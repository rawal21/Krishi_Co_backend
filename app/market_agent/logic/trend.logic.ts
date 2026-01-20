import { MandiPriceRecord } from "../types/market.types";

export function analyzeTrend(
  records: MandiPriceRecord[]
): "RISING" | "FALLING" | "STABLE" | "UNCERTAIN" {
  if (records.length < 2) return "UNCERTAIN";

  const sorted = [...records].sort(
    (a, b) => a.date.localeCompare(b.date)
  );

  const first = sorted[0].modalPrice;
  const last = sorted[sorted.length - 1].modalPrice;

  const change = ((last - first) / first) * 100;

  if (change > 2) return "RISING";
  if (change < -2) return "FALLING";
  return "STABLE";
}
