import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// If launched by the desktop app with ?desktop=1&server=<url>, remember the
// server URL (only when not already configured). The user can still change it
// from inside the app.
try {
  const p = new URLSearchParams(window.location.search);
  if (p.get('desktop') === '1') {
    const server = p.get('server');
    if (server && !localStorage.getItem('openchat_server')) {
      localStorage.setItem('openchat_server', server.trim().replace(/\/+$/, ''));
    }
  }
} catch {
  /* never block startup on this */
}

createRoot(document.getElementById('root')!).render(<App />);
