# FIRELINE Risk Command Canvas Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and verify a production-ready, historical FIRELINE decision-support dashboard that derives operational analytics from the repository's scored FIRMS hotspot dataset.

**Architecture:** A Next.js App Router frontend loads build-generated, year-partitioned static data through one client loader. Pure TypeScript functions own filtering, aggregation, URL state, scientific terminology, and weighted-score calculations; focused client components render the map, priority queue, charts, and accessible table. The methodology route is separately bundled and does not load the secondary surge/modeling CSV at runtime.

**Tech Stack:** Node.js 20.9+, npm, Next.js App Router, React, TypeScript 5.1+, native CSS, MapLibre GL JS 5, OpenFreeMap Positron, Recharts, `node:test` through `tsx`, Vercel.

**Spec:** `docs/superpowers/specs/2026-08-30-fireline-risk-command-canvas-design.md`

## Global Constraints

- Use `data/dashboard/hotspots_with_risk_scores.csv` as the sole runtime analytical source.
- Do not load `daily_surge_panel_features.csv` in the first release; only describe its role in the methodology appendix.
- Derive all dashboard KPI values and the visible date range from the loaded, filtered records.
- Describe FIRMS hotspots as satellite-detected thermal anomalies, never automatically as field-verified wildfires.
- Explain that `confidence` is algorithmic detection confidence, FRP is a radiated-energy proxy, and risk tier is an analytical response priority.
- Render weighted contributions as `0.45 * intensityScore` and `0.55 * exposureScore`; their sum must differ from `riskScore` by no more than `1e-9`.
- Keep modeling evidence out of `/` and confined to `/methodology`.
- Use Bahasa Indonesia for interface copy while preserving agreed technical terms.
- Use identical risk colors everywhere: Critical `#8F1D2C`, High `#C4472D`, Medium `#B97812`, and Low `#267266`.
- Use native CSS and semantic controls; do not add Tailwind, a component kit, a state library, or an API layer.
- Respect visible focus, keyboard operation, reduced motion, chart/table alternatives, and responsive widths of 375, 768, 1024, and 1440px.
- OpenFreeMap is an external contextual basemap with no API key or SLA. The rest of the dashboard must remain useful if it fails.

## Official implementation references

- Next.js installation and Node/TypeScript floors: https://nextjs.org/docs/app/getting-started/installation
- MapLibre clustering: https://maplibre.org/maplibre-gl-js/docs/examples/cluster/
- MapLibre large-data guidance: https://maplibre.org/maplibre-gl-js/docs/guides/large-data/
- OpenFreeMap setup: https://openfreemap.org/quick_start/
- Recharts installation: https://recharts.github.io/en-US/guide/

## File map

### Project and application shell

- Create `package.json`, `package-lock.json`, `tsconfig.json`, `next-env.d.ts`, `next.config.ts`, `eslint.config.mjs`, and `.gitignore`.
- Create `app/layout.tsx`, `app/page.tsx`, `app/loading.tsx`, `app/error.tsx`, and `app/globals.css`.
- Create `components/app-frame.tsx` for the shared header, skip link, historical status, and methodology navigation.

### Data preparation and domain logic

- Create `scripts/lib/hotspots.mjs` for strict CSV parsing, validation, normalization, contribution checks, and tuple encoding.
- Create `scripts/prepare-dashboard-data.mjs` for static metadata and year partitions.
- Create `lib/fireline/types.ts` for shared domain contracts.
- Create `lib/fireline/data.ts` for tuple decoding and `loadDashboardData()`.
- Create `lib/fireline/analytics.ts` for filtering, KPIs, trends, exposure bins, sorting, pagination, and weighted contributions.
- Create `lib/fireline/url-state.ts` for validated URL filter parsing and serialization.
- Create `lib/fireline/map-data.ts` for GeoJSON conversion and MapLibre paint expressions.

### Dashboard and appendix

- Create `components/dashboard/dashboard.tsx` for data loading, shared filter state, selection, and orchestration.
- Create `components/dashboard/filter-bar.tsx` for desktop controls and the native mobile dialog.
- Create `components/dashboard/summary-rail.tsx` for four derived KPI values.
- Create `components/dashboard/map-workspace.tsx` for lazy map loading, queue, legend, and selected-record details.
- Create `components/dashboard/risk-map.tsx` for MapLibre lifecycle and clustered layers.
- Create `components/dashboard/analytics-panels.tsx` for temporal, exposure, province, and feature-engineering views.
- Create `components/dashboard/hotspot-table.tsx` for sortable, paginated access to filtered records.
- Create `components/dashboard/dashboard.module.css` for dashboard-specific responsive layout.
- Create `app/methodology/page.tsx` and `components/methodology-content.tsx` for provenance, formulas, compact modeling evidence, and limitations.
- Create `components/methodology-link.tsx` to carry dashboard filters into the appendix without making the dashboard route dynamic.

### Checks and documentation

- Create `tests/shell.test.tsx`, `tests/data-pipeline.test.mjs`, `tests/analytics.test.ts`, `tests/map-data.test.ts`, `tests/dashboard-markup.test.tsx`, and `tests/methodology.test.tsx`.
- Create `README.md` with local, build, data, and Vercel instructions.

Generated files under `public/data/` are ignored and recreated by `predev` and `prebuild`.

---

### Task 1: Scaffold the typed Next.js shell and visual tokens

**Files:**
- Create: `package.json`
- Create: `package-lock.json`
- Create: `tsconfig.json`
- Create: `next-env.d.ts`
- Create: `next.config.ts`
- Create: `eslint.config.mjs`
- Create: `.gitignore`
- Create: `app/layout.tsx`
- Create: `app/page.tsx`
- Create: `app/globals.css`
- Create: `components/app-frame.tsx`
- Test: `tests/shell.test.tsx`

**Interfaces:**
- Consumes: the approved typography, color, terminology, and route decisions from the spec.
- Produces: `AppFrame({ children }: PropsWithChildren)`, global CSS tokens, a buildable App Router project, and npm verification scripts used by every later task.

- [ ] **Step 1: Create the package manifest and install only the required dependencies**

Create `package.json`:

```json
{
  "name": "fireline-risk-command-canvas",
  "version": "0.1.0",
  "private": true,
  "engines": {
    "node": ">=20.9.0"
  },
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint .",
    "typecheck": "tsc --noEmit",
    "test": "node --import tsx --test tests/*.test.*"
  }
}
```

Run:

```bash
npm install next@latest react@latest react-dom@latest maplibre-gl@^5 recharts
npm install --save-dev typescript@^5.1 @types/node @types/react @types/react-dom @types/geojson eslint eslint-config-next tsx
```

Expected: npm creates `package-lock.json` and exits successfully without adding Tailwind or a UI kit.

- [ ] **Step 2: Add strict Next.js, TypeScript, ESLint, and ignore configuration**

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "react-jsx",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./*"] }
  },
  "include": ["next-env.d.ts", ".next/types/**/*.ts", "**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules"]
}
```

Create `next.config.ts`:

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
};

export default nextConfig;
```

Create `eslint.config.mjs`:

```js
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTypeScript,
  globalIgnores([".next/**", "public/data/**"]),
]);
```

Create `.gitignore`:

```gitignore
node_modules/
.next/
out/
.vercel/
coverage/
public/data/
.env*.local
```

- [ ] **Step 3: Write the failing shell semantics test**

Create `tests/shell.test.tsx`:

```tsx
import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { AppFrame } from "@/components/app-frame";

test("shell identifies a historical FIRMS dashboard and exposes navigation", () => {
  const html = renderToStaticMarkup(<AppFrame><main id="main">Isi</main></AppFrame>);
  assert.match(html, /FIRELINE/);
  assert.match(html, /Snapshot historis/);
  assert.match(html, /Metodologi/);
  assert.match(html, /Lewati ke konten utama/);
});
```

- [ ] **Step 4: Run the shell test and confirm the missing component failure**

Run: `node --import tsx --test tests/shell.test.tsx`

Expected: FAIL with `Cannot find module '@/components/app-frame'`.

- [ ] **Step 5: Implement the app frame, fonts, base route, and tokens**

Create `components/app-frame.tsx`:

```tsx
import Link from "next/link";
import type { PropsWithChildren } from "react";

export function AppFrame({ children }: PropsWithChildren) {
  return (
    <>
      <a className="skip-link" href="#main">Lewati ke konten utama</a>
      <header className="app-header">
        <Link className="wordmark" href="/" aria-label="FIRELINE dashboard">FIRE—LINE</Link>
        <span className="snapshot-label">Snapshot historis</span>
        <Link className="method-link" href="/methodology">Metodologi</Link>
      </header>
      {children}
    </>
  );
}
```

Create `app/layout.tsx`:

```tsx
import { Atkinson_Hyperlegible, Barlow_Condensed } from "next/font/google";
import "maplibre-gl/dist/maplibre-gl.css";
import "./globals.css";

const body = Atkinson_Hyperlegible({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-body",
});
const display = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
});

export const metadata = {
  title: "FIRELINE | Risk Command Canvas",
  description: "Dashboard historis anomali termal FIRMS dan konteks risiko Kalimantan.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body className={body.variable + " " + display.variable}>{children}</body>
    </html>
  );
}
```

Create `app/page.tsx`:

```tsx
import { AppFrame } from "@/components/app-frame";

export default function Page() {
  return (
    <AppFrame>
      <main id="main" className="shell-preview">
        <p className="eyebrow">NASA FIRMS · Kalimantan</p>
        <h1>Prioritas bukan sekadar sinyal termal terbesar.</h1>
        <p>Dashboard sedang disiapkan dari snapshot historis repository.</p>
      </main>
    </AppFrame>
  );
}
```

Create `app/globals.css` with the approved tokens and base behavior:

```css
:root {
  --peat: #172826;
  --cloud: #f2f6f4;
  --surface: #ffffff;
  --grid: #c7d2cf;
  --critical: #8f1d2c;
  --high: #c4472d;
  --medium: #b97812;
  --low: #267266;
  --focus: #155e75;
  --radius-sm: 10px;
  --radius-lg: 14px;
}

* { box-sizing: border-box; }
html { color-scheme: light; background: var(--cloud); }
body {
  margin: 0;
  color: var(--peat);
  background: var(--cloud);
  font-family: var(--font-body), sans-serif;
  line-height: 1.5;
}
button, input, select { font: inherit; }
a { color: inherit; }
:focus-visible { outline: 3px solid var(--focus); outline-offset: 3px; }
.skip-link { position: fixed; left: 1rem; top: -5rem; z-index: 1000; padding: .75rem 1rem; background: var(--peat); color: white; }
.skip-link:focus { top: 1rem; }
.app-header { min-height: 64px; display: flex; align-items: center; gap: 1rem; padding: 0 24px; border-bottom: 1px solid var(--grid); background: rgba(255,255,255,.96); }
.wordmark { font: 700 1.45rem/1 var(--font-display), sans-serif; letter-spacing: .08em; text-decoration: none; }
.snapshot-label { margin-right: auto; font-size: .875rem; }
.method-link { min-height: 44px; display: inline-flex; align-items: center; }
.shell-preview { padding: clamp(24px, 5vw, 72px); }
.eyebrow { font-family: var(--font-display), sans-serif; letter-spacing: .08em; text-transform: uppercase; }
```

- [ ] **Step 6: Verify the shell**

Run:

```bash
npm test
npm run typecheck
npm run lint
npm run build
```

Expected: every command exits 0 and Next reports both `/` and the framework not-found route as buildable.

- [ ] **Step 7: Commit the scaffold**

```bash
git add package.json package-lock.json tsconfig.json next-env.d.ts next.config.ts eslint.config.mjs .gitignore app components/app-frame.tsx tests/shell.test.tsx
git commit -m "feat: scaffold FIRELINE dashboard shell"
```

---

### Task 2: Build the validated primary-data preparation pipeline

**Files:**
- Modify: `package.json`
- Create: `scripts/lib/hotspots.mjs`
- Create: `scripts/prepare-dashboard-data.mjs`
- Test: `tests/data-pipeline.test.mjs`
- Track existing source: `data/dashboard/hotspots_with_risk_scores.csv`

**Interfaces:**
- Consumes: the exact 22-column primary CSV schema.
- Produces: `parseHotspotsCsv(text)`, `weightedParts(row)`, `toTuple(row)`, `prepareDataset(text)`, `public/data/metadata.json`, and `public/data/hotspots-<year>.json`.

- [ ] **Step 1: Write failing parser, scientific-contract, and contribution tests**

Create `tests/data-pipeline.test.mjs`:

```js
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
```

- [ ] **Step 2: Run the data test and confirm the missing module failure**

Run: `node --test tests/data-pipeline.test.mjs`

Expected: FAIL with `Cannot find module '../scripts/lib/hotspots.mjs'`.

- [ ] **Step 3: Implement strict parsing, normalization, and tuple encoding**

Create `scripts/lib/hotspots.mjs` with these public contracts and validations:

```js
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
```

- [ ] **Step 4: Run the unit test and verify exact source precision**

Run: `node --test tests/data-pipeline.test.mjs`

Expected: PASS. The tests use an absolute tolerance of `1e-12` and the implementation retains unrounded source precision.

- [ ] **Step 5: Implement the deterministic file generator and npm hooks**

Create `scripts/prepare-dashboard-data.mjs`:

```js
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { prepareDataset } from "./lib/hotspots.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const source = resolve(root, "data/dashboard/hotspots_with_risk_scores.csv");
const output = resolve(root, "public/data");
const prepared = prepareDataset(await readFile(source, "utf8"));

await mkdir(output, { recursive: true });
await writeFile(resolve(output, "metadata.json"), JSON.stringify(prepared.metadata));
for (const [year, rows] of prepared.partitions) {
  await writeFile(resolve(output, "hotspots-" + year + ".json"), JSON.stringify(rows));
}
console.log("Prepared " + prepared.metadata.recordCount + " FIRMS hotspot records");
```

Add these scripts to `package.json`:

```json
{
  "scripts": {
    "prepare:data": "node scripts/prepare-dashboard-data.mjs",
    "predev": "npm run prepare:data",
    "prebuild": "npm run prepare:data"
  }
}
```

Merge them into the existing `scripts` object without removing the verification commands.

- [ ] **Step 6: Generate and inspect the runtime data**

Run:

```bash
npm run prepare:data
du -h public/data/*
```

Expected: metadata plus 2024, 2025, and 2026 partitions are created; the log reports the row count derived from the source.

- [ ] **Step 7: Run the complete checks and commit the pipeline plus primary source**

Run:

```bash
npm test
npm run typecheck
npm run lint
npm run build
```

Then commit:

```bash
git add package.json package-lock.json scripts tests/data-pipeline.test.mjs data/dashboard/hotspots_with_risk_scores.csv
git commit -m "feat: prepare validated FIRMS hotspot data"
```

---

### Task 3: Implement typed loading, filters, aggregates, and URL state

**Files:**
- Create: `lib/fireline/types.ts`
- Create: `lib/fireline/data.ts`
- Create: `lib/fireline/analytics.ts`
- Create: `lib/fireline/url-state.ts`
- Test: `tests/analytics.test.ts`

**Interfaces:**
- Consumes: `/data/metadata.json` and `HotspotTuple[]` partitions from Task 2.
- Produces: `loadDashboardData(signal?)`, `applyFilters(records, filters)`, `deriveSummary(records)`, `aggregateMonthly(records)`, `aggregateExposure(records)`, `sortHotspots(records, sort)`, `paginate(records, page, size)`, `weightedContributions(record)`, `parseFilters(params, metadata)`, and `serializeFilters(filters)`.

- [ ] **Step 1: Define exact shared domain types**

Create `lib/fireline/types.ts`:

```ts
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
```

- [ ] **Step 2: Write failing analytics and URL-state tests**

Create `tests/analytics.test.ts`:

```ts
import assert from "node:assert/strict";
import test from "node:test";
import {
  aggregateMonthly, applyFilters, deriveSummary, weightedContributions,
} from "@/lib/fireline/analytics";
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
```

- [ ] **Step 3: Run tests and confirm missing modules**

Run: `node --import tsx --test tests/analytics.test.ts`

Expected: FAIL because `lib/fireline/analytics.ts` and `url-state.ts` do not exist.

- [ ] **Step 4: Implement loading and tuple decoding**

Create `lib/fireline/data.ts`:

```ts
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
```

- [ ] **Step 5: Implement pure filtering, KPI, trend, exposure, sort, pagination, and contribution functions**

Create `lib/fireline/analytics.ts`. Use these exact signatures and rules:

```ts
import type { FilterState, Hotspot } from "./types";

export function applyFilters(rows: Hotspot[], f: FilterState): Hotspot[] {
  return rows.filter((row) =>
    row.date >= f.from && row.date <= f.to &&
    (f.province === "all" || row.province === f.province) &&
    (f.tier === "all" || row.riskTier === f.tier) &&
    (f.confidence === "all" || row.confidence === f.confidence) &&
    (f.dayNight === "all" || row.dayNight === f.dayNight)
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
```

- [ ] **Step 6: Implement validated query parsing and serialization**

Create `lib/fireline/url-state.ts`:

```ts
import type { Confidence, DashboardMetadata, DayNight, FilterState, RiskTier } from "./types";

const tiers = new Set<RiskTier>(["Kritis", "Tinggi", "Sedang", "Rendah"]);
const confidence = new Set<Confidence>(["Low", "Nominal", "High"]);
const dayNight = new Set<DayNight>(["D", "N"]);

export function parseFilters(params: URLSearchParams, meta: DashboardMetadata): FilterState {
  const fromValue = params.get("from");
  const toValue = params.get("to");
  const provinceValue = params.get("province");
  const tierValue = params.get("tier") as RiskTier | null;
  const confidenceValue = params.get("confidence") as Confidence | null;
  const dayNightValue = params.get("dayNight") as DayNight | null;
  const from = fromValue && fromValue >= meta.minDate && fromValue <= meta.maxDate ? fromValue : meta.minDate;
  const to = toValue && toValue >= from && toValue <= meta.maxDate ? toValue : meta.maxDate;
  return {
    from,
    to,
    province: provinceValue && meta.provinces.includes(provinceValue) ? provinceValue : "all",
    tier: tierValue && tiers.has(tierValue) ? tierValue : "all",
    confidence: confidenceValue && confidence.has(confidenceValue) ? confidenceValue : "all",
    dayNight: dayNightValue && dayNight.has(dayNightValue) ? dayNightValue : "all",
  };
}

export function serializeFilters(filters: FilterState): URLSearchParams {
  const params = new URLSearchParams({ from: filters.from, to: filters.to });
  if (filters.province !== "all") params.set("province", filters.province);
  if (filters.tier !== "all") params.set("tier", filters.tier);
  if (filters.confidence !== "all") params.set("confidence", filters.confidence);
  if (filters.dayNight !== "all") params.set("dayNight", filters.dayNight);
  return params;
}
```

- [ ] **Step 7: Run checks and commit domain logic**

Run:

```bash
npm test
npm run typecheck
npm run lint
```

Expected: all tests and static checks pass.

Commit:

```bash
git add lib tests/analytics.test.ts
git commit -m "feat: add hotspot filtering and analytics"
```

---

### Task 4: Build the data-driven dashboard shell, filters, summary, and recovery states

**Files:**
- Modify: `app/page.tsx`
- Create: `components/dashboard/dashboard.tsx`
- Create: `components/dashboard/filter-bar.tsx`
- Create: `components/dashboard/summary-rail.tsx`
- Create: `components/dashboard/dashboard.module.css`
- Test: `tests/dashboard-markup.test.tsx`

**Interfaces:**
- Consumes: `loadDashboardData`, `parseFilters`, `serializeFilters`, `applyFilters`, and `deriveSummary`.
- Produces: `Dashboard()`, `FilterBar(props)`, `SummaryRail({ summary, scope })`, a precise `HistoricalNotice`, shared filter state, and stable loading/error/empty layouts.

- [ ] **Step 1: Write failing markup tests for precise terminology and derived-summary props**

Create `tests/dashboard-markup.test.tsx`:

```tsx
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
```

- [ ] **Step 2: Run the markup tests and confirm missing exports**

Run: `node --import tsx --test tests/dashboard-markup.test.tsx`

Expected: FAIL because `summary-rail.tsx` does not exist.

- [ ] **Step 3: Implement precise notice and derived summary rail**

In `components/dashboard/summary-rail.tsx`:

```tsx
type Summary = {
  total: number;
  priorityCount: number;
  medianFrp: number | null;
  within5KmPercent: number | null;
};

const number = new Intl.NumberFormat("id-ID");
const decimal = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 1 });

export function HistoricalNotice({ minDate, maxDate }: { minDate: string; maxDate: string }) {
  return (
    <aside className="historical-notice" aria-label="Batas interpretasi data">
      <strong>Snapshot historis {minDate}—{maxDate}.</strong>{" "}
      Hotspot FIRMS adalah anomali termal hasil deteksi satelit, bukan konfirmasi kebakaran lapangan.
    </aside>
  );
}

export function SummaryRail({ summary, scope }: { summary: Summary; scope: string }) {
  const items = [
    ["Hotspot terdeteksi", number.format(summary.total)],
    ["High / Critical", number.format(summary.priorityCount)],
    ["Median FRP", summary.medianFrp === null ? "—" : decimal.format(summary.medianFrp) + " MW"],
    ["Dalam radius 5 km", summary.within5KmPercent === null ? "—" : decimal.format(summary.within5KmPercent) + "%"],
  ];
  return (
    <section aria-label={"Ringkasan terfilter: " + scope} className="summary-rail">
      {items.map(([label, value]) => <div key={label}><span>{label}</span><strong>{value}</strong></div>)}
    </section>
  );
}
```

- [ ] **Step 4: Implement native desktop filters and the mobile dialog**

`FilterBar` receives:

```ts
interface FilterBarProps {
  filters: FilterState;
  metadata: DashboardMetadata;
  onChange(next: FilterState): void;
  onReset(): void;
}
```

Implement one reusable control group:

```tsx
function FilterControls({
  value, metadata, onChange,
}: {
  value: FilterState;
  metadata: DashboardMetadata;
  onChange(next: FilterState): void;
}) {
  const set = <K extends keyof FilterState>(key: K, next: FilterState[K]) =>
    onChange({ ...value, [key]: next });
  return (
    <div className={styles.controls}>
      <label>Dari<input type="date" min={metadata.minDate} max={value.to} value={value.from} onChange={(e) => set("from", e.target.value)} /></label>
      <label>Sampai<input type="date" min={value.from} max={metadata.maxDate} value={value.to} onChange={(e) => set("to", e.target.value)} /></label>
      <label>Provinsi<select value={value.province} onChange={(e) => set("province", e.target.value)}>
        <option value="all">Semua provinsi</option>
        {metadata.provinces.map((province) => <option key={province}>{province}</option>)}
      </select></label>
      <label>Risk tier<select value={value.tier} onChange={(e) => set("tier", e.target.value as FilterState["tier"])}>
        <option value="all">Semua tier</option>
        {["Kritis", "Tinggi", "Sedang", "Rendah"].map((tier) => <option key={tier}>{tier}</option>)}
      </select></label>
      <label>Confidence<select value={value.confidence} onChange={(e) => set("confidence", e.target.value as FilterState["confidence"])}>
        <option value="all">Semua confidence</option>
        {["Low", "Nominal", "High"].map((confidence) => <option key={confidence}>{confidence}</option>)}
      </select></label>
      <label>Waktu<select value={value.dayNight} onChange={(e) => set("dayNight", e.target.value as FilterState["dayNight"])}>
        <option value="all">Siang & malam</option><option value="D">Siang</option><option value="N">Malam</option>
      </select></label>
    </div>
  );
}
```

`FilterBar` imports `useEffect`, `useRef`, and `useState`. Desktop passes changes directly to `onChange`. Mobile edits a `draft` copy inside a native `dialog`:

```tsx
export function FilterBar({ filters, metadata, onChange, onReset }: FilterBarProps) {
const dialog = useRef<HTMLDialogElement>(null);
const [draft, setDraft] = useState(filters);
useEffect(() => setDraft(filters), [filters]);

return (
  <>
    <div className={styles.desktopFilters}>
      <FilterControls value={filters} metadata={metadata} onChange={onChange} />
      <button type="button" onClick={onReset}>Reset filter</button>
    </div>
    <button type="button" className={styles.mobileFilterButton} onClick={() => dialog.current?.showModal()}>
      Filter data
    </button>
    <dialog ref={dialog} className={styles.filterDialog}>
      <form onSubmit={(event) => {
        event.preventDefault();
        onChange(draft);
        dialog.current?.close();
      }}>
        <h2>Filter data</h2>
        <FilterControls value={draft} metadata={metadata} onChange={setDraft} />
        <button type="button" onClick={() => setDraft(parseFilters(new URLSearchParams(), metadata))}>Reset filter</button>
        <button type="button" onClick={() => dialog.current?.close()}>Batal</button>
        <button type="submit">Terapkan filter</button>
      </form>
    </dialog>
  </>
);
}
```

The native dialog owns focus trapping and Escape behavior; do not add a custom focus trap.

- [ ] **Step 5: Implement Dashboard loading, URL synchronization, filtering, retry, and empty state**

In `components/dashboard/dashboard.tsx`:

```tsx
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { applyFilters, deriveSummary } from "@/lib/fireline/analytics";
import { loadDashboardData } from "@/lib/fireline/data";
import { parseFilters, serializeFilters } from "@/lib/fireline/url-state";
import type { DashboardData, FilterState } from "@/lib/fireline/types";
import { FilterBar } from "./filter-bar";
import { HistoricalNotice, SummaryRail } from "./summary-rail";
import styles from "./dashboard.module.css";

export function Dashboard() {
  const params = useSearchParams();
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);
  const [filters, setFilters] = useState<FilterState | null>(null);
  const query = params.toString();

  useEffect(() => {
    const controller = new AbortController();
    setData(null);
    setError(null);
    loadDashboardData(controller.signal)
      .then(setData)
      .catch((reason: unknown) => {
        if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : "Data tidak dapat dimuat");
      });
    return () => controller.abort();
  }, [retry]);

  useEffect(() => {
    if (data) setFilters(parseFilters(new URLSearchParams(query), data.metadata));
  }, [data, query]);

  const rows = useMemo(
    () => data && filters ? applyFilters(data.hotspots, filters) : [],
    [data, filters],
  );
  const summary = useMemo(() => deriveSummary(rows), [rows]);

  function updateFilters(next: FilterState) {
    setFilters(next);
    router.replace("/?" + serializeFilters(next).toString(), { scroll: false });
  }

  if (error) {
    return (
      <section className={styles.recovery} role="alert">
        <h1>Data historis belum berhasil dimuat.</h1>
        <p>{error}</p>
        <button type="button" onClick={() => setRetry((value) => value + 1)}>Coba lagi</button>
      </section>
    );
  }
  if (!data || !filters) return <div className={styles.skeleton} aria-label="Memuat data historis" />;

  const reset = () => updateFilters(parseFilters(new URLSearchParams(), data.metadata));
  const scope = filters.province === "all" ? "Semua provinsi" : filters.province;

  return (
    <div className={styles.dashboard}>
      <header className={styles.thesis}>
        <p>Risk Command Canvas</p>
        <h1>Prioritas bukan sekadar sinyal termal terbesar, tetapi indikasi ancaman terbesar bagi manusia.</h1>
      </header>
      <HistoricalNotice minDate={data.metadata.minDate} maxDate={data.metadata.maxDate} />
      <FilterBar filters={filters} metadata={data.metadata} onChange={updateFilters} onReset={reset} />
      <SummaryRail summary={summary} scope={scope} />
      {rows.length === 0 ? (
        <section className={styles.empty}>
          <h2>Tidak ada hotspot pada kombinasi filter ini</h2>
          <button type="button" onClick={reset}>Reset filter</button>
        </section>
      ) : (
        <>
          <section className={styles.workspace} aria-label="Risk Command Map">
            <h2>Peta prioritas</h2>
            <p>{rows.length} hotspot terfilter siap divisualisasikan.</p>
          </section>
          <section className={styles.analyticsReserved} aria-label="Analisis historis">
            <h2>Pola temporal, exposure, dan feature engineering</h2>
          </section>
          <section className={styles.tableReserved} aria-label="Tabel hotspot">
            <h2>Data hotspot terfilter</h2>
          </section>
        </>
      )}
    </div>
  );
}
```

Task 5 replaces the reserved map section, and Task 6 replaces the reserved analytics and table sections without changing the shared `rows` array.

- [ ] **Step 6: Replace the static page with Suspense-backed Dashboard**

Update `app/page.tsx`:

```tsx
import Link from "next/link";
import { Suspense } from "react";
import { AppFrame } from "@/components/app-frame";
import { Dashboard } from "@/components/dashboard/dashboard";

export default function Page() {
  return (
    <AppFrame>
      <main id="main">
        <Suspense fallback={<div className="dashboard-skeleton" aria-label="Memuat dashboard" />}>
          <Dashboard />
        </Suspense>
      </main>
    </AppFrame>
  );
}
```

- [ ] **Step 7: Add responsive shell styles and verify**

Implement the dashboard grid using:

```css
.dashboard { padding: 20px clamp(16px, 2vw, 32px) 48px; }
.summaryRail { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 1px; }
.workspace { display: grid; grid-template-columns: minmax(0, 2fr) minmax(288px, .75fr); gap: 16px; }
@media (max-width: 1023px) { .workspace { grid-template-columns: minmax(0, 1fr) 320px; } }
@media (max-width: 767px) {
  .summaryRail, .workspace { grid-template-columns: 1fr; }
  .desktopFilters { display: none; }
  .mobileFilterButton { display: inline-flex; }
}
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { scroll-behavior: auto !important; transition-duration: .01ms !important; animation-duration: .01ms !important; }
}
```

Run `npm test`, `npm run typecheck`, `npm run lint`, and `npm run build`. Expected: all pass.

- [ ] **Step 8: Commit the dashboard state shell**

```bash
git add app/page.tsx components/dashboard tests/dashboard-markup.test.tsx
git commit -m "feat: add data-driven dashboard filters"
```

---

### Task 5: Implement the Risk Command Map, priority queue, and actual contribution detail

**Files:**
- Create: `lib/fireline/map-data.ts`
- Create: `components/dashboard/map-workspace.tsx`
- Create: `components/dashboard/risk-map.tsx`
- Modify: `components/dashboard/dashboard.tsx`
- Modify: `components/dashboard/dashboard.module.css`
- Test: `tests/map-data.test.ts`
- Modify test: `tests/dashboard-markup.test.tsx`

**Interfaces:**
- Consumes: filtered `Hotspot[]`, `RiskLens`, selected hotspot, `sortHotspots`, and `weightedContributions`.
- Produces: `toFeatureCollection(rows)`, `pointColorExpression(lens)`, `MapWorkspace(props)`, `RiskMap(props)`, `PriorityQueue(props)`, and `HotspotDetail({ hotspot })`.

- [ ] **Step 1: Write failing GeoJSON, tier-style, and weighted-detail tests**

Create `tests/map-data.test.ts`:

```ts
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
  assert.equal(geojson.features[0].properties.riskTier, "Tinggi");
});

test("priority paint expression contains every approved risk token", () => {
  const expression = JSON.stringify(pointColorExpression("priority"));
  for (const color of ["#8F1D2C", "#C4472D", "#B97812", "#267266"]) {
    assert.match(expression, new RegExp(color));
  }
});
```

Extend `tests/dashboard-markup.test.tsx`:

```tsx
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
```

Keep the fixture local to this test file so it has no hidden dependency on another test.

- [ ] **Step 2: Run focused tests and confirm missing map modules**

Run:

```bash
node --import tsx --test tests/map-data.test.ts
node --import tsx --test tests/dashboard-markup.test.tsx
```

Expected: FAIL because map-data and map-workspace exports do not exist.

- [ ] **Step 3: Implement GeoJSON conversion and lens expressions**

Create `lib/fireline/map-data.ts`:

```ts
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
        id: row.id, riskTier: row.riskTier, riskScore: row.riskScore,
        intensityScore: row.intensityScore, exposureScore: row.exposureScore,
      },
    })),
  };
}

export function pointColorExpression(lens: RiskLens): ExpressionSpecification {
  if (lens === "intensity") return ["interpolate", ["linear"], ["get", "intensityScore"], 0, "#DCE5E2", 1, "#C4472D"];
  if (lens === "exposure") return ["interpolate", ["linear"], ["get", "exposureScore"], 0, "#DCE5E2", 1, "#267266"];
  return ["match", ["get", "riskTier"],
    "Kritis", "#8F1D2C", "Tinggi", "#C4472D",
    "Sedang", "#B97812", "Rendah", "#267266", "#66736F"];
}
```

`@types/geojson` is installed in Task 1, so the type-only imports add no runtime bundle code.

- [ ] **Step 4: Implement the map lifecycle and clustering**

In `risk-map.tsx`:

- Initialize one MapLibre `Map` with style `https://tiles.openfreemap.org/styles/positron`, center `[113.2, 0.2]`, zoom `4.1`, bounds constrained around Borneo, an attribution control, and a navigation control without compass.
- On `load`, add one GeoJSON source with `cluster: true`, `clusterRadius: 44`, and `clusterMaxZoom: 10`.
- Add cluster circles/count labels, unclustered points, a Critical halo layer, and a selected neutral halo layer.
- Use `pointColorExpression(lens)` for point color. Use larger radii for Kritis/Tinggi and a hollow treatment for Rendah.
- On cluster click, call `getClusterExpansionZoom(clusterId)` and `easeTo`.
- On point click, look up the numeric `id` in the current filtered records and call `onSelect`.
- When `rows` changes, call `source.setData(toFeatureCollection(rows))`.
- When `lens` changes, update paint properties without recreating the map.
- When `selectedId` changes, update the selected-layer filter.
- On style/tile errors, call `onBasemapError`; do not clear dashboard state.
- Remove the map instance in the effect cleanup.

Give the map wrapper `role="region"`, `aria-label="Peta anomali termal FIRMS"`, and `aria-describedby="map-summary"`. The nearby summary states the number of filtered records and that the table is the keyboard-accessible equivalent.

Use this lifecycle structure in `risk-map.tsx`:

```tsx
"use client";

import maplibregl, { type GeoJSONSource } from "maplibre-gl";
import { useEffect, useRef, useState } from "react";
import { pointColorExpression, toFeatureCollection } from "@/lib/fireline/map-data";
import type { Hotspot, RiskLens } from "@/lib/fireline/types";

interface RiskMapProps {
  rows: Hotspot[];
  lens: RiskLens;
  selectedId: number | null;
  onSelect(hotspot: Hotspot): void;
  onBasemapError(): void;
}

export function RiskMap({ rows, lens, selectedId, onSelect, onBasemapError }: RiskMapProps) {
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const rowsRef = useRef(rows);
  const selectRef = useRef(onSelect);
  const errorRef = useRef(onBasemapError);
  const [ready, setReady] = useState(false);
  rowsRef.current = rows;
  selectRef.current = onSelect;
  errorRef.current = onBasemapError;

  useEffect(() => {
    if (!container.current) return;
    const map = new maplibregl.Map({
      container: container.current,
      style: "https://tiles.openfreemap.org/styles/positron",
      center: [113.2, 0.2],
      zoom: 4.1,
      maxBounds: [[106, -6], [121, 7]],
      attributionControl: true,
    });
    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    map.on("error", () => errorRef.current());
    map.on("load", () => {
      map.addSource("hotspots", {
        type: "geojson",
        data: toFeatureCollection(rowsRef.current),
        cluster: true,
        clusterRadius: 44,
        clusterMaxZoom: 10,
      });
      map.addLayer({
        id: "clusters", type: "circle", source: "hotspots", filter: ["has", "point_count"],
        paint: { "circle-color": "#526864", "circle-radius": ["step", ["get", "point_count"], 16, 100, 22, 1000, 30] },
      });
      map.addLayer({
        id: "cluster-count", type: "symbol", source: "hotspots", filter: ["has", "point_count"],
        layout: { "text-field": ["get", "point_count_abbreviated"], "text-size": 12 },
        paint: { "text-color": "#FFFFFF" },
      });
      map.addLayer({
        id: "critical-halo", type: "circle", source: "hotspots",
        filter: ["all", ["!", ["has", "point_count"]], ["==", ["get", "riskTier"], "Kritis"]],
        paint: { "circle-radius": 10, "circle-color": "rgba(0,0,0,0)", "circle-stroke-color": "#8F1D2C", "circle-stroke-width": 3 },
      });
      map.addLayer({
        id: "points", type: "circle", source: "hotspots", filter: ["!", ["has", "point_count"]],
        paint: {
          "circle-color": pointColorExpression("priority"),
          "circle-radius": ["match", ["get", "riskTier"], "Kritis", 7, "Tinggi", 6, "Sedang", 5, 4],
          "circle-opacity": ["match", ["get", "riskTier"], "Rendah", 0.18, 0.78],
          "circle-stroke-color": ["match", ["get", "riskTier"], "Rendah", "#267266", "#FFFFFF"],
          "circle-stroke-width": ["match", ["get", "riskTier"], "Rendah", 2, 1],
        },
      });
      map.addLayer({
        id: "selected", type: "circle", source: "hotspots",
        filter: ["==", ["get", "id"], -1],
        paint: { "circle-radius": 12, "circle-color": "rgba(0,0,0,0)", "circle-stroke-color": "#FFFFFF", "circle-stroke-width": 4 },
      });
      map.on("click", "clusters", async (event) => {
        const feature = event.features?.[0];
        const clusterId = Number(feature?.properties?.cluster_id);
        const source = map.getSource("hotspots") as GeoJSONSource;
        const zoom = await source.getClusterExpansionZoom(clusterId);
        const coordinates = (feature?.geometry as GeoJSON.Point).coordinates as [number, number];
        map.easeTo({ center: coordinates, zoom });
      });
      map.on("click", "points", (event) => {
        const id = Number(event.features?.[0]?.properties?.id);
        const hotspot = rowsRef.current.find((row) => row.id === id);
        if (hotspot) selectRef.current(hotspot);
      });
      setReady(true);
    });
    return () => { setReady(false); map.remove(); mapRef.current = null; };
  }, []);

  useEffect(() => {
    if (ready) (mapRef.current?.getSource("hotspots") as GeoJSONSource | undefined)?.setData(toFeatureCollection(rows));
  }, [ready, rows]);
  useEffect(() => {
    if (ready) mapRef.current?.setPaintProperty("points", "circle-color", pointColorExpression(lens));
  }, [lens, ready]);
  useEffect(() => {
    if (ready) mapRef.current?.setFilter("selected", ["==", ["get", "id"], selectedId ?? -1]);
  }, [ready, selectedId]);

  return <div ref={container} className="map-canvas" role="region" aria-label="Peta anomali termal FIRMS" aria-describedby="map-summary" />;
}
```

- [ ] **Step 5: Implement queue, legend, selection, and weighted contribution detail**

`MapWorkspace` dynamically imports `RiskMap` with `ssr: false` and consumes:

```ts
interface MapWorkspaceProps {
  rows: Hotspot[];
  lens: RiskLens;
  selected: Hotspot | null;
  onLensChange(lens: RiskLens): void;
  onSelect(hotspot: Hotspot): void;
}
```

The queue renders the first 50 rows from `sortHotspots(rows, sort)`, exposes the four sort options, and marks the selected button with `aria-pressed`. Each row shows tier text, province, date, FRP, and school distance.

`HotspotDetail` must call `weightedContributions(hotspot)`. Render a zero-to-one track with three adjacent segments:

```tsx
const parts = weightedContributions(hotspot);
<div
  className={styles.contributionTrack}
  role="img"
  aria-label={"Kontribusi intensity " + parts.intensity.toFixed(3) +
    ", exposure " + parts.exposure.toFixed(3) + ", risk score " + parts.total.toFixed(3)}
>
  <span className={styles.intensityPart} style={{ width: (parts.intensity * 100) + "%" }} />
  <span className={styles.exposurePart} style={{ width: (parts.exposure * 100) + "%" }} />
  <span className={styles.remainderPart} style={{ width: (parts.remainder * 100) + "%" }} />
</div>
<dl>
  <div><dt>0.45 × intensity_score</dt><dd>{parts.intensity.toFixed(3)}</dd></div>
  <div><dt>0.55 × exposure_score</dt><dd>{parts.exposure.toFixed(3)}</dd></div>
</dl>
```

The detail note states that confidence is algorithmic detection confidence and risk tier is an analytical priority, not field verification.

- [ ] **Step 6: Wire the workspace into Dashboard and verify**

Pass `rows`, `lens`, `selected`, and their setters from `Dashboard`. Keep map height at 620px desktop, 520px tablet, and 420px mobile to reserve layout space.

Run:

```bash
npm test
npm run typecheck
npm run lint
npm run build
```

Expected: all pass; the map chunk is client-only in the build output.

- [ ] **Step 7: Commit the map workspace**

```bash
git add lib/fireline/map-data.ts components/dashboard tests
git commit -m "feat: add risk command map and priority queue"
```

---

### Task 6: Add temporal, exposure, feature-engineering, and accessible table views

**Files:**
- Modify: `lib/fireline/analytics.ts`
- Create: `components/dashboard/analytics-panels.tsx`
- Create: `components/dashboard/hotspot-table.tsx`
- Modify: `components/dashboard/dashboard.tsx`
- Modify: `components/dashboard/dashboard.module.css`
- Modify test: `tests/analytics.test.ts`
- Modify test: `tests/dashboard-markup.test.tsx`

**Interfaces:**
- Consumes: the same filtered `Hotspot[]` used by the map and summary.
- Produces: `AnalyticsPanels({ rows })`, `HotspotTable({ rows, onSelect })`, province-tier aggregation, exposure bins, chart summaries, sortable table state, and pagination.

- [ ] **Step 1: Add failing aggregation, sorting, and pagination tests**

Extend `tests/analytics.test.ts`:

```ts
import { aggregateExposure, aggregateProvinceTiers, paginate, sortHotspots } from "@/lib/fireline/analytics";

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
  assert.deepEqual(province, {
    province: "KALIMANTAN BARAT",
    Kritis: 1,
    Tinggi: 0,
    Sedang: 0,
    Rendah: 0,
  });
});
```

- [ ] **Step 2: Run analytics tests and confirm the new province aggregator fails**

Run: `node --import tsx --test tests/analytics.test.ts`

Expected: FAIL until the province-by-tier function is exported and matches the stable return shape.

- [ ] **Step 3: Finish the pure aggregators and pass tests**

Add to `lib/fireline/analytics.ts`:

```ts
export function aggregateProvinceTiers(rows: Hotspot[]) {
  const provinces = new Map<string, {
    province: string; Kritis: number; Tinggi: number; Sedang: number; Rendah: number;
  }>();
  for (const row of rows) {
    const current = provinces.get(row.province) ?? {
      province: row.province, Kritis: 0, Tinggi: 0, Sedang: 0, Rendah: 0,
    };
    current[row.riskTier]++;
    provinces.set(row.province, current);
  }
  return [...provinces.values()].sort((a, b) => a.province.localeCompare(b.province));
}
```

The stable four-key shape prevents missing chart series when a province has no filtered records in one tier. Run `node --import tsx --test tests/analytics.test.ts`.

Expected: PASS with boundary distances counted once, stable tier keys, deterministic sorting, and deterministic pagination.

- [ ] **Step 4: Implement analytical panels with no modeling content**

Create `analytics-panels.tsx` with four sections:

1. **Pola temporal & musim** — Recharts monthly line chart from `aggregateMonthly(rows)`. Add background bands for July–October and a textual summary naming the peak filtered month. Axis label: `Jumlah hotspot terdeteksi`.
2. **Exposure terhadap fasilitas pendidikan** — distance-bin bar chart and filtered median school distance. Copy states that school proximity is a proxy, not a population count.
3. **Komposisi prioritas per provinsi** — stacked bar chart using the four exact tier tokens and direct province labels.
4. **Feature engineering** — the approved three-stage pipeline plus filtered median intensity, exposure, and risk scores.

Set `isAnimationActive={false}` on chart series. Wrap each chart in a fixed-aspect container and provide a `<p className="sr-only">` summary. Never import or mention daily surge probabilities in this component.

Use this component structure:

```tsx
"use client";

import {
  Bar, BarChart, CartesianGrid, LabelList, Legend, Line, LineChart,
  ReferenceArea, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import {
  aggregateExposure, aggregateMonthly, aggregateProvinceTiers,
} from "@/lib/fireline/analytics";
import type { Hotspot } from "@/lib/fireline/types";

const tierColors = {
  Kritis: "#8F1D2C", Tinggi: "#C4472D", Sedang: "#B97812", Rendah: "#267266",
};

function median(values: number[]) {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

export function AnalyticsPanels({ rows }: { rows: Hotspot[] }) {
  const monthly = aggregateMonthly(rows);
  const exposure = aggregateExposure(rows);
  const provinces = aggregateProvinceTiers(rows);
  const peak = monthly.reduce((best, point) => point.count > best.count ? point : best, monthly[0]);
  const dryYears = [...new Set(monthly.map((point) => point.month.slice(0, 4)))];
  const scoreSummary = {
    intensity: median(rows.map((row) => row.intensityScore)),
    exposure: median(rows.map((row) => row.exposureScore)),
    risk: median(rows.map((row) => row.riskScore)),
  };

  return (
    <div className="analytics-grid">
      <section aria-labelledby="temporal-title">
        <h2 id="temporal-title">Pola temporal &amp; musim</h2>
        <p className="sr-only">Bulan puncak pada filter ini adalah {peak.month} dengan {peak.count} hotspot terdeteksi.</p>
        <div className="chart-frame">
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={monthly}>
              <CartesianGrid stroke="#C7D2CF" vertical={false} />
              {dryYears.map((year) => <ReferenceArea key={year} x1={year + "-07"} x2={year + "-10"} fill="#B97812" fillOpacity={0.1} />)}
              <XAxis dataKey="month" minTickGap={24} /><YAxis allowDecimals={false} />
              <Tooltip /><Line dataKey="count" stroke="#172826" strokeWidth={2} dot={false} isAnimationActive={false} name="Hotspot" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>
      <section aria-labelledby="exposure-title">
        <h2 id="exposure-title">Exposure terhadap fasilitas pendidikan</h2>
        <p>Sekolah adalah proxy kedekatan permukiman dan fasilitas, bukan ukuran populasi lokal.</p>
        <div className="chart-frame">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={exposure}><XAxis dataKey="label" /><YAxis allowDecimals={false} /><Tooltip />
              <Bar dataKey="count" fill="#267266" isAnimationActive={false}><LabelList dataKey="count" position="top" /></Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
      <section aria-labelledby="province-title">
        <h2 id="province-title">Komposisi prioritas per provinsi</h2>
        <div className="chart-frame">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={provinces}><XAxis dataKey="province" /><YAxis allowDecimals={false} /><Tooltip /><Legend />
              {(Object.keys(tierColors) as Array<keyof typeof tierColors>).map((tier) =>
                <Bar key={tier} dataKey={tier} stackId="risk" fill={tierColors[tier]} isAnimationActive={false} />)}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
      <section aria-labelledby="feature-title">
        <h2 id="feature-title">Feature engineering</h2>
        <ol className="feature-pipeline">
          <li>FRP + brightness + confidence <strong>intensity score</strong></li>
          <li>Jarak sekolah + sekolah 5 km + populasi provinsi <strong>exposure score</strong></li>
          <li>Intensity + exposure <strong>risk score → risk tier</strong></li>
        </ol>
        <dl>
          <div><dt>Median intensity</dt><dd>{scoreSummary.intensity?.toFixed(3) ?? "—"}</dd></div>
          <div><dt>Median exposure</dt><dd>{scoreSummary.exposure?.toFixed(3) ?? "—"}</dd></div>
          <div><dt>Median risk score</dt><dd>{scoreSummary.risk?.toFixed(3) ?? "—"}</dd></div>
        </dl>
      </section>
    </div>
  );
}
```

- [ ] **Step 5: Implement the sortable, paginated table**

`HotspotTable` keeps `sort` and `page` state, uses `sortHotspots` and `paginate` with 25 rows per page, and displays:

- Date/time.
- Province.
- Tier.
- Risk score.
- FRP in MW.
- Confidence.
- School distance.
- Nearby-school count.

Use a native `table`. Sort buttons are inside `th` and the active column exposes `aria-sort`. Row detail uses a labeled button calling `onSelect(row)`. Pagination uses `Sebelumnya` and `Berikutnya` buttons with disabled semantics and a visible `Halaman X dari Y` status.

Implement:

```tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { paginate, sortHotspots, type HotspotSort } from "@/lib/fireline/analytics";
import type { Hotspot } from "@/lib/fireline/types";

export function HotspotTable({ rows, onSelect }: { rows: Hotspot[]; onSelect(row: Hotspot): void }) {
  const [sort, setSort] = useState<HotspotSort>("risk");
  const [page, setPage] = useState(1);
  const sorted = useMemo(() => sortHotspots(rows, sort), [rows, sort]);
  const result = paginate(sorted, page, 25);
  useEffect(() => setPage(1), [rows, sort]);
  const sortHeader = (label: string, value: HotspotSort) => (
    <button type="button" onClick={() => setSort(value)}>{label}</button>
  );

  return (
    <section aria-labelledby="table-title">
      <h2 id="table-title">Hotspot terdeteksi</h2>
      <div className="table-scroll">
        <table>
          <thead><tr>
            <th aria-sort={sort === "date" ? "descending" : "none"}>{sortHeader("Waktu", "date")}</th>
            <th>Provinsi</th><th>Tier</th>
            <th aria-sort={sort === "risk" ? "descending" : "none"}>{sortHeader("Risk score", "risk")}</th>
            <th aria-sort={sort === "frp" ? "descending" : "none"}>{sortHeader("FRP", "frp")}</th>
            <th>Confidence</th>
            <th aria-sort={sort === "distance" ? "ascending" : "none"}>{sortHeader("Jarak sekolah", "distance")}</th>
            <th>Sekolah 5 km</th><th>Detail</th>
          </tr></thead>
          <tbody>{result.rows.map((row) => (
            <tr key={row.id}>
              <td>{row.timestamp}</td><td>{row.province}</td>
              <td><span data-tier={row.riskTier}>{row.riskTier}</span></td>
              <td>{row.riskScore.toFixed(3)}</td><td>{row.frp.toFixed(1)} MW</td>
              <td>{row.confidence}</td><td>{row.schoolDistanceKm.toFixed(2)} km</td>
              <td>{row.schoolsWithin5Km}</td>
              <td><button type="button" onClick={() => onSelect(row)}>Lihat hotspot</button></td>
            </tr>
          ))}</tbody>
        </table>
      </div>
      <nav aria-label="Paginasi tabel">
        <button type="button" disabled={result.page === 1} onClick={() => setPage(result.page - 1)}>Sebelumnya</button>
        <span aria-live="polite">Halaman {result.page} dari {result.pageCount}</span>
        <button type="button" disabled={result.page === result.pageCount} onClick={() => setPage(result.page + 1)}>Berikutnya</button>
      </nav>
    </section>
  );
}
```

- [ ] **Step 6: Add markup tests for section language and table semantics**

Extend `tests/dashboard-markup.test.tsx`, reusing the local `detailHotspot` fixture added in Task 5:

```tsx
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
```

If Recharts cannot render under `renderToStaticMarkup` because it requires layout dimensions, test the exported `ChartSummary` and table components separately; do not add jsdom.

- [ ] **Step 7: Wire panels and table into Dashboard, verify, and commit**

Run:

```bash
npm test
npm run typecheck
npm run lint
npm run build
```

Expected: all pass.

Commit:

```bash
git add lib/fireline/analytics.ts components/dashboard tests
git commit -m "feat: add seasonal and exposure analytics"
```

---

### Task 7: Build the inspectable methodology appendix without a second runtime dataset

**Files:**
- Create: `app/methodology/page.tsx`
- Create: `components/methodology-content.tsx`
- Create: `components/methodology-link.tsx`
- Modify: `app/page.tsx`
- Modify: `components/app-frame.tsx`
- Create: `tests/methodology.test.tsx`

**Interfaces:**
- Consumes: approved notebook/report facts and whitelisted dashboard query parameters.
- Produces: `MethodologyContent()`, `dashboardReturnHref(params)`, `MethodologyLink()`, `DashboardReturnLink()`, and a separately bundled static `/methodology` route.

- [ ] **Step 1: Write failing methodology content and return-link tests**

Create `tests/methodology.test.tsx`:

```tsx
import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { MethodologyContent, dashboardReturnHref } from "@/components/methodology-content";

test("methodology distinguishes detection, intensity proxy, and field verification", () => {
  const html = renderToStaticMarkup(<MethodologyContent />);
  assert.match(html, /anomali termal/);
  assert.match(html, /bukan konfirmasi kebakaran/);
  assert.match(html, /FRP.*proxy/s);
  assert.match(html, /ROC-AUC/);
});

test("methodology return link preserves only dashboard filters", () => {
  const href = dashboardReturnHref(new URLSearchParams("from=2024-08-01&tier=Kritis&junk=x"));
  assert.equal(href, "/?from=2024-08-01&tier=Kritis");
});
```

- [ ] **Step 2: Run the test and confirm the missing component**

Run: `node --import tsx --test tests/methodology.test.tsx`

Expected: FAIL with missing `methodology-content`.

- [ ] **Step 3: Implement the methodology content and query whitelist**

`MethodologyContent` contains these exact sections:

- `Apa yang dideteksi FIRMS` — thermal anomaly definition, confidence meaning, and field-verification caveat.
- `Data & provenance` — primary scored hotspot CSV and supporting notebook/report.
- `Feature engineering` — intensity, exposure, risk score, and quantile tiers.
- `Modeling appendix` — historical HGB ROC-AUC 0.823, persistence ROC-AUC 0.784, temporal CV mean 0.739 ± 0.058, threshold caveat, and low-season test-period caveat.
- `Keterbatasan` — school proxy, absent separate North Kalimantan population polygon, historical climatology, and no real-time weather.

Do not call `loadDashboardData()` and do not fetch `daily_surge_panel_features.csv`. The appendix can name its role in the notebook but has no interactive panel derived from it.

Implement `MethodologyContent` with the source-approved copy and formula:

```tsx
export function MethodologyContent() {
  return (
    <article className="methodology-content">
      <header>
        <p className="eyebrow">Metodologi &amp; batas interpretasi</p>
        <h1>Bagaimana FIRELINE membaca hotspot FIRMS</h1>
      </header>
      <section>
        <h2>Apa yang dideteksi FIRMS</h2>
        <p>Hotspot FIRMS adalah anomali termal yang dideteksi sensor satelit. Satu record bukan otomatis konfirmasi kebakaran di lapangan.</p>
        <p>Confidence menyatakan keyakinan algoritma deteksi. FRP adalah proxy energi termal yang diradiasikan, bukan ukuran luas terbakar.</p>
      </section>
      <section>
        <h2>Data &amp; provenance</h2>
        <p>Dashboard operasional memakai hotspots_with_risk_scores.csv. Notebook analisis dan laporan temuan menjelaskan pembersihan, feature engineering, evaluasi, dan limitasi.</p>
      </section>
      <section>
        <h2>Feature engineering &amp; risk score</h2>
        <pre>{`intensity = 0.60·minmax(log1p(FRP)) + 0.20·minmax(brightness) + 0.20·minmax(confidence)
exposure = 0.50·exp(-distance/5) + 0.30·minmax(log1p(schools_5km)) + 0.20·minmax(log1p(prov_pop))
risk score = 0.45·intensity + 0.55·exposure`}</pre>
        <p>Tier Kritis, Tinggi, Sedang, dan Rendah berasal dari kuantil risk score dan menyatakan prioritas analitis, bukan status verifikasi kebakaran.</p>
      </section>
      <details>
        <summary>Modeling appendix</summary>
        <p>Eksperimen historis HistGradientBoosting mencapai ROC-AUC 0.823, dibanding baseline persistence 0.784. Time-series cross-validation menghasilkan rata-rata ROC-AUC 0.739 ± 0.058.</p>
        <p>Hasil ini mengukur diskriminasi hari surge pada data historis. Threshold operasi bergantung pada toleransi false alarm, dan periode uji berada pada musim rendah.</p>
        <p>daily_surge_panel_features.csv memuat klimatologi, lag, rolling window, dan input eksperimen tersebut, tetapi tidak dimuat oleh dashboard runtime.</p>
      </details>
      <section>
        <h2>Keterbatasan</h2>
        <ul>
          <li>Sekolah digunakan sebagai proxy kedekatan permukiman dan fasilitas vital.</li>
          <li>Dataset populasi tidak menyediakan poligon Kalimantan Utara yang terpisah.</li>
          <li>Konteks cuaca memakai klimatologi historis, bukan cuaca real-time 2024–2026.</li>
          <li>Setiap hotspot tetap memerlukan verifikasi lapangan sebelum dinyatakan sebagai kebakaran.</li>
        </ul>
      </section>
    </article>
  );
}
```

Implement:

```ts
const dashboardKeys = ["from", "to", "province", "tier", "confidence", "dayNight"];
export function dashboardReturnHref(params: URLSearchParams): string {
  const kept = new URLSearchParams();
  for (const key of dashboardKeys) {
    const value = params.get(key);
    if (value) kept.set(key, value);
  }
  const query = kept.toString();
  return query ? "/?" + query : "/";
}
```

- [ ] **Step 4: Implement the route and preserve filters in both directions**

Create `components/methodology-link.tsx`:

```tsx
"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { dashboardReturnHref } from "./methodology-content";

export function MethodologyLink() {
  const query = useSearchParams().toString();
  return <Link className="method-link" href={query ? "/methodology?" + query : "/methodology"}>Metodologi</Link>;
}

export function DashboardReturnLink() {
  const href = dashboardReturnHref(new URLSearchParams(useSearchParams().toString()));
  return <Link href={href}>Kembali ke dashboard</Link>;
}
```

Change `AppFrame` to accept `methodologyLink?: React.ReactNode` and render `methodologyLink ?? <Link className="method-link" href="/methodology">Metodologi</Link>`. Update `app/page.tsx` to pass `<Suspense fallback={<Link className="method-link" href="/methodology">Metodologi</Link>}><MethodologyLink /></Suspense>`.

Create `app/methodology/page.tsx`:

```tsx
import { Suspense } from "react";
import { AppFrame } from "@/components/app-frame";
import { MethodologyContent } from "@/components/methodology-content";
import { DashboardReturnLink } from "@/components/methodology-link";

function ReturnLink() {
  return (
    <Suspense fallback={<Link href="/">Kembali ke dashboard</Link>}>
      <DashboardReturnLink />
    </Suspense>
  );
}

export default function MethodologyPage() {
  return (
    <AppFrame>
      <main id="main" className="methodology-page">
        <ReturnLink />
        <MethodologyContent />
        <ReturnLink />
      </main>
    </AppFrame>
  );
}
```

Keep the methodology page readable at a maximum text measure of 72 characters and use the existing tokens and typography.

- [ ] **Step 5: Verify no secondary CSV is shipped or requested**

Run:

```bash
rg -n "daily_surge_panel_features|loadDashboardData" app/methodology components/methodology-content.tsx
npm test
npm run typecheck
npm run lint
npm run build
```

Expected: the search finds only explanatory copy naming the secondary file, never a loader/import/fetch; all checks pass.

- [ ] **Step 6: Commit the appendix**

```bash
git add app/page.tsx app/methodology components/app-frame.tsx components/methodology-content.tsx components/methodology-link.tsx tests/methodology.test.tsx
git commit -m "feat: add FIRELINE methodology appendix"
```

---

### Task 8: Finish resilience, responsive polish, documentation, and production verification

**Files:**
- Create: `app/loading.tsx`
- Create: `app/error.tsx`
- Modify: `app/globals.css`
- Modify: `components/dashboard/dashboard.module.css`
- Create: `README.md`
- Modify: `tests/dashboard-markup.test.tsx`
- Modify: `tests/methodology.test.tsx`

**Interfaces:**
- Consumes: all completed routes and components.
- Produces: stable loading/error UI, final responsive and accessibility behavior, deploy instructions, and recorded verification evidence.

- [ ] **Step 1: Write a failing source-language guard**

Add to `tests/dashboard-markup.test.tsx`:

```ts
import { readFile } from "node:fs/promises";

test("core UI source keeps scientific hotspot terminology", async () => {
  const files = [
    "components/dashboard/summary-rail.tsx",
    "components/dashboard/map-workspace.tsx",
    "components/dashboard/analytics-panels.tsx",
  ];
  const source = (await Promise.all(files.map((file) => readFile(file, "utf8")))).join("\n");
  assert.match(source, /anomali termal/);
  assert.doesNotMatch(source, /kebakaran aktif|kebakaran terverifikasi/i);
});
```

Run `node --import tsx --test tests/dashboard-markup.test.tsx` and confirm it fails if the exact scientific note is not yet present in the map workspace. Add the note there and rerun to PASS.

- [ ] **Step 2: Add route-level loading and error recovery**

Create `app/loading.tsx`:

```tsx
export default function Loading() {
  return <main id="main" className="route-loading" aria-label="Memuat FIRELINE"><div className="dashboard-skeleton" /></main>;
}
```

Create `app/error.tsx`:

```tsx
"use client";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset(): void }) {
  return (
    <main id="main" className="route-error">
      <p className="eyebrow">Dashboard tidak dapat ditampilkan</p>
      <h1>Data historis belum berhasil dimuat.</h1>
      <p>{error.message}</p>
      <button type="button" onClick={reset}>Coba lagi</button>
    </main>
  );
}
```

- [ ] **Step 3: Complete responsive, focus, contrast, and reduced-motion CSS**

Ensure:

- Every interactive control is at least 44px high on compact layouts.
- Risk badges include text and border treatment.
- The map, chart, and table containers can shrink with `min-width: 0`.
- Table overflow is confined to its own wrapper; the page has no horizontal overflow.
- Mobile content order is summary, map, selected detail, queue, temporal, exposure, feature engineering, table.
- Mobile has no fixed-height queue or nested page scroll.
- Sticky controls use `scroll-margin-top` and never cover focused content.
- `:focus-visible` remains at least 3px.
- All map and panel transitions are opacity/transform and the existing reduced-motion rule disables them.
- Chart and map containers reserve dimensions before JavaScript loads.

Use a high/critical badge pair that remains distinguishable in grayscale by adding `border-style: double` for Critical and `border-style: solid` for High.

Add these non-negotiable rules to the relevant global/module styles:

```css
.map-canvas, .chart-frame, .table-scroll { min-width: 0; }
.map-canvas { width: 100%; height: 620px; background: #e3ebe8; }
.chart-frame { min-height: 260px; }
.table-scroll { overflow-x: auto; }
[data-tier="Kritis"] { color: #8f1d2c; border: 3px double currentColor; }
[data-tier="Tinggi"] { color: #c4472d; border: 2px solid currentColor; }
[data-tier="Sedang"] { color: #7b4c00; border: 2px solid #b97812; }
[data-tier="Rendah"] { color: #1f5d54; border: 2px solid #267266; background: transparent; }
.sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; }
button, select, input, summary, a { touch-action: manipulation; }
@media (max-width: 1023px) { .map-canvas { height: 520px; } }
@media (max-width: 767px) {
  .map-canvas { height: 420px; }
  button, select, input, summary { min-height: 44px; }
  .priority-queue { max-height: none; overflow: visible; }
}
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation: none !important; transition: none !important; scroll-behavior: auto !important; }
}
```

- [ ] **Step 4: Document local use, source semantics, and Vercel deployment**

Create `README.md` with:

````markdown
# FIRELINE Risk Command Canvas

Historical decision-support dashboard for NASA FIRMS thermal anomalies in Kalimantan.

## Run locally

```bash
npm install
npm run dev
```

`predev` validates `data/dashboard/hotspots_with_risk_scores.csv` and regenerates `public/data`.

## Verify

```bash
npm test
npm run typecheck
npm run lint
npm run build
```

## Deploy to Vercel

Import this repository as a Next.js project. No environment variables are required. Vercel runs `npm run build`, whose `prebuild` step regenerates the static data partitions.

## Scientific interpretation

A FIRMS hotspot is a satellite-detected thermal anomaly, not automatic field confirmation of wildfire. FRP is a proxy for radiated thermal energy, and FIRELINE's risk tier is an analytical response-priority score based on intensity and exposure features.
````

- [ ] **Step 5: Run the complete automated verification**

Run:

```bash
npm test
npm run typecheck
npm run lint
npm run build
git diff --check
```

Expected: every command exits 0. Record the exact test count and generated route list for the final handoff.

- [ ] **Step 6: Run the production server smoke check**

Start `npm run start` from the completed build. In a second command session run:

```bash
curl --fail --silent --show-error http://127.0.0.1:3000/
curl --fail --silent --show-error http://127.0.0.1:3000/methodology
```

Expected: both return rendered HTML containing `FIRELINE`; stop the server cleanly afterward.

- [ ] **Step 7: Perform responsive and accessibility acceptance checks**

At 375, 768, 1024, and 1440px:

- Confirm no horizontal page overflow.
- Operate every filter, Risk Lens control, queue row, table sort, pagination action, and methodology return link with keyboard only.
- Confirm the selected detail shows variable weighted components rather than fixed 45/55 segments.
- Confirm filtering changes every KPI and all analytical panels.
- Confirm the map legend defines hotspots as thermal anomalies.
- Enable reduced motion and verify state changes remain immediate and readable.
- Block `tiles.openfreemap.org` and confirm KPI, queue, charts, table, and methodology remain usable.
- Inspect text and non-text contrast for all four risk tokens and focus states.

- [ ] **Step 8: Commit production readiness changes**

```bash
git add app components README.md tests
git commit -m "chore: finish FIRELINE production readiness"
```

- [ ] **Step 9: Confirm the final working tree**

Run:

```bash
git status --short
git log --oneline -10
```

Expected: implementation files are committed. Existing unrelated repository artifacts remain preserved; do not stage or delete them merely to make status empty.
