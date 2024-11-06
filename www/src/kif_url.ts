import { err, ok, Result } from "neverthrow";
import ProxyFetch from "./proxy_fetch";

export async function PageUrlToKifUrl(
  pageUrl: string
): Promise<Result<string, Error>> {
  if (pageUrl.endsWith(".kif")) {
    return ok(pageUrl);
  }
  if (pageUrl.startsWith("https://aidn.jp/shogi/")) {
    let problem_name = pageUrl.slice("https://aidn.jp/shogi/".length);
    if (problem_name.endsWith("/")) {
      problem_name = problem_name.slice(0, -1);
    }
    return ok(`https://aidn.jp/shogi/data/${problem_name}.kif`);
  }
  if (pageUrl.startsWith("https://www.shogi.or.jp/tsume_shogi/everyday/")) {
    const content = await ProxyFetch(pageUrl);
    const match = content.match(/kifu_path:     '(.*)',/);
    if (match) {
      return ok(match[1]);
    } else {
      return err(new Error(`Failed to parse kifu_path: ${pageUrl}`));
    }
  }
  return err(new Error("Invalid URL"));
}
