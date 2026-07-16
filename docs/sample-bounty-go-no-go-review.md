# Sample Bounty GO/NO-GO Review

> Synthetic example — not a customer result.
>
> The URLs and facts below are deliberately fictional. This sample shows the
> report structure, decision standard, and calculation method without implying
> that WrightOps reviewed or earned money from a real bounty.

## Decision

**HOLD**

Do not claim or implement the bounty yet. The advertised payout is clear, but
the public evidence does not establish reserved funding, payment authority, or
an objective acceptance test. One competing implementation is also open.

Smallest next step: ask the named maintainer, in the bounty's existing public
thread, to confirm the funding source, who can approve payment, whether multiple
implementations can be paid, and the exact passing test.

## Target and evidence cutoff

- Synthetic bounty:
  `https://example.invalid/acme/widget/issues/4242`
- Synthetic platform rules:
  `https://example.invalid/rules/bounties`
- Evidence cutoff: `2026-07-16T12:00:00Z`
- Review boundary: public issue, linked public repository, linked public rules
- Repository execution: none

## Evidence table

| Question | Synthetic public evidence | Finding |
| --- | --- | --- |
| Is a payout amount stated? | The issue title states `$300 bounty`. | Yes, advertised amount only. |
| Is funding reserved or escrowed? | No transaction, escrow record, or platform funding state is linked. | Unknown. |
| Who can authorize payment? | The issue author is a contributor; the rules say an authorized maintainer approves payouts. No authorized payer is named. | Unknown. |
| Is the work still available? | The issue is open and has no assignee. | Probably, but not reserved. |
| Is there competition? | One open pull request links to the issue. | Yes. |
| Is acceptance objective? | The issue asks to “improve reliability” without a failing test, target metric, or supported-version matrix. | No. |
| Are upfront costs required? | No bond, purchase, paid API, or private account is requested. | No known upfront cash cost. |
| Are private credentials required? | The issue references only public code and public CI. | No. |
| Are contribution rights clear? | The synthetic repository states an MIT license and requires contributor certification. | Yes, subject to the stated contribution process. |
| Is payment guaranteed after merge? | The synthetic rules reserve final discretion and do not address competing implementations. | No. |

## Scope and economics

Stated assumptions:

- advertised payout: `$300.00`
- platform fee if paid: `10%`
- implementation: `4.0 hours`
- tests and documentation: `1.0 hour`
- review and revisions: `1.0 hour`
- total delivery time: `6.0 hours`
- collection probability: not estimated because funding and payment authority
  are unresolved

If paid, the fee-adjusted receipt would be:

```text
$300.00 × (1 - 0.10) = $270.00
```

The paid-case hourly return would be:

```text
$270.00 ÷ 6.0 hours = $45.00/hour
```

That is not an expected hourly return. An expected value would require a
defensible payment probability, which the public evidence does not provide.

## Red flags

1. Funding is advertised but not independently evidenced.
2. Payment authority is unnamed.
3. Acceptance criteria are subjective.
4. A competing implementation is already open.
5. The rules do not say whether more than one implementation can be paid.

## What would change the decision

Change `HOLD` to `GO` only if authoritative public evidence confirms all of the
following:

1. the bounty is funded or the payer has current payment authority;
2. the work remains claimable despite the competing pull request;
3. a specific passing test or measurable acceptance condition;
4. the applicable fee and payout process; and
5. the resulting conservative hourly return meets the buyer's stated floor.

Change `HOLD` to `NO-GO` if the payer confirms that the competing pull request
has priority, the bounty is unfunded, or the verified economics fall below the
buyer's floor.

## Limits

This sample is a public-evidence decision aid, not legal, tax, financial,
security, privacy, or compliance advice. It does not claim the bounty, contact
the payer, execute code, guarantee eligibility, predict a merge, or guarantee
payment or profit.
