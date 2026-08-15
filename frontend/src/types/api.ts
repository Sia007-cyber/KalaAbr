/* =============================================================
   API types — exact mirror of the backend DTO records.
   -------------------------------------------------------------
   BigDecimal (Java) serializes as JSON number → string in TS.
   LocalDateTime serializes as ISO-8601 string.
   ============================================================= */

export interface Warehouse {
  id: number
  name: string
  address: string | null
  capacity: number | null
}

export interface WarehouseInput {
  name: string
  address?: string | null
  capacity?: number | null
}

export interface Category {
  id: number
  name: string
  parentId: number | null
  /** present only when the endpoint builds a tree */
  children?: Category[]
}

export interface CategoryInput {
  name: string
  parentId?: number | null
}

export interface Item {
  id: number
  name: string
  categoryId: number | null
  categoryName: string | null
  warehouseId: number | null
  warehouseName: string | null
  quantityOnHand: number
  /** committed to arrive via ISSUED purchase permits — never persisted */
  incomingStock: number
  /** reserved for ISSUED sale permits — never persisted */
  reservedStock: number
  availableStock: number
  unitOfMeasure: string
}

export interface ItemInput {
  name: string
  categoryId: number
  warehouseId: number
  unitOfMeasure: string
  quantityOnHand?: number | null
}

export type PermitType = 'PURCHASE' | 'SALE'
export type PermitStatus = 'ISSUED' | 'CONFIRMED' | 'CANCELLED'

export interface PermitLine {
  id: number
  itemId: number
  itemName: string
  quantity: number
  /** Java BigDecimal → JSON number (string in TS) */
  unitPrice: string
}

export interface Permit {
  id: number
  permitType: PermitType
  status: PermitStatus
  warehouseId: number
  warehouseName: string
  totalAmount: string
  createdAt: string
  confirmedAt: string | null
  lines: PermitLine[]
}

export interface PermitLineInput {
  itemId: number
  quantity: number
  unitPrice: string
}

export interface IssuePermitInput {
  warehouseId: number
  lines: PermitLineInput[]
}

export interface CashAccount {
  id: number
  balance: string
}

/* ---------- Authentication ---------- */

export type Role = 'USER' | 'ADMIN'

export interface User {
  id: number
  username: string
  email: string
  role: Role
  createdAt: string
}

/** پاسخ ورود و ثبتنام — توکن JWT + اطلاعات کاربر */
export interface AuthResponse {
  token: string
  user: User
}

export interface RegisterInput {
  username: string
  email: string
  password: string
}

/** ورود با نام کاربری (ترجیحی) یا ایمیل */
export interface LoginInput {
  username?: string
  email?: string
  password: string
}

/** Standard error body from GlobalExceptionHandler */
export interface ApiErrorBody {
  timestamp: string
  status: number
  error: string
  message: string
  path: string
  fieldErrors?: Record<string, string>
}