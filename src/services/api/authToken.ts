const TOKEN_KEY = "fleetmanager:authToken";

export function getAuthToken() {
  return sessionStorage.getItem(TOKEN_KEY);
}

export function setAuthToken(token: string) {
  sessionStorage.setItem(TOKEN_KEY, token);
}

export function clearAuthToken() {
  sessionStorage.removeItem(TOKEN_KEY);
}

export const authChangedEvent = "fleetmanager:auth-changed";

export function notifyAuthChanged() {
  window.dispatchEvent(new Event(authChangedEvent));
}
