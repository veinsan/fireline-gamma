import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { HistoricalNotice, SummaryRail } from "@/components/dashboard/summary-rail";

test("historical notice defines FIRMS hotspots precisely", () => {
  const html = renderToStaticMarkup(<HistoricalNotice minDate="2024-08-01" maxDate="2026-05-31" />);
  assert.match(html, /anomali termal/);
  assert.match(html, /bukan konfirmasi kebakaran lapangan/);
  assert.doesNotMatch(html, /kebakaran aktif/);
});

test("summary rail renders values supplied by analytics", () => {
  const html = renderToStaticMarkup(
    <SummaryRail
      summary={{ total: 12, priorityCount: 3, medianFrp: 8.5, within5KmPercent: 75 }}
      scope="Semua provinsi"
    />,
  );
  for (const label of ["Hotspot terdeteksi", "High / Critical", "Median FRP", "Dalam radius 5 km"]) {
    assert.match(html, new RegExp(label));
  }
  assert.match(html, />12</);
});

import { HotspotDetail } from "@/components/dashboard/map-workspace";
import type { Hotspot } from "@/lib/fireline/types";

function detailHotspot(overrides: Partial<Hotspot> = {}): Hotspot {
  return {
    id: 1, date: "2024-08-01", timestamp: "2024-08-01 05:45:00",
    province: "KALIMANTAN BARAT", latitude: -2, longitude: 110,
    frp: 10, brightness: 335, confidence: "Nominal", dayNight: "D",
    schoolDistanceKm: 2, schoolsWithin5Km: 3, provincePopulation: 4_000_000,
    intensityScore: 0.4, exposureScore: 0.6, riskScore: 0.51, riskTier: "Tinggi",
    ...overrides,
  };
}

test("detail labels actual weighted score components", () => {
  const html = renderToStaticMarkup(<HotspotDetail hotspot={detailHotspot()} />);
  assert.match(html, /0\.45 × intensity_score/);
  assert.match(html, /0\.55 × exposure_score/);
  assert.match(html, /0[,.]180/);
  assert.match(html, /0[,.]330/);
});

import { AnalyticsPanels } from "@/components/dashboard/analytics-panels";
import { HotspotTable } from "@/components/dashboard/hotspot-table";

test("analytical panels stay seasonal and exclude model evidence", () => {
  const rows = [detailHotspot(), detailHotspot({ id: 2, date: "2024-11-02", riskTier: "Rendah" })];
  const html = renderToStaticMarkup(<AnalyticsPanels rows={rows} />);
  assert.match(html, /Pola temporal &amp; musim/);
  assert.match(html, /Feature engineering/);
  assert.doesNotMatch(html, /probabilitas surge/i);
});

test("hotspot table exposes sortable semantics", () => {
  const rows = [detailHotspot(), detailHotspot({ id: 2 })];
  const html = renderToStaticMarkup(<HotspotTable rows={rows} onSelect={() => undefined} />);
  assert.match(html, /aria-sort/);
  assert.match(html, /Hotspot terdeteksi/);
});

import { readFile } from "node:fs/promises";

test("route-level recovery states keep historical data language", async () => {
  const [loading, error] = await Promise.all([readFile("app/loading.tsx", "utf8"), readFile("app/error.tsx", "utf8")]);
  assert.match(loading, /Memuat FIRELINE/);
  assert.match(error, /Data historis belum berhasil dimuat/);
  assert.match(error, /Coba lagi/);
});

test("core UI source keeps scientific hotspot terminology", async () => {
  const files = ["components/dashboard/summary-rail.tsx", "components/dashboard/map-workspace.tsx", "components/dashboard/analytics-panels.tsx"];
  const source = (await Promise.all(files.map((file) => readFile(file, "utf8")))).join("\n");
  assert.match(source, /anomali termal/);
  assert.doesNotMatch(source, /kebakaran aktif|kebakaran terverifikasi/i);
});
