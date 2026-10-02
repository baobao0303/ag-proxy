/**
 * Should the session cookie carry the `Secure` attribute?
 *
 * A `Secure` cookie is discarded by the browser when the page is served over
 * plain HTTP, so a correct password still ends up back on /login. This app is
 * reached over a Tailscale IP without TLS, so the flag has to be opt-out.
 *
 * It lives in its own module on purpose. When this expression sits inline in a
 * route handler, the Next.js compiler folds `process.env.NODE_ENV === "production"`
 * down to a literal `true` at build time, and the result is `secure: true` baked
 * into the bundle — `COOKIE_SECURE` is then never read at runtime and the fix
 * silently does nothing. Reading the variable through `process.env[...]` keeps
 * it a real runtime lookup, so the env file actually takes effect.
 */

export function cookieSecure(): boolean {
  const raw = process.env["COOKIE_SECURE"];
  if (raw === "true") return true;
  if (raw === "false") return false;
  // Unset: fall back to the production default.
  return process.env["NODE_ENV"] === "production";
}
