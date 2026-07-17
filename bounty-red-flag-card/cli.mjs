#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import process from "node:process";
import { assessBounty, FLAGS, RESPONSE_VALUES } from "./lib/assessment.mjs";

const HELP = `Bounty Red-Flag Card CLI

Run a deterministic, offline preflight for one software bounty.

Usage:
  node cli.mjs --input assessment.json
  node cli.mjs --input assessment.json --json
  cat assessment.json | node cli.mjs --input - --json
  node cli.mjs --sample
  node cli.mjs --list

Options:
  --input <path|->  Read an assessment from a JSON file or stdin.
  --json            Print the machine-readable report.
  --sample          Print a complete sample input.
  --list            List flag ids and the question each one answers.
  --help            Show this help.

Each answer must be one of: ${RESPONSE_VALUES.join(", ")}.
Missing answers become unknown and count as flags.
`;

const sample = {
  subject: {
    label: "Example public software bounty",
    source: "https://example.com/public-bounty"
  },
  answers: Object.fromEntries(FLAGS.map((flag) => [flag.id, "unknown"]))
};

function parseArguments(argv) {
  const result = { input: null, json: false, sample: false, list: false, help: false };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--input") {
      const value = argv[index + 1];
      if (!value || value.startsWith("--")) {
        throw new Error("--input requires a file path or - for stdin.");
      }
      result.input = value;
      index += 1;
    } else if (argument === "--json") {
      result.json = true;
    } else if (argument === "--sample") {
      result.sample = true;
    } else if (argument === "--list") {
      result.list = true;
    } else if (argument === "--help" || argument === "-h") {
      result.help = true;
    } else {
      throw new Error(`Unknown argument: ${argument}`);
    }
  }
  return result;
}

async function readStdin() {
  const chunks = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString("utf8");
}

function formatText(report) {
  const subject = report.subject.label ?? report.subject.source ?? "Unnamed bounty";
  const rows = [
    "BOUNTY RED-FLAG CARD",
    `Subject: ${subject}`,
    `Verdict: ${report.verdict.label} [${report.verdict.code}]`,
    `Flags: ${report.counts.totalFlagged}/12 · clear ${report.counts.clear} · present ${report.counts.flag} · unknown ${report.counts.unknown}`,
    `Hard stops: ${report.hardStops.length ? report.hardStops.join(", ") : "none"}`,
    "",
    report.verdict.meaning,
    report.verdict.nextStep,
    "",
    "Flagged or unknown facts:"
  ];

  const unresolved = report.results.filter((result) => result.flagged);
  if (unresolved.length === 0) {
    rows.push("- none");
  } else {
    for (const result of unresolved) {
      rows.push(`- ${result.id}: ${result.response}${result.hardStop ? " [HARD STOP]" : ""} — ${result.title}`);
    }
  }
  rows.push("", report.disclaimer);
  return `${rows.join("\n")}\n`;
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  const actionCount = [options.sample, options.list, options.help, Boolean(options.input)].filter(Boolean).length;
  if (actionCount > 1) {
    throw new Error("Choose one of --input, --sample, --list, or --help.");
  }

  if (options.help || actionCount === 0) {
    process.stdout.write(HELP);
    return;
  }
  if (options.sample) {
    process.stdout.write(`${JSON.stringify(sample, null, 2)}\n`);
    return;
  }
  if (options.list) {
    process.stdout.write(
      `${FLAGS.map((flag, index) => `${String(index + 1).padStart(2, "0")} ${flag.id}${flag.hardStop ? " [blocking]" : ""}\n   ${flag.question}`).join("\n")}\n`
    );
    return;
  }

  const source = options.input === "-" ? await readStdin() : await readFile(options.input, "utf8");
  let input;
  try {
    input = JSON.parse(source);
  } catch (error) {
    throw new Error(`Input is not valid JSON: ${error.message}`);
  }
  const report = assessBounty(input);
  process.stdout.write(options.json ? `${JSON.stringify(report, null, 2)}\n` : formatText(report));
}

main().catch((error) => {
  process.stderr.write(`Error: ${error.message}\n`);
  process.exitCode = 2;
});
