/**
 * API client — wraps ky with auth + base URL + JSON envelope unwrap.
 */
import ky from 'ky';

const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:8080/v1';

export const api = ky.create({
  prefixUrl: API_BASE,
  timeout: 15_000,
  retry: 1,
  hooks: {
    beforeRequest: [
      (request) => {
        const token = localStorage.getItem('kashmir-admin-token');
        if (token) request.headers.set('Authorization', `Bearer ${token}`);
      },
    ],
  },
});

/** Envelope unwrap: API returns { data, error, code } — return data, throw error. */
async function unwrap<T>(promise: Promise<Response>): Promise<T> {
  const res = await promise;
  const json = await res.json<{ data?: T; error?: string }>();
  if (json.error) throw new Error(json.error);
  return json.data as T;
}

export const apiGet = <T>(url: string) => unwrap<T>(api.get(url));
export const apiPost = <T>(url: string, body: unknown) =>
  unwrap<T>(api.post(url, { json: body }));
export const apiPut = <T>(url: string, body: unknown) =>
  unwrap<T>(api.put(url, { json: body }));
export const apiPatch = <T>(url: string, body: unknown) =>
  unwrap<T>(api.patch(url, { json: body }));
export const apiDelete = <T = void>(url: string) => unwrap<T>(api.delete(url));

// ─── Typed endpoints ────────────────────────────────────────

export interface Destination {
  id: string;
  slug: string;
  name: string;
  name_urdu?: string;
  name_hindi?: string;
  district?: string;
  region_slug?: string;
  tagline?: string;
  uniqueness?: string;
  description?: string;
  lat?: number;
  lng?: number;
  altitude_m?: number;
  best_months?: number[];
  season_type?: string;
  rating: number;
  review_count: number;
  distance_from_srinagar_km?: number;
  entry_fee_inr?: number;
  categories?: string[];
  permits?: string[];
  is_published?: boolean;
  is_featured?: boolean;
}

export const destinations = {
  list: () => apiGet<Destination[]>('admin/destinations'),
  get: (id: string) => apiGet<Destination>(`admin/destinations/${id}`),
  create: (d: Partial<Destination>) => apiPost<{ id: string }>('admin/destinations', d),
  update: (id: string, d: Partial<Destination>) => apiPut<{ updated: string }>(`admin/destinations/${id}`, d),
  unpublish: (id: string) => apiDelete(`admin/destinations/${id}`),
};

export interface Trek {
  id: string;
  slug: string;
  name: string;
  difficulty: string;
  duration_days: number;
  max_altitude_m: number;
  status: string;
  rating: number;
}
export const treks = {
  list: () => apiGet<Trek[]>('treks'),
};

export interface Advisory {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  category: string;
  title: string;
  body?: string;
  source?: string;
  affected?: string;
  valid_until: string;
}
export const advisories = {
  list: () => apiGet<Advisory[]>('advisories'),
  create: (a: Partial<Advisory>) => apiPost<Advisory>('admin/advisories', a),
  delete: (id: string) => apiDelete(`admin/advisories/${id}`),
};

/** Trail reports — community trail-condition reports (V3) */
export interface TrailReport {
  id: string;
  category: string;       // snow | trail | water | wrong_path | blocked | unsafe | wildlife | other
  severity: number;       // 1..5 (V3)
  body?: string;
  photo_url?: string;
  waypoint_idx?: number;
  status: 'open' | 'reviewing' | 'resolved' | 'dismissed';
  created_at: string;
  expires_at?: string;
  trek_slug: string;
  trek_name: string;
  reporter: string;
  lat?: number;
  lng?: number;
}
export const trailReports = {
  list: (status: TrailReport['status'] = 'open') =>
    apiGet<TrailReport[]>(`admin/reports?status=${status}`),
  resolve: (id: string, status: 'resolved' | 'dismissed', admin_note?: string) =>
    apiPost(`admin/reports/${id}/resolve`, { status, admin_note }),
};

/** Track recordings — saved GPX hikes (V3) */
export interface TrackRecording {
  id: string;
  name: string;
  user: string;
  distance_m: number;
  duration_s: number;
  gain_m: number;
  max_altitude_m?: number;
  is_public: boolean;
  trek_slug?: string;
  created_at: string;
}
export const tracks = {
  list: () => apiGet<TrackRecording[]>('admin/tracks'),
};

export interface Provider {
  id: string;
  type: string;
  name: string;
  verified: boolean;
  rating: number;
  price_inr: number;
  price_unit: string;
}
export const providers = {
  list: () => apiGet<Provider[]>('providers'),
  verify: (id: string) => apiPost<{ verified: boolean }>(`admin/providers/${id}/verify`, {}),
};
