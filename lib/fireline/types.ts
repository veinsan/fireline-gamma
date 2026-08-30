export type RiskTier = "Kritis" | "Tinggi" | "Sedang" | "Rendah";
export type Confidence = "Low" | "Nominal" | "High";
export type DayNight = "D" | "N";
export type RiskLens = "priority" | "intensity" | "exposure";

export type HotspotTuple = [
  id: number, date: string, timestamp: string, province: string,
  latitude: number, longitude: number, frp: number, brightness: number,
  confidence: Confidence, dayNight: DayNight, schoolDistanceKm: number,
  schoolsWithin5Km: number, provincePopulation: number,
  intensityScore: number, exposureScore: number, riskScore: number,
  riskTier: RiskTier,
];

export interface Hotspot {
  id: number;
  date: string;
  timestamp: string;
  province: string;
  latitude: number;
  longitude: number;
  frp: number;
  brightness: number;
  confidence: Confidence;
  dayNight: DayNight;
  schoolDistanceKm: number;
  schoolsWithin5Km: number;
  provincePopulation: number;
  intensityScore: number;
  exposureScore: number;
  riskScore: number;
  riskTier: RiskTier;
}

export interface DashboardMetadata {
  schemaVersion: 1;
  recordCount: number;
  minDate: string;
  maxDate: string;
  provinces: string[];
  years: number[];
  partitions: Array<{ year: number; count: number; url: string }>;
}

export interface DashboardData {
  metadata: DashboardMetadata;
  hotspots: Hotspot[];
}

export interface FilterState {
  from: string;
  to: string;
  province: "all" | string;
  tier: "all" | RiskTier;
  confidence: "all" | Confidence;
  dayNight: "all" | DayNight;
}
