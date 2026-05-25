/**
 * Live-ops WebSocket — keeps the admin in sync with the same advisory
 * broadcasts that go to mobile clients.
 *
 * Auto-reconnects with exponential backoff. Subscribers receive parsed
 * events; unknown event types are passed through.
 */

export interface AdvisoryEvent {
  type: 'advisory.new' | 'advisory.update' | 'advisory.clear' | 'advisory.cleared' | 'road.status';
  advisory?: any;
  id?: string;
  status?: string;
  count?: number;
}

type Listener = (e: AdvisoryEvent) => void;

const WS_URL =
  (import.meta.env.VITE_WS_URL as string | undefined) ??
  (import.meta.env.VITE_API_BASE as string | undefined)?.replace(/^http/, 'ws').replace(/\/v1$/, '') + '/ws/advisories' ??
  'ws://localhost:8080/ws/advisories';

class LiveOps {
  private ws: WebSocket | null = null;
  private listeners = new Set<Listener>();
  private retries = 0;
  private closed = false;

  start() {
    this.closed = false;
    this.connect();
  }

  stop() {
    this.closed = true;
    this.ws?.close();
  }

  subscribe(fn: Listener) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private connect() {
    try {
      this.ws = new WebSocket(WS_URL);
    } catch {
      this.scheduleReconnect();
      return;
    }

    this.ws.addEventListener('open', () => {
      this.retries = 0;
      console.info('[live-ops] connected');
    });
    this.ws.addEventListener('message', (ev) => {
      try {
        const payload = JSON.parse(ev.data) as AdvisoryEvent;
        this.listeners.forEach((fn) => fn(payload));
      } catch { /* ignore non-JSON */ }
    });
    this.ws.addEventListener('close', () => {
      if (!this.closed) this.scheduleReconnect();
    });
    this.ws.addEventListener('error', () => {
      this.ws?.close();
    });
  }

  private scheduleReconnect() {
    const delay = Math.min(30_000, 500 * Math.pow(2, this.retries++));
    console.info('[live-ops] reconnecting in', delay, 'ms');
    setTimeout(() => this.connect(), delay);
  }
}

export const liveOps = new LiveOps();
