type Summary = {
  total: number;
  priorityCount: number;
  medianFrp: number | null;
  within5KmPercent: number | null;
};

const number = new Intl.NumberFormat("id-ID");
const decimal = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 1 });
const date = new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" });

function formatDate(value: string) {
  return date.format(new Date(value + "T00:00:00Z"));
}

export function HistoricalNotice({ minDate, maxDate }: { minDate: string; maxDate: string }) {
  return (
    <aside className="historical-notice" aria-label="Batas interpretasi data">
      <span className="notice-mark" aria-hidden="true">HIST</span>
      <p>
        <strong>Snapshot historis {formatDate(minDate)}—{formatDate(maxDate)}.</strong>{" "}
        Hotspot FIRMS adalah anomali termal hasil deteksi satelit, bukan konfirmasi kebakaran lapangan.
      </p>
    </aside>
  );
}

export function SummaryRail({ summary, scope }: { summary: Summary; scope: string }) {
  const items = [
    ["Hotspot terdeteksi", number.format(summary.total), "records"],
    ["High / Critical", number.format(summary.priorityCount), "priority"],
    ["Median FRP", summary.medianFrp === null ? "—" : decimal.format(summary.medianFrp) + " MW", "intensity"],
    ["Dalam radius 5 km", summary.within5KmPercent === null ? "—" : decimal.format(summary.within5KmPercent) + "%", "exposure"],
  ];
  return (
    <section aria-label={"Ringkasan terfilter: " + scope} className="summary-rail">
      {items.map(([label, value, kind]) => (
        <div className="summary-item" data-summary={kind} key={label}>
          <span>{label}</span>
          <strong>{value}</strong>
        </div>
      ))}
    </section>
  );
}
