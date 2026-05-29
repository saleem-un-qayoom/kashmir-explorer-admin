/**
 * API client — wraps ky with auth + base URL + JSON envelope unwrap.
 */
import ky from 'ky';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? 'http://localhost:8080/v1';

const timings = new WeakMap<Request, number>();

const METHOD_COLORS: Record<string, string> = {
  GET: '#2D6A4F',
  POST: '#2A5266',
  PUT: '#E8893A',
  PATCH: '#C9A227',
  DELETE: '#B23A2E',
};

function logApi(method: string, url: string, status: number, ms: number, err?: string) {
  const color = METHOD_COLORS[method] ?? '#8B7E6F';
  const icon = status < 300 ? '✓' : status < 500 ? '⚠' : '✗';
  const dur = ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${ms}ms`;
  console.groupCollapsed(
    `%c ${icon} %c ${method} %c ${status} %c ${url} %c ${dur}`,
    'color:inherit',
    `color:${color};font-weight:700`,
    status < 300 ? 'color:#2D6A4F' : status < 500 ? 'color:#C9A227' : 'color:#B23A2E',
    'color:#2A5266',
    'color:#8B7E6F;font-size:11px',
  );
  if (err) console.log('%c error', 'color:#B23A2E;font-weight:700', err);
  console.groupEnd();
}

function onBefore({ request }: { request: Request }) {
  const token = localStorage.getItem('kashmir-admin-token');
  if (token) request.headers.set('Authorization', `Bearer ${token}`);
  timings.set(request, performance.now());
}

function onAfter({ request, response }: { request: Request; response: Response }) {
  const start = timings.get(request);
  if (start) logApi(request.method, request.url, response.status, Math.round(performance.now() - start));
}

async function onError(error: any) {
  const start = timings.get(error?.request);
  if (start) logApi(error?.request?.method, error?.request?.url, error?.response?.status ?? 0, Math.round(performance.now() - start), error?.message);

  // Surface the API's envelope error message instead of ky's generic
  // "Request failed with status code 400". The Go backend always returns
  // { error: "…", code: "…" } on 4xx/5xx.
  try {
    const res = error?.response as Response | undefined;
    if (res) {
      const cloned = res.clone();
      const body = (await cloned.json().catch(() => null)) as { error?: string; code?: string } | null;
      if (body?.error) {
        error.message = body.code ? `${body.error} (${body.code})` : body.error;
      }
    }
  } catch {
    /* leave original error.message untouched */
  }
  return error;
}

export const api = ky.create({
  prefix: API_BASE,
  timeout: 15_000,
  retry: 1,
  hooks: {
    beforeRequest: [onBefore],
    beforeError: [onError],
    afterResponse: [onAfter],
  },
});

/** Envelope unwrap: API returns { data, error, code } — return data, throw error. */
async function unwrap<T>(promise: Promise<Response>): Promise<T> {
  const res = await promise;
  const json = (await res.json()) as { data?: T; error?: string };
  if (json.error) throw new Error(json.error);
  return json.data as T;
}

export const apiGet = <T>(url: string) => unwrap<T>(api.get(url));
export const apiPost = <T>(url: string, body: unknown) => unwrap<T>(api.post(url, { json: body }));
export const apiPut = <T>(url: string, body: unknown) => unwrap<T>(api.put(url, { json: body }));
export const apiPatch = <T>(url: string, body: unknown) => unwrap<T>(api.patch(url, { json: body }));
export const apiDelete = <T = void>(url: string) => unwrap<T>(api.delete(url));

// ─── Helpers ────────────────────────────────────────────────

export interface CrudOps<T> {
  list: () => Promise<T[]>;
  get: (id: string) => Promise<T>;
  create: (d: Partial<T>) => Promise<{ id: string }>;
  update: (id: string, d: Partial<T>) => Promise<{ id: string }>;
  remove: (id: string) => Promise<void>;
  delete: (id: string) => Promise<void>;
}

function crud<T>(base: string): CrudOps<T> {
  const admin = base.startsWith('admin/') ? base : `admin/${base}`;
  const ops = {
    list: () => apiGet<T[]>(base),
    get: (id: string) => apiGet<T>(`${base}/${id}`),
    create: (d: Partial<T>) => apiPost<{ id: string }>(admin, d),
    update: (id: string, d: Partial<T>) => apiPut<{ id: string }>(`${admin}/${id}`, d),
    remove: (id: string) => apiDelete(`${admin}/${id}`),
  };
  return { ...ops, delete: ops.remove };
}

// ─── Destinations ───────────────────────────────────────────

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
  activities?: string[];
  features?: string[]; // AllTrails-style tags: kid_friendly, dog_friendly, waterfall, wildlife, …
  network_coverage?: {
    jio?: 'good' | 'patchy' | 'none';
    airtel?: 'good' | 'patchy' | 'none';
    bsnl?: 'good' | 'patchy' | 'none';
  };
  practical?: {
    atm?: boolean;
    fuel_km?: number;
    toilet?: 'clean' | 'basic' | 'none';
    drone?: boolean;
  };
  is_published?: boolean;
  is_featured?: boolean;
}

export const destinations = crud<Destination>('destinations') as CrudOps<Destination> & { unpublish: (id: string) => Promise<void> };
destinations.unpublish = (id: string) => apiDelete(`admin/destinations/${id}`);

// ─── Treks ──────────────────────────────────────────────────

export interface Trek {
  id: string;
  slug: string;
  name: string;
  difficulty: 'easy' | 'moderate' | 'hard' | 'strenuous';
  trek_type?: string;
  duration_days: number;
  distance_km?: number;
  max_altitude_m: number;
  start_point?: string;
  end_point?: string;
  best_months?: number[];
  permits?: string[];
  ams_risk?: boolean;
  status: string;
  closure_reason?: string;
  tagline?: string;
  uniqueness?: string;
  rating: number;
  review_count: number;
  guide_available?: boolean;
  guide_price_inr?: number;
  path_geojson?: [number, number][];
  waypoint_coords?: { lng: number; lat: number; name?: string; day?: number; altitude_m?: number; type?: string; notes?: string }[];
  /** Structured editor — the API persists this as JSONB on treks.waypoints. */
  waypoints?: Array<{
    day: number;
    name: string;
    type: 'camp' | 'summit' | 'lake' | 'pass' | 'start' | 'end';
    altitudeM: number;
    distanceFromStartKm?: number;
    lat?: number;
    lng?: number;
    notes?: string;
  }>;
  gear_list?: Array<{ name: string; category: string; essential: boolean }>;
  trail_sections?: TrailSection[];
  /** AllTrails-style discovery fields (migration 0009). */
  features?: string[];      // dog_friendly, kid_friendly, waterfall, …
  activities?: string[];    // hike, ski, mtb, pilgrimage, …
  elevation_gain_m?: number;
  route_type?: 'out-and-back' | 'loop' | 'point-to-point';
  is_published?: boolean;
}

export interface TrailSection {
  name: string;
  from: string;
  to: string;
  start_lat: number;
  start_lng: number;
  end_lat: number;
  end_lng: number;
  altitude_start_m: number;
  altitude_end_m: number;
  distance_km: number;
  duration_hours: number;
  difficulty: 'easy' | 'moderate' | 'hard' | 'strenuous';
  type: 'hike' | 'camp' | 'base_camp' | 'summit' | 'pass' | 'lake' | 'viewpoint';
  description: string;
  photos: string[];
}

type ExtendedTreks = CrudOps<Trek> & { adminList: () => Promise<Trek[]>; adminGet: (id: string) => Promise<Trek>; adminRemove: (id: string) => Promise<void> };
export const treks = crud<Trek>('treks') as ExtendedTreks;
treks.adminList = () => apiGet<Trek[]>('admin/treks');
treks.adminGet = (id: string) => apiGet<Trek>(`admin/treks/${id}`);
treks.adminRemove = (id: string) => apiDelete(`admin/treks/${id}`);

// ─── Advisories ─────────────────────────────────────────────

export interface Advisory {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  category: string;
  title: string;
  body?: string;
  source?: string;
  affected?: string;
  confidence?: number;
  valid_until: string;
  created_at?: string;
}
export const advisories = crud<Advisory>('advisories');

// ─── Providers ──────────────────────────────────────────────

export interface Provider {
  id: string;
  type: string;
  name: string;
  jktdc_reg_no?: string;
  verified: boolean;
  base_location_text?: string;
  languages?: string[];
  rating: number;
  review_count: number;
  capacity?: number;
  amenities?: string[];
  price_inr: number;
  price_unit: string;
  cancellation?: string;
  description?: string;
  years_hosting?: number;
  response_time_min?: number;
  phone?: string;
  whatsapp?: string;
}
export const providers = crud<Provider>('providers') as CrudOps<Provider> & { verify: (id: string) => Promise<{ verified: boolean }> };
providers.verify = (id: string) => apiPost<{ verified: boolean }>(`admin/providers/${id}/verify`, {});

// ─── Categories & Regions ───────────────────────────────────

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  color?: string;
}
export const categories = crud<Category>('categories');

export interface Region {
  id: string;
  name: string;
  slug: string;
  description?: string;
}
export const regions = crud<Region>('regions');

// ─── Cultural ───────────────────────────────────────────────

export interface Dish {
  id: string;
  name: string;
  name_urdu?: string;
  name_kashmiri?: string;
  vegetarian: boolean;
  description: string;
  where_to_try: string;
  price_range: string;
}
export const dishes = crud<Dish>('cultural/food');

export interface Festival {
  id: string;
  name: string;
  month: number;
  duration: string;
  description: string;
  region: string;
}
export const festivals = crud<Festival>('cultural/festivals');

export interface Craft {
  id: string;
  name: string;
  origin: string;
  price: string;
  description: string;
}
export const crafts = crud<Craft>('cultural/crafts');

export interface EtiquetteTip {
  id: string;
  category: 'mosque' | 'wazwan' | 'street' | 'dress';
  title: string;
  body: string;
}
export const etiquette = crud<EtiquetteTip>('cultural/etiquette');

// ─── Permits ────────────────────────────────────────────────

export interface Permit {
  id: string;
  name: string;
  required: string;
  office: string;
  processing_days: string;
  cost_inr: string;
  validity: string;
  status: 'open' | 'seasonal' | 'always';
  notes: string;
  official_url: string;
}
export const permits = crud<Permit>('permits');

// ─── Photo Spots ────────────────────────────────────────────

export interface PhotoSpot {
  id: string;
  destination_slug: string;
  name: string;
  lat: number;
  lng: number;
  best_time: 'sunrise' | 'golden-pm' | 'blue-hour' | 'dawn' | 'night';
  facing: string;
  tripod_recommended: boolean;
  drone_allowed: boolean;
  description?: string;
}
export const photoSpots = crud<PhotoSpot>('admin/photo-spots');

// ─── Road Status ────────────────────────────────────────────

export interface RoadStatus {
  id: string;
  name: string;
  slug: string;
  status: 'open' | 'one-way' | 'closed' | 'restricted';
  closure_reason?: string;
  last_checked: string;
}
export const roadStatus = crud<RoadStatus>('roads/status');

// ─── Images ────────────────────────────────────────────────────

export interface Image {
  id: string;
  destination_id?: string;
  trek_id?: string;
  url: string;
  blurhash?: string;
  caption?: string;
  is_hero: boolean;
  sort_order: number;
  created_at: string;
}

export const images = {
  forDestination: (id: string) => apiGet<Image[]>(`images/destination/${id}`),
  forTrek: (id: string) => apiGet<Image[]>(`images/trek/${id}`),
  create: (data: Partial<Image>) => apiPost<{ id: string }>('admin/images', data),
  update: (id: string, data: Partial<Image>) => apiPut<{ updated: string }>(`admin/images/${id}`, data),
  remove: (id: string) => apiDelete(`admin/images/${id}`),
};

// ─── Existing types (kept for backward compat) ──────────────

/** Trail reports — community trail-condition reports (V3) */
export interface TrailReport {
  id: string;
  category: string;
  severity: number;
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
