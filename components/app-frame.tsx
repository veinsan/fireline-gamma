import Link from "next/link";
import type { PropsWithChildren } from "react";

export function AppFrame({ children }: PropsWithChildren) {
  return (
    <>
      <a className="skip-link" href="#main">Lewati ke konten utama</a>
      <header className="app-header">
        <Link className="wordmark" href="/" aria-label="FIRELINE dashboard">FIRE—LINE</Link>
        <span className="snapshot-label">Snapshot historis</span>
        <Link className="method-link" href="/methodology">Metodologi</Link>
      </header>
      {children}
    </>
  );
}
