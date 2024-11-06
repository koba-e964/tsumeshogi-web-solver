export default async function ProxyFetch(rawUrl: string): Promise<string> {
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
