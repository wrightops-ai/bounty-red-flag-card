import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

test("sample review is explicitly synthetic and demonstrates a bounded decision", async () => {
  const sample = await readFile(
    new URL("docs/sample-bounty-go-no-go-review.md", root),
    "utf8",
  );

  assert.match(sample, /Synthetic example — not a customer result/);
  assert.match(sample, /\*\*HOLD\*\*/);
  assert.match(sample, /\$270\.00 ÷ 6\.0 hours = \$45\.00\/hour/);
  assert.match(sample, /not an expected hourly return/);
  assert.match(sample, /does not claim the bounty/);
});

test("README discloses the GitHub sign-in gate and links the sample", async () => {
  const readme = await readFile(new URL("README.md", root), "utf8");

  assert.match(readme, /public GitHub request form \(sign-in required\)/);
  assert.match(readme, /sample GO\/HOLD\/NO-GO report/);
  assert.match(readme, /Do not pay before WrightOps confirms/);
});

test("release notes use real Markdown paragraphs", async () => {
  const notes = await readFile(
    new URL("docs/release-notes-v1.0.0.md", root),
    "utf8",
  );

  assert.match(notes, /\n\nIncludes print-ready HTML/);
  assert.doesNotMatch(notes, /\\n/);
  assert.match(notes, /no bounty claim/);
});

test("README preview is a checked 1200 by 800 PNG", async () => {
  const readme = await readFile(new URL("README.md", root), "utf8");
  const preview = await readFile(
    new URL("docs/bounty-red-flag-card-preview.png", root),
  );

  assert.match(readme, /docs\/bounty-red-flag-card-preview\.png/);
  assert.equal(preview.subarray(1, 4).toString("ascii"), "PNG");
  assert.equal(preview.readUInt32BE(16), 1200);
  assert.equal(preview.readUInt32BE(20), 800);
});

test("GitHub Pages launcher routes to the executable app without scripting", async () => {
  const launcher = await readFile(new URL("index.html", root), "utf8");
  assert.match(launcher, /http-equiv="refresh" content="0; url=\.\/bounty-red-flag-card\/"/);
  assert.match(launcher, /href="\.\/bounty-red-flag-card\/"/);
  assert.doesNotMatch(launcher, /<script\b/i);
});
