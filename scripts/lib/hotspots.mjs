export const REQUIRED_COLUMNS = [
  "acq_date", "year", "quarter", "month_num", "month_name", "week",
  "is_dry_season", "datetime", "province", "latitude", "longitude",
  "frp", "brightness", "conf_label", "daynight", "dist_school_km",
  "schools_5km", "prov_pop", "intensity_score", "exposure_score",
  "risk_score", "risk_tier",
];

const TIERS = new Set(["Kritis", "Tinggi", "Sedang", "Rendah"]);
const CONFIDENCE = new Set(["Low", "Nominal", "High"]);
const DAY_NIGHT = new Set(["D", "N"]);
const SCORE_TOLERANCE = 1e-9;

function finite(value, name, rowNumber) {
  const number = Number(value);
  if (!Number.isFinite(number)) throw new Error("row " + rowNumber + ": invalid " + name);
  return number;
}

export function weightedParts(hotspot) {
  const intensity = 0.45 * hotspot.intensityScore;
  const exposure = 0.55 * hotspot.exposureScore;
  const total = intensity + exposure;
  return { intensity, exposure, total, remainder: Math.max(0, 1 - total) };
}

export function parseHotspotsCsv(text) {
  const lines = text.trim().split(/\r?\n/);
  const columns = lines.shift().split(",");
  if (columns.join(",") !== REQUIRED_COLUMNS.join(",")) {
    throw new Error("Unexpected hotspot CSV schema");
  }

  // ponytail: the trusted repository CSV has no quoted fields; adopt csv-parse if that schema changes.
  return lines.map((line, index) => {
    if (line.includes('"')) throw new Error("row " + (index + 2) + ": quoted fields are unsupported");
    const values = line.split(",");
    if (values.length !== REQUIRED_COLUMNS.length) {
      throw new Error("row " + (index + 2) + ": expected 22 columns");
    }
    const value = Object.fromEntries(columns.map((column, i) => [column, values[i]]));
    const rowNumber = index + 2;
    const hotspot = {
      id: index + 1,
      date: value.acq_date,
      timestamp: value.datetime,
      year: finite(value.year, "year", rowNumber),
      province: value.province,
      latitude: finite(value.latitude, "latitude", rowNumber),
      longitude: finite(value.longitude, "longitude", rowNumber),
      frp: finite(value.frp, "frp", rowNumber),
      brightness: finite(value.brightness, "brightness", rowNumber),
      confidence: value.conf_label,
      dayNight: value.daynight,
      schoolDistanceKm: finite(value.dist_school_km, "dist_school_km", rowNumber),
      schoolsWithin5Km: finite(value.schools_5km, "schools_5km", rowNumber),
      provincePopulation: finite(value.prov_pop, "prov_pop", rowNumber),
      intensityScore: finite(value.intensity_score, "intensity_score", rowNumber),
      exposureScore: finite(value.exposure_score, "exposure_score", rowNumber),
      riskScore: finite(value.risk_score, "risk_score", rowNumber),
      riskTier: value.risk_tier,
    };
    if (!/^\d{4}-\d{2}-\d{2}$/.test(hotspot.date)) throw new Error("row " + rowNumber + ": invalid acq_date");
    if (hotspot.latitude < -90 || hotspot.latitude > 90 || hotspot.longitude < -180 || hotspot.longitude > 180) {
      throw new Error("row " + rowNumber + ": invalid coordinates");
    }
    if (!CONFIDENCE.has(hotspot.confidence) || !DAY_NIGHT.has(hotspot.dayNight) || !TIERS.has(hotspot.riskTier)) {
      throw new Error("row " + rowNumber + ": invalid category");
    }
    for (const score of [hotspot.intensityScore, hotspot.exposureScore, hotspot.riskScore]) {
      if (score < 0 || score > 1) throw new Error("row " + rowNumber + ": score outside 0..1");
    }
    if (Math.abs(weightedParts(hotspot).total - hotspot.riskScore) > SCORE_TOLERANCE) {
      throw new Error("row " + rowNumber + ": risk_score mismatch");
    }
    return hotspot;
  });
}

export function toTuple(h) {
  return [
    h.id, h.date, h.timestamp, h.province, h.latitude, h.longitude,
    h.frp, h.brightness, h.confidence, h.dayNight, h.schoolDistanceKm,
    h.schoolsWithin5Km, h.provincePopulation, h.intensityScore,
    h.exposureScore, h.riskScore, h.riskTier,
  ];
}

export function prepareDataset(text) {
  const hotspots = parseHotspotsCsv(text);
  if (hotspots.length === 0) throw new Error("Hotspot CSV contains no records");
  const partitions = new Map();
  for (const hotspot of hotspots) {
    const year = Number(hotspot.date.slice(0, 4));
    if (!partitions.has(year)) partitions.set(year, []);
    partitions.get(year).push(toTuple(hotspot));
  }
  const dates = hotspots.map((h) => h.date);
  const provinces = [...new Set(hotspots.map((h) => h.province))].sort();
  const years = [...partitions.keys()].sort();
  return {
    metadata: {
      schemaVersion: 1,
      recordCount: hotspots.length,
      minDate: dates.reduce((a, b) => a < b ? a : b),
      maxDate: dates.reduce((a, b) => a > b ? a : b),
      provinces,
      years,
      partitions: years.map((year) => ({
        year,
        count: partitions.get(year).length,
        url: "/data/hotspots-" + year + ".json",
      })),
    },
    partitions,
  };
}
