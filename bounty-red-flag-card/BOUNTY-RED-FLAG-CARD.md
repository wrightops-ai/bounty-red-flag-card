# Bounty Red-Flag Card

**12 checks before you claim, code, spend, or share access**

Mark a flag when it is present **or when authoritative evidence is missing**.

1. <a id="flag-funding"></a> **Payout is not verifiably funded.** A number in a title, issue, or comment is not proof that funds are escrowed or that the payer can and will pay.
2. <a id="flag-availability"></a> **The claim window is closed, expired, or ambiguous.** The issue may be open while the bounty deadline, platform slot, or eligibility window is not.
3. <a id="flag-competition"></a> **Someone else is assigned or already building.** Check assignees, claims, linked pull requests, forks, comments, and platform submissions.
4. <a id="flag-acceptance"></a> **Acceptance criteria are missing or subjective.** “Improve,” “support,” “production-ready,” and “make it better” need testable definitions.
5. <a id="flag-authority"></a> **The person offering payment may lack acceptance authority.** Confirm who can merge, approve delivery, resolve disputes, and release funds.
6. <a id="flag-upfront-cost"></a> **You must pay, bond, purchase, or provision first.** Include claim bonds, subscriptions, cloud spend, devices, SIMs, domains, and reimbursable purchases.
7. <a id="flag-access"></a> **Delivery requires private credentials or production access.** Never treat a bounty as authorization to access accounts, secrets, customer data, or live systems.
8. <a id="flag-third-party"></a> **Payment depends on third-party adoption, promotion, or approval.** A merge, listing, app-store review, upstream acceptance, or public endorsement may be outside your control.
9. <a id="flag-scope"></a> **The real scope exceeds the headline task.** Count setup, reverse engineering, tests, documentation, deployment, review cycles, maintenance, and support.
10. <a id="flag-baseline"></a> **The project baseline is unhealthy or inactive.** Archived repositories, failing tests, missing fixtures, broken provisioning, and long silence can make acceptance impossible.
11. <a id="flag-rights"></a> **Rights or compliance obligations are unclear.** Verify license compatibility, data rights, disclosure rules, export/sanctions constraints, taxes, and platform terms.
12. <a id="flag-economics"></a> **Expected hourly return falls below your floor.** Use expected payout after fees divided by total delivery time, including review, revisions, communication, and collection risk.

## Decision rule

**Hard stop until resolved:** unfunded payout, closed/expired claim, unauthorized access, prohibited conduct, or mandatory upfront spending you cannot independently justify.

| Flags marked | Preflight result |
| ---: | --- |
| 0–1 | Continue to full due diligence. This is **not** a GO decision. |
| 2–3 | Pause. Verify the flagged facts with authoritative evidence. |
| 4+ | Default to **NO-GO** unless the evidence materially changes. |

### 30-second economics check

```text
expected hourly return =
(payout × probability of payment − unavoidable costs)
÷ total hours through acceptance and collection
```

**Evidence beats optimism. Unknown is not “safe.” Never fabricate demand, proof, eligibility, identity, or completion.**

_Triage aid only—not legal, tax, financial, security, or compliance advice._
