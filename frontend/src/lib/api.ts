/* =============================================================
   API client — thin typed fetch wrapper over the backend REST API.
   -------------------------------------------------------------
   Base URL:      VITE_API_URL env var (e.g. http://localhost:8080/api)
                  falls back to the Vite dev proxy (/api) with env-var
                  override to the CORS-whitelisted backend origin.
   Errors:        non-2xx → ApiError with parsed body + status.
   Conventions:   JSON in/out, 204 → null, cardinality-safe.
   ============================================================= */

import type {
  ApiErrorBody,
  AuthResponse,
  CashAccount,
  Category,
  CategoryInput,
  IssuePermitInput,
  Item,
  ItemInput,
  LoginInput,
  Permit,
  RegisterInput,
  Warehouse,
  WarehouseInput,
} from '../types/api'
import { getToken } from './token'

/** Resolve the API base URL once. Origin override must be one of the
 *  backend's CORS-whitelisted origins (see application.yml). */
const apiBase: string = import.meta.env.VITE_API_URL ?? '/api'

const authHeaders = (): Record<string, string> => {
  const token = getToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export class ApiError extends Error {
  readonly status: number
  readonly body: ApiErrorBody | null
  /** server validation message — stores a list of field messages */
  readonly messages: string[]

  constructor(status: number, body: ApiErrorBody | null, fallback: string) {
    const first = body?.message ?? fallback
    super(first)
    this.name = 'ApiError'
    this.status = status
    this.body = body
    this.messages = body?.fieldErrors
      ? Object.values(body.fieldErrors)
      : first
        ? [first]
        : []
  }
}

async function request<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(`${apiBase}${path}`, {
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    ...init,
  })

  if (!res.ok) {
    let body: ApiErrorBody | null = null
    try {
      body = (await res.json()) as ApiErrorBody
    } catch {
      /* non-JSON error (proxy, gateway) → body stays null */
    }
    throw new ApiError(res.status, body, `درخواست ناموفق (${res.status})`)
  }

  if (res.status === 204) return undefined as T
  return (await res.json()) as T
}

/* ------------------------------------------------------------------ */
/* Endpoints                                                          */
/* ------------------------------------------------------------------ */

export const api = {
  /* ---------- Auth /api/auth ---------- */
  auth: {
    register: (input: RegisterInput) =>
      request<AuthResponse>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    login: (input: LoginInput) =>
      request<AuthResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
  },

  /* ---------- Warehouses /api/warehouses ---------- */
  warehouses: {
    list: () => request<Warehouse[]>('/warehouses'),
    get: (id: number) => request<Warehouse>(`/warehouses/${id}`),
    create: (input: WarehouseInput) =>
      request<Warehouse>('/warehouses', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    update: (id: number, input: WarehouseInput) =>
      request<Warehouse>(`/warehouses/${id}`, {
        method: 'PUT',
        body: JSON.stringify(input),
      }),
    delete: (id: number) =>
      request<void>(`/warehouses/${id}`, { method: 'DELETE' }),
  },

  /* ---------- Categories /api/categories ---------- */
  categories: {
    tree: () => request<Category[]>('/categories'),
    flat: () => request<Category[]>('/categories/flat'),
    get: (id: number) => request<Category>(`/categories/${id}`),
    create: (input: CategoryInput) =>
      request<Category>('/categories', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    update: (id: number, input: CategoryInput) =>
      request<Category>(`/categories/${id}`, {
        method: 'PUT',
        body: JSON.stringify(input),
      }),
    delete: (id: number) =>
      request<void>(`/categories/${id}`, { method: 'DELETE' }),
  },

  /* ---------- Items /api/items ---------- */
  items: {
    list: (params?: { warehouseId?: number; categoryId?: number }) => {
      const q = new URLSearchParams()
      if (params?.warehouseId != null) q.set('warehouseId', String(params.warehouseId))
      if (params?.categoryId != null) q.set('categoryId', String(params.categoryId))
      const qs = q.toString()
      return request<Item[]>(`/items${qs ? `?${qs}` : ''}`)
    },
    get: (id: number) => request<Item>(`/items/${id}`),
    create: (input: ItemInput) =>
      request<Item>('/items', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    update: (id: number, input: ItemInput) =>
      request<Item>(`/items/${id}`, {
        method: 'PUT',
        body: JSON.stringify(input),
      }),
    delete: (id: number) =>
      request<void>(`/items/${id}`, { method: 'DELETE' }),
  },

  /* ---------- Permits /api/permits ---------- */
  permits: {
    list: () => request<Permit[]>('/permits'),
    get: (id: number) => request<Permit>(`/permits/${id}`),
    issuePurchase: (input: IssuePermitInput) =>
      request<Permit>('/permits/purchases', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    confirmPurchase: (id: number) =>
      request<Permit>(`/permits/purchases/${id}/confirm`, { method: 'POST' }),
    issueSale: (input: IssuePermitInput) =>
      request<Permit>('/permits/sales', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    confirmSale: (id: number) =>
      request<Permit>(`/permits/sales/${id}/confirm`, { method: 'POST' }),
    cancel: (id: number) =>
      request<Permit>(`/permits/${id}/cancel`, { method: 'POST' }),
  },

  /* ---------- Cash account /api/cash-account ---------- */
  cashAccount: {
    get: () => request<CashAccount>('/cash-account'),
  },
}