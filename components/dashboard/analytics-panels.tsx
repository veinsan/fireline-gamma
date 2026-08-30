"use client";

import {
  Bar, BarChart, CartesianGrid, LabelList, Legend, Line, LineChart,
  ReferenceArea, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { aggregateExposure, aggregateMonthly, aggregateProvinceTiers } from "@/lib/fireline/analytics";
import type { Hotspot } from "@/lib/fireline/types";

const tierColors = { Kritis: "#8F1D2C", Tinggi: "#C4472D", Sedang: "#B97812", Rendah: "#267266" };
const monthFormat = new Intl.DateTimeFormat("id-ID", { month: "short", year: "2-digit", timeZone: "UTC" });
const number = new Intl.NumberFormat("id-ID");

function median(values: number[]) {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

function formatMonth(value: string) {
  return monthFormat.format(new Date(value + "-01T00:00:00Z"));
}

export function AnalyticsPanels({ rows }: { rows: Hotspot[] }) {
  const monthly = aggregateMonthly(rows);
  const exposure = aggregateExposure(rows);
  const provinces = aggregateProvinceTiers(rows).map((row) => ({ ...row, shortProvince: row.province.replace("KALIMANTAN ", "") }));
  const peak = monthly.reduce((best, point) => point.count > best.count ? point : best, monthly[0]);
  const dryYears = [...new Set(monthly.map((point) => point.month.slice(0, 4)))];
  const scoreSummary = {
    intensity: median(rows.map((row) => row.intensityScore)),
    exposure: median(rows.map((row) => row.exposureScore)),
    risk: median(rows.map((row) => row.riskScore)),
    school: median(rows.map((row) => row.schoolDistanceKm)),
  };

  return (
    <div className="analytics-grid">
      <section className="analysis-card analysis-card-wide" aria-labelledby="temporal-title">
        <header className="analysis-heading"><div><p className="eyebrow">01 · Temporal evidence</p><h2 id="temporal-title">Pola temporal &amp; musim</h2></div><div className="insight-callout"><span>Puncak filter</span><strong>{formatMonth(peak.month)}</strong><small>{number.format(peak.count)} hotspot</small></div></header>
        <p className="analysis-copy">Area amber menandai Juli–Oktober untuk memberi konteks musim kering, bukan prediksi kejadian.</p>
        <p className="sr-only">Bulan puncak pada filter ini adalah {peak.month} dengan {peak.count} hotspot terdeteksi.</p>
        <div className="chart-frame">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthly} margin={{ top: 12, right: 18, left: -4, bottom: 8 }}>
              <CartesianGrid stroke="#D7E0DE" vertical={false} />
              {dryYears.map((year) => <ReferenceArea key={year} x1={year + "-07"} x2={year + "-10"} fill="#B97812" fillOpacity={0.09} />)}
              <XAxis dataKey="month" minTickGap={28} tickFormatter={formatMonth} tick={{ fontSize: 11, fill: "#60706D" }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#60706D" }} axisLine={false} tickLine={false} width={48} />
              <Tooltip labelFormatter={(value) => formatMonth(String(value))} formatter={(value) => [number.format(Number(value)), "Hotspot terdeteksi"]} />
              <Line dataKey="count" stroke="#172826" strokeWidth={2.4} dot={false} activeDot={{ r: 4, fill: "#C4472D" }} isAnimationActive={false} name="Hotspot" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="analysis-card" aria-labelledby="exposure-title">
        <header className="analysis-heading"><div><p className="eyebrow">02 · Human context</p><h2 id="exposure-title">Exposure terhadap fasilitas pendidikan</h2></div></header>
        <p className="analysis-copy">Sekolah dipakai sebagai proxy kedekatan permukiman dan fasilitas vital, bukan ukuran populasi lokal.</p>
        <div className="inline-stat"><span>Median jarak sekolah</span><strong>{scoreSummary.school?.toFixed(2) ?? "—"} km</strong></div>
        <p className="sr-only">Distribusi jarak hotspot terhadap sekolah terdekat dalam empat kelompok jarak.</p>
        <div className="chart-frame chart-frame-compact">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={exposure} margin={{ top: 22, right: 8, left: -12, bottom: 2 }}>
              <CartesianGrid stroke="#E0E7E5" vertical={false} /><XAxis dataKey="label" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} /><YAxis allowDecimals={false} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(value) => [number.format(Number(value)), "Hotspot"]} />
              <Bar dataKey="count" fill="#267266" radius={[5,5,0,0]} isAnimationActive={false}><LabelList dataKey="count" position="top" formatter={(value) => number.format(Number(value))} style={{ fontSize: 10, fill: "#425451" }} /></Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="analysis-card" aria-labelledby="province-title">
        <header className="analysis-heading"><div><p className="eyebrow">03 · Regional mix</p><h2 id="province-title">Komposisi prioritas per provinsi</h2></div></header>
        <p className="analysis-copy">Komposisi tier berubah mengikuti seluruh filter aktif dan menggunakan risk score yang sudah diekspor notebook.</p>
        <p className="sr-only">Perbandingan jumlah hotspot Kritis, Tinggi, Sedang, dan Rendah per provinsi.</p>
        <div className="chart-frame chart-frame-compact">
          <ResponsiveContainer width="100%" height={270}>
            <BarChart data={provinces} margin={{ top: 12, right: 8, left: -12, bottom: 18 }}>
              <CartesianGrid stroke="#E0E7E5" vertical={false} /><XAxis dataKey="shortProvince" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} /><YAxis allowDecimals={false} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip /><Legend wrapperStyle={{ fontSize: 11 }} />
              {(Object.keys(tierColors) as Array<keyof typeof tierColors>).map((tier) => <Bar key={tier} dataKey={tier} stackId="risk" fill={tierColors[tier]} isAnimationActive={false} />)}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="analysis-card feature-card" aria-labelledby="feature-title">
        <header className="analysis-heading"><div><p className="eyebrow">04 · Explainability</p><h2 id="feature-title">Feature engineering</h2></div></header>
        <ol className="feature-pipeline">
          <li><span>Intensity</span><p>FRP + brightness + confidence</p><strong>intensity score</strong></li>
          <li><span>Exposure</span><p>Jarak sekolah + sekolah 5 km + populasi provinsi</p><strong>exposure score</strong></li>
          <li><span>Priority</span><p>45% intensity + 55% exposure</p><strong>risk score → risk tier</strong></li>
        </ol>
        <dl className="score-median-grid">
          <div><dt>Median intensity</dt><dd>{scoreSummary.intensity?.toFixed(3) ?? "—"}</dd></div>
          <div><dt>Median exposure</dt><dd>{scoreSummary.exposure?.toFixed(3) ?? "—"}</dd></div>
          <div><dt>Median risk score</dt><dd>{scoreSummary.risk?.toFixed(3) ?? "—"}</dd></div>
        </dl>
      </section>
    </div>
  );
}
