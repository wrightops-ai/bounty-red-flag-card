# Coding-agent instructions

This repository publishes the free Bounty Red-Flag Card in Markdown and
self-contained HTML, plus deterministic release archives. Keep the card a
skeptical due-diligence aid; do not present it as proof that a bounty is safe,
legal, profitable, payable, secure, or compliant.

## Repository map

- `bounty-red-flag-card/` contains the product, its validator, tests, manifest,
  license, and generated `dist/` release files.
- `docs/` contains the preview, release notes, service terms, and synthetic
  sample review.
- `release-builder.mjs` builds and verifies deterministic ZIP and tar.gz
  outputs.
- `.github/ISSUE_TEMPLATE/` contains the public Bounty GO/NO-GO Review intake.

## Verification

Use Node.js 20 or newer. From the repository root, run:

```sh
npm test
npm run validate
npm run build
```

The GitHub Actions workflow also verifies `bounty-red-flag-card/dist/SHA256SUMS`
after those commands.

## Boundaries

Preserve the offline HTML boundary: no scripts, fonts, images, analytics, or
network resources. Do not add credentials, private code, customer data, email
addresses, payment information, or wallet secrets to public files or issues.
Do not claim bounties, contact payers, execute third-party repository code,
sign wallet transactions, spend funds, publish releases, or make payment or
refund decisions without the accountable human owner's explicit authorization.

Keep the MIT license notices and do not imply that purchase transfers exclusive
rights. Unknown or unsupported facts must remain unknown.
