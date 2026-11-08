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

async function probeUrl(url: string): Promise<boolean> {
  if (!url) return false;
  try {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 1500);
    const res = await fetch(url.replace(/\/+$/, '') + '/api/health', {
      signal: controller.signal,
      cache: 'no-store',
    });
    clearTimeout(t);
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Resolve the server URL at startup. Always probes the stored URL; if it's
 * dead, fall back to the auto-discovered cloudflared_link.json from the repo.
 */
export async function resolveServerUrl(): Promise<string> {
  const stored = getApiBase();

  if (stored && (await probeUrl(stored))) {
    return stored;
  }

  // Stored URL is dead or missing → try discovery
  if (isDesktop()) {
    const params = new URLSearchParams(window.location.search);
    const server = (params.get('server') || '').trim().replace(/\/+$/, '');
    if (server && (await probeUrl(server))) {
      setApiBase(server);
      return server;
    }
  }

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
    /* GitHub raw unreachable */
  }

  // Discovery failed → keep stored value rather than nothing (caller may retry later)
  return stored || '';
}
