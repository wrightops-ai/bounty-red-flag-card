import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

test("Markdown contains twelve stable, unique checks", async () => {
  const markdown = await readFile(new URL("BOUNTY-RED-FLAG-CARD.md", root), "utf8");
  const ids = [...markdown.matchAll(/<a id="flag-([a-z-]+)"><\/a>/g)].map((match) => match[1]);
  assert.equal(ids.length, 12);
  assert.equal(new Set(ids).size, 12);
  assert.match(markdown, /0–1 \| Continue to full due diligence/);
  assert.match(markdown, /4\+ \| Default to \*\*NO-GO\*\*/);
});

test("HTML is standalone, print-ready, and structurally complete", async () => {
  const html = await readFile(new URL("BOUNTY-RED-FLAG-CARD.html", root), "utf8");
  assert.equal([...html.matchAll(/data-flag="/g)].length, 12);
  assert.match(html, /@page\s*\{[\s\S]*size: Letter portrait/);
  assert.match(html, /@media print/);
  assert.doesNotMatch(html, /<(?:script|iframe|img)\b/i);
  assert.doesNotMatch(html, /(?:src|href)\s*=\s*["']https?:/i);
});

test("manifest fixes the product price at free", async () => {
  const manifest = JSON.parse(await readFile(new URL("product-manifest.json", root), "utf8"));
  assert.equal(manifest.price.amount, 0);
  assert.equal(manifest.price.currency, "USD");
  assert.equal(manifest.telemetry, false);
  assert.equal(manifest.containsPersonalData, false);
  assert.deepEqual(manifest.license, { spdx: "MIT", file: "LICENSE" });
  assert.deepEqual(manifest.publisher, {
    name: "WrightOps",
    capacity: "Owner-authorized operating brand",
    incorporatedEntityClaim: false
  });
  assert.equal(manifest.provenance.classification, "owner-authorized first-party");
  assert.equal(manifest.runtime.thirdPartyRuntimeContent, false);
  assert.equal(manifest.rightsAndResale.resalePermitted, true);
  assert.equal(manifest.rightsAndResale.exclusiveRightsTransferred, false);
  assert.equal(manifest.release.manifestSelfReference.excludedFromSourceInventory, true);
  assert.equal(new Set(manifest.release.sourceInventory.map((item) => item.path)).size, manifest.release.sourceInventory.length);
  assert.equal(manifest.release.sourceInventory.some((item) => item.path === "product-manifest.json"), false);
});
