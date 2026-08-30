import type { Confidence, DashboardMetadata, DayNight, FilterState, RiskTier } from "./types";

const tiers = new Set<RiskTier>(["Kritis", "Tinggi", "Sedang", "Rendah"]);
const confidence = new Set<Confidence>(["Low", "Nominal", "High"]);
const dayNight = new Set<DayNight>(["D", "N"]);

export function parseFilters(params: URLSearchParams, meta: DashboardMetadata): FilterState {
  const fromValue = params.get("from");
  const toValue = params.get("to");
  const provinceValue = params.get("province");
  const tierValue = params.get("tier") as RiskTier | null;
  const confidenceValue = params.get("confidence") as Confidence | null;
  const dayNightValue = params.get("dayNight") as DayNight | null;
  const from = fromValue && fromValue >= meta.minDate && fromValue <= meta.maxDate ? fromValue : meta.minDate;
  const to = toValue && toValue >= from && toValue <= meta.maxDate ? toValue : meta.maxDate;
  return {
    from,
    to,
    province: provinceValue && meta.provinces.includes(provinceValue) ? provinceValue : "all",
    tier: tierValue && tiers.has(tierValue) ? tierValue : "all",
    confidence: confidenceValue && confidence.has(confidenceValue) ? confidenceValue : "all",
    dayNight: dayNightValue && dayNight.has(dayNightValue) ? dayNightValue : "all",
  };
}

export function serializeFilters(filters: FilterState): URLSearchParams {
  const params = new URLSearchParams({ from: filters.from, to: filters.to });
  if (filters.province !== "all") params.set("province", filters.province);
  if (filters.tier !== "all") params.set("tier", filters.tier);
  if (filters.confidence !== "all") params.set("confidence", filters.confidence);
  if (filters.dayNight !== "all") params.set("dayNight", filters.dayNight);
  return params;
}
