/* =============================================================
   CommandPalette — ⌘K global search (items, warehouses, permits,
   actions). Instant: no enter animation for high-frequency tool.
   Registered via useEffect so the dialog's DialogTitle isn't
   required by the DOM tree. Uses cmdk.
   ============================================================= */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import * as Dialog from '@radix-ui/react-dialog'
import { Command } from 'cmdk'
import {
  Search,
  Boxes,
  Warehouse as WarehouseIcon,
  FileStack,
  ArrowDownToLine,
  ArrowUpFromLine,
  PackagePlus,
} from 'lucide-react'
import { useItems, useWarehouses, usePermits } from '../../lib/hooks'
import { faDigits, faMoneyCompact, faRelative } from '../../lib/format'

interface CommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const nav = useNavigate()
  const [search, setSearch] = useState('')
  const items = useItems()
  const warehouses = useWarehouses()
  const permits = usePermits()

  const go = (path: string) => {
    onOpenChange(false)
    setSearch('')
    nav(path)
  }

  const itemResults = items.data ?? []
  const warehouseResults = warehouses.data ?? []
  const permitResults = permits.data ?? []

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="palette-overlay" />
        <Dialog.Content
          className="palette-content"
          aria-describedby={undefined}
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <Dialog.Title className="sr-only">جستجوی سریع</Dialog.Title>
          <Command
            label="جستجوی سریع"
            loop
            shouldFilter={false}
            onKeyDown={(e) => {
              if (e.key === 'Escape') onOpenChange(false)
            }}
          >
            <div className="palette-input-wrap">
              <Search size={16} aria-hidden />
              <Command.Input
                autoFocus
                className="palette-input"
                placeholder="جستجوی کالا، انبار، مجوز…"
                value={search}
                onValueChange={setSearch}
              />
            </div>
            <Command.List className="palette-list">
              <Command.Empty className="palette-empty">موردی یافت نشد</Command.Empty>

              {permitResults.length > 0 && (
                <Command.Group heading="مجوزها">
                  {permitResults.slice(0, 4).map((p) => (
                    <Command.Item
                      key={p.id}
                      value={`permit-${p.id}`}
                      onSelect={() => go(`/permits/${p.id}`)}
                      className="palette-item"
                    >
                      <FileStack size={15} aria-hidden />
                      <span className="palette-item-label">
                        #{p.id} — {p.warehouseName}
                      </span>
                      <span className="palette-item-meta">
                        {faMoneyCompact(p.totalAmount)} · {faRelative(p.createdAt)}
                      </span>
                    </Command.Item>
                  ))}
                </Command.Group>
              )}

              {itemResults.length > 0 && (
                <Command.Group heading="کالاها">
                  {itemResults
                    .filter((i) =>
                      search
                        ? i.name.includes(search) ||
                          i.warehouseName?.includes(search)
                        : true,
                    )
                    .slice(0, 5)
                    .map((i) => (
                      <Command.Item
                        key={i.id}
                        value={`item-${i.id}`}
                        onSelect={() => go(`/items/${i.id}`)}
                        className="palette-item"
                      >
                        <Boxes size={15} aria-hidden />
                        <span className="palette-item-label">{i.name}</span>
                        <span className="palette-item-meta">
                          {i.warehouseName} · {faDigits(i.availableStock)} واحد
                        </span>
                      </Command.Item>
                    ))}
                </Command.Group>
              )}

              {warehouseResults.length > 0 && (
                <Command.Group heading="انبارها">
                  {warehouseResults.map((w) => (
                    <Command.Item
                      key={w.id}
                      value={`warehouse-${w.id}`}
                      onSelect={() => go(`/warehouses/${w.id}`)}
                      className="palette-item"
                    >
                      <WarehouseIcon size={15} aria-hidden />
                      <span className="palette-item-label">{w.name}</span>
                      <span className="palette-item-meta">
                        {w.capacity != null ? `${w.capacity} واحد` : ''}
                      </span>
                    </Command.Item>
                  ))}
                </Command.Group>
              )}

              <Command.Group heading="اقدامات">
                <Command.Item
                  value="action-purchase"
                  onSelect={() => go('/permits/new?type=purchase')}
                  className="palette-item"
                >
                  <ArrowDownToLine size={15} aria-hidden />
                  <span className="palette-item-label">صدور مجوز خرید</span>
                </Command.Item>
                <Command.Item
                  value="action-sale"
                  onSelect={() => go('/permits/new?type=sale')}
                  className="palette-item"
                >
                  <ArrowUpFromLine size={15} aria-hidden />
                  <span className="palette-item-label">صدور مجوز فروش</span>
                </Command.Item>
                <Command.Item
                  value="action-item"
                  onSelect={() => go('/items/new')}
                  className="palette-item"
                >
                  <PackagePlus size={15} aria-hidden />
                  <span className="palette-item-label">افزودن کالا</span>
                </Command.Item>
              </Command.Group>
            </Command.List>
          </Command>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}