export async function ReadKif(name: string): Promise<string> {
  //const url: string =
  //  "https://book.mynavi.jp/files/user/shogi_news/kif/Honjitsu_Tsume_20241017.txt";
  const rawUrl = "https://aidn.jp/shogi/data/5_1.kif";
  const url: string = `https://corsproxy.io/?${encodeURIComponent(rawUrl)}`;
  const resp = await fetch(url, {
    method: "GET",
    mode: "cors",
  });
  if (!resp.ok) {
    throw new Error("fetch error");
  }
  return await resp.text();
}
