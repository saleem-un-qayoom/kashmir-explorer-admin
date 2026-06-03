/**
 * Admin auth — phone OTP via the same-origin BFF.
 *
 * The access token is held in an httpOnly cookie set by /api/session (the
 * client never sees it). Only a non-secret user object ({id, role}) is cached
 * in localStorage so the UI can role-gate; the real gate is the cookie that the
 * BFF proxy attaches to every API call.
 */

import { api } from './api';

const USER_KEY = 'kashmir-admin-user';

export interface AdminUser {
  id: string;
  role: 'admin' | 'user';
}

export const auth = {
  isAuthenticated(): boolean {
    if (typeof window === 'undefined') return false;
    return !!localStorage.getItem(USER_KEY);
  },

  currentUser(): AdminUser | null {
    if (typeof window === 'undefined') return null;
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  async startPhone(phone: string): Promise<void> {
    // No auth needed; routed through the BFF proxy to the API.
    await api.post('auth/phone/start', { json: { phone } });
  },

  async verifyPhone(phone: string, code: string): Promise<AdminUser> {
    // /api/session verifies the OTP, enforces the admin role, and sets the
    // httpOnly token cookie. It returns only the non-secret user object.
    const res = await fetch('/api/session', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ phone, code }),
    });
    const json = (await res.json().catch(() => null)) as { user?: AdminUser; error?: string } | null;
    if (!res.ok || !json?.user) {
      throw new Error(json?.error ?? 'Verification failed.');
    }
    localStorage.setItem(USER_KEY, JSON.stringify(json.user));
    return json.user;
  },

  async signOut(): Promise<void> {
    try {
      await fetch('/api/session', { method: 'DELETE' });
    } catch {
      /* clear locally regardless */
    }
    localStorage.removeItem(USER_KEY);
    if (typeof window !== 'undefined') window.location.assign('/login');
  },
};
