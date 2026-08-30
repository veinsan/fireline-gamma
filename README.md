# FIRELINE Risk Command Canvas

Historical decision-support dashboard for NASA FIRMS thermal anomalies in Kalimantan, built for the COMPFEST 18 Data Science Academy case study.

## Run locally

```bash
npm install
npm run dev
```

`predev` validates `data/dashboard/hotspots_with_risk_scores.csv` and regenerates the year-partitioned browser assets in `public/data`.

## Verify

```bash
npm test
npm run typecheck
npm run lint
npm run build
```

## Deploy to Vercel

Import this repository as a Next.js project. No environment variables are required. Vercel runs `npm run build`; the `prebuild` step validates the primary CSV and regenerates the static data partitions.

## Data contract

- Core dashboard source: `data/dashboard/hotspots_with_risk_scores.csv`
- `data/dashboard/daily_surge_panel_features.csv` is methodology/experiment context only and is not loaded at runtime.
- Filters, KPIs, map layers, queue, charts, and table all derive from the same filtered primary record set.

## Scientific interpretation

A FIRMS hotspot is a satellite-detected thermal anomaly, not automatic field confirmation of wildfire. FRP is a proxy for radiated thermal energy, and FIRELINE's risk tier is an analytical response-priority score based on intensity and exposure features.

The dashboard is a historical snapshot, not a live command system. The visible date range is derived from the source dataset.
