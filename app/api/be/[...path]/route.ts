/**
 * Backend proxy (BFF) — the browser talks to this same-origin route instead of
 * calling the API directly, so the admin JWT can live in an httpOnly cookie the
 * client JS can't read (XSS can't exfiltrate it). This handler reads the cookie
 * server-side and attaches it as a Bearer token when forwarding to the real API.
 *
 * The token is never exposed to the browser; only this server route sees it.
 */
import { cookies } from 'next/headers';
import type { NextRequest } from 'next/server';

const API_BASE = process.env.API_BASE ?? process.env.NEXT_PUBLIC_API_BASE ?? 'http://localhost:8080/v1';
const TOKEN_COOKIE = 'kx_admin_token';

async function handler(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  const token = (await cookies()).get(TOKEN_COOKIE)?.value;

  const target = `${API_BASE}/${path.join('/')}${req.nextUrl.search}`;
  const headers = new Headers();
  const contentType = req.headers.get('content-type');
  if (contentType) headers.set('content-type', contentType);
  if (token) headers.set('authorization', `Bearer ${token}`);

  const hasBody = req.method !== 'GET' && req.method !== 'HEAD';
  // Forward the raw bytes (arrayBuffer), not text() — text() corrupts binary
  // uploads such as image bytes. Works equally for JSON/form bodies.
  const upstream = await fetch(target, {
    method: req.method,
    headers,
    body: hasBody ? await req.arrayBuffer() : undefined,
    redirect: 'manual',
    cache: 'no-store',
  });

  // 204/304 are null-body statuses; constructing a Response with a body throws.
  const nullBody = upstream.status === 204 || upstream.status === 304;
  const outHeaders = new Headers();
  const upstreamCT = upstream.headers.get('content-type');
  if (upstreamCT) outHeaders.set('content-type', upstreamCT);

  return new Response(nullBody ? null : await upstream.arrayBuffer(), {
    status: upstream.status,
    headers: outHeaders,
  });
}

export {
  handler as GET,
  handler as POST,
  handler as PUT,
  handler as PATCH,
  handler as DELETE,
};
