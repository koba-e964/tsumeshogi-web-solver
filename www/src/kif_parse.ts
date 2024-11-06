import { PageUrlToKifUrl } from "./kif_url";
import ProxyFetch from "./proxy_fetch";

export async function ReadKif(pageUrl: string): Promise<string> {
  const rawUrl = await PageUrlToKifUrl(pageUrl);
  if (rawUrl.isErr()) {
    console.log(rawUrl.error);
    return rawUrl.error.message;
  }
  return await ProxyFetch(rawUrl.value);
}
