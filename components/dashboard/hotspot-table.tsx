"use client";

import { useMemo, useState } from "react";
import { paginate, sortHotspots, type HotspotSort } from "@/lib/fireline/analytics";
import type { Hotspot } from "@/lib/fireline/types";

const number = new Intl.NumberFormat("id-ID");

export function HotspotTable({ rows, onSelect }: { rows: Hotspot[]; onSelect(row: Hotspot): void }) {
  const [sort, setSort] = useState<HotspotSort>("risk");
  const [page, setPage] = useState(1);
  const sorted = useMemo(() => sortHotspots(rows, sort), [rows, sort]);
  const result = paginate(sorted, page, 25);
  function changeSort(next: HotspotSort) { setSort(next); setPage(1); }
  const sortHeader = (label: string, value: HotspotSort) => <button type="button" onClick={() => changeSort(value)}>{label}<span aria-hidden="true"> ↕</span></button>;

  return (
    <section className="data-table-card" aria-labelledby="table-title">
      <header className="table-heading"><div><p className="eyebrow">Accessible data</p><h2 id="table-title">Hotspot terdeteksi</h2></div><p>{number.format(rows.length)} record sesuai filter</p></header>
      <div className="table-scroll">
        <table>
          <thead><tr>
            <th aria-sort={sort === "date" ? "descending" : "none"}>{sortHeader("Waktu", "date")}</th>
            <th>Provinsi</th><th>Tier</th>
            <th aria-sort={sort === "risk" ? "descending" : "none"}>{sortHeader("Risk score", "risk")}</th>
            <th aria-sort={sort === "frp" ? "descending" : "none"}>{sortHeader("FRP", "frp")}</th>
            <th>Confidence</th>
            <th aria-sort={sort === "distance" ? "ascending" : "none"}>{sortHeader("Jarak sekolah", "distance")}</th>
            <th>Sekolah 5 km</th><th><span className="sr-only">Aksi detail</span></th>
          </tr></thead>
          <tbody>{result.rows.map((row) => (
            <tr key={row.id}>
              <td className="mono-cell">{row.timestamp}</td><td>{row.province.replace("KALIMANTAN ", "Kalimantan ")}</td>
              <td><span className="tier-badge" data-tier={row.riskTier}>{row.riskTier}</span></td>
              <td className="numeric-cell">{row.riskScore.toFixed(3)}</td><td className="numeric-cell">{row.frp.toFixed(1)} MW</td>
              <td>{row.confidence}</td><td className="numeric-cell">{row.schoolDistanceKm.toFixed(2)} km</td>
              <td className="numeric-cell">{number.format(row.schoolsWithin5Km)}</td>
              <td><button className="table-detail-button" type="button" onClick={() => onSelect(row)}>Lihat hotspot</button></td>
            </tr>
          ))}</tbody>
        </table>
      </div>
      <nav className="table-pagination" aria-label="Paginasi tabel">
        <button type="button" disabled={result.page === 1} onClick={() => setPage(result.page - 1)}>Sebelumnya</button>
        <span aria-live="polite">Halaman {result.page} dari {result.pageCount}</span>
        <button type="button" disabled={result.page === result.pageCount} onClick={() => setPage(result.page + 1)}>Berikutnya</button>
      </nav>
    </section>
  );
}
