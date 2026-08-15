/* =============================================================
   Persian formatting utilities.
   Persian digits (۰۱۲۳۴۵۶۷۸۹), tabular rendering, Jalali dates.
   Backend timestamps arrive as ISO-8601 (yyyy-MM-dd'T'HH:mm:ss).
   ============================================================= */

const FA_DIGITS = '۰۱۲۳۴۵۶۷۸۹'
const FA_MAP: Record<string, string> = Object.fromEntries(
  [...FA_DIGITS].map((f, i) => [f, String(i)]),
)

/** Convert latin digits to Persian digits */
export function faDigits(input: string | number): string {
  return String(input).replace(/[0-9]/g, (d) => FA_DIGITS[Number(d)])
}

/** Normalize Persian/Arabic digits + separators to plain ASCII numbers.
 *  Used to parse user input (Persian digits) into what the API accepts. */
export function toLatinNumber(input: string): string {
  return input
    .replace(/[۰-۹]/g, (d) => FA_MAP[d])
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
    .replace(/٬|،|,/g, '')
    .trim()
}

/** Group digits with thousands separator, then Persian digits.
 *  concat: append the unit (e.g. 'واحد') after the number. */
export function faNumber(value: string | number): string {
  const s = String(value)
  const [int, frac] = s.split('.')
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, '٬')
  return frac ? faDigits(`${grouped}.${frac}`) : faDigits(grouped)
}

/** Money: 2 fixed decimals, tabular, Persian digits. */
export function faMoney(value: string | number): string {
  const n = Number(value)
  if (Number.isNaN(n)) return '—'
  return faNumber(n.toFixed(2))
}

/** Short compact money for KPI cards — e.g. ۴۸٫۲ میلیون */
export function faMoneyCompact(value: string | number): string {
  const n = Number(value)
  if (Number.isNaN(n)) return '—'
  if (Math.abs(n) >= 1_000_000_000) {
    return `${faNumber((n / 1_000_000_000).toFixed(1))} میلیارد`
  }
  if (Math.abs(n) >= 1_000_000) {
    return `${faNumber((n / 1_000_000).toFixed(1))} میلیون`
  }
  if (Math.abs(n) >= 1_000) {
    return `${faNumber((n / 1_000).toFixed(0))} هزار`
  }
  return faNumber(n)
}

/* ---------- Jalali date ---------- */

const FA_MONTHS = [
  'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
  'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند',
]

/** Gregorian (y,m,d) → [py, pm, pd] Jalali.
 *  Modified algorithm (Kazimierz M. Borkowski) — timezone-naive,
 *  correct for 1900–2100. */
export function toJalali(y: number, m: number, d: number): [number, number, number] {
  const g2j = (gy: number, gm: number, gd: number): [number, number, number] => {
    const g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334]
    let jy = gy <= 1600 ? 0 : 979
    gy -= jy <= 0 ? 621 : 1600
    const gy2 = gm > 2 ? gy + 1 : gy
    let days =
      (365 * gy) +
      Math.floor((gy2 + 3) / 4) -
      Math.floor((gy2 + 99) / 100) +
      Math.floor((gy2 + 399) / 400) -
      80 +
      gd +
      g_d_m[gm - 1]
    jy += 33 * Math.floor(days / 12053)
    days %= 12053
    jy += 4 * Math.floor(days / 1461)
    days %= 1461
    jy += Math.floor((days - 1) / 365)
    if (days > 365) days = (days - 1) % 365
    const jm = days < 186 ? 1 + Math.floor(days / 31) : 7 + Math.floor((days - 186) / 30)
    const jd = 1 + (days < 186 ? days % 31 : (days - 186) % 30)
    return [jy, jm, jd]
  }
  return g2j(y, m, d)
}

/** Parse ISO date (handles date-only or date-time) → Jalali tuple */
function isoToJalali(iso: string): [number, number, number] | null {
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!m) return null
  return toJalali(Number(m[1]), Number(m[2]), Number(m[3]))
}

/** e.g. ۱۴۰۵/۰۵/۲۴ */
export function faDate(iso: string): string {
  const j = isoToJalali(iso)
  if (!j) return iso
  return `${faDigits(j[0])}/${faDigits(String(j[1]).padStart(2, '0'))}/${faDigits(String(j[2]).padStart(2, '0'))}`
}

/** e.g. ۲۴ مرداد ۱۴۰۵ */
export function faDateLong(iso: string): string {
  const j = isoToJalali(iso)
  if (!j) return iso
  return `${faDigits(j[2])} ${FA_MONTHS[j[1] - 1]} ${faDigits(j[0])}`
}

/** e.g. ۲۴ مرداد ۱۴۰۵، ۱۴:۳۰ */
export function faDateTime(iso: string): string {
  const j = isoToJalali(iso)
  const t = iso.match(/T(\d{2}):(\d{2})/)
  if (!j) return iso
  const time = t ? `، ${faDigits(`${t[1]}:${t[2]}`)}` : ''
  return `${faDateLong(iso)}${time}`
}

/** Relative — 'همین الان' / '۳ ساعت پیش' / 'دیروز' / else Jalali date */
export function faRelative(iso: string, now = new Date()): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  const diffMs = now.getTime() - d.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return 'همین الان'
  if (diffMin < 60) return `${faDigits(diffMin)} دقیقه پیش`
  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24) return `${faDigits(diffH)} ساعت پیش`
  const nowStart = new Date(now)
  nowStart.setHours(0, 0, 0, 0)
  const dStart = new Date(d)
  dStart.setHours(0, 0, 0, 0)
  const dayDiff = Math.round((nowStart.getTime() - dStart.getTime()) / 86400000)
  if (dayDiff === 1) return 'دیروز'
  if (dayDiff < 7) return `${faDigits(dayDiff)} روز پیش`
  return faDate(iso)
}