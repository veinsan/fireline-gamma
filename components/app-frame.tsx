import Link from "next/link";
import type { PropsWithChildren, ReactNode } from "react";

export function AppFrame({ children, methodologyLink }: PropsWithChildren<{ methodologyLink?: ReactNode }>) {
  return (
    <>
      <a className="skip-link" href="#main">Lewati ke konten utama</a>
      <header className="app-header">
        <Link className="wordmark" href="/" aria-label="FIRELINE dashboard">FIRE—LINE</Link>
        <span className="snapshot-label"><i aria-hidden="true" /> Snapshot historis</span>
        {methodologyLink ?? <Link className="method-link" href="/methodology">Metodologi</Link>}
      </header>
      {children}
    </>
  );
}
