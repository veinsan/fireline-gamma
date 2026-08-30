import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { MethodologyContent, dashboardReturnHref } from "@/components/methodology-content";

test("methodology distinguishes detection, intensity proxy, and field verification", () => {
  const html = renderToStaticMarkup(<MethodologyContent />);
  assert.match(html, /anomali termal/);
  assert.match(html, /bukan konfirmasi kebakaran/);
  assert.match(html, /FRP[\s\S]*proxy/);
  assert.match(html, /ROC-AUC/);
});

test("methodology return link preserves only dashboard filters", () => {
  const href = dashboardReturnHref(new URLSearchParams("from=2024-08-01&tier=Kritis&junk=x"));
  assert.equal(href, "/?from=2024-08-01&tier=Kritis");
});
