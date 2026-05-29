/**
 * Admin auth — phone OTP, persisted token, role gate.
 */

import { api } from './api';

const TOKEN_KEY = 'kashmir-admin-token';
const USER_KEY = 'kashmir-admin-user';

export interface AdminUser {
  id: string;
  role: 'admin' | 'user';
}

export const auth = {
  isAuthenticated(): boolean {
    if (typeof window === 'undefined') return false;
    return !!localStorage.getItem(TOKEN_KEY);
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
    await api.post('auth/phone/start', { json: { phone } });
  },

  async verifyPhone(phone: string, code: string): Promise<AdminUser> {
    const res = (await api.post('auth/phone/verify', { json: { phone, code } }).json()) as { data: any };
    const user: AdminUser = res.data?.user;
    if (user.role !== 'admin') {
      throw new Error('This account does not have admin access.');
    }
    localStorage.setItem(TOKEN_KEY, res.data.access_token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    return user;
  },

  signOut() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    window.location.assign('/login');
  },
};
