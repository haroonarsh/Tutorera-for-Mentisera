/** Never forward browser-supplied job credentials or proxy identity headers. */
export function forwardToBackend(request: Request): Request {
  const source = new URL(request.url);
  const url = new URL(request.url);
  url.protocol = "http:";
  url.host = "native-backend";
  const forwarded = new Request(url, request);
  forwarded.headers.delete("host");
  forwarded.headers.delete("X-Tutorera-Job-Token");
  forwarded.headers.delete("X-Tutorera-Preview-Token");
  forwarded.headers.delete("forwarded");
  forwarded.headers.delete("x-forwarded-for");
  const clientIp = request.headers.get("CF-Connecting-IP");
  if (clientIp) forwarded.headers.set("x-forwarded-for", clientIp);
  forwarded.headers.set("x-forwarded-proto", source.protocol.replace(":", ""));
  forwarded.headers.set("x-forwarded-host", source.host);
  return forwarded;
}

export function isInternalPath(request: Request): boolean {
  return new URL(request.url).pathname.toLowerCase().startsWith("/internal");
}

