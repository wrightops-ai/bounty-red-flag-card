# Repository instructions

This repository maintains the free Bounty Red-Flag Card, a twelve-check
preflight for software bounty risk, in Markdown and self-contained HTML. It
also contains deterministic release tooling and public terms for a separate
Bounty GO/NO-GO Review.

- Keep changes small and preserve agreement between the Markdown and HTML card.
- Preserve exactly twelve stable checks unless the product scope is explicitly
  changed and both formats, validation, and release artifacts are updated
  together.
- Treat unknown facts as flags; never describe the card or review as legal,
  tax, financial, security, privacy, or compliance advice.
- Keep the HTML offline and print-ready. Do not add scripts, iframes, external
  fonts, images, analytics, or network-loaded resources.
- Keep release inputs free of secrets, private paths, credentials, private
  code, customer data, payment information, and wallet keys.
- Preserve deterministic release behavior, normalized archive metadata, the
  source inventory, and SHA-256 verification.
- Do not invent undocumented commands or claim that evidence was verified when
  it was not.

Use Node.js 20 or newer. From the repository root, verify changes with:

```sh
npm test
npm run validate
npm run build
```

Do not claim bounties, contact payers, execute third-party repository code,
publish releases, access credentials, sign wallet transactions, spend funds,
or make payment or refund decisions without explicit authorization from the
accountable human owner.
