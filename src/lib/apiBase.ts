// Auto-discovery for the OpenChat V2 server URL.
//
// Resolution order on startup:
//  1. localStorage 'openchat_server' (user-configured or previously discovered)
//  2. globalThis.monacoServerUrl, set by the desktop shell via preload/query param
//  3. fetch cloudflared_link.json from raw.githubusercontent.com (committed to repo,
//     kept current by watch-tunnel.ps1 whenever the tunnel restarts)
const AUTO_DISCOVER_URL =
  'https://raw.githubusercontent.com/mrtristinthegoanimater449/openchat-v2/main/cloudflared_link.json';

const STORAGE_KEY = 'openchat_server';

export function getApiBase(): string {
  try {
    return (localStorage.getItem(STORAGE_KEY) || '').trim();
  } catch {
    return '';
  }
}

export function setApiBase(url: string) {
  const trimmed = (url || '').trim().replace(/\/+$/, '');
  if (!trimmed) localStorage.removeItem(STORAGE_KEY);
  else localStorage.setItem(STORAGE_KEY, trimmed);
}

export function apiUrl(path: string): string {
  return getApiBase() + path;
}

/** True when running inside the Electron shell (desktop app). */
export function isDesktop(): boolean {
  return (
    typeof window !== 'undefined' &&
    (new URLSearchParams(window.location.search).get('desktop') === '1' ||
      !!(window as any).__OPENCHAT_DESKTOP__)
  );
}

/**
 * Resolve the server URL at startup. Runs before the UI mounts so the first
 * render already knows where to talk.
 */
export async function resolveServerUrl(): Promise<string> {
  // 1) localStorage
  const stored = getApiBase();
  if (stored) return stored;

  // 2) desktop shell convenience default
  if (isDesktop()) {
    const params = new URLSearchParams(window.location.search);
    const server = (params.get('server') || '').trim().replace(/\/+$/, '');
    if (server) {
      setApiBase(server);
      return server;
    }
  }

  // 3) auto-discovery from GitHub
  try {
    const res = await fetch(AUTO_DISCOVER_URL, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      const discovered = String(data?.url || '').trim().replace(/\/+$/, '');
      if (/^https?:\/\/.+/.test(discovered)) {
        setApiBase(discovered);
        return discovered;
      }
    }
  } catch {
    /* network unavailable — caller decides what to do */
  }
  return '';
}
