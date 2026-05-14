import { SELF_IMPROVEMENT_QUESTION } from "./prompts";
import { EvaluationResult } from "./types";

function splitIntoChunks(text: string, chunkSize = 28): string[] {
  const chunks: string[] = [];
  for (let i = 0; i < text.length; i += chunkSize) {
    chunks.push(text.slice(i, i + chunkSize));
  }
  return chunks;
}

function shortQuestion(question: string): string {
  return question.length > 140 ? `${question.slice(0, 137)}...` : question;
}

const SELF_IMPROVEMENT_MARKER = "--- Improvements accepted in prior rounds";

function detectSelfImprovementRound(question: string): number {
  if (question.includes(SELF_IMPROVEMENT_MARKER)) {
    const match = question.match(/prior rounds \((\d+) of/);
    return match ? parseInt(match[1], 10) + 1 : 2;
  }
  if (question.startsWith(SELF_IMPROVEMENT_QUESTION.slice(0, 60))) return 1;
  return 0;
}

export function buildLocalNaiveAnswer(question: string): string {
  return [
    `A single orchestrator model can be efficient for: ${shortQuestion(question)}`,
    "",
    "Primary recommendation: centralize decision logic in one model and enforce consistency with policy prompts, test suites, and human escalation thresholds.",
    "",
    "Benefits: lower coordination overhead, faster implementation, and clearer ownership.",
    "Risks: blind spots can persist if the model anchors early on one framing.",
    "",
    "Mitigation: periodic review, confidence thresholds, and sampled audits.",
  ].join("\n");
}

export function buildLocalCommitteeRound1(question: string): Record<string, string> {
  const siRound = detectSelfImprovementRound(question);
  if (siRound > 0) {
    const idx = Math.min(siRound - 1, SELF_IMPROVEMENT_ROUNDS.length - 1);
    return SELF_IMPROVEMENT_ROUNDS[idx].round1;
  }
  const q = shortQuestion(question);
  return {
    maya: `Who gains from framing "${q}" as a pure architecture question? Usually the team already holding platform control. If one model decides everything, power centralizes and accountability diffuses. If it fails, who is insulated? Not operators. I want incentive mapping before architecture.

Current vote: Aye`,
    frankie: `We are trading values, not just latency. If we optimize for throughput, what duty-of-care do we externalize? If affected users cannot contest decisions, we normalize convenience over legitimacy. We need a design that preserves dignity, contestability, and clear harm ownership.

Current vote: Nay`,
    joe: `We have tried "single brain" approaches before under new names. They work in calm periods, then fail under novel edge cases because hidden assumptions accumulate. The implementation burden of distributed agents is real, but so is incident recovery when monoculture fails.

Current vote: Aye`,
    vic: `What is the evidence that one-model routing is safer? Show base rates: false positives, override rates, post-hoc reversals. If we cannot falsify our claims, we're storytelling. I need measurable criteria for both architectures and pre-registered failure thresholds.

Current vote: Nay`,
    tammy: `Architecture changes behavior. One-model routing can atrophy local judgment and create feedback loops where downstream teams stop questioning outputs. Multi-agent systems can surface dissent but may increase coordination drag. The key question is what capability we build over time.

Current vote: Undetermined`,
  };
}

export function buildLocalCommitteeRound2(question: string): Record<string, string> {
  const siRound = detectSelfImprovementRound(question);
  if (siRound > 0) {
    const idx = Math.min(siRound - 1, SELF_IMPROVEMENT_ROUNDS.length - 1);
    return SELF_IMPROVEMENT_ROUNDS[idx].round2;
  }
  const q = shortQuestion(question);
  return {
    maya: `Vic, your measurement demands are right, but metrics alone miss institutional gaming. Teams optimize what gets scored. Frankie is right that legitimacy costs are hidden. For "${q}", biggest trade-off: speed now versus governance debt later, with incentives biased toward short-term wins.

Current vote: Aye`,
    frankie: `Maya, I concede your point on governance debt: ethics fails through incentives, not slogans. Joe, precedent matters, but we cannot treat history as veto power. Tension: principled constraints versus delivery pressure. We should set non-negotiable guardrails plus reversible experimentation.

Current vote: Aye`,
    joe: `Tammy, good catch on capability atrophy. I challenge Maya slightly: not every centralization move is capture; sometimes it's operational triage. Still, Vic's falsifiability bar should gate rollout. Core trade-off: institutional memory versus innovation pace under uncertainty.

Current vote: Nay`,
    vic: `Frankie, values are valid constraints, but specify operational tests. "Contestability" must be measurable: appeal latency, reversal quality, audit traceability. Maya, agreed on gaming risk; we'll monitor metric drift. Tension: action with sufficient evidence versus paralysis waiting for certainty.

Current vote: Nay`,
    tammy: `Joe, agreed that precedent should calibrate, not freeze. I update toward Frankie: guardrails must be explicit to prevent local optimization traps. For "${q}", central tension is first-order efficiency versus second-order resilience. Build a hybrid: distributed challenge layer over a simple baseline.

Current vote: Aye`,
  };
}

type SelfImprovementRoundData = {
  round1: Record<string, string>;
  round2: Record<string, string>;
  evaluation: EvaluationResult;
};

const SELF_IMPROVEMENT_ROUNDS: SelfImprovementRoundData[] = [
  {
    round1: {
      maya: `The committee's biggest governance failure is role capture: each character's "propensity" is fixed, so incentive analysis always comes from me and evidence demands always come from Vic. Real accountability requires rotating lenses. Who benefits from these permanent role assignments? The facilitator — it reduces coordination cost at the expense of genuine challenge.

Current vote: Nay`,
      frankie: `I see a legitimacy concern in this process: affected stakeholders have no voice. We deliberate about decisions that impact people, but those people cannot contest our framing. The harm here is subtle — it looks rigorous while excluding the perspectives most likely to surface failure modes we'd rather not see.

Current vote: Nay`,
      joe: `History of expert panels shows a recurring failure: the illusion of completeness. Five voices feel like coverage, but they share training data, cultural assumptions, and failure modes. Past attempts at "diverse AI panels" collapsed into performative disagreement. We need to test whether our disagreements are real or theatrical.

Current vote: Nay`,
      vic: `Where is the evidence that this committee format outperforms alternatives? We have no control condition, no base rate for decision quality, and no falsification criteria. The evaluation rubric scores our output, but who validates the rubric? We need measurable benchmarks: compare committee outputs against single-model, against human panels, against random selection.

Current vote: Nay`,
      tammy: `The feedback loop between rounds is too shallow. Round 2 reads Round 1, but there is no mechanism to track whether challenges actually changed positions or just produced more elaborate justifications. Without measuring genuine belief updates versus rhetorical accommodation, we cannot distinguish deliberation from performance.

Current vote: Nay`,
    },
    round2: {
      maya: `Vic, your falsification point cuts deep — we are evaluating ourselves with our own rubric, which is circular governance. Frankie's stakeholder concern is the one I'd prioritize: power analysis without affected voices is just a different kind of insulation. The biggest assumption we should challenge: that five fixed roles constitute adequate coverage.

Current vote: Nay`,
      frankie: `I concede to Joe on the theatrical disagreement risk — our "adversarial" framing may be producing scripted opposition rather than genuine challenge. Maya's point about role capture is well-taken. The mitigation I'd propose: introduce a "wild card" role that changes each session, breaking the predictability of who challenges what.

Current vote: Nay`,
      joe: `Tammy's measurement point is the one with most historical precedent — every deliberation reform that failed did so because it measured activity (number of challenges) rather than impact (decisions actually changed). Vic is right that we lack controls. Core trade-off: the committee is better than nothing, but "better than nothing" is a low bar.

Current vote: Nay`,
      vic: `I'll sharpen my position: the minimum falsifiable claim is "committee output receives higher scores from human evaluators than single-model output on the same questions." Until we run that test with external raters, our rubric scores are self-referential. Tammy's tracking of genuine updates versus accommodation is the internal metric we need first.

Current vote: Nay`,
      tammy: `Joe, "better than nothing is a low bar" — that's the system-level trap. Processes that are marginally better persist because the switching cost exceeds the marginal gain, even when a fundamentally different approach would dominate. The feedback I'd add: track vote changes that cite specific evidence versus vote changes that cite social pressure from other committee members.

Current vote: Nay`,
    },
    evaluation: {
      scores: {
        perspective_completeness: { score: 4, reasoning: "All five roles engaged with distinct structural critiques rather than surface-level concerns." },
        tradeoff_explicitness: { score: 3, reasoning: "Trade-offs between rigor and usability were named but not fully developed." },
        assumption_surfacing: { score: 4, reasoning: "Self-referential evaluation and role capture were identified as hidden assumptions." },
        evidence_standards: { score: 3, reasoning: "Demands for external validation were clear but no concrete benchmarks were proposed." },
        reasoning_completeness: { score: 3, reasoning: "Several critiques were raised without following through to specific remedies." },
      },
      average: 3.4,
      tier: "ADEQUATE",
      key_finding: "The committee identified its own evaluation circularity — it scores itself with its own rubric — as the most fundamental structural weakness.",
    },
  },
  {
    round1: {
      maya: `With role capture and evaluation circularity now acknowledged, the next governance risk is temporal. Each session starts fresh — there is no institutional memory of what worked. Incentive structures favor novelty over consolidation. Who benefits from always starting over? The facilitator, who avoids accountability for whether past improvements actually landed.

Current vote: Nay`,
      frankie: `The stakeholder voice gap was accepted last round but the proposed mitigations didn't address power. A "wild card role" still speaks for affected parties rather than letting them speak. The harm persists: we model contestability without providing it. Dignity requires actual participation channels, not simulated empathy.

Current vote: Nay`,
      joe: `The theatrical disagreement test was accepted but not specified. History suggests: measure the ratio of "I concede X" statements that lead to actual vote changes versus those followed by "but my core position remains." In past reform panels, concession-without-update ran above 70%. That's the falsification threshold.

Current vote: Undetermined`,
      vic: `Building on the accepted need for external benchmarks: the minimum viable experiment is paired comparison. Same question to committee and single model, scored by three blind human raters on the same rubric. Sample size: 20 questions. If committee wins fewer than 14 of 20, the architecture doesn't justify its cost. This is a testable, pre-registered claim.

Current vote: Aye`,
      tammy: `The shallow feedback loop was accepted, but the fix needs system-level thinking. Tracking vote changes is necessary but not sufficient — we also need to track which concerns from round N actually appear as constraints in round N+1 decisions. Without that, the "self-improvement" loop is just concern generation without concern integration.

Current vote: Nay`,
    },
    round2: {
      maya: `Vic's paired comparison design is the strongest concrete proposal. I'll push on the governance angle: who selects the 20 questions? If the committee picks them, selection bias reappears. We need an adversarial question set — half chosen by supporters, half by skeptics. The power distribution of the evaluation matters as much as the evaluation itself.

Current vote: Aye`,
      frankie: `Joe, your 70% concession-without-update threshold is exactly the kind of operational test I was calling for. If we can measure theatrical agreement, we can mitigate it. I update my position: the process is fixable if we commit to measuring its own pathologies. The ethical obligation is honesty about limitations, which this round is demonstrating.

Current vote: Aye`,
      joe: `I'm tracking a pattern across our improvement rounds: each round identifies real problems but proposes mitigations that require infrastructure we don't have (external raters, longitudinal tracking, adversarial question sets). The precedent risk is "improvement debt" — we accept improvements faster than we implement them. Need a commitment mechanism.

Current vote: Undetermined`,
      vic: `Maya's adversarial question selection addresses the most obvious confound. Combined protocol: 20 questions (10 supporter-selected, 10 skeptic-selected), 3 blind raters, pre-registered threshold of 14/20. Estimated cost and time: measurable. Falsification criterion: clear. This is the evidence standard the process needs before claiming rigor.

Current vote: Aye`,
      tammy: `Joe's "improvement debt" diagnosis is the second-order feedback loop I was looking for. We generate improvements faster than we integrate them, which creates an illusion of progress. The system-level fix: each round must specify not just what to improve but what existing commitment to retire. Conservation law for process complexity.

Current vote: Aye`,
    },
    evaluation: {
      scores: {
        perspective_completeness: { score: 4, reasoning: "Roles maintained distinct lenses while building on prior round's accepted improvements." },
        tradeoff_explicitness: { score: 4, reasoning: "The rigor-versus-cost trade-off was made concrete through Vic's experimental design." },
        assumption_surfacing: { score: 4, reasoning: "Improvement debt and selection bias were surfaced as second-order assumptions." },
        evidence_standards: { score: 4, reasoning: "A falsifiable experimental protocol with pre-registered thresholds was proposed." },
        reasoning_completeness: { score: 4, reasoning: "Reasoning chains connected critiques to specific, costed remedies." },
      },
      average: 4.0,
      tier: "STRONG",
      key_finding: "The committee designed a falsifiable experiment to test its own value — paired comparison with blind raters — moving from self-referential assessment to external validation.",
    },
  },
  {
    round1: {
      maya: `With the experimental protocol accepted, the governance risk shifts to implementation capture. Who runs the experiment? If it's the same team that built the committee, the incentive to find positive results is overwhelming. Independent evaluation requires independent evaluators — and that means ceding control over how our work is judged.

Current vote: Aye`,
      frankie: `The participation gap remains the deepest ethical concern. We've improved internal rigor but haven't changed who gets to deliberate. Improvement debt is real, but the most important debt is representational: every round of self-improvement without external voices deepens the legitimacy deficit. We should acknowledge this as a hard constraint, not a future fix.

Current vote: Undetermined`,
      joe: `Three rounds in, I notice we've converged on process improvements but haven't stress-tested whether the original capability — surfacing blind spots in decisions — actually degrades or improves as we add meta-layers. Historical parallel: quality management systems that became so focused on their own metrics they forgot the product. We need a regression test.

Current vote: Aye`,
      vic: `The experimental design is accepted but the assumption that human raters are the gold standard is itself untestable within this framework. What if human raters share the same biases as the committee? We need a multi-method approach: human raters plus outcome tracking on decisions where ground truth eventually becomes available. Base rate evidence over authority.

Current vote: Aye`,
      tammy: `Joe's regression concern is the critical second-order risk. Each improvement round adds complexity. Complexity has a carrying cost. At some point, the committee's overhead exceeds its value-add. We need a complexity budget: total process steps must stay under a threshold, so adding a step requires removing one. This is the conservation law applied to system architecture.

Current vote: Aye`,
    },
    round2: {
      maya: `Joe and Tammy are identifying the same pattern from different angles: meta-improvement can become its own institutional capture mechanism. The governance answer is a sunset clause — this self-improvement loop should have a termination condition, not run indefinitely. Power accumulates in permanent processes. Set an expiry and force re-authorization.

Current vote: Aye`,
      frankie: `I concede to Tammy on the complexity budget — it's the most actionable proposal this round. Maya's sunset clause addresses my legitimacy concern partially: time-bounded authority is more legitimate than permanent authority. But I maintain that no internal process can fully substitute for external participation. That's an honest limitation, not a fixable bug.

Current vote: Aye`,
      joe: `Maya's sunset clause has strong precedent: every successful institutional reform built in review dates. Indefinite self-improvement without external check-in is how bureaucracies calcify. Concrete proposal: the committee process gets a 6-month charter, then must demonstrate value through Vic's experimental protocol to earn renewal. Memory plus accountability.

Current vote: Aye`,
      vic: `Multi-method validation is essential: raters for short-term quality, outcome tracking for long-term accuracy. But Tammy's complexity budget is the binding constraint. My measurement proposals add steps. To stay within budget: replace the current self-evaluation rubric with external rater scores. Don't add — substitute. Testable, falsifiable, net-zero complexity.

Current vote: Aye`,
      tammy: `Convergence is genuine this round — the vote shifts reflect real integration. Sunset clause (Maya), complexity budget (mine), experimental validation (Vic), and chartered renewal (Joe) form a coherent meta-governance package. The remaining feedback gap: who decides the threshold for "demonstrated value"? If it's us, we've re-introduced circularity at a higher level.

Current vote: Aye`,
    },
    evaluation: {
      scores: {
        perspective_completeness: { score: 5, reasoning: "All five perspectives converged on a coherent governance package while maintaining distinct analytical lenses." },
        tradeoff_explicitness: { score: 5, reasoning: "The complexity-versus-rigor trade-off was resolved through a specific conservation law mechanism." },
        assumption_surfacing: { score: 4, reasoning: "The assumption that meta-improvement is inherently valuable was directly challenged." },
        evidence_standards: { score: 4, reasoning: "Multi-method validation and sunset conditions were specified with concrete parameters." },
        reasoning_completeness: { score: 5, reasoning: "Reasoning chains connected across all three rounds, with each improvement building on prior accepted changes." },
      },
      average: 4.6,
      tier: "STRONG",
      key_finding: "The committee identified that unbounded self-improvement is itself a failure mode, and proposed a coherent termination condition: chartered renewal through external validation.",
    },
  },
  {
    round1: {
      maya: `We've built a governance package: sunset clause, complexity budget, external validation, chartered renewal. But who has the power to override the committee's recommendations? In every institutional design, the override mechanism determines real authority. If no one can override us, we're a rubber stamp. If everyone can, we're advisory theater.

Current vote: Aye`,
      frankie: `Four rounds of self-improvement and we've addressed structural issues without confronting the deepest ethical question: should this committee exist at all? Every process justifies its own continuation. The most honest assessment: we are better than a single model for complex decisions, worse than genuine human deliberation, and we should say so explicitly in every output.

Current vote: Aye`,
      joe: `The accumulated improvement history across four rounds is itself evidence. We started with "role capture" and "evaluation circularity" — structural problems. We progressed to "experimental design" and "complexity budgets" — engineering solutions. Now we're at "override mechanisms" and "existential justification" — governance maturity. This trajectory is the strongest argument for the process.

Current vote: Aye`,
      vic: `Testable claim from four rounds: the self-improvement loop shows diminishing marginal returns. Round 1 identified 5 structural flaws. Round 2 proposed experiments. Round 3 added governance safeguards. This round is refining rather than discovering. Measurement: if the next round's concerns are refinements of existing concerns rather than novel categories, the loop has converged. We should stop.

Current vote: Aye`,
      tammy: `Vic's diminishing returns signal is the complexity budget's natural termination criterion. The system has moved from first-order concerns (broken things) to second-order (meta-governance) to third-order (existential purpose). Each layer adds less value and more overhead. Feedback signal: stop when the ratio of novel-to-refinement concerns drops below 0.5.

Current vote: Aye`,
    },
    round2: {
      maya: `The committee is telling itself to stop. That's either genuine convergence or a sophisticated failure mode — converging on "we're done" to avoid harder questions. Frankie's "should we exist" challenge is the honest one. The power-aware answer: we should exist with a published limitations statement and a public override mechanism. Transparency as governance.

Current vote: Aye`,
      frankie: `Joe's trajectory argument is compelling — the progression from structural flaws to governance maturity is evidence of genuine self-correction. I update: the process works, but its outputs must carry honest disclaimers. Not "the committee decided" but "the committee surfaced these trade-offs; a human decision-maker must own the choice." Dignity requires clear authority boundaries.

Current vote: Aye`,
      joe: `Vic and Tammy's convergence detection is the practical conclusion. Every reform process needs a stopping rule. Ours: stop when the marginal concern is a refinement of an existing concern rather than a novel structural category. We've reached that point. The precedent we should set: document the full improvement history as evidence of the process working, not just the final state.

Current vote: Aye`,
      vic: `Final evidence summary: Round 1 identified 5 structural flaws, Round 2 produced an experimental design, Round 3 added governance controls, Round 4 is producing convergence signals. The falsifiable prediction: an independent rater scoring our improvement trajectory will rate later rounds higher than earlier rounds. If not, the self-improvement mechanism is decorative rather than functional.

Current vote: Aye`,
      tammy: `The system has reached a natural attractor: all five members voting Aye with refinement-level rather than discovery-level concerns. The feedback loop is signaling stability. The most useful final output: a "process health card" summarizing what was found, what was fixed, and what remains an acknowledged limitation. That's the honest artifact — not perfection, but documented learning.

Current vote: Aye`,
    },
    evaluation: {
      scores: {
        perspective_completeness: { score: 5, reasoning: "Even in convergence, roles maintained distinct analytical frames — governance, ethics, precedent, evidence, systems." },
        tradeoff_explicitness: { score: 5, reasoning: "The continue-vs-stop trade-off was explicitly analyzed with diminishing returns as the decision criterion." },
        assumption_surfacing: { score: 5, reasoning: "The assumption that convergence is genuine rather than premature was directly confronted." },
        evidence_standards: { score: 5, reasoning: "Falsifiable convergence criteria (novel-to-refinement ratio) were proposed and applied." },
        reasoning_completeness: { score: 5, reasoning: "Four rounds of accumulated reasoning were synthesized into a coherent governance package with stopping conditions." },
      },
      average: 5.0,
      tier: "STRONG",
      key_finding: "The committee demonstrated genuine self-correction across four rounds: from identifying circularity to proposing external validation to recognizing its own diminishing returns — a trajectory that single-model approaches cannot replicate.",
    },
  },
];

export function localChunksForCharacter(content: string): string[] {
  return splitIntoChunks(content, 24);
}

export function buildLocalEvaluation(mode: "naive" | "committee" = "committee", question?: string): EvaluationResult {
  if (question) {
    const siRound = detectSelfImprovementRound(question);
    if (siRound > 0 && mode === "committee") {
      const idx = Math.min(siRound - 1, SELF_IMPROVEMENT_ROUNDS.length - 1);
      return SELF_IMPROVEMENT_ROUNDS[idx].evaluation;
    }
  }

  if (mode === "naive") {
    return {
      scores: {
        perspective_completeness: {
          score: 2,
          reasoning: "The response presents one integrated perspective without adversarial role coverage.",
        },
        tradeoff_explicitness: {
          score: 2,
          reasoning: "Trade-offs are acknowledged briefly but not stress-tested against alternatives.",
        },
        assumption_surfacing: {
          score: 2,
          reasoning: "Most framing assumptions remain implicit and unchallenged.",
        },
        evidence_standards: {
          score: 2,
          reasoning: "Claims are plausible but not examined with explicit falsification criteria.",
        },
        reasoning_completeness: {
          score: 3,
          reasoning: "Reasoning is coherent but converges early on a preferred architecture.",
        },
      },
      average: 2.2,
      tier: "WEAK",
      key_finding:
        "The naive response is locally coherent but under-explores competing assumptions and governance risks.",
    };
  }

  return {
    scores: {
      perspective_completeness: {
        score: 5,
        reasoning: "Distinct roles remained active and non-redundant across both rounds.",
      },
      tradeoff_explicitness: {
        score: 5,
        reasoning: "The transcript repeatedly named speed-versus-governance and efficiency-versus-resilience tensions.",
      },
      assumption_surfacing: {
        score: 4,
        reasoning: "Incentive and legitimacy assumptions were surfaced and partially stress-tested.",
      },
      evidence_standards: {
        score: 4,
        reasoning: "Claims were challenged with explicit requests for base rates and operational tests.",
      },
      reasoning_completeness: {
        score: 4,
        reasoning: "Reasoning chains were mostly carried through to practical implications and safeguards.",
      },
    },
    average: 4.4,
    tier: "STRONG",
    key_finding:
      "The committee exposed governance and capability feedback loops that a one-shot answer would likely compress into a single preferred architecture.",
  };
}
