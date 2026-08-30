import type { FeatureCollection, Point } from "geojson";
import type { ExpressionSpecification } from "maplibre-gl";
import type { Hotspot, RiskLens } from "./types";

export function toFeatureCollection(rows: Hotspot[]): FeatureCollection<Point> {
  return {
    type: "FeatureCollection",
    features: rows.map((row) => ({
      type: "Feature",
      id: row.id,
      geometry: { type: "Point", coordinates: [row.longitude, row.latitude] },
      properties: {
        id: row.id,
        riskTier: row.riskTier,
        riskScore: row.riskScore,
        intensityScore: row.intensityScore,
        exposureScore: row.exposureScore,
      },
    })),
  };
}

export function pointColorExpression(lens: RiskLens): ExpressionSpecification {
  if (lens === "intensity") return ["interpolate", ["linear"], ["get", "intensityScore"], 0, "#DCE5E2", 0.45, "#B97812", 1, "#8F1D2C"];
  if (lens === "exposure") return ["interpolate", ["linear"], ["get", "exposureScore"], 0, "#DCE5E2", 0.45, "#8DB8AE", 1, "#267266"];
  return ["match", ["get", "riskTier"], "Kritis", "#8F1D2C", "Tinggi", "#C4472D", "Sedang", "#B97812", "Rendah", "#267266", "#66736F"];
}
