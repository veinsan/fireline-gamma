# FIRELINE Risk Command Canvas — Design Specification

**Date:** 30 August 2026  
**Status:** Design approved in chat; awaiting final specification review

## 1. Product definition

FIRELINE is a historical decision-support dashboard for exploring wildfire hotspot risk across Kalimantan. It serves two audiences in one coherent experience:

- BPBD and field-response stakeholders scanning for historically high-priority hotspots and understanding why they were prioritized.
- COMPFEST judges and data analysts inspecting the evidence, feature engineering, provenance, and methodological limitations behind the dashboard.

The interface is written in Bahasa Indonesia while retaining standard technical terms such as risk score, exposure, FRP, confidence, feature engineering, and ROC-AUC.

The dashboard is explicitly historical. It must never imply that the displayed hotspots are live incidents. The visible snapshot range is derived from the loaded dataset, currently spanning August 2024 through May 2026.

## 2. Source-of-truth hierarchy

### Primary operational source

`data/dashboard/hotspots_with_risk_scores.csv` is the source of truth for the core dashboard. It supplies hotspot location, acquisition time, province, intensity fields, exposure fields, engineered scores, and risk tiers.

All core operational analytics must use this file, including:

- Filtered hotspot counts and risk-tier counts.
- Temporal trends and seasonal patterns.
- Spatial layers and the priority queue.
- FRP, brightness, and confidence summaries.
- Distance-to-school and schools-within-5-km exposure summaries.
- Intensity, exposure, and risk-score distributions.
- Province comparisons.

Displayed analytical values are always derived from the loaded and currently filtered records. The application must not duplicate analytical KPI values as constants.

### Secondary analytical source

`data/dashboard/daily_surge_panel_features.csv` is not a runtime dependency in the first release. The methodology appendix identifies it as the source of climatology, lagged values, rolling windows, and surge-model experiment inputs, but explains those experiments from the notebook and findings report instead of loading a second interactive dataset.

### Supporting references

- `notebooks/Case Study Grad Compfest.ipynb` defines cleaning, feature engineering, risk scoring, model evaluation, and limitations.
- `reports/findings/Case Study_Findings.pdf` supplies the narrative interpretation of the analysis.
- `docs/case-study/Case_Study_Graduation_Night_COMPFEST_18.md` defines the competition brief and evaluation context.
- Existing report figures are references, not runtime dashboard data.

## 3. Goals and non-goals

### Goals

- Make risk priority—not raw fire intensity—the primary spatial lens.
- Let users trace every selected hotspot from source fields to risk score.
- Keep filters synchronized across the map, queue, KPIs, and analytical views.
- Expose seasonal, spatial, intensity, and human-exposure patterns without presenting historical data as live monitoring.
- Keep methodology and limitations inspectable without crowding the operational workspace.
- Deploy reliably to Vercel and remain straightforward to connect to future NASA FIRMS or BMKG APIs.

### Non-goals

- No live NASA FIRMS or BMKG integration.
- No push alerts, authentication, case management, dispatch workflow, or crowdsourced reporting.
- No new model training or synthetic prediction values in the core dashboard.
- No model-evidence cards in the operational workspace.
- No dark theme in the first release.

## 4. Information architecture

### Primary route: `/`

```text
[ FIRELINE | Snapshot historis: derived range | Metodologi ]

[ Date ][ Provinsi ][ Risk tier ][ Confidence ][ Siang/Malam ][ Reset ]

[ Derived summary rail ]

[                  INTERACTIVE MAP             ][ PRIORITY QUEUE ]
[ Risk Lens: Prioritas | Intensity | Exposure  ][ sortable list  ]
[ aggregated overview -> individual hotspots   ][ hotspot detail ]

[ Temporal trend + seasonal patterns                            ]
[ Exposure insight ][ Feature engineering outputs               ]
[ Accessible data table + provenance + limitations              ]
```

The opening thesis is:

> Prioritas bukan sekadar api terbesar, tetapi ancaman terbesar bagi manusia.

The map is the hero and begins immediately after compact controls and a derived summary rail. Generic marketing-style KPI cards must not displace it.

### Methodology route: `/methodology`

The separately loaded appendix contains:

- Dataset provenance and cleaning decisions.
- Feature definitions and risk-scoring equations.
- A compact modeling appendix with evaluation evidence and honest caveats.
- Data limitations and implications for interpretation.
- A back link that restores the dashboard URL search parameters carried into the methodology route.

Modeling remains appendix content and never appears in the core dashboard.

## 5. Filters and shared state

Core filters are:

- Date range.
- Province.
- Risk tier.
- Confidence.
- Day/night.

All filters update the same filtered record set used by KPIs, map layers, priority queue, charts, and table. Filter state is encoded in URL search parameters so a view can be refreshed or shared. Invalid parameters fall back to valid dataset bounds rather than breaking the page.

The filter collection wraps on narrow widths. Mobile uses a labeled filter sheet with an applied-filter count, explicit Apply and Reset actions, keyboard focus management, and no hover-only controls.

An empty result shows which filters produced no matches and provides a Reset filter action.

## 6. Core dashboard modules

### Derived summary rail

The summary rail shows four values computed from the filtered primary dataset: total hotspots, High/Critical hotspots, median FRP, and the percentage of hotspots within the five-kilometre exposure threshold. Labels state the active filter scope.

No analytical result is hardcoded. Even the displayed snapshot range is derived from dataset dates.

### Risk Command Map

The Risk Lens has three mutually exclusive views:

- **Prioritas:** `risk_tier` and `risk_score` determine emphasis.
- **Intensity:** `intensity_score`, FRP, brightness, and confidence provide context.
- **Exposure:** `exposure_score`, `dist_school_km`, and `schools_5km` provide context.

At broad zoom levels the map clusters or aggregates points. At useful detail levels it reveals individual hotspots. Selecting a map point selects the same record in the priority queue and detail panel without changing the active filters.

The selected-hotspot explanation includes:

- Acquisition date and time.
- Province and coordinates.
- FRP, brightness, and confidence.
- Distance to nearest school and schools within five kilometres.
- Intensity score, exposure score, risk score, and risk tier.
- A contribution bar reflecting the documented 45% intensity and 55% exposure weighting.

The dashboard uses the already exported scores and tiers as authoritative values. It may validate their relationship during data preparation but must not silently replace them with a different formula.

### Priority queue

The queue defaults to descending risk score and remains synchronized with the map. Users can sort by risk score, date, FRP, or school distance. Each row exposes tier text, not color alone. Selecting a row moves map focus and opens the same detail view.

### Temporal trend and seasonal patterns

This module derives daily or monthly hotspot counts directly from `acq_date` in the primary dataset. It supports the same filters and highlights the July–October dry-season window as seasonal context. It does not present surge probabilities or model predictions.

### Exposure insights

This module derives exposure distributions and province comparisons from `dist_school_km`, `schools_5km`, `prov_pop`, and `exposure_score`. It explains that schools are used as a proxy for nearby settlement and critical facilities; it must not relabel school counts as population counts.

### Feature engineering outputs

The core view explains the operational feature pipeline using fields already present in the primary dataset:

```text
FRP + brightness + confidence -> intensity score
school distance + nearby schools + province population -> exposure score
intensity score + exposure score -> risk score -> risk tier
```

The panel shows filtered distributions or representative records rather than model validation. Lagged, rolling, climatology, and surge features are described only in the methodology appendix.

### Accessible table

The complete filtered result set is available through a paginated, sortable table. Column headers expose sort state, numeric values use tabular figures, and the table serves as the non-map route to every hotspot detail.

## 7. Risk scoring reference

The methodology appendix documents the notebook's scoring logic:

```text
intensity =
  0.60 * minmax(log1p(FRP))
  + 0.20 * minmax(brightness)
  + 0.20 * minmax(confidence ordinal)

exposure =
  0.50 * exp(-school distance km / 5)
  + 0.30 * minmax(log1p(schools within 5 km))
  + 0.20 * minmax(log1p(province population))

risk score = 0.45 * intensity + 0.55 * exposure
```

Risk tiers were assigned from risk-score quantiles in the source analysis: Critical at or above the 95th percentile, High at or above the 80th, Medium at or above the 50th, and Low below the median. The Bahasa Indonesia UI labels are Kritis, Tinggi, Sedang, and Rendah.

## 8. Visual system

The visual direction is **operational cartography**: cool survey surfaces, restrained borders, strong data hierarchy, and warm color reserved for actual risk meaning.

### Core tokens

- Peat ink `#172826` — primary text, controls, and navigation.
- Cloud sheet `#F2F6F4` — application background.
- Survey white `#FFFFFF` — panels.
- Map grid `#C7D2CF` — borders and geographic guides.
- Canopy teal `#267266` — analytical context and Low risk.
- Dry-season amber `#B97812` — seasonal emphasis and Medium risk.

### Risk tokens

- Critical `#8F1D2C`.
- High `#C4472D`.
- Medium `#B97812`.
- Low `#267266`.

These tokens are identical across map, charts, queue, badges, table, and legend. Color is reinforced with labels, marker size, fill treatment, and outline:

- Critical: largest marker with a double outline.
- High: large solid marker.
- Medium: medium solid marker.
- Low: smaller hollow marker.
- Selected: neutral white and peat halo, never another risk color.

### Typography

- Barlow Condensed for headings and operational labels.
- Atkinson Hyperlegible for interface and explanatory copy.
- Native monospace for coordinates, dates, FRP, and tabular figures.

### Surfaces and effects

- Desaturated map treatment so risk layers remain dominant.
- Flat panels with visible one-pixel borders, 10–14px radii, and minimal shadow.
- No glassmorphism, flame effects, decorative gradients, or red-dominant page chrome.

## 9. Motion and interaction

The signature interaction is the Risk Lens transition. Switching lenses crossfades map layers while preserving viewport and selection. The selected detail panel updates with a short opacity/translate transition.

Motion uses transform and opacity only. Rapid changes cancel and settle on the newest state. `prefers-reduced-motion` removes nonessential transitions and renders the final state immediately.

Interactive controls use native buttons, links, selects, and date inputs. Map-specific controls use MapLibre's accessible control primitives. All controls have visible focus, pressed/selected state, and at least a 44px touch target on compact layouts.

## 10. Responsive behavior

- **1440px and above:** map occupies the main canvas; priority queue is visible beside it.
- **1024px:** map remains primary; queue narrows and secondary analytical modules form two columns.
- **768px:** queue moves below the map; analytical modules become one or two columns based on content.
- **375px:** filters move to a sheet; order becomes summary, map, selected hotspot, queue, trend, exposure, feature engineering, table.

There are no nested scrolling regions on mobile. Sticky controls reserve space and must not obscure keyboard focus.

## 11. Technical architecture

### Stack

- Next.js App Router.
- TypeScript.
- Native CSS Grid, CSS Modules, and CSS custom properties.
- MapLibre GL for clustered WebGL hotspot rendering.
- Recharts for filtered temporal and comparative charts.
- Vercel static-first deployment.

### Build-time data preparation

A deterministic Node script runs before development and production builds:

1. Read `hotspots_with_risk_scores.csv`.
2. Validate required headers, dates, coordinates, numeric fields, and tier values.
3. Verify that each row has the expected number of columns.
4. Partition compact hotspot output by year and emit derived dataset metadata.
5. Leave `daily_surge_panel_features.csv` out of runtime assets; the methodology appendix references its schema and documented results only.

The script fails the build with a specific message when source data is malformed or its schema changes.

### Runtime flow

```text
Primary CSV
  -> prebuild validation and compact year partitions
  -> static Vercel/CDN assets
  -> loadDashboardData()
  -> URL-backed filters
  -> one filtered record set
  -> derived KPIs, map, queue, charts, and table
```

`loadDashboardData()` is the only source-loading boundary needed by the core dashboard. A future live integration can change that function to read a normalized API response while leaving visualization components unchanged. No API interface, service hierarchy, or backend is created in this release.

### Performance

- Dynamically import the map bundle.
- Use compressed, year-partitioned static data.
- Cluster points at broad zoom levels.
- Recompute filtered aggregates only when filter state changes.
- Reserve map and chart dimensions during loading.
- Keep the methodology route in a separate bundle.

## 12. Error handling and resilience

- Invalid source rows fail data preparation instead of being silently dropped.
- A failed data request shows its cause, a Retry action, and access to methodology/provenance.
- An empty filter result names the active scope and provides Reset filter.
- If external basemap tiles fail, queue, charts, KPIs, and table remain usable.
- Unknown URL filter values are normalized to valid defaults.
- No UI state labels historical records as active, current, or real-time.

## 13. Accessibility

- A skip link targets the dashboard main content.
- Heading levels follow document hierarchy.
- Every icon-only control has an accessible name and state.
- Risk is never conveyed by color alone.
- Map insights have a sortable table and textual summary alternative.
- Monthly and province-comparison charts include direct labels. Denser views provide keyboard-reachable exact values, a concise screen-reader summary, a nearby legend, and the equivalent table data.
- Focus remains visible and unobscured by sticky UI.
- Reduced motion is supported.
- Text and meaningful non-text elements meet WCAG contrast requirements.

## 14. Verification and acceptance

### Automated checks

- A small Node-native test covers CSV transformation, schema rejection, filter aggregation, and KPI derivation.
- Type checking succeeds.
- Linting succeeds.
- The production Next.js build succeeds.

### Interaction checks

- Every filter updates KPIs, map, queue, charts, and table from the same record set.
- URL parameters restore a shared filter state.
- Risk Lens changes preserve viewport and selection.
- Map and queue selection remain synchronized.
- KPI values change with filters and are never read from constants.
- Modeling content is absent from `/` and confined to a compact appendix in `/methodology`.

### Visual and accessibility checks

- Verify 375px, 768px, 1024px, and 1440px layouts without horizontal overflow.
- Verify keyboard-only operation and visible focus.
- Verify reduced-motion behavior.
- Verify risk-token consistency across map, charts, queue, legend, and table.
- Verify the table and textual summaries remain usable without the map.

## 15. Future live-data extension

Future NASA FIRMS or BMKG integrations should normalize their responses to the same client-side hotspot shape produced by the current build script. They can then replace the loader's static source without rewriting filters or visualizations.

Live data will require explicit freshness, failure, uncertainty, rate-limit, and provenance states. None of those states are simulated in the historical release.
