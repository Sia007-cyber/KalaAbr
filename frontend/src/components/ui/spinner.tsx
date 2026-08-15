/* =============================================================
   Spinner — small, transform-only, reduced-motion aware.
   ============================================================= */

export function Spinner({ size = 16 }: { size?: number }) {
  return (
    <span
      className="spinner"
      style={{ width: size, height: size }}
      role="status"
      aria-label="در حال بارگذاری"
    >
      <svg viewBox="0 0 16 16" width={size} height={size} aria-hidden>
        <circle
          cx="8" cy="8" r="6"
          fill="none"
          stroke="currentColor"
          strokeOpacity="0.25"
          strokeWidth="2"
        />
        <path
          d="M14 8a6 6 0 0 0-6-6"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    </span>
  )
}