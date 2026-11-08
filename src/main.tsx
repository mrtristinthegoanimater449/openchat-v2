import { resolveServerUrl } from './lib/apiBase';
import './index.css';

// Resolve the server URL *before* mounting so the first render already knows
// where the OpenChat backend lives.
async function boot() {
  await resolveServerUrl();
  const { default: App } = await import('./App.tsx');
  const { createRoot } = await import('react-dom/client');
  createRoot(document.getElementById('root')!).render(<App />);
}

void boot();
