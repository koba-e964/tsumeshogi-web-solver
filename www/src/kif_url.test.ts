import { PageUrlToKifUrl } from "./kif_url";
// https://zenn.dev/yu46/articles/083ea1911d1e62
import { test, expect } from "@jest/globals";
import { ok } from "neverthrow";

test("aidn 5_1", async () => {
  const pageUrl = "https://aidn.jp/shogi/5_1/";
  const expectedKifUrl = "https://aidn.jp/shogi/data/5_1.kif";
  expect(await PageUrlToKifUrl(pageUrl)).toStrictEqual(ok(expectedKifUrl));
});

test("aidn 5_1 idem", async () => {
  const pageUrl = "https://aidn.jp/shogi/data/5_1.kif";
  const expectedKifUrl = pageUrl;
  expect(await PageUrlToKifUrl(pageUrl)).toStrictEqual(ok(expectedKifUrl));
});

// TODO: involves fetch, should be moved to integration test
const longTimeout = 20000;
test(
  "shogi.or.jp 20241167",
  async () => {
    const pageUrl =
      "https://www.shogi.or.jp/tsume_shogi/everyday/20241167.html";
    const expectedKifUrl =
      "https://www.shogi.or.jp/tsume_shogi/data/everyday_20241106.kif";
    expect(await PageUrlToKifUrl(pageUrl)).toStrictEqual(ok(expectedKifUrl));
  },
  longTimeout
);

test(
  "shogi.or.jp 20241097",
  async () => {
    const pageUrl =
      "https://www.shogi.or.jp/tsume_shogi/everyday/20241097.html";
    const expectedKifUrl =
      "https://www.shogi.or.jp/tsume_shogi/data/everyday_20241009.kif";
    expect(await PageUrlToKifUrl(pageUrl)).toStrictEqual(ok(expectedKifUrl));
  },
  longTimeout
);

test(
  "shogi.or.jp 20231117",
  async () => {
    const pageUrl =
      "https://www.shogi.or.jp/tsume_shogi/everyday/20231117.html";
    const expectedKifUrl =
      "https://www.shogi.or.jp/tsume_shogi/data/everyday_20230111.kif";
    expect(await PageUrlToKifUrl(pageUrl)).toStrictEqual(ok(expectedKifUrl));
  },
  longTimeout
);

test(
  "shogi.or.jp 20231119",
  async () => {
    const pageUrl =
      "https://www.shogi.or.jp/tsume_shogi/everyday/20231119.html";
    const expectedKifUrl =
      "https://www.shogi.or.jp/tsume_shogi/data/everyday_20231101.kif";
    expect(await PageUrlToKifUrl(pageUrl)).toStrictEqual(ok(expectedKifUrl));
  },
  longTimeout
);
