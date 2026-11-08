// API base URL helpers for the web + desktop (Electron) apps.
//
// - Web deployment (served by the OpenChat server): localStorage has no
//   'openchat_server', so apiUrl() returns the relative path — same-origin, unchanged.
// - Desktop app (Electron, bundled HTML loaded via file://): the web bundle is
//   same-origin-less, so all API calls must go to the configured OpenChat server.
//   On first run the user picks/enters a server URL; it persists in localStorage.
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
