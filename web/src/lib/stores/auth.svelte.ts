import { jwtDecode } from "jwt-decode";

const STORAGE_KEY = "hive.token";

interface JWTPayload {
  sub: string;
  username: string;
  name: string;
  exp: number;
  iat: number;
}

export interface CurrentUser {
  id: string;
  username: string;
  name: string;
}

function readStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(STORAGE_KEY);
}

function decodeSafely(token: string | null): JWTPayload | null {
  if (!token) return null;
  try {
    return jwtDecode<JWTPayload>(token);
  } catch {
    return null;
  }
}

function expiresInSeconds(payload: JWTPayload | null): number {
  if (!payload) return 0;
  return payload.exp - Math.floor(Date.now() / 1000);
}

/**
 * Auth store backed by localStorage. Decodes the JWT client-side so the
 * expiry is available synchronously — the layout gate checks it before
 * calling any GraphQL endpoint.
 */
function createAuth() {
  let token = $state<string | null>(readStoredToken());
  let payload = $derived(decodeSafely(token));

  return {
    get token() {
      return token;
    },
    get user(): CurrentUser | null {
      if (!payload) return null;
      return { id: payload.sub, username: payload.username, name: payload.name };
    },
    /** Synchronous auth check — token exists and is not expired. */
    isAuthenticated(): boolean {
      return payload !== null && expiresInSeconds(payload) > 0;
    },
    setToken(next: string) {
      token = next;
      localStorage.setItem(STORAGE_KEY, next);
    },
    clearToken() {
      token = null;
      localStorage.removeItem(STORAGE_KEY);
    },
  };
}

export const auth = createAuth();
