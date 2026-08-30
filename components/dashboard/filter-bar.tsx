"use client";

import { useRef, useState } from "react";
import { parseFilters } from "@/lib/fireline/url-state";
import type { DashboardMetadata, FilterState } from "@/lib/fireline/types";
import styles from "./dashboard.module.css";

interface FilterBarProps {
  filters: FilterState;
  metadata: DashboardMetadata;
  onChange(next: FilterState): void;
  onReset(): void;
}

function FilterControls({
  value,
  metadata,
  onChange,
}: {
  value: FilterState;
  metadata: DashboardMetadata;
  onChange(next: FilterState): void;
}) {
  const set = <K extends keyof FilterState>(key: K, next: FilterState[K]) =>
    onChange({ ...value, [key]: next });

  return (
    <div className={styles.controls}>
      <label><span>Dari</span><input type="date" min={metadata.minDate} max={value.to} value={value.from} onChange={(e) => set("from", e.target.value)} /></label>
      <label><span>Sampai</span><input type="date" min={value.from} max={metadata.maxDate} value={value.to} onChange={(e) => set("to", e.target.value)} /></label>
      <label><span>Provinsi</span><select value={value.province} onChange={(e) => set("province", e.target.value)}>
        <option value="all">Semua provinsi</option>
        {metadata.provinces.map((province) => <option key={province} value={province}>{province.replace("KALIMANTAN ", "Kalimantan ")}</option>)}
      </select></label>
      <label><span>Risk tier</span><select value={value.tier} onChange={(e) => set("tier", e.target.value as FilterState["tier"])}>
        <option value="all">Semua tier</option>
        {(["Kritis", "Tinggi", "Sedang", "Rendah"] as const).map((tier) => <option key={tier} value={tier}>{tier}</option>)}
      </select></label>
      <label><span>Confidence</span><select value={value.confidence} onChange={(e) => set("confidence", e.target.value as FilterState["confidence"])}>
        <option value="all">Semua confidence</option>
        {(["Low", "Nominal", "High"] as const).map((confidence) => <option key={confidence} value={confidence}>{confidence}</option>)}
      </select></label>
      <label><span>Waktu</span><select value={value.dayNight} onChange={(e) => set("dayNight", e.target.value as FilterState["dayNight"])}>
        <option value="all">Siang &amp; malam</option><option value="D">Siang</option><option value="N">Malam</option>
      </select></label>
    </div>
  );
}

export function FilterBar({ filters, metadata, onChange, onReset }: FilterBarProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [draft, setDraft] = useState(filters);
  const activeCount = [filters.province, filters.tier, filters.confidence, filters.dayNight].filter((value) => value !== "all").length +
    Number(filters.from !== metadata.minDate || filters.to !== metadata.maxDate);

  return (
    <section className={styles.filterBar} aria-label="Filter data hotspot">
      <div className={styles.desktopFilters}>
        <FilterControls value={filters} metadata={metadata} onChange={onChange} />
        <button className={styles.resetButton} type="button" onClick={onReset}>Reset</button>
      </div>
      <button type="button" className={styles.mobileFilterButton} onClick={() => { setDraft(filters); dialog.current?.showModal(); }}>
        Filter data {activeCount > 0 ? <span aria-label={`${activeCount} filter aktif`}>{activeCount}</span> : null}
      </button>
      <dialog ref={dialog} className={styles.filterDialog} onClose={() => setDraft(filters)}>
        <form onSubmit={(event) => {
          event.preventDefault();
          onChange(draft);
          dialog.current?.close();
        }}>
          <div className={styles.dialogHeader}><div><p className={styles.kicker}>Scope data</p><h2>Filter data</h2></div><button type="button" aria-label="Tutup filter" onClick={() => dialog.current?.close()}>×</button></div>
          <FilterControls value={draft} metadata={metadata} onChange={setDraft} />
          <div className={styles.dialogActions}>
            <button type="button" className={styles.resetButton} onClick={() => setDraft(parseFilters(new URLSearchParams(), metadata))}>Reset filter</button>
            <button type="button" onClick={() => dialog.current?.close()}>Batal</button>
            <button type="submit" className={styles.primaryButton}>Terapkan filter</button>
          </div>
        </form>
      </dialog>
    </section>
  );
}
