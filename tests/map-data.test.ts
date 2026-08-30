import assert from "node:assert/strict";
import test from "node:test";
import { pointColorExpression, toFeatureCollection } from "@/lib/fireline/map-data";
import type { Hotspot } from "@/lib/fireline/types";

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

test("converts filtered hotspots to stable-id GeoJSON", () => {
  const geojson = toFeatureCollection([hotspot()]);
  assert.equal(geojson.features[0].id, 1);
  assert.deepEqual(geojson.features[0].geometry.coordinates, [110, -2]);
  assert.equal(geojson.features[0].properties?.riskTier, "Tinggi");
});

test("priority paint expression contains every approved risk token", () => {
  const expression = JSON.stringify(pointColorExpression("priority"));
  for (const color of ["#8F1D2C", "#C4472D", "#B97812", "#267266"]) assert.match(expression, new RegExp(color));
});
