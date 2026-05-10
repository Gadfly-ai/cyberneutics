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
  const q = shortQuestion(question);
  return {
    maya: `Who gains from framing "${q}" as a pure architecture question? Usually the team already holding platform control. If one model decides everything, power centralizes and accountability diffuses. If it fails, who is insulated? Not operators. I want incentive mapping before architecture.`,
    frankie: `We are trading values, not just latency. If we optimize for throughput, what duty-of-care do we externalize? If affected users cannot contest decisions, we normalize convenience over legitimacy. We need a design that preserves dignity, contestability, and clear harm ownership.`,
    joe: `We have tried "single brain" approaches before under new names. They work in calm periods, then fail under novel edge cases because hidden assumptions accumulate. The implementation burden of distributed agents is real, but so is incident recovery when monoculture fails.`,
    vic: `What is the evidence that one-model routing is safer? Show base rates: false positives, override rates, post-hoc reversals. If we cannot falsify our claims, we're storytelling. I need measurable criteria for both architectures and pre-registered failure thresholds.`,
    tammy: `Architecture changes behavior. One-model routing can atrophy local judgment and create feedback loops where downstream teams stop questioning outputs. Multi-agent systems can surface dissent but may increase coordination drag. The key question is what capability we build over time.`,
  };
}

export function buildLocalCommitteeRound2(question: string): Record<string, string> {
  const q = shortQuestion(question);
  return {
    maya: `Vic, your measurement demands are right, but metrics alone miss institutional gaming. Teams optimize what gets scored. Frankie is right that legitimacy costs are hidden. For "${q}", biggest trade-off: speed now versus governance debt later, with incentives biased toward short-term wins.`,
    frankie: `Maya, I concede your point on governance debt: ethics fails through incentives, not slogans. Joe, precedent matters, but we cannot treat history as veto power. Tension: principled constraints versus delivery pressure. We should set non-negotiable guardrails plus reversible experimentation.`,
    joe: `Tammy, good catch on capability atrophy. I challenge Maya slightly: not every centralization move is capture; sometimes it's operational triage. Still, Vic's falsifiability bar should gate rollout. Core trade-off: institutional memory versus innovation pace under uncertainty.`,
    vic: `Frankie, values are valid constraints, but specify operational tests. "Contestability" must be measurable: appeal latency, reversal quality, audit traceability. Maya, agreed on gaming risk; we'll monitor metric drift. Tension: action with sufficient evidence versus paralysis waiting for certainty.`,
    tammy: `Joe, agreed that precedent should calibrate, not freeze. I update toward Frankie: guardrails must be explicit to prevent local optimization traps. For "${q}", central tension is first-order efficiency versus second-order resilience. Build a hybrid: distributed challenge layer over a simple baseline.`,
  };
}

export function localChunksForCharacter(content: string): string[] {
  return splitIntoChunks(content, 24);
}

export function buildLocalEvaluation(mode: "naive" | "committee" = "committee"): EvaluationResult {
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
