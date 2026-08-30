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
