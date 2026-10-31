/** Cloudflare Workers cannot upgrade HTTP connections, so only polling works.
 * Default to polling when NEXT_PUBLIC_SOCKET_TRANSPORT is "polling" or when
 * the API URL points at our Cloudflare backend (api.tutorera.ac.pk). */
export function socketTransportOptions() {
  const isPollingOnly =
    process.env.NEXT_PUBLIC_SOCKET_TRANSPORT === "polling" ||
    (process.env.NEXT_PUBLIC_API_URL ?? "").includes("tutorera.ac.pk");
  return isPollingOnly
    ? { transports: ["polling"], upgrade: false }
    : { transports: ["websocket", "polling"] };
}
