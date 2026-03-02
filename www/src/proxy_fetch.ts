export default async function ProxyFetch(rawUrl: string): Promise<Uint8Array> {
  const url = `https://api.codetabs.com/v1/proxy/?quest=${encodeURIComponent(
    rawUrl,
  )}`;
  const resp = await fetch(url, {
    method: "GET",
    mode: "cors",
  });
  if (!resp.ok) {
    throw new Error(`fetch error: ${resp.status} ${resp.statusText}`);
  }
  return new Uint8Array(await resp.arrayBuffer());
}
