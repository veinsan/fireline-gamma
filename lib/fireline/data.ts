import type { DashboardData, DashboardMetadata, Hotspot, HotspotTuple } from "./types";

function isDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

function invalidMetadata(detail: string): never {
  throw new Error("Invalid dashboard metadata: " + detail);
}

function validateMetadata(value: unknown): DashboardMetadata {
  if (!value || typeof value !== "object" || Array.isArray(value)) invalidMetadata("expected an object");
  const meta = value as Record<string, unknown>;
  if (meta.schemaVersion !== 1) invalidMetadata("unsupported schemaVersion");
  if (!Number.isInteger(meta.recordCount) || (meta.recordCount as number) < 0) invalidMetadata("invalid recordCount");
  if (!isDate(meta.minDate) || !isDate(meta.maxDate) || meta.minDate > meta.maxDate) invalidMetadata("invalid date bounds");
  if (!Array.isArray(meta.provinces) || !meta.provinces.every((province) => typeof province === "string")) invalidMetadata("invalid provinces");
  if (!Array.isArray(meta.years) || !meta.years.every((year) => Number.isInteger(year))) invalidMetadata("invalid years");
  if (!Array.isArray(meta.partitions)) invalidMetadata("invalid partitions");
  const partitions = meta.partitions.map((partition) => {
    if (!partition || typeof partition !== "object" || Array.isArray(partition)) invalidMetadata("invalid partition");
    const value = partition as Record<string, unknown>;
    if (!Number.isInteger(value.year) || !Number.isInteger(value.count) || (value.count as number) < 0 ||
      typeof value.url !== "string" || value.url !== "/data/hotspots-" + value.year + ".json") invalidMetadata("invalid partition");
    return { year: value.year as number, count: value.count as number, url: value.url };
  });
  if (new Set(partitions.map((partition) => partition.year)).size !== partitions.length) invalidMetadata("duplicate partition year");
  if (partitions.reduce((total, partition) => total + partition.count, 0) !== meta.recordCount) invalidMetadata("partition record count mismatch");
  return {
    schemaVersion: 1,
    recordCount: meta.recordCount as number,
    minDate: meta.minDate,
    maxDate: meta.maxDate,
    provinces: meta.provinces as string[],
    years: meta.years as number[],
    partitions,
  };
}

export function decodeHotspot(row: HotspotTuple): Hotspot {
  const [
    id, date, timestamp, province, latitude, longitude, frp, brightness,
    confidence, dayNight, schoolDistanceKm, schoolsWithin5Km,
    provincePopulation, intensityScore, exposureScore, riskScore, riskTier,
  ] = row;
  return {
    id, date, timestamp, province, latitude, longitude, frp, brightness,
    confidence, dayNight, schoolDistanceKm, schoolsWithin5Km,
    provincePopulation, intensityScore, exposureScore, riskScore, riskTier,
  };
}

async function readJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error("Gagal memuat " + url + " (" + response.status + ")");
  return response.json() as Promise<T>;
}

export async function loadDashboardData(signal?: AbortSignal): Promise<DashboardData> {
  const metadata = validateMetadata(await readJson<unknown>("/data/metadata.json", signal));
  const partitions = await Promise.all(
    metadata.partitions.map(async (partition) => {
      const rows = await readJson<unknown>(partition.url, signal);
      if (!Array.isArray(rows)) throw new Error("Invalid hotspot partition: " + partition.url);
      if (rows.length !== partition.count) throw new Error("Invalid hotspot partition record count: " + partition.url);
      return rows as HotspotTuple[];
    }),
  );
  const hotspots = partitions.flat().map(decodeHotspot);
  if (hotspots.length !== metadata.recordCount) throw new Error("Invalid dashboard record count");
  return { metadata, hotspots };
}
