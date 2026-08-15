/* =============================================================
   Typed TanStack Query hooks per resource.
   ============================================================= */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from './api'
import {
  invalidateCategoryDerived,
  invalidateItemDerived,
  invalidatePermitDerived,
  invalidateWarehouseDerived,
  qk,
} from './query-keys'
import type {
  CategoryInput,
  IssuePermitInput,
  ItemInput,
  WarehouseInput,
} from '../types/api'

/* ---------- Warehouses ---------- */
export const useWarehouses = () =>
  useQuery({ queryKey: qk.warehouses(), queryFn: api.warehouses.list })

export const useWarehouse = (id: number) =>
  useQuery({
    queryKey: qk.warehouse(id),
    queryFn: () => api.warehouses.get(id),
    enabled: id > 0,
  })

export const useCreateWarehouse = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: WarehouseInput) => api.warehouses.create(input),
    onSuccess: () => invalidateWarehouseDerived(qc),
  })
}

export const useUpdateWarehouse = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: WarehouseInput }) =>
      api.warehouses.update(id, input),
    onSuccess: (_d, { id }) => {
      invalidateWarehouseDerived(qc)
      void qc.invalidateQueries({ queryKey: qk.warehouse(id) })
    },
  })
}

export const useDeleteWarehouse = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.warehouses.delete(id),
    onSuccess: () => invalidateWarehouseDerived(qc),
  })
}

/* ---------- Categories ---------- */
export const useCategoriesTree = () =>
  useQuery({ queryKey: qk.categoriesTree(), queryFn: api.categories.tree })

export const useCategoriesFlat = () =>
  useQuery({ queryKey: qk.categoriesFlat(), queryFn: api.categories.flat })

export const useCategory = (id: number) =>
  useQuery({
    queryKey: qk.category(id),
    queryFn: () => api.categories.get(id),
    enabled: id > 0,
  })

export const useCreateCategory = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CategoryInput) => api.categories.create(input),
    onSuccess: () => invalidateCategoryDerived(qc),
  })
}

export const useUpdateCategory = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: CategoryInput }) =>
      api.categories.update(id, input),
    onSuccess: (_d, { id }) => {
      invalidateCategoryDerived(qc)
      void qc.invalidateQueries({ queryKey: qk.category(id) })
    },
  })
}

export const useDeleteCategory = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.categories.delete(id),
    onSuccess: () => invalidateCategoryDerived(qc),
  })
}

/* ---------- Items ---------- */
export const useItems = (params?: { warehouseId?: number; categoryId?: number }) =>
  useQuery({
    queryKey: qk.items(params),
    queryFn: () => api.items.list(params),
  })

export const useItem = (id: number) =>
  useQuery({
    queryKey: qk.item(id),
    queryFn: () => api.items.get(id),
    enabled: id > 0,
  })

export const useCreateItem = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: ItemInput) => api.items.create(input),
    onSuccess: () => invalidateItemDerived(qc),
  })
}

export const useUpdateItem = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: ItemInput }) =>
      api.items.update(id, input),
    onSuccess: (_d, { id }) => {
      invalidateItemDerived(qc)
      void qc.invalidateQueries({ queryKey: qk.item(id) })
    },
  })
}

export const useDeleteItem = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.items.delete(id),
    onSuccess: () => invalidateItemDerived(qc),
  })
}

/* ---------- Permits ---------- */
export const usePermits = () =>
  useQuery({ queryKey: qk.permits(), queryFn: api.permits.list })

export const usePermit = (id: number) =>
  useQuery({
    queryKey: qk.permit(id),
    queryFn: () => api.permits.get(id),
    enabled: id > 0,
  })

export const useIssuePurchase = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: IssuePermitInput) => api.permits.issuePurchase(input),
    onSuccess: () => invalidatePermitDerived(qc),
  })
}

export const useIssueSale = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: IssuePermitInput) => api.permits.issueSale(input),
    onSuccess: () => invalidatePermitDerived(qc),
  })
}

export const useConfirmPurchase = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.permits.confirmPurchase(id),
    onSuccess: (d) => {
      invalidatePermitDerived(qc)
      void qc.invalidateQueries({ queryKey: qk.permit(d.id) })
    },
  })
}

export const useConfirmSale = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.permits.confirmSale(id),
    onSuccess: (d) => {
      invalidatePermitDerived(qc)
      void qc.invalidateQueries({ queryKey: qk.permit(d.id) })
    },
  })
}

export const useCancelPermit = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.permits.cancel(id),
    onSuccess: (d) => {
      invalidatePermitDerived(qc)
      void qc.invalidateQueries({ queryKey: qk.permit(d.id) })
    },
  })
}

/* ---------- Cash ---------- */
export const useCash = () =>
  useQuery({ queryKey: qk.cash(), queryFn: api.cashAccount.get })