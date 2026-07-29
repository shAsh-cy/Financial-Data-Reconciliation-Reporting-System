export function parseDecimal(s: string | null | undefined): number {
  if (s == null || s === "") return 0;
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : 0;
}

export function formatCurrency(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatCurrencyDetailed(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/** Compact axis/label form: 1_250_000 → "1.3M", 4_200 → "4.2K", 12 → "12". */
export function formatCompact(value: number): string {
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toFixed(0);
}

export function formatPercent(value: number | null | undefined, fractionDigits = 1): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return `${value.toFixed(fractionDigits)}%`;
}

export function formatRatio(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return value.toFixed(2);
}

export function trendFromSeries(current: number, previous: number): {
  deltaPct: number;
  label: string;
  trend: "up" | "down" | "flat";
} | null {
  if (!Number.isFinite(current) || !Number.isFinite(previous) || previous === 0) return null;
  const deltaPct = ((current - previous) / Math.abs(previous)) * 100;
  const t = Math.abs(deltaPct) < 0.05 ? "flat" : deltaPct > 0 ? "up" : "down";
  const sign = deltaPct > 0 ? "+" : "";
  return {
    deltaPct,
    label: `${sign}${deltaPct.toFixed(1)}% vs prior`,
    trend: t,
  };
}
