/**
 * Token Storage Strategy & Security Trade-offs:
 *
 * This implementation persists the JWT access token in browser localStorage.
 *
 * Trade-offs & Security Analysis:
 * - Persistent across browser restarts and shared across tabs under the same origin.
 * - LocalStorage is accessible to any JavaScript execution context within the origin.
 *   It is NOT inherently secure against Cross-Site Scripting (XSS).
 *
 * Mitigations applied:
 * - Access tokens on the backend are short-lived.
 * - On application mount, the frontend immediately verifies the stored token against
 *   the backend via GET /api/v1/auth/me; invalid, expired, or revoked sessions are purged immediately.
 * - Explicit logout purges the stored token and wipes in-memory auth state.
 * - When end-to-end immunity from script access is required by enterprise compliance,
 *   migrating to HttpOnly, SameSite=Lax cookies with CSRF defense on the backend is recommended.
 */

const TOKEN_KEY = "vibe_hrm_access_token";

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // Gracefully handle storage quota or disabled storage
  }
}

export function removeStoredToken(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    // Gracefully handle storage access restrictions
  }
}
