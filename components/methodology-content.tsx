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

export function MethodologyContent() {
  return (
    <article className="methodology-content">
      <header className="methodology-hero">
        <p className="eyebrow">Metodologi &amp; batas interpretasi</p>
        <h1>Bagaimana FIRELINE membaca hotspot FIRMS</h1>
        <p>Appendix ini membuka definisi data, feature engineering, eksperimen modeling historis, dan keterbatasan yang membatasi cara dashboard boleh dibaca.</p>
      </header>

      <section>
        <span className="method-index">01</span>
        <div><h2>Apa yang dideteksi FIRMS</h2>
          <p>Hotspot FIRMS adalah <strong>anomali termal</strong> yang dideteksi sensor satelit. Satu record bukan konfirmasi kebakaran di lapangan dan tetap memerlukan verifikasi.</p>
          <p><strong>Confidence</strong> menyatakan keyakinan algoritma deteksi. <strong>FRP</strong> adalah proxy energi termal yang diradiasikan, bukan ukuran luas terbakar.</p>
        </div>
      </section>

      <section>
        <span className="method-index">02</span>
        <div><h2>Data &amp; provenance</h2>
          <p>Dashboard operasional memakai <code>hotspots_with_risk_scores.csv</code> sebagai source of truth. Notebook analisis dan laporan temuan menjelaskan cleaning, feature engineering, evaluasi, dan limitation.</p>
          <ul>
            <li>NASA FIRMS VIIRS NOAA-20 menjadi dataset utama hotspot.</li>
            <li>Data sekolah dipakai untuk mengukur kedekatan exposure terhadap fasilitas pendidikan.</li>
            <li>Data populasi provinsi dan klimatologi historis memberi konteks tambahan pada analisis.</li>
          </ul>
        </div>
      </section>

      <section>
        <span className="method-index">03</span>
        <div><h2>Feature engineering &amp; risk score</h2>
          <pre>{`intensity = 0.60·minmax(log1p(FRP))
          + 0.20·minmax(brightness)
          + 0.20·minmax(confidence)

exposure  = 0.50·exp(-distance/5)
          + 0.30·minmax(log1p(schools_5km))
          + 0.20·minmax(log1p(prov_pop))

risk score = 0.45·intensity + 0.55·exposure`}</pre>
          <p>Tier Kritis, Tinggi, Sedang, dan Rendah berasal dari kuantil risk score dan menyatakan prioritas analitis, bukan status verifikasi kebakaran.</p>
        </div>
      </section>

      <details className="model-appendix">
        <summary><span>04</span><strong>Modeling appendix</strong><small>Opsional · eksperimen historis</small></summary>
        <div className="model-body">
          <p>Eksperimen historis HistGradientBoosting mencapai <strong>ROC-AUC 0.823</strong>, dibanding baseline persistence <strong>0.784</strong>. Time-series cross-validation menghasilkan rata-rata <strong>ROC-AUC 0.739 ± 0.058</strong>.</p>
          <p>Hasil ini mengukur diskriminasi hari surge pada data historis. Threshold operasi bergantung pada toleransi false alarm, dan periode uji berada pada musim rendah.</p>
          <p><code>daily_surge_panel_features.csv</code> memuat klimatologi, lag, rolling window, dan input eksperimen tersebut, tetapi tidak dimuat oleh dashboard runtime.</p>
        </div>
      </details>

      <section>
        <span className="method-index">05</span>
        <div><h2>Keterbatasan</h2>
          <ul className="limitation-list">
            <li><strong>School proxy.</strong> Sekolah digunakan sebagai proxy kedekatan permukiman dan fasilitas vital, bukan ukuran populasi lokal.</li>
            <li><strong>Kalimantan Utara.</strong> Dataset populasi tidak menyediakan poligon Kalimantan Utara yang terpisah, sehingga representasi exposure provinsi memiliki batas.</li>
            <li><strong>Weather context.</strong> Konteks cuaca memakai klimatologi historis, bukan cuaca real-time 2024–2026.</li>
            <li><strong>Field verification.</strong> Setiap hotspot tetap memerlukan verifikasi lapangan sebelum dinyatakan sebagai kebakaran.</li>
          </ul>
        </div>
      </section>
    </article>
  );
}
