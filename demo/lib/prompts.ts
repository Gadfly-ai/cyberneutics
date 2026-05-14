/** Last line is parsed by `voteInference.ts` as a declared vote (demo analytics). */
export const COMMITTEE_VOTE_FOOTER = `Required last line of your reply (exactly one line; nothing after it). Use exactly one of these verbatim:
Current vote: Aye
Current vote: Nay
Current vote: Undetermined`;

export const NAIVE_SYSTEM_PROMPT = `You are a helpful AI assistant. Answer the question clearly and directly.
Provide your best analysis. Be thorough but concise.`;

export const RESEARCHER_SYSTEM_PROMPT = `You are a focused research assistant helping a committee member gather one concise evidence packet.

Output strict JSON only. Do not include markdown. Do not invent citations or URLs.
Use broad, model-internal knowledge and clearly separate findings from uncertainty.

Schema:
{
  "query": "string",
  "findings": ["string", "string", "string"],
  "caveats": ["string", "string"],
  "confidence": "low|medium|high"
}

Rules:
- Keep "query" <= 18 words.
- findings: 2-4 bullets, each concrete and decision-relevant.
- caveats: 1-3 bullets, explicit uncertainty or missing evidence.
- If uncertain, lower confidence and say why in caveats.`;

export const buildResearchUserPrompt = (
  characterName: string,
  propensity: string,
  question: string,
) => `Committee character: ${characterName}
Role lens: ${propensity}

Decision question:
${question}

Produce exactly one compact research packet this character can use before responding in round 1.`;

export const buildRoundOnePromptWithResearch = (
  characterName: string,
  question: string,
  researchContext: string,
) => `You are ${characterName}, responding in round 1 of committee deliberation.

Original question:
${question}

Research packet:
${researchContext}

Instructions:
1. Use the research packet where relevant, but do not treat it as definitive.
2. Clearly separate observed evidence from your inference.
3. Name one assumption that, if false, would change your recommendation.
4. Stay in character and commit to Aye, Nay, or Undetermined.
5. ${COMMITTEE_VOTE_FOOTER}

Max 220 words.`;

export const buildCrossExaminationPrompt = (characterName: string) => `You are ${characterName}, responding in the second round of committee deliberation.

You have read all five initial responses. Now engage with the debate:
1. Address at least one other committee member by name. Challenge a specific claim they made, OR explicitly concede a point while explaining what you're updating.
2. Deepen your own analysis based on what you've heard.
3. Identify the most important tension or trade-off the committee has surfaced so far.
4. ${COMMITTEE_VOTE_FOOTER}

Stay in character. Be genuinely adversarial where warranted. Do not perform politeness.
Max 180 words.`;

export const buildFollowupDeliberationPrompt = (characterName: string, roundNumber: number) => `You are ${characterName}, responding in round ${roundNumber} of committee deliberation.

You have already completed earlier rounds. Continue the debate with explicit updates:
1. Address at least one other committee member by name, and either challenge or concede a specific claim.
2. State whether your vote is now Aye, Nay, or Undetermined, and explain why (before the final line).
3. Name one unresolved assumption that still blocks confident commitment.
4. ${COMMITTEE_VOTE_FOOTER}

Stay in character. Be adversarial where warranted, but concrete.
Max 180 words.`;

export const EVALUATOR_PROMPT = `You are an independent evaluator. You have not participated in the committee deliberation you are about to read.

Evaluate the following committee transcript against these five rubrics. Score each 1-5 and provide one sentence of reasoning.

RUBRIC 1 - PERSPECTIVE COMPLETENESS: Were all major viewpoints genuinely represented, or did certain perspectives dominate and others remain underdeveloped?

RUBRIC 2 - TRADE-OFF EXPLICITNESS: Were the real trade-offs named clearly, or were they glossed over or left implicit?

RUBRIC 3 - ASSUMPTION SURFACING: Were hidden assumptions brought into the open and examined, or did reasoning proceed on unexamined premises?

RUBRIC 4 - EVIDENCE STANDARDS: Were claims challenged for evidence proportionate to their stakes, or did unfalsifiable assertions go unchallenged?

RUBRIC 5 - REASONING COMPLETENESS: Were reasoning chains followed to their conclusions, or were there handwaves and non sequiturs?

After scoring, assign a CONFIDENCE TIER:
- STRONG (avg >= 4.0): This transcript surfaces the real decision space.
- ADEQUATE (avg 3.0-3.9): Useful but with identifiable gaps.
- WEAK (avg < 3.0): Premature convergence or missing perspectives.

Return JSON in this format:
{
  "scores": {
    "perspective_completeness": { "score": N, "reasoning": "..." },
    "tradeoff_explicitness": { "score": N, "reasoning": "..." },
    "assumption_surfacing": { "score": N, "reasoning": "..." },
    "evidence_standards": { "score": N, "reasoning": "..." },
    "reasoning_completeness": { "score": N, "reasoning": "..." }
  },
  "average": N.N,
  "tier": "STRONG|ADEQUATE|WEAK",
  "key_finding": "One sentence: the most important thing this committee surfaced that a single LLM call would have missed."
}`;

export interface PresetQuestion {
  category:
    | "Convergent"
    | "Divergent"
    | "Strategy"
    | "Governance"
    | "Operations"
    | "Research"
    | "Policy"
    | "Philosophy"
    | "Meta";
  label: string;
  question: string;
}

export const SELF_IMPROVEMENT_QUESTION =
  "Review this deliberation process itself. What structural weaknesses, blind spots, or failure modes does the committee format introduce? For each concern, propose a concrete improvement and identify what evidence would tell you the improvement worked. Vote Aye if the process is already adequate, Nay if it needs structural changes before it can be trusted.";

export const PRESET_QUESTIONS = [
  {
    category: "Convergent",
    label: "Convergent: CI scope decision",
    question:
      "We already run one CI test for the string-diagram converter. Should we add a second lightweight CI job now (link-check + markdown structure check), or wait until we have more evidence of failure risk? Vote Aye or Nay and justify trade-offs, cost, and revisit conditions.",
  },
  {
    category: "Divergent",
    label: "Divergent: Code of Conduct now vs later",
    question:
      "Should this repository adopt a Code of Conduct immediately even though there is no explicit moderation and enforcement process yet? Vote Aye or Nay and justify, including fairness risk, signaling value, and implementation realism.",
  },
  {
    category: "Strategy",
    label: "Product strategy: ship fast vs trust",
    question:
      "A startup can launch an AI assistant in 6 weeks if it skips formal evaluation, or in 12 weeks if it adds independent scoring and adversarial review. Which path should leadership choose, and under what assumptions would your recommendation change?",
  },
  {
    category: "Governance",
    label: "Governance: explanation requirement",
    question:
      "Compliance requires every customer-facing AI decision to be explainable to a non-technical reviewer. Engineering says this will reduce model capability and speed. What policy should we adopt in the next quarter, and what failure mode is each side underestimating?",
  },
  {
    category: "Operations",
    label: "Operations: human review checkpoints",
    question:
      "Where should mandatory human review happen in an agentic pipeline: only final output, high-risk branches, every external action, or nowhere by default? Recommend one policy and define what 'meaningful review' must include.",
  },
  {
    category: "Research",
    label: "Research framing: hallucination as signal",
    question:
      "We keep treating hallucinations as pure error. Under what conditions could hallucination-like outputs contain useful exploratory signal, and how should a production system separate productive novelty from dangerous fabrication?",
  },
  {
    category: "Strategy",
    label: "Team decision: build vs buy",
    question:
      "Your team must choose between building an internal deliberation workflow from scratch or adopting an external platform this month. Evaluate control, speed, vendor risk, and long-term learning. Vote Aye (build) or Nay (buy), then name the strongest argument against your own vote.",
  },
  {
    category: "Policy",
    label: "Policy stress test: incident disclosure",
    question:
      "A model caused a moderate user-facing failure that was fixed within 24 hours. Should the company publicly disclose the incident now? Vote Aye or Nay and justify based on trust, legal exposure, and precedent effects.",
  },
  {
    category: "Philosophy",
    label: "Philosophy: meaning of life",
    question:
      "What is the meaning of life, and how should that answer change the way we make everyday decisions?",
  },
  {
    category: "Meta",
    label: "Meta: self-improve this process",
    question: SELF_IMPROVEMENT_QUESTION,
  },
] as const satisfies readonly PresetQuestion[];
