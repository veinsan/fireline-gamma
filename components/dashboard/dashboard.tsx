"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { applyFilters, deriveSummary } from "@/lib/fireline/analytics";
import { loadDashboardData } from "@/lib/fireline/data";
import { parseFilters, serializeFilters } from "@/lib/fireline/url-state";
import type { DashboardData, FilterState, Hotspot, RiskLens } from "@/lib/fireline/types";
import { FilterBar } from "./filter-bar";
import { HistoricalNotice, SummaryRail } from "./summary-rail";
import { MapWorkspace } from "./map-workspace";
import { AnalyticsPanels } from "./analytics-panels";
import { HotspotTable } from "./hotspot-table";
import styles from "./dashboard.module.css";

export function Dashboard() {
  const params = useSearchParams();
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);
  const [lens, setLens] = useState<RiskLens>("priority");
  const [selected, setSelected] = useState<Hotspot | null>(null);
  const query = params.toString();

  useEffect(() => {
    const controller = new AbortController();
    loadDashboardData(controller.signal)
      .then(setData)
      .catch((reason: unknown) => {
        if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : "Data tidak dapat dimuat");
      });
    return () => controller.abort();
  }, [retry]);

  const filters = useMemo(() => data ? parseFilters(new URLSearchParams(query), data.metadata) : null, [data, query]);
  const rows = useMemo(() => data && filters ? applyFilters(data.hotspots, filters) : [], [data, filters]);
  const summary = useMemo(() => deriveSummary(rows), [rows]);
  const selectedVisible = selected && rows.some((row) => row.id === selected.id) ? selected : null;

  function updateFilters(next: FilterState) {
    const serialized = serializeFilters(next).toString();
    router.replace(serialized ? "/?" + serialized : "/", { scroll: false });
  }

  if (error) {
    return (
      <section className={styles.recovery} role="alert">
        <p className={styles.kicker}>Data boundary</p>
        <h1>Data historis belum berhasil dimuat.</h1>
        <p>{error}</p>
        <button className={styles.primaryButton} type="button" onClick={() => { setError(null); setData(null); setRetry((value) => value + 1); }}>Coba lagi</button>
      </section>
    );
  }
  if (!data || !filters) return <div className={styles.skeleton} aria-label="Memuat data historis" />;

  const reset = () => updateFilters(parseFilters(new URLSearchParams(), data.metadata));
  const scope = filters.province === "all" ? "Semua provinsi" : filters.province.replace("KALIMANTAN ", "Kalimantan ");

  return (
    <div className={styles.dashboard}>
      <header className={styles.thesis}>
        <div>
          <p className={styles.kicker}>Risk Command Canvas · Historical intelligence</p>
          <h1>Prioritas bukan sekadar sinyal termal terbesar, tetapi indikasi ancaman terbesar bagi manusia.</h1>
        </div>
        <p className={styles.thesisNote}>Eksplorasi 61 ribu lebih deteksi FIRMS melalui tiga lensa: prioritas, intensity, dan exposure.</p>
      </header>
      <HistoricalNotice minDate={data.metadata.minDate} maxDate={data.metadata.maxDate} />
      <FilterBar filters={filters} metadata={data.metadata} onChange={updateFilters} onReset={reset} />
      <SummaryRail summary={summary} scope={scope} />
      {rows.length === 0 ? (
        <section className={styles.empty}>
          <p className={styles.kicker}>Tidak ada hasil</p>
          <h2>Tidak ada hotspot pada kombinasi filter ini.</h2>
          <p>Ubah tanggal atau longgarkan filter wilayah dan karakteristik deteksi.</p>
          <button className={styles.primaryButton} type="button" onClick={reset}>Reset filter</button>
        </section>
      ) : (
        <>
          <MapWorkspace rows={rows} lens={lens} selected={selectedVisible} onLensChange={setLens} onSelect={setSelected} />
          <AnalyticsPanels rows={rows} />
          <HotspotTable rows={rows} onSelect={setSelected} />
        </>
      )}
    </div>
  );
}
