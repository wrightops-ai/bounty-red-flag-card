export const RESPONSE_VALUES = Object.freeze(["clear", "flag", "unknown"]);

export const FLAGS = Object.freeze([
  {
    id: "funding",
    title: "Payout is not verifiably funded.",
    question: "Can authoritative evidence show that the stated payout is funded and available?",
    hardStop: true
  },
  {
    id: "availability",
    title: "The claim window is closed, expired, or ambiguous.",
    question: "Is the claim window open now, with the deadline and eligibility rules confirmed?",
    hardStop: true
  },
  {
    id: "competition",
    title: "Someone else is assigned or already building.",
    question: "Have assignees, claims, pull requests, forks, comments, and submissions been checked?",
    hardStop: false
  },
  {
    id: "acceptance",
    title: "Acceptance criteria are missing or subjective.",
    question: "Are the deliverable and acceptance tests objective enough to verify before work starts?",
    hardStop: false
  },
  {
    id: "authority",
    title: "The person offering payment may lack acceptance authority.",
    question: "Is it clear who can accept delivery, resolve disputes, and release the payout?",
    hardStop: false
  },
  {
    id: "upfront-cost",
    title: "You must pay, bond, purchase, or provision first.",
    question: "Can the work be attempted without an unjustified bond, purchase, subscription, or spend?",
    hardStop: true
  },
  {
    id: "access",
    title: "Delivery requires private credentials or production access.",
    question: "Can the deliverable be completed without secrets, customer data, or live-system access?",
    hardStop: true
  },
  {
    id: "third-party",
    title: "Payment depends on third-party adoption, promotion, or approval.",
    question: "Is acceptance controlled by the named payer rather than an unrelated third party?",
    hardStop: false
  },
  {
    id: "scope",
    title: "The real scope exceeds the headline task.",
    question: "Does the estimate include setup, tests, docs, review cycles, support, and collection?",
    hardStop: false
  },
  {
    id: "baseline",
    title: "The project baseline is unhealthy or inactive.",
    question: "Does the baseline build, test, and provide enough maintainer activity for acceptance?",
    hardStop: false
  },
  {
    id: "rights",
    title: "Rights or compliance obligations are unclear.",
    question: "Are licenses, data rights, disclosure duties, taxes, and platform rules understood?",
    hardStop: false
  },
  {
    id: "economics",
    title: "Expected hourly return falls below your floor.",
    question: "After costs and payment risk, does expected return still clear the required hourly floor?",
    hardStop: false
  }
]);

const VERDICTS = Object.freeze({
  HARD_STOP: Object.freeze({
    code: "HARD_STOP",
    label: "Hard stop",
    meaning: "A blocking fact or unresolved blocking uncertainty is present.",
    nextStep: "Do not claim, code, spend, or share access until every hard stop has authoritative evidence."
  }),
  DEFAULT_NO_GO: Object.freeze({
    code: "DEFAULT_NO_GO",
    label: "Default no-go",
    meaning: "Four or more facts remain flagged or unknown.",
    nextStep: "Default to no-go unless authoritative evidence materially changes the assessment."
  }),
  HOLD_VERIFY: Object.freeze({
    code: "HOLD_VERIFY",
    label: "Hold and verify",
    meaning: "Two or three facts remain flagged or unknown.",
    nextStep: "Pause and resolve the named facts before committing delivery time."
  }),
  CONTINUE_DUE_DILIGENCE: Object.freeze({
    code: "CONTINUE_DUE_DILIGENCE",
    label: "Continue due diligence",
    meaning: "Zero or one fact remains flagged or unknown.",
    nextStep: "Continue the full review. This result is not a GO decision and does not prove safety or payment."
  })
});

function normalizeSubject(subject) {
  if (subject === undefined) {
    return {};
  }
  if (!subject || typeof subject !== "object" || Array.isArray(subject)) {
    throw new TypeError("subject must be an object when provided.");
  }

  const result = {};
  for (const key of ["label", "source"]) {
    if (subject[key] !== undefined) {
      if (typeof subject[key] !== "string") {
        throw new TypeError(`subject.${key} must be a string.`);
      }
      const value = subject[key].trim();
      if (value) {
        result[key] = value;
      }
    }
  }
  return result;
}

export function normalizeAnswers(answers = {}) {
  if (!answers || typeof answers !== "object" || Array.isArray(answers)) {
    throw new TypeError("answers must be an object.");
  }

  const knownIds = new Set(FLAGS.map((flag) => flag.id));
  const unknownIds = Object.keys(answers).filter((id) => !knownIds.has(id));
  if (unknownIds.length > 0) {
    throw new TypeError(`Unknown flag id${unknownIds.length === 1 ? "" : "s"}: ${unknownIds.join(", ")}`);
  }

  return Object.fromEntries(
    FLAGS.map((flag) => {
      const response = answers[flag.id] ?? "unknown";
      if (!RESPONSE_VALUES.includes(response)) {
        throw new TypeError(
          `${flag.id} must be one of: ${RESPONSE_VALUES.join(", ")}. Received: ${String(response)}`
        );
      }
      return [flag.id, response];
    })
  );
}

export function assessBounty(input = {}) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new TypeError("Assessment input must be an object.");
  }

  const subject = normalizeSubject(input.subject);
  const answers = normalizeAnswers(input.answers);
  const results = FLAGS.map((flag) => {
    const response = answers[flag.id];
    const flagged = response !== "clear";
    return {
      id: flag.id,
      title: flag.title,
      response,
      flagged,
      hardStop: flag.hardStop && flagged
    };
  });
  const hardStops = results.filter((result) => result.hardStop).map((result) => result.id);
  const counts = {
    clear: results.filter((result) => result.response === "clear").length,
    flag: results.filter((result) => result.response === "flag").length,
    unknown: results.filter((result) => result.response === "unknown").length,
    totalFlagged: results.filter((result) => result.flagged).length
  };

  let verdict;
  if (hardStops.length > 0) {
    verdict = VERDICTS.HARD_STOP;
  } else if (counts.totalFlagged >= 4) {
    verdict = VERDICTS.DEFAULT_NO_GO;
  } else if (counts.totalFlagged >= 2) {
    verdict = VERDICTS.HOLD_VERIFY;
  } else {
    verdict = VERDICTS.CONTINUE_DUE_DILIGENCE;
  }

  return {
    schemaVersion: 1,
    tool: "Bounty Red-Flag Card",
    subject,
    answers,
    counts,
    hardStops,
    verdict,
    results,
    disclaimer:
      "Triage aid only. This assessment does not prove that a bounty is safe, legal, compliant, profitable, eligible, acceptable, or payable."
  };
}
