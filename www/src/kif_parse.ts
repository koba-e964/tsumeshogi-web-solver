import { Result, ok, err } from "neverthrow";
import { PageUrlToKifUrl } from "./kif_url";
import ProxyFetch from "./proxy_fetch";
import { importKIF } from "tsshogi";
import Encoding from "encoding-japanese";

export function ParseKif(kif: Uint8Array): Result<string, Error> {
  const detectedEncoding = Encoding.detect(kif);
  if (detectedEncoding === false) {
    return err(new Error("Failed to detect encoding"));
  }
  const unicodeArray = Encoding.convert(kif, {
    to: "UNICODE",
    from: detectedEncoding,
  });
  const utf8kif = Encoding.codeToString(unicodeArray);
  const record = importKIF(utf8kif);
  if (record instanceof Error) {
    return err(record);
  }
  return ok(record.sfen);
}

export async function ReadKif(pageUrl: string): Promise<string> {
  const rawUrl = await PageUrlToKifUrl(pageUrl);
  if (rawUrl.isErr()) {
    console.log(rawUrl.error);
    return rawUrl.error.message;
  }
  const kif = await ProxyFetch(rawUrl.value);
  const sfen = ParseKif(kif);
  if (sfen.isErr()) {
    console.log(sfen.error);
    return sfen.error.message;
  }
  return sfen.value;
}
