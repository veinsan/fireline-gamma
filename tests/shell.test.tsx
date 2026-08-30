import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { AppFrame } from "@/components/app-frame";

test("shell identifies a historical FIRMS dashboard and exposes navigation", () => {
  const html = renderToStaticMarkup(<AppFrame><main id="main">Isi</main></AppFrame>);
  assert.match(html, /FIRELINE/);
  assert.match(html, /Snapshot historis/);
  assert.match(html, /Metodologi/);
  assert.match(html, /Lewati ke konten utama/);
});
