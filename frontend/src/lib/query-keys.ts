/* =============================================================
   TanStack Query keys + invalidation map.
   -------------------------------------------------------------
   Every entity has a stable key factory. Mutations invalidate
   exactly the caches they affect — a permit mutation touches
   the derived surfaces (items' computed stocks, cash balance)
   so it must invalidate all three.
   ============================================================= */

export const qk = {
  warehouses: () => ['warehouses'] as const,
  warehouse: (id: number) => ['warehouses', id] as const,

  categoriesTree: () => ['categories', 'tree'] as const,
  categoriesFlat: () => ['categories', 'flat'] as const,
  category: (id: number) => ['categories', id] as const,

  items: (params?: { warehouseId?: number; categoryId?: number }) =>
    ['items', params] as const,
  item: (id: number) => ['items', id] as const,

  permits: () => ['permits'] as const,
  permit: (id: number) => ['permits', id] as const,

  cash: () => ['cash'] as const,
}

export interface QueryClientLike {
  invalidateQueries: (filters: { queryKey: readonly unknown[] }) => unknown
}

/** Entities whose derived data changes when a permit mutates */
export const invalidatePermitDerived = (qc: QueryClientLike) => {
  void qc.invalidateQueries({ queryKey: qk.permits() })
  void qc.invalidateQueries({ queryKey: qk.items(undefined) })
  void qc.invalidateQueries({ queryKey: qk.cash() })
}

export const invalidateItemDerived = (qc: QueryClientLike) => {
  void qc.invalidateQueries({ queryKey: qk.items(undefined) })
}

export const invalidateWarehouseDerived = (qc: QueryClientLike) => {
  void qc.invalidateQueries({ queryKey: qk.warehouses() })
  void qc.invalidateQueries({ queryKey: qk.items(undefined) })
}

export const invalidateCategoryDerived = (qc: QueryClientLike) => {
  void qc.invalidateQueries({ queryKey: qk.categoriesTree() })
  void qc.invalidateQueries({ queryKey: qk.categoriesFlat() })
  void qc.invalidateQueries({ queryKey: qk.items(undefined) })
}