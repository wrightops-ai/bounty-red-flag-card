import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { assessBounty, FLAGS } from "../lib/assessment.mjs";

const root = new URL("../", import.meta.url);
const [markdown, printHtml, appHtml, packageText, manifestText] = await Promise.all([
  readFile(new URL("BOUNTY-RED-FLAG-CARD.md", root), "utf8"),
  readFile(new URL("BOUNTY-RED-FLAG-CARD.html", root), "utf8"),
  readFile(new URL("index.html", root), "utf8"),
  readFile(new URL("package.json", root), "utf8"),
  readFile(new URL("product-manifest.json", root), "utf8")
]);
const manifest = JSON.parse(manifestText);
const packageJson = JSON.parse(packageText);

const engineFlags = FLAGS.map((flag) => flag.id);
const markdownFlags = [...markdown.matchAll(/<a id="flag-([a-z-]+)"><\/a>/g)].map((match) => match[1]);
const printFlags = [...printHtml.matchAll(/data-flag="([a-z-]+)"/g)].map((match) => match[1]);
const appFlags = [...appHtml.matchAll(/data-flag-id="([a-z-]+)"/g)].map((match) => match[1]);

assert.equal(engineFlags.length, 12, "Decision engine must define exactly 12 flags.");
assert.deepEqual(markdownFlags, engineFlags, "Markdown flag order must match the decision engine.");
assert.deepEqual(printFlags, engineFlags, "Print HTML flag order must match the decision engine.");
assert.deepEqual(appFlags, engineFlags, "Interactive app flag order must match the decision engine.");

assert.match(printHtml, /@media print/, "Print HTML must include print-specific CSS.");
assert.match(printHtml, /@page\s*\{/, "Print HTML must define a print page.");
assert.doesNotMatch(printHtml, /<(?:script|iframe|img)\b/i, "Print HTML must remain script, frame, and image free.");
assert.doesNotMatch(printHtml, /(?:src|href)\s*=\s*["']https?:/i, "Print HTML must not load external resources.");

assert.equal([...appHtml.matchAll(/type="radio"/g)].length, 36, "App must expose three states for all 12 checks.");
assert.equal([...appHtml.matchAll(/value="unknown" checked/g)].length, 12, "Every app check must default to unknown.");
assert.equal([...appHtml.matchAll(/data-hard-stop="true"/g)].length, 4, "App must identify the four blocking checks.");
assert.match(appHtml, /<script>[\s\S]+<\/script>/, "App must include executable inline logic.");
assert.match(appHtml, /aria-live="polite"/, "App result must be announced to assistive technology.");
assert.match(appHtml, /prefers-reduced-motion/, "App must respect reduced-motion preferences.");
assert.doesNotMatch(appHtml, /<(?:iframe|img)\b/i, "App must not embed frames or images.");
assert.doesNotMatch(appHtml, /<link\b[^>]+rel=["']stylesheet["']/i, "App must not load external stylesheets.");
assert.match(appHtml, /<link\b[^>]+rel=["']icon["'][^>]+href=["']data:/i, "App favicon must be embedded.");
assert.doesNotMatch(appHtml, /<(?:script|source)\b[^>]+src\s*=/i, "App must not load external scripts or media.");
assert.doesNotMatch(appHtml, /\b(?:fetch|XMLHttpRequest|WebSocket|EventSource|sendBeacon)\s*\(/, "App must make no network requests.");
assert.doesNotMatch(appHtml, /\b(?:localStorage|sessionStorage|document\.cookie|indexedDB)\b/, "App must not persist user inputs.");

const emptyReport = assessBounty({});
assert.equal(emptyReport.counts.unknown, 12);
assert.equal(emptyReport.verdict.code, "HARD_STOP");
assert.equal(Object.prototype.hasOwnProperty.call(emptyReport, "assessedAt"), false, "Reports must not add nondeterministic timestamps.");

assert.equal(packageJson.version, manifest.version, "Package and manifest versions must match.");
assert.equal(packageJson.bin["bounty-red-flag-card"], "./cli.mjs", "Package must expose the CLI entry point.");
assert.equal(manifest.version, "1.1.0");
assert.equal(manifest.price.amount, 0, "The card must remain free.");
assert.deepEqual(manifest.dependencies, [], "The card must remain dependency-free.");
assert.equal(manifest.telemetry, false, "The product must remain telemetry-free.");
assert.equal(manifest.containsPersonalData, false, "The product must declare no bundled personal data.");
assert.equal(manifest.runtime.networkRequired, false, "Runtime must remain offline.");
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
assert.equal(manifest.release.archives.every((archive) => archive.name.includes("v1.1.0")), true);

console.log(
  "Validated 12 aligned checks, runnable offline app, deterministic CLI engine, and free rights/provenance metadata."
);
