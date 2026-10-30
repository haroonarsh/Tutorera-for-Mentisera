/** Native Workers cannot forward node:http upgrade events. Polling still
 * provides Socket.IO messaging; Render keeps WebSockets unless configured. */
export function socketTransportOptions() {
  return process.env.NEXT_PUBLIC_SOCKET_TRANSPORT === "polling"
    ? { transports: ["polling"], upgrade: false }
    : { transports: ["websocket", "polling"] };
}
