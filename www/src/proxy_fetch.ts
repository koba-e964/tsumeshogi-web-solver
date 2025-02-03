export default async function ProxyFetch(rawUrl: string): Promise<Uint8Array> {
  let url: string;
  if (rawUrl.endsWith(".html")) {
    // corsproxy.io doesn't support HTML contents.
    // Falls back to slower but more reliable codetabs.com.
    url = `https://api.codetabs.com/v1/proxy/?quest=${encodeURIComponent(
      rawUrl
    )}`;
  } else {
    url = `https://corsproxy.io/?url=${encodeURIComponent(rawUrl)}`;
  }
  const resp = await fetch(url, {
    method: "GET",
    mode: "cors",
  });
  if (!resp.ok) {
    throw new Error(`fetch error: ${resp.status} ${resp.statusText}`);
  }
  return new Uint8Array(await resp.arrayBuffer());
}
