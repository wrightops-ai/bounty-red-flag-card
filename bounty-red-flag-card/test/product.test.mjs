import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { assessBounty, FLAGS } from "../lib/assessment.mjs";

const root = new URL("../", import.meta.url);
const ids = FLAGS.map((flag) => flag.id);
const clearAnswers = Object.fromEntries(ids.map((id) => [id, "clear"]));

test("all published formats contain the same twelve stable checks", async () => {
  const [markdown, printHtml, appHtml] = await Promise.all([
    readFile(new URL("BOUNTY-RED-FLAG-CARD.md", root), "utf8"),
    readFile(new URL("BOUNTY-RED-FLAG-CARD.html", root), "utf8"),
    readFile(new URL("index.html", root), "utf8")
  ]);
  const markdownIds = [...markdown.matchAll(/<a id="flag-([a-z-]+)"><\/a>/g)].map((match) => match[1]);
  const printIds = [...printHtml.matchAll(/data-flag="([a-z-]+)"/g)].map((match) => match[1]);
  const appIds = [...appHtml.matchAll(/data-flag-id="([a-z-]+)"/g)].map((match) => match[1]);

  assert.deepEqual(markdownIds, ids);
  assert.deepEqual(printIds, ids);
  assert.deepEqual(appIds, ids);
  assert.equal(new Set(ids).size, 12);
  assert.match(markdown, /0–1 \| Continue to full due diligence/);
  assert.match(markdown, /4\+ \| Default to \*\*NO-GO\*\*/);
});

test("print HTML remains script-free, standalone, and print-ready", async () => {
  const html = await readFile(new URL("BOUNTY-RED-FLAG-CARD.html", root), "utf8");
  assert.equal([...html.matchAll(/data-flag="/g)].length, 12);
  assert.match(html, /@page\s*\{[\s\S]*size: Letter portrait/);
  assert.match(html, /@media print/);
  assert.doesNotMatch(html, /<(?:script|iframe|img)\b/i);
  assert.doesNotMatch(html, /(?:src|href)\s*=\s*["']https?:/i);
});

test("interactive app is a runnable, offline, accessible assessment", async () => {
  const html = await readFile(new URL("index.html", root), "utf8");
  assert.equal([...html.matchAll(/data-flag-id="/g)].length, 12);
  assert.equal([...html.matchAll(/type="radio"/g)].length, 36);
  assert.equal([...html.matchAll(/value="unknown" checked/g)].length, 12);
  assert.equal([...html.matchAll(/data-hard-stop="true"/g)].length, 4);
  assert.match(html, /<script>[\s\S]+currentReport\(\)[\s\S]+<\/script>/);
  assert.match(html, /aria-live="polite"/);
  assert.match(html, /@media \(prefers-reduced-motion: reduce\)/);
  assert.doesNotMatch(html, /<(?:iframe|img)\b/i);
  assert.doesNotMatch(html, /<link\b[^>]+rel=["']stylesheet["']/i);
  assert.match(html, /<link\b[^>]+rel=["']icon["'][^>]+href=["']data:/i);
  assert.doesNotMatch(html, /<(?:script|source)\b[^>]+src\s*=/i);
  assert.doesNotMatch(html, /\b(?:fetch|XMLHttpRequest|WebSocket|EventSource|sendBeacon)\s*\(/);
  assert.doesNotMatch(html, /\b(?:localStorage|sessionStorage|document\.cookie|indexedDB)\b/);
  assert.doesNotMatch(html, /<form\b/i);
  assert.doesNotMatch(html, /\b(?:analytics|gtag|segment|mixpanel|hotjar)\s*\(/i);
});

test("interactive app routes high-intent users through the complete offer page", async () => {
  const html = await readFile(new URL("index.html", root), "utf8");

  assert.match(html, /https:\/\/zachwright\.xyz\/bounty-go-no-go-review\//);
  assert.match(html, />See the \$49 review and request scope</);
  assert.doesNotMatch(html, /issues\/new\?template=bounty-review\.yml/);
});

test("decision engine treats missing evidence as flagged and blocking where required", () => {
  const report = assessBounty({});
  assert.deepEqual(report.counts, { clear: 0, flag: 0, unknown: 12, totalFlagged: 12 });
  assert.deepEqual(report.hardStops, ["funding", "availability", "upfront-cost", "access"]);
  assert.equal(report.verdict.code, "HARD_STOP");
});

test("decision engine applies every non-blocking count band", () => {
  const one = assessBounty({ answers: { ...clearAnswers, competition: "unknown" } });
  const three = assessBounty({
    answers: { ...clearAnswers, competition: "unknown", scope: "flag", economics: "unknown" }
  });
  const four = assessBounty({
    answers: {
      ...clearAnswers,
      competition: "unknown",
      acceptance: "flag",
      scope: "unknown",
      economics: "flag"
    }
  });
  assert.equal(one.verdict.code, "CONTINUE_DUE_DILIGENCE");
  assert.equal(three.verdict.code, "HOLD_VERIFY");
  assert.equal(four.verdict.code, "DEFAULT_NO_GO");
  assert.doesNotMatch(JSON.stringify(one), /"(?:SAFE|GO)"/);
});

test("decision engine rejects invalid answer values and unknown ids", () => {
  assert.throws(() => assessBounty({ answers: { funding: "yes" } }), /must be one of/);
  assert.throws(() => assessBounty({ answers: { invented: "clear" } }), /Unknown flag id/);
});

test("CLI emits deterministic JSON for the synthetic example", () => {
  const cliPath = new URL("cli.mjs", root);
  const inputPath = new URL("example-assessment.json", root);
  const args = [cliPath.pathname, "--input", inputPath.pathname, "--json"];
  const first = spawnSync(process.execPath, args, { encoding: "utf8" });
  const second = spawnSync(process.execPath, args, { encoding: "utf8" });
  assert.equal(first.status, 0, first.stderr);
  assert.equal(second.status, 0, second.stderr);
  assert.equal(first.stdout, second.stdout);
  const report = JSON.parse(first.stdout);
  assert.equal(report.verdict.code, "HOLD_VERIFY");
  assert.deepEqual(report.counts, { clear: 9, flag: 0, unknown: 3, totalFlagged: 3 });
  assert.equal(report.hardStops.length, 0);
});

test("manifest fixes the product at free and declares executable formats", async () => {
  const manifest = JSON.parse(await readFile(new URL("product-manifest.json", root), "utf8"));
  assert.equal(manifest.version, "1.1.0");
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
  assert.equal(manifest.runtime.networkRequired, false);
  assert.deepEqual(manifest.runtime.dependencies, []);
  assert.ok(manifest.formats.includes("Interactive offline HTML"));
  assert.ok(manifest.formats.includes("Node.js CLI"));
  assert.equal(manifest.rightsAndResale.resalePermitted, true);
  assert.equal(manifest.rightsAndResale.exclusiveRightsTransferred, false);
  assert.equal(manifest.release.manifestSelfReference.excludedFromSourceInventory, true);
  assert.equal(new Set(manifest.release.sourceInventory.map((item) => item.path)).size, manifest.release.sourceInventory.length);
  assert.equal(manifest.release.sourceInventory.some((item) => item.path === "product-manifest.json"), false);
  assert.equal(manifest.release.archives.every((archive) => archive.name.includes("v1.1.0")), true);
});
