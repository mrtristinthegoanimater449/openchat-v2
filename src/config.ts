// Google Identity Services client ID (public by design — safe to embed in browser code).
// NOTE: This must be a "Web application" OAuth client from Google Cloud Console,
// NOT the "installed" desktop client from youtube-data/client_secret.json.
// The client_secret must NEVER be used in browser code.
export const GOOGLE_CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID ??
  '520658917291-nehsp0uaeau7vfevpuopea9n4ee2ssco.apps.googleusercontent.com';
