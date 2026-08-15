/* =============================================================
   PermitForm — two-step permit issuance (purchase / sale).
   -------------------------------------------------------------
   Step 1: warehouse + line-items editor (client-validated against
           the same rules the backend enforces — available stock,
           capacity, cash).
   Step 2: preview — the ledger effect BEFORE anything is written,
           showing the exact cash + stock impact, then commit.

   The preview is the guard: every rule the backend will throw on
   is surfaced here first, so a business-rule 4xx should never
   normally reach the server (server rules remain the source of
   truth; this is mirroring, not a replacement).
   ============================================================= */

import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Plus,
  Trash2,
  ShieldAlert,
  Undo2,
} from 'lucide-react'
import { Button } from '../ui/button'
import { PageHeader } from '../layout/AppLayout'
import {
  useItems,
  useIssuePurchase,
  useIssueSale,
  useWarehouses,
} from '../../lib/hooks'
import { faDigits, faMoney, toLatinNumber } from '../../lib/format'
import type { PermitLineInput, PermitType } from '../../types/api'

/* ---------- types ---------- */

interface LineDraft {
  /** stable local id (NOT item id) so React can key rows */
  key: number
  itemId: number | ''
  quantity: string
  unitPrice: string
}

interface LineSummary {
  itemId: number
  name: string
  quantity: number
  unitPrice: number
  /** stock-availability message, or null when OK */
  stockIssue: string | null
  /** capacity-limit message, or null when OK (purchase only) */
  capacityIssue: string | null
}

type Flow = 'editor' | 'preview'

/** reference-stable empty arrays — avoids re-created useMemo deps */
const EMPTY_ITEMS: import('../../types/api').Item[] = []
const EMPTY_WAREHOUSES: import('../../types/api').Warehouse[] = []

/* ---------- main ---------- */

export function PermitForm() {
  const nav = useNavigate()
  const [params] = useSearchParams()

  /* ?type=purchase|sale — default purchase; unknown values fall back */
  const initialType: PermitType =
    params.get('type') === 'sale' ? 'SALE' : 'PURCHASE'

  const [type, setType] = useState<PermitType>(initialType)
  const [warehouseId, setWarehouseId] = useState<number | ''>('')
  const [lines, setLines] = useState<LineDraft[]>([blankLine()])
  const [flow, setFlow] = useState<Flow>('editor')
  const [submitErr, setSubmitErr] = useState<string | null>(null)

  const warehouses = useWarehouses()
  const items = useItems()
  const issueP = useIssuePurchase()
  const issueS = useIssueSale()

  const itemsData = items.data ?? EMPTY_ITEMS
  const whData = warehouses.data ?? EMPTY_WAREHOUSES

  const itemsOfWh = useMemo(
    () =>
      warehouseId === ''
        ? itemsData
        : itemsData.filter((i) => i.warehouseId === warehouseId),
    [itemsData, warehouseId],
  )

  const lineSummaries = useMemo(() => summarize(lines, itemsData), [lines, itemsData])

  const total = useMemo(
    () =>
      lineSummaries.reduce(
        (s, l) => s + (Number.isFinite(l.unitPrice) ? l.unitPrice : 0) * l.quantity,
        0,
      ),
    [lineSummaries],
  )

  /* business guards (mirror of the backend rules) */
  const availableQty = warehouseId === '' ? 0 : sumQuantityOnHand(warehouseId, itemsData)
  const currentIncoming = warehouseId === '' ? 0 : sumIncoming(warehouseId, itemsData)
  const cap = whData.find((w) => w.id === warehouseId)?.capacity ?? null

  const saleShort = total > 0 && availableQty < totalQty(lineSummaries)
  const capacityShort =
    type === 'PURCHASE' && cap != null && totalQty(lineSummaries) > 0
      ? availableQty + currentIncoming + totalQty(lineSummaries) > cap
      : false

  const valid =
    warehouseId !== '' && lineSummaries.length > 0 && !saleShort && !capacityShort

  const goPreview = () => {
    setSubmitErr(null)
    setFlow('preview')
  }

  const backToEdit = () => {
    setSubmitErr(null)
    setFlow('editor')
  }

  const doIssue = async () => {
    if (warehouseId === '') return
    if (!valid) return
    const input: { warehouseId: number; lines: PermitLineInput[] } = {
      warehouseId,
      lines: lineSummaries.map((l) => ({
        itemId: l.itemId,
        quantity: l.quantity,
        unitPrice: String(l.unitPrice),
      })),
    }
    try {
      const permit =
        type === 'PURCHASE'
          ? await issueP.mutateAsync(input)
          : await issueS.mutateAsync(input)
      nav(`/permits/${permit.id}`)
    } catch (e) {
      setSubmitErr(e instanceof Error ? e.message : 'خطای ناشناخته')
    }
  }

  const busy = issueP.isPending || issueS.isPending

  return (
    <>
      <PageHeader
        title={type === 'PURCHASE' ? 'صدور مجوز خرید' : 'صدور مجوز فروش'}
        subtitle="ثبت ورود یا خروج کالا با پیشنمایش اثر نقدی و موجودی"
      />

      {flow === 'editor' ? (
        <Step1
          type={type}
          setType={(t) => {
            setType(t)
            setWarehouseId('')
            setLines([blankLine()])
            setFlow('editor')
          }}
          warehouseId={warehouseId}
          setWarehouseId={(v) => {
            setWarehouseId(v)
            setLines([blankLine()])
          }}
          lines={lines}
          setLines={setLines}
          whData={whData}
          itemsOfWh={itemsOfWh}
          lineSummaries={lineSummaries}
          total={total}
          availableQty={availableQty}
          currentIncoming={currentIncoming}
          cap={cap}
          saleShort={saleShort}
          capacityShort={capacityShort}
          loading={warehouses.isPending || items.isPending}
          onPreview={goPreview}
        />
      ) : (
        <Step2
          type={type}
          backToEdit={backToEdit}
          warehouseName={
            whData.find((w) => w.id === warehouseId)?.name ?? '—'
          }
          lines={lines}
          itemsData={itemsData}
          total={total}
          availableQty={availableQty}
          currentIncoming={currentIncoming}
          cap={cap}
          busy={busy}
          err={submitErr}
          onIssue={doIssue}
        />
      )}
    </>
  )
}

/* ---------- helpers ---------- */

function blankLine(): LineDraft {
  return { key: Date.now(), itemId: '', quantity: '', unitPrice: '' }
}

function summarize(lines: LineDraft[], itemsData: import('../../types/api').Item[]): LineSummary[] {
  const out: LineSummary[] = []
  for (const l of lines) {
    if (l.itemId === '') continue
    const it = itemsData.find((i) => i.id === l.itemId)
    const quantity = parseQty(l.quantity)
    const unitPrice = parseMoney(l.unitPrice)
    if (!it) continue
    let stockIssue: string | null = null
    if (quantity > it.availableStock) {
      stockIssue = `موجودی قابل فروش: ${faDigits(it.availableStock)} واحد`
    }
    out.push({
      itemId: it.id,
      name: it.name,
      quantity,
      unitPrice,
      stockIssue,
      capacityIssue: null,
    })
  }
  return out
}

function parseQty(s: string): number {
  const n = Number(toLatinNumber(s))
  return Number.isInteger(n) && n > 0 ? n : 0
}

function parseMoney(s: string): number {
  const n = Number(toLatinNumber(s))
  return Number.isFinite(n) && n >= 0 ? n : 0
}

function sumQuantityOnHand(
  warehouseId: number,
  itemsData: import('../../types/api').Item[],
): number {
  return itemsData
    .filter((i) => i.warehouseId === warehouseId)
    .reduce((s, i) => s + i.quantityOnHand, 0)
}

function sumIncoming(
  warehouseId: number,
  itemsData: import('../../types/api').Item[],
): number {
  return itemsData
    .filter((i) => i.warehouseId === warehouseId)
    .reduce((s, i) => s + i.incomingStock, 0)
}

function totalQty(lines: LineSummary[]): number {
  return lines.reduce((s, l) => s + l.quantity, 0)
}

/* ---------- Step 1: editor ---------- */

function Step1({
  type,
  setType,
  warehouseId,
  setWarehouseId,
  lines,
  setLines,
  whData,
  itemsOfWh,
  lineSummaries,
  total,
  availableQty,
  currentIncoming,
  cap,
  saleShort,
  capacityShort,
  loading,
  onPreview,
}: {
  type: PermitType
  setType: (t: PermitType) => void
  warehouseId: number | ''
  setWarehouseId: (v: number | '') => void
  lines: LineDraft[]
  setLines: (l: LineDraft[]) => void
  whData: import('../../types/api').Warehouse[]
  itemsOfWh: import('../../types/api').Item[]
  lineSummaries: LineSummary[]
  total: number
  availableQty: number
  currentIncoming: number
  cap: number | null
  saleShort: boolean
  capacityShort: boolean
  loading: boolean
  onPreview: () => void
}) {
  const updateLine = (key: number, patch: Partial<LineDraft>) => {
    setLines(lines.map((l) => (l.key === key ? { ...l, ...patch } : l)))
  }
  const removeLine = (key: number) => {
    setLines(lines.length > 1 ? lines.filter((l) => l.key !== key) : [blankLine()])
  }
  const addLine = () => setLines([...lines, blankLine()])

  const valid =
    warehouseId !== '' && lineSummaries.length > 0 && !saleShort && !capacityShort

  return (
    <div className="form-grid">
      <section className="card step gs-8" aria-label="اطلاعات مجوز">
        <div className="step-head">
          <span className="step-num">۱</span>
          <div>
            <div className="step-title">اطلاعات مجوز</div>
            <div className="step-sub">نوع، انبار و ردیفهای کالا</div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {/* type */}
          <div className="field">
            <span className="field-label" id="pf-type-label">
              نوع مجوز
            </span>
            <div
              className="onoff"
              role="radiogroup"
              aria-labelledby="pf-type-label"
            >
              <button
                type="button"
                role="radio"
                aria-checked={type === 'PURCHASE'}
                className={`onoff-btn is-in${type === 'PURCHASE' ? ' is-active' : ''}`}
                onClick={() => setType('PURCHASE')}
              >
                <ArrowDownToLine size={14} aria-hidden />
                خرید
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={type === 'SALE'}
                className={`onoff-btn is-out${type === 'SALE' ? ' is-active' : ''}`}
                onClick={() => setType('SALE')}
              >
                <ArrowUpFromLine size={14} aria-hidden />
                فروش
              </button>
            </div>
          </div>

          {/* warehouse */}
          <div className="field">
            <label className="field-label" htmlFor="pf-wh">
              انبار
            </label>
            <select
              id="pf-wh"
              className="select"
              value={warehouseId}
              onChange={(e) =>
                setWarehouseId(e.target.value === '' ? '' : Number(e.target.value))
              }
              disabled={loading}
            >
              <option value="" disabled>
                {loading ? 'در حال بارگذاری…' : 'انتخاب انبار…'}
              </option>
              {whData.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </div>

          {/* capacity context */}
          {warehouseId !== '' && (
            <p className="field-hint" style={{ display: 'flex', gap: 'var(--space-1)' }}>
              {type === 'PURCHASE' && cap != null
                ? `ظرفیت انبار: ${faDigits(cap)} واحد · اشغالشده: ${faDigits(availableQty)} · در راه: ${faDigits(currentIncoming)}`
                : `موجودی قابل فروش در انبار: ${faDigits(availableQty)} واحد`}
            </p>
          )}
        </div>
      </section>

      <section className="card step gs-4" aria-label="نکات">
        <div className="step-head">
          <span className="step-num" style={{ color: 'var(--text-faint)', borderColor: 'var(--border)' }}>
            !
          </span>
          <div>
            <div className="step-title">نکات</div>
            <div className="step-sub">قبل از صدور</div>
          </div>
        </div>
        <ul style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
          <li>در مجوز خرید، وجه کل همان لحظه از حساب کسر میشود (تعهد).</li>
          <li>در مجوز فروش، موجودی قابل فروش رزرو میشود و وجه پس از تأیید واریز میشود.</li>
          <li>پس از صدور، میتوانید مجوز را تأیید یا لغو کنید.</li>
        </ul>
      </section>

      <section className="card step gs-12" aria-label="ردیفهای کالا">
        <div className="step-head">
          <span className="step-num">۲</span>
          <div>
            <div className="step-title">ردیفهای کالا</div>
            <div className="step-sub">
              {type === 'PURCHASE'
                ? 'کالاها باید متعلق به انبار انتخابی باشند'
                : 'فقط کالاهایی با موجودی قابل فروش کافی نمایش داده میشوند'}
            </div>
          </div>
        </div>

        <div className="line-editor">
          <div className="line-head">
            <span>کالا</span>
            <span>تعداد</span>
            <span>قیمت واحد</span>
            <span aria-hidden />
          </div>

          {lines.map((l) => {
            const sum = lineSummaries.find((s) => s.itemId === l.itemId)
            const warn = sum?.stockIssue != null
            return (
              <div key={l.key} className={`line-row${warn ? ' is-warn' : ''}`}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                  <select
                    className="select line-select"
                    value={l.itemId}
                    onChange={(e) =>
                      updateLine(l.key, {
                        itemId: e.target.value === '' ? '' : Number(e.target.value),
                      })
                    }
                  >
                    <option value="" disabled>
                      انتخاب کالا…
                    </option>
                    {itemsOfWh.map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.name}
                      </option>
                    ))}
                  </select>
                  {sum && (
                    <span className={`line-sum${sum.stockIssue ? ' is-warn' : ''}`}>
                      {sum.stockIssue ??
                        `قابل فروش: ${faDigits(
                          itemsOfWh.find((i) => i.id === sum.itemId)?.availableStock ?? 0,
                        )} واحد`}
                    </span>
                  )}
                </div>
                <input
                  className="input line-qty"
                  inputMode="numeric"
                  placeholder="تعداد"
                  value={l.quantity}
                  onChange={(e) => updateLine(l.key, { quantity: e.target.value })}
                  aria-label="تعداد"
                />
                <input
                  className="input line-qty"
                  inputMode="decimal"
                  placeholder="قیمت واحد"
                  value={l.unitPrice}
                  onChange={(e) => updateLine(l.key, { unitPrice: e.target.value })}
                  aria-label="قیمت واحد"
                />
                <button
                  type="button"
                  className="line-remove"
                  onClick={() => removeLine(l.key)}
                  disabled={lines.length <= 1}
                  aria-label="حذف ردیف"
                >
                  <Trash2 size={15} aria-hidden />
                </button>
              </div>
            )
          })}
        </div>

        <Button
          type="button"
          variant="secondary"
          size="sm"
          style={{ marginTop: 'var(--space-3)' }}
          onClick={addLine}
        >
          <Plus size={14} aria-hidden />
          افزودن ردیف
        </Button>
      </section>

      <div className="card step gs-12">
        <div className="form-total-line">
          <span>جمع کل</span>
          <strong>{faMoney(total)}</strong>
        </div>
        <div className="form-total-commit">
          <Button
            variant="primary"
            onClick={onPreview}
            disabled={!valid || loading}
          >
            پیشنمایش اثر
            <ArrowUpFromLine size={15} aria-hidden />
          </Button>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)', alignItems: 'flex-end' }}>
            {warehouseId === '' && (
              <span className="form-hint">ابتدا انبار را انتخاب کنید.</span>
            )}
            {saleShort && (
              <span className="form-hint" style={{ color: 'var(--danger-600)' }}>
                تعداد درخواستی از موجودی قابل فروش فراتر است.
              </span>
            )}
            {capacityShort && (
              <span className="form-hint" style={{ color: 'var(--danger-600)' }}>
                این خرید ظرفیت انبار را رد میکند.
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ---------- Step 2: preview ---------- */

function Step2({
  type,
  backToEdit,
  warehouseName,
  lines,
  itemsData,
  total,
  availableQty,
  currentIncoming,
  cap,
  busy,
  err,
  onIssue,
}: {
  type: PermitType
  backToEdit: () => void
  warehouseName: string
  lines: LineDraft[]
  itemsData: import('../../types/api').Item[]
  total: number
  availableQty: number
  currentIncoming: number
  cap: number | null
  busy: boolean
  err: string | null
  onIssue: () => void
}) {
  const summaries = summarize(lines, itemsData)
  const isPurchase = type === 'PURCHASE'

  return (
    <div className="form-grid">
      <section className="card step gs-8" aria-label="پیشنمایش">
        <div className="step-head">
          <span className="step-num">۳</span>
          <div>
            <div className="step-title">پیشنمایش اثر</div>
            <div className="step-sub">
              {isPurchase ? 'چک تأیید: اثر روی نقدینگی و ظرفیت' : 'چک تأیید: اثر روی موجودی'}
            </div>
          </div>
        </div>

        <div className="line-editor" style={{ marginBottom: 'var(--space-4)' }}>
          <div className="line-head">
            <span>کالا</span>
            <span>تعداد</span>
            <span>قیمت واحد</span>
            <span aria-hidden />
          </div>
          {summaries.map((s) => (
            <div key={s.itemId} className={`line-row${s.stockIssue ? ' is-warn' : ''}`}>
              <div style={{ minWidth: 0 }}>
                <div className="line-item-meta">{s.name}</div>
              </div>
              <span className="num" style={{ fontSize: 'var(--text-sm)' }}>
                {faDigits(s.quantity)}
              </span>
              <span className="num" style={{ fontSize: 'var(--text-sm)' }}>
                {faMoney(s.unitPrice)}
              </span>
              <span aria-hidden />
            </div>
          ))}
        </div>

        <div className="form-total-line">
          <span>جمع کل</span>
          <strong>{faMoney(total)}</strong>
        </div>
        <div className="form-total-line is-neg">
          <span>اثر روی حساب نقدی</span>
          <strong>{isPurchase ? `−${faMoney(total)}` : 'بدون اثر'}</strong>
        </div>
        <div className="form-total-line is-pos">
          <span>اثر روی موجودی</span>
          <strong>
            {isPurchase
              ? `+${faDigits(totalQty(summaries))} واحد (در راه)`
              : `−${faDigits(totalQty(summaries))} واحد (رزرو)`}
          </strong>
        </div>

        <p className="form-issue-note" style={{ marginTop: 'var(--space-3)' }}>
          <span className={`dot ${isPurchase ? 'is-neg' : 'is-pos'}`} aria-hidden />
          {isPurchase
            ? 'با صدور، این مبلغ بلافاصله از موجودی نقدی کسر میشود و پس از تأیید، موجودی کالا افزایش مییابد.'
            : 'با صدور، موجودی قابل فروش رزرو میشود و پس از تأیید، وجه به حساب واریز میشود.'}
        </p>
      </section>

      <section className="card step gs-4" aria-label="خلاصه">
        <div className="step-head">
          <span className="step-num">✓</span>
          <div>
            <div className="step-title">خلاصه</div>
            <div className="step-sub">جزئیات مجوز</div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', fontSize: 'var(--text-sm)' }}>
          <div className="form-total-line" style={{ justifyContent: 'flex-start', gap: 'var(--space-2)' }}>
            <span>نوع</span>
            <strong>{isPurchase ? 'خرید' : 'فروش'}</strong>
          </div>
          <div className="form-total-line" style={{ justifyContent: 'flex-start', gap: 'var(--space-2)' }}>
            <span>انبار</span>
            <strong>{warehouseName}</strong>
          </div>
          <div className="form-total-line" style={{ justifyContent: 'flex-start', gap: 'var(--space-2)' }}>
            <span>ردیفها</span>
            <strong>{faDigits(summaries.length)}</strong>
          </div>
          <div className="form-total-line" style={{ justifyContent: 'flex-start', gap: 'var(--space-2)' }}>
            <span>جمع</span>
            <strong>{faMoney(total)}</strong>
          </div>
          {isPurchase && cap != null && (
            <div className="form-total-line" style={{ justifyContent: 'flex-start', gap: 'var(--space-2)' }}>
              <span>ظرفیت پس از صدور</span>
              <strong>{faDigits(availableQty + currentIncoming + totalQty(summaries))} / {faDigits(cap)}</strong>
            </div>
          )}
        </div>
      </section>

      {err && (
        <div className="form-grid gs-12" style={{ marginTop: 'var(--space-4)' }}>
          <div className="form-err">
            <ShieldAlert size={15} aria-hidden />
            {err}
          </div>
        </div>
      )}

      <div className="form-actions" style={{ gridColumn: 'span 12' }}>
        <Button variant="secondary" onClick={backToEdit} disabled={busy}>
          <Undo2 size={15} aria-hidden />
          بازگشت به ویرایش
        </Button>
        <Button variant="primary" onClick={onIssue} loading={busy}>
          {isPurchase ? <ArrowDownToLine size={15} aria-hidden /> : <ArrowUpFromLine size={15} aria-hidden />}
          صدور نهایی مجوز {isPurchase ? 'خرید' : 'فروش'}
        </Button>
      </div>
    </div>
  )
}
