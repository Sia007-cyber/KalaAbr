/* =============================================================
   Route stubs — detail/edit surfaces land in the next build phase.
   They still render the entity's name from live data so links in
   the shell never 404.
   ============================================================= */

import { useParams } from 'react-router-dom'
import { PageHeader } from '../../components/layout/AppLayout'
import { useWarehouse } from '../../lib/hooks'

export function WarehouseDetailPage() {
  const { id } = useParams()
  const nid = Number(id)
  const { data, isPending } = useWarehouse(nid)
  return (
    <>
      <PageHeader title={isPending ? '…' : data?.name ?? 'انبار'} />
      <div className="card empty">
        <p>جزئیات کامل انبار در فاز بعدی طراحی میشود.</p>
      </div>
    </>
  )
}

