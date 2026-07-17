# Bounty Red-Flag Card

A free, executable preflight tool for software bounties. Use it before claiming
work, opening a pull request, paying a bond, purchasing equipment, or sharing
credentials.

The browser app and CLI use the same 12 evidence states and decision rule.
Unknown evidence counts as a flag. The best possible result is **continue due
diligence**—never “safe,” “guaranteed,” or an automatic GO.

## Run the browser app

Open [`index.html`](index.html) directly in a current browser. It is one
self-contained file and works from `file://`; no server is required.

The app:

- keeps all inputs in the current browser tab;
- performs no network requests and has no telemetry;
- starts every fact at `unknown`;
- updates the verdict as evidence is marked `clear`, `present`, or `unknown`;
- copies or downloads a deterministic JSON report locally.

The optional bounty label and public source URL are included only in the local
report. They are not saved or transmitted.

## Run the CLI

Requires Node.js 20 or newer and no package installation.

```sh
node cli.mjs --help
node cli.mjs --input example-assessment.json
node cli.mjs --input example-assessment.json --json
cat example-assessment.json | node cli.mjs --input - --json
```

Generate a complete input template or list the checks:

```sh
node cli.mjs --sample > my-assessment.json
node cli.mjs --list
```

Input uses one of three values for each flag id:

```json
{
  "subject": {
    "label": "Issue #123 — parser fix",
    "source": "https://github.com/owner/repository/issues/123"
  },
  "answers": {
    "funding": "clear",
    "availability": "unknown",
    "competition": "flag"
  }
}
```

Missing answers become `unknown`. Invalid values and unknown flag ids fail with
exit code 2. Assessment verdicts are results, not process failures, so valid
assessments exit 0.

## Included

- `index.html` — self-contained interactive browser app
- `cli.mjs` — deterministic Node.js CLI
- `lib/assessment.mjs` — shared CLI decision engine and check definitions
- `example-assessment.json` — synthetic example input
- `BOUNTY-RED-FLAG-CARD.md` — portable Markdown card
- `BOUNTY-RED-FLAG-CARD.html` — script-free print-ready card
- `product-manifest.json` — product and reproducible-release metadata

## Print

Open `BOUNTY-RED-FLAG-CARD.html` and choose **Print**. That artifact remains a
separate, script-free one-page card with all styles inline and no fonts, images,
analytics, or network resources.

## Decision rule

Blocking unknowns or present blocking facts produce `HARD_STOP`. Otherwise:

| Flags marked or unknown | Preflight result |
| ---: | --- |
| 0–1 | `CONTINUE_DUE_DILIGENCE`—not a GO |
| 2–3 | `HOLD_VERIFY` |
| 4+ | `DEFAULT_NO_GO` |

The four tool-level blocking checks are funding, availability, upfront cost,
and private or production access. “Unknown” stays blocking until authoritative
evidence resolves it.

## Validate and build

```sh
npm test
npm run validate
npm run build:release
(cd dist && shasum -a 256 -c SHA256SUMS)
```

The release builder fixes timestamps, permissions, archive ownership metadata,
and file order so repeated builds are byte-identical. The manifest records the
exact source inventory and file hashes.

## Boundaries

This tool does not verify payment, eligibility, ownership, legality, security,
compliance, acceptance, or profitability. It does not claim a bounty, contact a
payer, execute third-party code, store evidence, or authorize access.

Do not use it to justify spam, speculative mass claims, unauthorized access,
deceptive submissions, or upfront spending you cannot independently justify.

## License

MIT. You may copy, print, adapt, redistribute, or resell the tool with the
included license notice. Purchase does not transfer exclusive rights. WrightOps
is an owner-authorized operating brand, not an incorporated-entity claim.
