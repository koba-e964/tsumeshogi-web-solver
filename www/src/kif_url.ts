import { err, ok, Result } from "neverthrow";

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
  return err(new Error("Invalid URL"));
}
