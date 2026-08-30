"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { sortHotspots, type HotspotSort, weightedContributions } from "@/lib/fireline/analytics";
import type { Hotspot, RiskLens } from "@/lib/fireline/types";

const RiskMap = dynamic(() => import("./risk-map").then((module) => module.RiskMap), {
  ssr: false,
  loading: () => <div className="map-canvas map-loading" aria-label="Memuat peta hotspot" />,
});

const number = new Intl.NumberFormat("id-ID");
const decimal = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 2 });

interface MapWorkspaceProps {
  rows: Hotspot[];
  lens: RiskLens;
  selected: Hotspot | null;
  onLensChange(lens: RiskLens): void;
  onSelect(hotspot: Hotspot): void;
}

const lensLabels: Record<RiskLens, string> = { priority: "Prioritas", intensity: "Intensity", exposure: "Exposure" };

export function HotspotDetail({ hotspot }: { hotspot: Hotspot }) {
  const parts = weightedContributions(hotspot);
  return (
    <article className="hotspot-detail" aria-labelledby="detail-title">
      <header>
        <div><p className="eyebrow">Hotspot terpilih</p><h3 id="detail-title">{hotspot.province.replace("KALIMANTAN ", "Kalimantan ")}</h3></div>
        <span className="tier-badge" data-tier={hotspot.riskTier}>{hotspot.riskTier}</span>
      </header>
      <p className="mono-line">{hotspot.timestamp} · {hotspot.latitude.toFixed(5)}, {hotspot.longitude.toFixed(5)}</p>
      <dl className="detail-grid">
        <div><dt>Risk score</dt><dd>{hotspot.riskScore.toFixed(3)}</dd></div>
        <div><dt>FRP</dt><dd>{decimal.format(hotspot.frp)} MW</dd></div>
        <div><dt>Confidence</dt><dd>{hotspot.confidence}</dd></div>
        <div><dt>Brightness</dt><dd>{decimal.format(hotspot.brightness)}</dd></div>
        <div><dt>Sekolah terdekat</dt><dd>{decimal.format(hotspot.schoolDistanceKm)} km</dd></div>
        <div><dt>Sekolah ≤5 km</dt><dd>{number.format(hotspot.schoolsWithin5Km)}</dd></div>
      </dl>
      <div className="contribution-block">
        <div className="contribution-heading"><span>Kontribusi aktual ke risk score</span><strong>{parts.total.toFixed(3)}</strong></div>
        <div className="contribution-track" role="img" aria-label={`Kontribusi intensity ${parts.intensity.toFixed(3)}, exposure ${parts.exposure.toFixed(3)}, risk score ${parts.total.toFixed(3)}`}>
          <span className="contribution-intensity" style={{ width: `${parts.intensity * 100}%` }} />
          <span className="contribution-exposure" style={{ width: `${parts.exposure * 100}%` }} />
          <span className="contribution-remainder" style={{ width: `${parts.remainder * 100}%` }} />
        </div>
        <dl className="contribution-labels">
          <div><dt>0.45 × intensity_score</dt><dd>{parts.intensity.toFixed(3)}</dd></div>
          <div><dt>0.55 × exposure_score</dt><dd>{parts.exposure.toFixed(3)}</dd></div>
        </dl>
      </div>
      <p className="scientific-note">Confidence adalah keyakinan algoritma deteksi. Risk tier merupakan prioritas analitis, bukan verifikasi kebakaran lapangan.</p>
    </article>
  );
}

function PriorityQueue({ rows, selected, onSelect }: { rows: Hotspot[]; selected: Hotspot | null; onSelect(row: Hotspot): void }) {
  const [sort, setSort] = useState<HotspotSort>("risk");
  const ranked = useMemo(() => sortHotspots(rows, sort).slice(0, 50), [rows, sort]);
  return (
    <aside className="priority-panel" aria-labelledby="queue-title">
      <header className="panel-heading">
        <div><p className="eyebrow">Priority queue</p><h2 id="queue-title">Hotspot prioritas</h2></div>
        <label className="queue-sort">Urutkan<select value={sort} onChange={(event) => setSort(event.target.value as HotspotSort)}><option value="risk">Risk score</option><option value="date">Terbaru</option><option value="frp">FRP</option><option value="distance">Jarak sekolah</option></select></label>
      </header>
      <ol className="priority-list">
        {ranked.map((row, index) => (
          <li key={row.id}>
            <button type="button" aria-pressed={selected?.id === row.id} onClick={() => onSelect(row)}>
              <span className="queue-rank">{String(index + 1).padStart(2, "0")}</span>
              <span className="queue-main"><strong>{row.province.replace("KALIMANTAN ", "Kalimantan ")}</strong><small>{row.date} · {decimal.format(row.frp)} MW · {decimal.format(row.schoolDistanceKm)} km sekolah</small></span>
              <span className="tier-badge" data-tier={row.riskTier}>{row.riskTier}</span>
              <span className="queue-score">{row.riskScore.toFixed(3)}</span>
            </button>
          </li>
        ))}
      </ol>
      {rows.length > ranked.length ? <p className="queue-note">Menampilkan 50 dari {number.format(rows.length)} hotspot. Tabel di bawah memuat seluruh hasil filter.</p> : null}
    </aside>
  );
}

export function MapWorkspace({ rows, lens, selected, onLensChange, onSelect }: MapWorkspaceProps) {
  const [basemapError, setBasemapError] = useState(false);
  return (
    <section className="map-workspace" aria-label="Risk Command Map">
      <div className="map-panel">
        <div className="map-toolbar">
          <div><p className="eyebrow">Spatial priority</p><h2>Peta anomali termal</h2></div>
          <div className="risk-lens" role="group" aria-label="Risk Lens">
            {(Object.keys(lensLabels) as RiskLens[]).map((item) => <button type="button" key={item} aria-pressed={lens === item} onClick={() => onLensChange(item)}>{lensLabels[item]}</button>)}
          </div>
        </div>
        <p id="map-summary" className="map-summary">{number.format(rows.length)} anomali termal terfilter. Gunakan tabel data sebagai alternatif keyboard untuk menelusuri setiap record.</p>
        {basemapError ? <p className="map-warning" role="status">Basemap eksternal mengalami gangguan. Layer analisis lain tetap dapat digunakan.</p> : null}
        <div className="map-stage"><RiskMap rows={rows} lens={lens} selectedId={selected?.id ?? null} onSelect={onSelect} onBasemapError={() => setBasemapError(true)} /></div>
        <div className="map-legend" aria-label="Legenda peta">
          <span><i data-tier="Kritis" /> Kritis</span><span><i data-tier="Tinggi" /> Tinggi</span><span><i data-tier="Sedang" /> Sedang</span><span><i data-tier="Rendah" /> Rendah</span>
          <small>Hotspot = anomali termal satelit, bukan konfirmasi kebakaran lapangan.</small>
        </div>
        {selected ? <HotspotDetail hotspot={selected} /> : <div className="selection-empty"><p className="eyebrow">Inspect</p><strong>Pilih hotspot pada peta atau priority queue.</strong><span>Detail intensity dan exposure akan dijelaskan di sini.</span></div>}
      </div>
      <PriorityQueue rows={rows} selected={selected} onSelect={onSelect} />
    </section>
  );
}
