import assert from "node:assert/strict";
import test from "node:test";
import {
  aggregateExposure, aggregateMonthly, aggregateProvinceTiers, applyFilters, deriveSummary, paginate, sortHotspots, weightedContributions,
} from "@/lib/fireline/analytics";
import { loadDashboardData } from "@/lib/fireline/data";
import { parseFilters, serializeFilters } from "@/lib/fireline/url-state";
import type { DashboardMetadata, Hotspot } from "@/lib/fireline/types";

function hotspot(overrides: Partial<Hotspot> = {}): Hotspot {
  return {
    id: 1, date: "2024-08-01", timestamp: "2024-08-01 05:45:00",
    province: "KALIMANTAN BARAT", latitude: -2, longitude: 110,
    frp: 10, brightness: 335, confidence: "Nominal", dayNight: "D",
    schoolDistanceKm: 2, schoolsWithin5Km: 3, provincePopulation: 4_000_000,
    intensityScore: 0.4, exposureScore: 0.6, riskScore: 0.51, riskTier: "Tinggi",
    ...overrides,
  };
}

const metadata: DashboardMetadata = {
  schemaVersion: 1, recordCount: 2, minDate: "2024-08-01", maxDate: "2026-05-31",
  provinces: ["KALIMANTAN BARAT", "KALIMANTAN TIMUR"], years: [2024, 2026], partitions: [],
};

test("one filter set drives the shared record subset", () => {
  const rows = [hotspot(), hotspot({ id: 2, province: "KALIMANTAN TIMUR", riskTier: "Rendah" })];
  const result = applyFilters(rows, {
    from: metadata.minDate, to: metadata.maxDate, province: "KALIMANTAN BARAT",
    tier: "all", confidence: "all", dayNight: "all",
  });
  assert.deepEqual(result.map((row) => row.id), [1]);
});

test("derives KPI values from records", () => {
  const summary = deriveSummary([hotspot(), hotspot({ id: 2, frp: 20, schoolDistanceKm: 8, riskTier: "Rendah" })]);
  assert.deepEqual(summary, { total: 2, priorityCount: 1, medianFrp: 15, within5KmPercent: 50 });
});

test("builds seasonal monthly counts from acq_date", () => {
  const trend = aggregateMonthly([hotspot(), hotspot({ id: 2, date: "2024-11-02" })]);
  assert.deepEqual(trend, [
    { month: "2024-08", count: 1, drySeason: true },
    { month: "2024-11", count: 1, drySeason: false },
  ]);
});

test("computes actual weighted contributions", () => {
  const parts = weightedContributions(hotspot());
  assert.ok(Math.abs(parts.intensity - 0.18) <= 1e-12);
  assert.ok(Math.abs(parts.exposure - 0.33) <= 1e-12);
  assert.ok(Math.abs(parts.total - 0.51) <= 1e-12);
});

test("normalizes invalid URL filters to dataset bounds", () => {
  const filters = parseFilters(new URLSearchParams("from=nope&province=UNKNOWN"), metadata);
  assert.equal(filters.from, metadata.minDate);
  assert.equal(filters.province, "all");
  assert.equal(parseFilters(serializeFilters(filters), metadata).to, metadata.maxDate);
});

test("normalizes malformed calendar URL dates to dataset bounds", () => {
  const filters = parseFilters(new URLSearchParams("from=2024-08-01junk&to=2024-99-99"), metadata);
  assert.equal(filters.from, metadata.minDate);
  assert.equal(filters.to, metadata.maxDate);
});

test("rejects malformed metadata and partition count mismatches", async () => {
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async () => new Response(JSON.stringify({
      ...metadata, recordCount: 1, minDate: "2024-99-99", partitions: [],
    }));
    await assert.rejects(loadDashboardData(), /Invalid dashboard metadata/);

    globalThis.fetch = async (url) => new Response(JSON.stringify(
      String(url) === "/data/metadata.json"
        ? { ...metadata, years: [2024], recordCount: 2, partitions: [{ year: 2024, count: 1, url: "/data/hotspots-2024.json" }] }
        : [[1, "2024-08-01", "2024-08-01 05:45:00", "KALIMANTAN BARAT", -2, 110, 10, 335, "Nominal", "D", 2, 3, 4_000_000, 0.4, 0.6, 0.51, "Tinggi"]],
    ));
    await assert.rejects(loadDashboardData(), /record count/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});


test("bins exposure distance without double counting boundaries", () => {
  const rows = [
    hotspot({ id: 1, schoolDistanceKm: 0.5 }),
    hotspot({ id: 2, schoolDistanceKm: 1 }),
    hotspot({ id: 3, schoolDistanceKm: 5 }),
    hotspot({ id: 4, schoolDistanceKm: 10 }),
  ];
  assert.deepEqual(aggregateExposure(rows).map((bin) => bin.count), [1, 1, 1, 1]);
});

test("sorts priority descending and paginates deterministically", () => {
  const rows = [hotspot({ id: 1, riskScore: 0.2 }), hotspot({ id: 2, riskScore: 0.8 })];
  const sorted = sortHotspots(rows, "risk");
  assert.deepEqual(sorted.map((row) => row.id), [2, 1]);
  assert.deepEqual(paginate(sorted, 1, 1).rows.map((row) => row.id), [2]);
});

test("province aggregation always exposes all four risk tiers", () => {
  const [province] = aggregateProvinceTiers([hotspot({ riskTier: "Kritis" })]);
  assert.deepEqual(province, { province: "KALIMANTAN BARAT", Kritis: 1, Tinggi: 0, Sedang: 0, Rendah: 0 });
});
