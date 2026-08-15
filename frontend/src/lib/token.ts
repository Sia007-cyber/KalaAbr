/* =============================================================
   Token store — JWT session persistence + reactivity.
   Dual backing: in-memory (survives only this tab's lifetime) +
   localStorage (survives refresh). A tiny external store keeps
   the «authenticated» flag reactive for RequireAuth/UI.
   ============================================================= */

const TOKEN_KEY = 'kalaabr.token'

let memoryToken: string | null = null
const listeners = new Set<() => void>()

function readStorage(): string | null {
  try {
    return window.localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

function current(): string | null {
  return memoryToken ?? readStorage()
}

function emit() {
  for (const l of listeners) l()
}

export function getToken(): string | null {
  return current()
}

export function isAuthenticated(): boolean {
  return current() !== null
}

export function setToken(token: string): void {
  memoryToken = token
  try {
    window.localStorage.setItem(TOKEN_KEY, token)
  } catch {
    /* storage unavailable (private mode) — memory token still holds */
  }
  emit()
}

export function clearToken(): void {
  memoryToken = null
  try {
    window.localStorage.removeItem(TOKEN_KEY)
  } catch {
    /* noop */
  }
  emit()
}

/** React en sink: subscribe + getSnapshot for useSyncExternalStore. */
export function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function getSnapshot(): boolean {
  return current() !== null
}