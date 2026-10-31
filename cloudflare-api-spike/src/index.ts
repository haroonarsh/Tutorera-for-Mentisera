interface Env {
  ENVIRONMENT: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === "/health/live") {
      return Response.json({ status: "ok", environment: env.ENVIRONMENT }, { headers: { "Cache-Control": "no-store" } });
    }
    if (url.pathname === "/health/ready") {
      return Response.json(
        { status: "unavailable", reason: "Database and application compatibility not yet verified" },
        { status: 503, headers: { "Cache-Control": "no-store" } }
      );
    }
    return Response.json({ message: "Compatibility spike only; application routes not deployed" }, { status: 404 });
  },
};
