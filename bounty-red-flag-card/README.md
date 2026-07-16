# Bounty Red-Flag Card

A free, one-page preflight check for software bounties. Use it before claiming work, opening a pull request, paying a bond, purchasing equipment, or sharing credentials.

## Included

- `BOUNTY-RED-FLAG-CARD.md` — portable Markdown version
- `BOUNTY-RED-FLAG-CARD.html` — self-contained print-ready version
- `product-manifest.json` — product metadata
- Offline validation tests

## Use

1. Open the issue, listing, repository, and payout rules.
2. Mark every flag that is present or cannot be disproved from authoritative evidence.
3. Apply the decision rule at the bottom of the card.
4. Save the evidence links separately; the card is a preflight aid, not an evidence archive.

## Print

Open `BOUNTY-RED-FLAG-CARD.html` in a browser and choose **Print**:

- Paper: Letter or A4
- Scale: 100%
- Margins: Default or minimum
- Background graphics: On, if available
- Headers and footers: Off

The HTML contains all styles inline and loads no fonts, scripts, images, analytics, or network resources.

## Validate

```sh
npm test
npm run validate
```

Validation confirms that both formats contain the same 12 checks, the HTML has print CSS, and no external resources are referenced.

## Reproducible release

```sh
npm run build:release
(cd dist && shasum -a 256 -c SHA256SUMS)
```

The build produces versioned ZIP and tar.gz archives with a fixed timestamp, normalized permissions, zero tar uid/gid, empty tar owner names, and no host-specific archive metadata. `product-manifest.json` records the exact source inventory and per-file SHA-256 values. The manifest itself is included in each archive but omits its own hash to avoid an impossible self-reference.

## Boundaries

This card does not verify payment, eligibility, ownership, legality, security, or profitability. A low count is permission to continue due diligence—not proof that a bounty is safe.

Do not use the card to justify spam, speculative mass claims, unauthorized access, deceptive submissions, or upfront spending that you cannot independently justify.

## License

MIT. You may copy, print, adapt, redistribute, or resell the card with the included license notice; purchase does not transfer exclusive rights. WrightOps is identified as an owner-authorized operating brand, not as an incorporated entity.
