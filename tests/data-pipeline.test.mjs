import assert from "node:assert/strict";
import test from "node:test";
import {
  parseHotspotsCsv,
  prepareDataset,
  weightedParts,
} from "../scripts/lib/hotspots.mjs";

const header = "acq_date,year,quarter,month_num,month_name,week,is_dry_season,datetime,province,latitude,longitude,frp,brightness,conf_label,daynight,dist_school_km,schools_5km,prov_pop,intensity_score,exposure_score,risk_score,risk_tier";
const row = "2024-08-01,2024,3,8,Aug,31,1,2024-08-01 05:45:00,KALIMANTAN BARAT,-2.0,110.9,32.35,342.89,Nominal,D,2.5,2,4395983,0.4,0.6,0.51,Tinggi";

test("parses the repository schema into a normalized hotspot", () => {
  const [hotspot] = parseHotspotsCsv(header + "\n" + row);
  assert.equal(hotspot.province, "KALIMANTAN BARAT");
  assert.equal(hotspot.riskTier, "Tinggi");
  assert.equal(hotspot.frp, 32.35);
});

test("uses actual weighted components and validates their sum", () => {
  const [hotspot] = parseHotspotsCsv(header + "\n" + row);
  const parts = weightedParts(hotspot);
  assert.ok(Math.abs(parts.intensity - 0.18) <= 1e-12);
  assert.ok(Math.abs(parts.exposure - 0.33) <= 1e-12);
  assert.ok(Math.abs(parts.total - 0.51) <= 1e-12);
  assert.ok(Math.abs(parts.remainder - 0.49) <= 1e-12);
});

test("rejects a risk score inconsistent with exported component scores", () => {
  const bad = row.replace(",0.51,Tinggi", ",0.52,Tinggi");
  assert.throws(() => parseHotspotsCsv(header + "\n" + bad), /risk_score mismatch/);
});

test("partitions records by source year and derives metadata", () => {
  const prepared = prepareDataset(header + "\n" + row);
  assert.equal(prepared.metadata.recordCount, 1);
  assert.equal(prepared.metadata.minDate, "2024-08-01");
  assert.deepEqual([...prepared.partitions.keys()], [2024]);
});
