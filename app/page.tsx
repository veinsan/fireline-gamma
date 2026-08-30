import Link from "next/link";
import { Suspense } from "react";
import { AppFrame } from "@/components/app-frame";
import { Dashboard } from "@/components/dashboard/dashboard";
import { MethodologyLink } from "@/components/methodology-link";

export default function Page() {
  return (
    <AppFrame methodologyLink={<Suspense fallback={<Link className="method-link" href="/methodology">Metodologi</Link>}><MethodologyLink /></Suspense>}>
      <main id="main">
        <Suspense fallback={<div className="dashboard-skeleton" aria-label="Memuat dashboard" />}>
          <Dashboard />
        </Suspense>
      </main>
    </AppFrame>
  );
}
