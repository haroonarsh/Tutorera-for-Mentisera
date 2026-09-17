import { Request, Response, NextFunction } from "express";

/**
 * Sets a public Cache-Control header on GET responses for read-only,
 * unauthenticated, SEO-relevant endpoints (blog listing/detail, public
 * tutor directory, geo reference data). Previously nothing set
 * Cache-Control at all on these routes, so every request - including
 * repeated Next.js SSR/ISR revalidation fetches and any CDN/reverse proxy
 * in front of the API - hit the database fresh every time.
 *
 * `maxAgeSeconds` covers direct/browser reuse; `staleWhileRevalidateSeconds`
 * lets a CDN keep serving the stale response while it refetches in the
 * background, so a cache miss never means a slow response for a real
 * visitor. Only apply this to routes with no per-user/session-dependent
 * data - never to anything behind `protect`/`authorize`.
 */
export function cachePublic(maxAgeSeconds: number, staleWhileRevalidateSeconds = maxAgeSeconds * 5) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.method === "GET") {
      res.set("Cache-Control", `public, max-age=${maxAgeSeconds}, stale-while-revalidate=${staleWhileRevalidateSeconds}`);
    }
    next();
  };
}
