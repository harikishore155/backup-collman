/** Cookie names used for the client-side auth session (not HttpOnly — only the server can set those). */

const AUTH_KEYS = [
  "access_token",
  "refresh_token",
  "token_type",
  "role",
  "user_id",
  "user",
];

const defaultMaxAgeSeconds = 60 * 60 * 24 * 7; // 7 days

function getCookie(name) {
  if (typeof document === "undefined") return null;
  const escaped = name.replace(/[$()*+.?[\\\]^{|}]/g, "\\$&");
  const match = document.cookie.match(new RegExp(`(?:^|; )${escaped}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function setCookie(name, value, maxAgeSeconds = defaultMaxAgeSeconds) {
  if (typeof document === "undefined") return;
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; SameSite=Lax; Max-Age=${maxAgeSeconds}${secure}`;
}

function deleteCookie(name) {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=; Path=/; Max-Age=0`;
}

export function getAccessTokenFromCookie() {
  return getCookie("access_token");
}

export function getUserFromCookie() {
  const raw = getCookie("user");
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/** Persists login session fields to cookies (replaces localStorage for auth). */
export function saveAuthSession(session) {
  setCookie("access_token", session.access_token);
  if (session.refresh_token) {
    setCookie("refresh_token", session.refresh_token);
  } else {
    deleteCookie("refresh_token");
  }
  setCookie("token_type", session.token_type || "Bearer");
  setCookie("role", session.role || "");
  setCookie("user_id", String(session.user_id || ""));
  setCookie("user", JSON.stringify(session));
}

export function clearAuthCookies() {
  for (const key of AUTH_KEYS) {
    deleteCookie(key);
  }
}
