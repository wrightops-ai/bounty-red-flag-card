# Bounty Red-Flag Card v1.1.0

The free card is now a runnable tool, while preserving the original Markdown
and one-page print formats.

## Added

- A self-contained interactive browser app that runs directly from `file://`.
- A zero-dependency Node.js CLI with text and JSON output.
- Deterministic `HARD_STOP`, `DEFAULT_NO_GO`, `HOLD_VERIFY`, and
  `CONTINUE_DUE_DILIGENCE` results.
- Local copy and download of the JSON assessment.
- A synthetic example input and complete CLI help.

## Privacy and boundaries

The app sends no network requests, loads no third-party content, uses no
telemetry, and does not persist inputs. The CLI is likewise offline. Missing
answers become unknown and count as flags.

The output remains a triage aid. It does not claim a bounty, contact a payer,
execute repository code, authorize access, or prove safety, eligibility,
acceptance, payment, compliance, or profit.
