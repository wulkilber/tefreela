export type SessionUser = {
  id: string;
  email?: string | null;
  nome?: string | null;
  tipo_usuario: "cliente" | "freelancer" | "admin";
};

const TOKEN_KEY = "tefreela_access_token";
const REFRESH_KEY = "tefreela_refresh_token";
const USER_KEY = "tefreela_usuario";

function stores() {
  return [localStorage, sessionStorage];
}

export function getAccessToken() {
  for (const store of stores()) {
    const value = store.getItem(TOKEN_KEY);
    if (value) return value;
  }
  return null;
}

export function getSessionUser(): SessionUser | null {
  for (const store of stores()) {
    const raw = store.getItem(USER_KEY);
    if (!raw) continue;
    try {
      return JSON.parse(raw) as SessionUser;
    } catch {
      store.removeItem(USER_KEY);
    }
  }
  return null;
}

export function saveSession(
  accessToken: string,
  refreshToken: string,
  user: SessionUser,
  remember = true
) {
  clearSession();
  const store = remember ? localStorage : sessionStorage;
  store.setItem(TOKEN_KEY, accessToken);
  store.setItem(REFRESH_KEY, refreshToken);
  store.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  for (const store of stores()) {
    store.removeItem(TOKEN_KEY);
    store.removeItem(REFRESH_KEY);
    store.removeItem(USER_KEY);
  }
}
