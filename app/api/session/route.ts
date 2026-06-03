/**
 * Admin session — login (OTP verify) and logout.
 *
 * POST verifies the phone OTP against the API, enforces the admin role, and on
 * success stores the access token in an httpOnly cookie (so client JS never
 * touches it). DELETE clears the cookie. The non-secret user object is returned
 * to the client for UI role-gating; the token stays server-only.
 */
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const API_BASE = process.env.API_BASE ?? process.env.NEXT_PUBLIC_API_BASE ?? 'http://localhost:8080/v1';
const TOKEN_COOKIE = 'kx_admin_token';

export async function POST(req: Request) {
  let body: { phone?: string; code?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid body' }, { status: 400 });
  }

  const res = await fetch(`${API_BASE}/auth/phone/verify`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ phone: body.phone, code: body.code }),
    cache: 'no-store',
  });

  const data = (await res.json().catch(() => null)) as {
    data?: { access_token?: string; user?: { id: string; role: string } };
    error?: string;
  } | null;

  if (!res.ok) {
    return NextResponse.json({ error: data?.error ?? 'verification failed' }, { status: res.status });
  }

  const token = data?.data?.access_token;
  const user = data?.data?.user;
  if (!token || !user || user.role !== 'admin') {
    return NextResponse.json({ error: 'This account does not have admin access.' }, { status: 403 });
  }

  (await cookies()).set(TOKEN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24, // mirrors the 24h access-token TTL
  });

  return NextResponse.json({ user });
}

export async function DELETE() {
  (await cookies()).delete(TOKEN_COOKIE);
  return NextResponse.json({ ok: true });
}
