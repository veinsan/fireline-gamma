import Link from "next/link";
import { Suspense } from "react";
import { AppFrame } from "@/components/app-frame";
import { MethodologyContent } from "@/components/methodology-content";
import { DashboardReturnLink } from "@/components/methodology-link";

function ReturnLink() {
  return <Suspense fallback={<Link className="back-link" href="/">← Kembali ke dashboard</Link>}><DashboardReturnLink /></Suspense>;
}

export default function MethodologyPage() {
  return (
    <AppFrame>
      <main id="main" className="methodology-page">
        <ReturnLink />
        <MethodologyContent />
        <ReturnLink />
      </main>
    </AppFrame>
  );
}
