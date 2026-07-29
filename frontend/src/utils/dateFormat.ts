/**
 * Shared date formatting — single source for the chart axis label and the
 * "when did this happen" datetime used in tables. Previously copy-pasted in
 * five components.
 */

/** Chart axis label: "2026-01-31" → "Jan 26". Falls back to the raw string. */
export function formatChartDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString(undefined, { month: "short", year: "2-digit" });
  } catch {
    return dateStr;
  }
}

/** Locale datetime for table cells: null/invalid → "—". */
export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}
