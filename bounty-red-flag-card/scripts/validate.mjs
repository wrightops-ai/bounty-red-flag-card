import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const [markdown, html, manifestText] = await Promise.all([
  readFile(new URL("BOUNTY-RED-FLAG-CARD.md", root), "utf8"),
  readFile(new URL("BOUNTY-RED-FLAG-CARD.html", root), "utf8"),
  readFile(new URL("product-manifest.json", root), "utf8")
]);
const manifest = JSON.parse(manifestText);

const markdownFlags = [...markdown.matchAll(/<a id="flag-([a-z-]+)"><\/a>/g)].map((match) => match[1]);
const htmlFlags = [...html.matchAll(/data-flag="([a-z-]+)"/g)].map((match) => match[1]);

assert.equal(markdownFlags.length, 12, "Markdown must contain exactly 12 identified flags.");
assert.equal(htmlFlags.length, 12, "HTML must contain exactly 12 identified flags.");
assert.deepEqual(htmlFlags, markdownFlags, "Markdown and HTML flag order must match.");
assert.match(html, /@media print/, "HTML must include print-specific CSS.");
assert.match(html, /@page\s*\{/, "HTML must define a print page.");
assert.doesNotMatch(html, /<(?:script|iframe|img)\b/i, "HTML must not embed scripts, frames, or images.");
assert.doesNotMatch(html, /(?:src|href)\s*=\s*["']https?:/i, "HTML must not load external resources.");
assert.equal(manifest.price.amount, 0, "The card must remain free.");
assert.deepEqual(manifest.dependencies, [], "The card must remain dependency-free.");
assert.equal(manifest.containsPersonalData, false, "The product must declare no personal data.");
assert.equal(manifest.license.spdx, "MIT", "The product must retain its MIT license.");
assert.equal(manifest.publisher.name, "WrightOps");
assert.equal(manifest.publisher.capacity, "Owner-authorized operating brand");
assert.equal(manifest.publisher.incorporatedEntityClaim, false);
assert.equal(manifest.provenance.classification, "owner-authorized first-party");
assert.equal(manifest.provenance.thirdPartyRuntimeContent, false);
assert.deepEqual(manifest.runtime.dependencies, []);
assert.equal(manifest.runtime.thirdPartyRuntimeContent, false);
assert.equal(manifest.rightsAndResale.resalePermitted, true);
assert.equal(manifest.rightsAndResale.exclusiveRightsTransferred, false);
assert.equal(manifest.rightsAndResale.thirdPartyContentIncluded, false);
assert.ok(manifest.release.sourceInventory.length > 0);
assert.deepEqual(
  new Set(manifest.release.archives.map((archive) => archive.format)),
  new Set(["zip", "tar.gz"])
);

console.log(
  "Validated 12 matching flags, print CSS, offline HTML, and free rights/provenance metadata."
);
