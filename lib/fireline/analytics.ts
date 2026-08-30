import type { FilterState, Hotspot } from "./types";

export function applyFilters(rows: Hotspot[], f: FilterState): Hotspot[] {
  return rows.filter((row) =>
    row.date >= f.from && row.date <= f.to &&
    (f.province === "all" || row.province === f.province) &&
    (f.tier === "all" || row.riskTier === f.tier) &&
    (f.confidence === "all" || row.confidence === f.confidence) &&
    (f.dayNight === "all" || row.dayNight === f.dayNight),
  );
}

export function deriveSummary(rows: Hotspot[]) {
  if (rows.length === 0) return { total: 0, priorityCount: 0, medianFrp: null, within5KmPercent: null };
  const frp = rows.map((row) => row.frp).sort((a, b) => a - b);
  const middle = Math.floor(frp.length / 2);
  const medianFrp = frp.length % 2 ? frp[middle] : (frp[middle - 1] + frp[middle]) / 2;
  const priorityCount = rows.filter((row) => row.riskTier === "Kritis" || row.riskTier === "Tinggi").length;
  const exposed = rows.filter((row) => row.schoolDistanceKm < 5).length;
  return { total: rows.length, priorityCount, medianFrp, within5KmPercent: exposed / rows.length * 100 };
}

export function aggregateMonthly(rows: Hotspot[]) {
  const counts = new Map<string, number>();
  for (const row of rows) counts.set(row.date.slice(0, 7), (counts.get(row.date.slice(0, 7)) ?? 0) + 1);
  return [...counts].sort(([a], [b]) => a.localeCompare(b)).map(([month, count]) => {
    const monthNumber = Number(month.slice(5, 7));
    return { month, count, drySeason: monthNumber >= 7 && monthNumber <= 10 };
  });
}

export function aggregateExposure(rows: Hotspot[]) {
  const bins = [
    { label: "<1 km", min: 0, max: 1, count: 0 },
    { label: "1–<5 km", min: 1, max: 5, count: 0 },
    { label: "5–<10 km", min: 5, max: 10, count: 0 },
    { label: "≥10 km", min: 10, max: Infinity, count: 0 },
  ];
  for (const row of rows) {
    const bin = bins.find((candidate) => row.schoolDistanceKm >= candidate.min && row.schoolDistanceKm < candidate.max);
    if (!bin) throw new Error("Invalid school distance: " + row.schoolDistanceKm);
    bin.count++;
  }
  return bins.map(({ label, count }) => ({ label, count }));
}

export function weightedContributions(row: Hotspot) {
  const intensity = 0.45 * row.intensityScore;
  const exposure = 0.55 * row.exposureScore;
  const total = intensity + exposure;
  return { intensity, exposure, total, remainder: Math.max(0, 1 - total) };
}

export type HotspotSort = "risk" | "date" | "frp" | "distance";

export function sortHotspots(rows: Hotspot[], sort: HotspotSort): Hotspot[] {
  return [...rows].sort((a, b) => {
    if (sort === "date") return b.timestamp.localeCompare(a.timestamp);
    if (sort === "frp") return b.frp - a.frp;
    if (sort === "distance") return a.schoolDistanceKm - b.schoolDistanceKm;
    return b.riskScore - a.riskScore;
  });
}

export function paginate<T>(rows: T[], page: number, size: number) {
  const pageCount = Math.max(1, Math.ceil(rows.length / size));
  const safePage = Math.min(Math.max(1, page), pageCount);
  return { rows: rows.slice((safePage - 1) * size, safePage * size), page: safePage, pageCount };
}
