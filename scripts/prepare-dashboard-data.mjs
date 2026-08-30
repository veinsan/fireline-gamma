import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { prepareDataset } from "./lib/hotspots.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const source = resolve(root, "data/dashboard/hotspots_with_risk_scores.csv");
const output = resolve(root, "public/data");
const prepared = prepareDataset(await readFile(source, "utf8"));

await mkdir(output, { recursive: true });
await writeFile(resolve(output, "metadata.json"), JSON.stringify(prepared.metadata));
for (const [year, rows] of prepared.partitions) {
  await writeFile(resolve(output, "hotspots-" + year + ".json"), JSON.stringify(rows));
}
console.log("Prepared " + prepared.metadata.recordCount + " FIRMS hotspot records");
