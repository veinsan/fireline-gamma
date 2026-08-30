import type { DashboardData, DashboardMetadata, Hotspot, HotspotTuple } from "./types";

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
  const metadata = await readJson<DashboardMetadata>("/data/metadata.json", signal);
  const partitions = await Promise.all(
    metadata.partitions.map((partition) => readJson<HotspotTuple[]>(partition.url, signal)),
  );
  return { metadata, hotspots: partitions.flat().map(decodeHotspot) };
}
