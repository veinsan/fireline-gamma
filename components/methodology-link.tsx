"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { dashboardReturnHref } from "./methodology-content";

export function MethodologyLink() {
  const query = useSearchParams().toString();
  return <Link className="method-link" href={query ? "/methodology?" + query : "/methodology"}>Metodologi</Link>;
}

export function DashboardReturnLink() {
  const href = dashboardReturnHref(new URLSearchParams(useSearchParams().toString()));
  return <Link className="back-link" href={href}>← Kembali ke dashboard</Link>;
}
