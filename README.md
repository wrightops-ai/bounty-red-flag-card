# Bounty Red-Flag Card

Twelve checks to run before you claim a software bounty, write code, pay a
bond, buy equipment, or share access.

The card is free, offline, print-ready, and intentionally skeptical. Unknown
facts count as flags until authoritative evidence resolves them.

![Bounty Red-Flag Card showing the twelve preflight checks](docs/bounty-red-flag-card-preview.png)

## Use the free card

- [Open the Markdown card](bounty-red-flag-card/BOUNTY-RED-FLAG-CARD.md)
- [Open the print-ready HTML card](bounty-red-flag-card/BOUNTY-RED-FLAG-CARD.html)
- [Download the latest release](https://github.com/wrightops-ai/bounty-red-flag-card/releases/latest)
- [Verify release checksums](bounty-red-flag-card/dist/SHA256SUMS)

The HTML version is self-contained. It loads no scripts, fonts, images,
analytics, or network resources.

## What it checks

The preflight covers funding, availability, competition, acceptance criteria,
payment authority, upfront costs, access requests, third-party dependencies,
hidden scope, project health, rights and compliance, and expected hourly return.

The result is triage—not proof that a bounty is safe, legal, profitable, or
payable.

## Want an evidence-backed decision?

WrightOps offers a **Bounty GO/NO-GO Review for $49** after written scope
confirmation.

For one public software bounty or listing, the review delivers:

- an evidence-pinned funding and claimability check;
- competition, authority, acceptance, access, and rights findings;
- a bounded scope and expected-return estimate;
- a clear `GO`, `HOLD`, or `NO-GO` recommendation with unresolved facts named.

[Open the public GitHub request form (sign-in required)](https://github.com/wrightops-ai/bounty-red-flag-card/issues/new?template=bounty-review.yml),
inspect the [sample GO/HOLD/NO-GO report](docs/sample-bounty-go-no-go-review.md),
or read the [complete service and refund terms](docs/bounty-go-no-go-review.md).

Do not pay before WrightOps confirms the public target, deliverable, timing, and
fit in writing. Never put credentials, private code, customer data, email
addresses, wallet secrets, or payment information in a GitHub issue.

## Validate

Requires Node.js 20 or newer.

```sh
npm test
npm run validate
npm run build
```

The release builder fixes timestamps, permissions, archive ownership metadata,
and file order so independently repeated builds are byte-identical.

## Rights and boundaries

The card is MIT licensed. You may copy, adapt, redistribute, or sell it when
the copyright and permission notice are preserved. No purchase transfers
exclusive rights.

The card and paid review are not legal, tax, financial, security, privacy, or
compliance advice. They do not claim a bounty, contact a payer, execute
repository code, sign a wallet transaction, spend funds, or guarantee payment.

WrightOps is an owner-authorized operating brand. Zachary Wright is the
accountable human owner for paid scope, delivery, payment, and refunds.
