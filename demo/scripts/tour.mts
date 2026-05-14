/**
 * CLI pipeline tour — runs each stage of the cyberneutics pipeline in the
 * terminal with annotations showing where the code lives and how to extend it.
 *
 * Usage:
 *   npm run tour                     Full guided walkthrough (local mode)
 *   npm run tour -- --live           Full walkthrough using Anthropic API
 *   npm run tour -- --step roster    Jump to a single section
 *   npm run tour -- --step naive
 *   npm run tour -- --step committee
 *   npm run tour -- --step evaluate
 *   npm run tour -- --step extend
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const demoRoot = path.join(__dirname, "..");

// ---------------------------------------------------------------------------
// Load .env.local the same way the dev server would
// ---------------------------------------------------------------------------

function loadEnvLocal(): void {
  const envPath = path.join(demoRoot, ".env.local");
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, "utf-8").split("\n");
  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eqIdx = line.indexOf("=");
    if (eqIdx < 0) continue;
    const key = line.slice(0, eqIdx).trim();
    const val = line.slice(eqIdx + 1).trim();
    if (!process.env[key]) process.env[key] = val;
  }
}

loadEnvLocal();

// ---------------------------------------------------------------------------
// ANSI helpers (respects NO_COLOR)
// ---------------------------------------------------------------------------

const NO_COLOR = !!process.env.NO_COLOR;

const ansi = {
  reset: NO_COLOR ? "" : "\x1b[0m",
  bold: NO_COLOR ? "" : "\x1b[1m",
  dim: NO_COLOR ? "" : "\x1b[2m",
  underline: NO_COLOR ? "" : "\x1b[4m",
  cyan: NO_COLOR ? "" : "\x1b[36m",
  yellow: NO_COLOR ? "" : "\x1b[33m",
  green: NO_COLOR ? "" : "\x1b[32m",
  red: NO_COLOR ? "" : "\x1b[31m",
  magenta: NO_COLOR ? "" : "\x1b[35m",
  blue: NO_COLOR ? "" : "\x1b[34m",
  white: NO_COLOR ? "" : "\x1b[37m",
};

const charColor: Record<string, string> = {
  maya: ansi.red,
  frankie: ansi.green,
  joe: ansi.yellow,
  vic: ansi.blue,
  tammy: ansi.magenta,
};

function heading(text: string): void {
  console.log(`\n${ansi.bold}${ansi.cyan}--- ${text} ---${ansi.reset}\n`);
}

function hint(text: string): void {
  console.log(`${ansi.dim}  ${text}${ansi.reset}`);
}

function fileRef(label: string, file: string): void {
  console.log(`${ansi.dim}  ${label}: ${ansi.underline}${file}${ansi.reset}`);
}

function blank(): void {
  console.log();
}

// ---------------------------------------------------------------------------
// Imports from lib/ — same code the web app uses
// ---------------------------------------------------------------------------

const { CHARACTERS } = await import("../lib/characters.js");
const { PRESET_QUESTIONS } = await import("../lib/prompts.js");
const {
  buildLocalNaiveAnswer,
  buildLocalCommitteeRound1,
  buildLocalCommitteeRound2,
  buildLocalEvaluation,
} = await import("../lib/localDemo.js");

// Pipeline import is deferred to --live mode to avoid pulling in
// @anthropic-ai/sdk at startup when it isn't needed.

// ---------------------------------------------------------------------------
// Arg parsing
// ---------------------------------------------------------------------------

const args = process.argv.slice(2);
const liveFlag = args.includes("--live");
const stepIdx = args.indexOf("--step");
const stepName = stepIdx >= 0 ? args[stepIdx + 1] : null;
const validSteps = ["roster", "naive", "committee", "evaluate", "extend"];
if (stepName && !validSteps.includes(stepName)) {
  console.error(
    `Unknown step: "${stepName}". Valid steps: ${validSteps.join(", ")}`,
  );
  process.exit(1);
}

function shouldRun(step: string): boolean {
  return stepName === null || stepName === step;
}

// ---------------------------------------------------------------------------
// Mode detection
// ---------------------------------------------------------------------------

const apiKey = process.env.ANTHROPIC_API_KEY;
const hasKey = !!apiKey && apiKey.length > 0;
const useApi = liveFlag && hasKey;

// ---------------------------------------------------------------------------
// Tour question
// ---------------------------------------------------------------------------

const TOUR_QUESTION =
  "Should we adopt microservices for our monolith?";

// ---------------------------------------------------------------------------
// Step 0: Welcome banner
// ---------------------------------------------------------------------------

console.log(
  `\n${ansi.bold}${ansi.cyan}=== Cyberneutics Pipeline Tour ===${ansi.reset}`,
);
blank();

if (useApi) {
  console.log(
    `${ansi.green}Mode: API${ansi.reset} (ANTHROPIC_API_KEY detected, --live flag set)`,
  );
  hint("Responses will come from Claude — output varies between runs.");
} else if (liveFlag && !hasKey) {
  console.log(
    `${ansi.yellow}Mode: local${ansi.reset} (--live requested but no ANTHROPIC_API_KEY found)`,
  );
  hint("Add your key to demo/.env.local to enable API mode.");
} else {
  console.log(
    `${ansi.yellow}Mode: local${ansi.reset} (deterministic demo text, no network calls)`,
  );
  if (hasKey) {
    hint("API key detected. Use --live to run through Anthropic instead.");
  } else {
    hint("To enable API mode: add ANTHROPIC_API_KEY to demo/.env.local");
  }
}
hint("To force local even with a key: set LOCAL_DEMO_ONLY=1 in .env.local");
if (!stepName) {
  hint("Jump to one step: npm run tour -- --step roster|naive|committee|evaluate|extend");
}

// ---------------------------------------------------------------------------
// Step 1: Roster
// ---------------------------------------------------------------------------

if (shouldRun("roster")) {
  heading("Step 1: The Roster (lib/characters.ts)");

  console.log(`${CHARACTERS.length} characters loaded:\n`);
  for (const c of CHARACTERS) {
    const color = charColor[c.id] ?? ansi.white;
    console.log(
      `  ${color}${ansi.bold}${c.name.padEnd(8)}${ansi.reset} ${ansi.dim}(${c.propensity})${ansi.reset}`,
    );
    console.log(`${ansi.dim}           catches: ${c.catches}${ansi.reset}`);
    console.log(
      `${ansi.dim}           failure mode: ${c.failureMode}${ansi.reset}`,
    );
  }
  blank();
  fileRef("Roster defined in", "lib/characters.ts");
  fileRef("Character type", "lib/types.ts → Character interface");
  hint(
    "Extend: add a 6th object to CHARACTERS[] in lib/characters.ts,",
  );
  hint(
    "        then add keyed entries in lib/localDemo.ts for offline mode.",
  );
}

// ---------------------------------------------------------------------------
// Step 2: Naive path
// ---------------------------------------------------------------------------

if (shouldRun("naive")) {
  heading(`Step 2: Naive Path — single voice baseline`);

  console.log(`${ansi.dim}Question:${ansi.reset} "${TOUR_QUESTION}"\n`);

  if (useApi) {
    hint("[API mode] Streaming a single Claude completion...\n");
    // We don't have a standalone naive API runner in lib, so we show local
    // naive + note the difference. The naive route is in app/api/naive/.
    const naive = buildLocalNaiveAnswer(TOUR_QUESTION);
    console.log(naive);
    blank();
    hint(
      "Note: the web app's API naive path streams from Claude (app/api/naive/route.ts).",
    );
    hint(
      "The local version above shows the same shape — one voice, one answer.",
    );
  } else {
    console.log(buildLocalNaiveAnswer(TOUR_QUESTION));
  }

  blank();
  hint("This is the single-voice baseline. One model, one system prompt.");
  fileRef("Naive answer builder", "lib/localDemo.ts → buildLocalNaiveAnswer()");
  fileRef("System prompt", "lib/prompts.ts → NAIVE_SYSTEM_PROMPT");
  fileRef("API route", "app/api/naive/route.ts");
  hint("Modify NAIVE_SYSTEM_PROMPT to change the baseline voice.");
}

// ---------------------------------------------------------------------------
// Step 3 + 4: Committee rounds
// ---------------------------------------------------------------------------

if (shouldRun("committee")) {
  if (useApi) {
    await runLiveCommittee();
  } else {
    runLocalCommittee();
  }
}

function runLocalCommittee(): void {
  heading("Step 3: Committee Round 1 — independent responses");
  console.log(`${ansi.dim}Question:${ansi.reset} "${TOUR_QUESTION}"\n`);

  const round1 = buildLocalCommitteeRound1(TOUR_QUESTION);
  for (const c of CHARACTERS) {
    const color = charColor[c.id] ?? ansi.white;
    console.log(
      `${color}${ansi.bold}${c.name}${ansi.reset} ${ansi.dim}(${c.propensity})${ansi.reset}`,
    );
    console.log(round1[c.id] ?? "(no response)");
    blank();
  }

  fileRef("Round 1 builder", "lib/localDemo.ts → buildLocalCommitteeRound1()");
  fileRef("Round 1 prompt (API)", "lib/prompts.ts → buildRoundOnePromptWithResearch()");
  hint("In API mode, a research step (lib/research.ts) runs before round 1.");

  heading("Step 4: Cross-Examination — characters engage each other");

  const round2 = buildLocalCommitteeRound2(TOUR_QUESTION);
  for (const c of CHARACTERS) {
    const color = charColor[c.id] ?? ansi.white;
    console.log(
      `${color}${ansi.bold}${c.name}${ansi.reset} ${ansi.dim}(${c.propensity})${ansi.reset}`,
    );
    console.log(round2[c.id] ?? "(no response)");
    blank();
  }

  fileRef("Round 2 builder", "lib/localDemo.ts → buildLocalCommitteeRound2()");
  fileRef("Round 2 prompt (API)", "lib/prompts.ts → buildCrossExaminationPrompt()");
  fileRef("Pipeline orchestration", "lib/pipeline.ts → runCommitteePipeline()");
  hint("The pipeline supports 2–6 rounds (clamped). Rounds 3+ use buildFollowupDeliberationPrompt().");
  hint("Add a pipeline stage: insert a new callbacks.onPhase() block in pipeline.ts.");
}

async function runLiveCommittee(): Promise<void> {
  heading("Step 3–4: Live Committee Deliberation (API mode)");
  console.log(`${ansi.dim}Question:${ansi.reset} "${TOUR_QUESTION}"\n`);
  hint("Streaming from Claude — each character responds in real time.\n");

  const { runCommitteePipeline } = await import("../lib/pipeline.js");

  const characterNames: Record<string, string> = {};
  for (const c of CHARACTERS) {
    characterNames[c.id] = c.name;
  }

  await runCommitteePipeline(
    TOUR_QUESTION,
    {
      onPhase(phase) {
        const label =
          phase === 1
            ? "Round 1 — independent responses"
            : phase === 2
              ? "Round 2 — cross-examination"
              : `Round ${phase} — follow-up deliberation`;
        console.log(`\n${ansi.bold}${ansi.cyan}[Phase ${phase}] ${label}${ansi.reset}\n`);
      },
      onCharacterStart(characterId) {
        const color = charColor[characterId] ?? ansi.white;
        const name = characterNames[characterId] ?? characterId;
        process.stdout.write(`${color}${ansi.bold}${name}:${ansi.reset} `);
      },
      onCharacterChunk(_characterId, chunk) {
        process.stdout.write(chunk);
      },
      onCharacterDone() {
        console.log("\n");
      },
      onResearchStart(characterId) {
        const name = characterNames[characterId] ?? characterId;
        hint(`${name} researching...`);
      },
      onResearchDone(characterId, packet) {
        const name = characterNames[characterId] ?? characterId;
        const conf = packet.result?.confidence ?? "?";
        hint(`${name} research done (confidence: ${conf})`);
      },
      onResearchError(characterId, message) {
        const name = characterNames[characterId] ?? characterId;
        console.log(`${ansi.red}  ${name} research failed: ${message}${ansi.reset}`);
      },
      onDone() {
        blank();
      },
    },
    { rounds: 2, executionMode: "api" },
  );

  fileRef("Pipeline orchestration", "lib/pipeline.ts → runCommitteePipeline()");
  fileRef("Research step", "lib/research.ts → runCharacterResearch()");
  fileRef("Model constant", "lib/pipeline.ts → MODEL");
  hint("The pipeline supports 2–6 rounds. Add --live to npm run tour to see this.");
}

// ---------------------------------------------------------------------------
// Step 5: Evaluation
// ---------------------------------------------------------------------------

if (shouldRun("evaluate")) {
  heading("Step 5: Evaluation — rubric scoring");

  const naiveEval = buildLocalEvaluation("naive");
  const committeeEval = buildLocalEvaluation("committee");

  const rubricKeys = Object.keys(naiveEval.scores) as Array<
    keyof typeof naiveEval.scores
  >;

  const labelWidth = Math.max(...rubricKeys.map((k) => k.length));

  console.log(`${ansi.bold}Naive evaluation:${ansi.reset}`);
  for (const key of rubricKeys) {
    const s = naiveEval.scores[key];
    const tierColor = s.score >= 4 ? ansi.green : s.score >= 3 ? ansi.yellow : ansi.red;
    console.log(
      `  ${key.padEnd(labelWidth)}  ${tierColor}${s.score.toFixed(1)}${ansi.reset}  ${ansi.dim}${s.reasoning}${ansi.reset}`,
    );
  }
  console.log(
    `  ${"average".padEnd(labelWidth)}  ${ansi.red}${naiveEval.average.toFixed(1)}${ansi.reset}  (${naiveEval.tier})`,
  );
  console.log(`  ${ansi.dim}${naiveEval.key_finding}${ansi.reset}`);

  blank();

  console.log(`${ansi.bold}Committee evaluation:${ansi.reset}`);
  for (const key of rubricKeys) {
    const s = committeeEval.scores[key];
    const tierColor = s.score >= 4 ? ansi.green : s.score >= 3 ? ansi.yellow : ansi.red;
    console.log(
      `  ${key.padEnd(labelWidth)}  ${tierColor}${s.score.toFixed(1)}${ansi.reset}  ${ansi.dim}${s.reasoning}${ansi.reset}`,
    );
  }
  console.log(
    `  ${"average".padEnd(labelWidth)}  ${ansi.green}${committeeEval.average.toFixed(1)}${ansi.reset}  (${committeeEval.tier})`,
  );
  console.log(`  ${ansi.dim}${committeeEval.key_finding}${ansi.reset}`);

  blank();
  hint(
    `Delta: committee scores ${(committeeEval.average - naiveEval.average).toFixed(1)} points higher on average.`,
  );
  fileRef("Rubric type", "lib/types.ts → EvaluationResult");
  fileRef("Evaluator prompt", "lib/prompts.ts → EVALUATOR_PROMPT");
  fileRef("Local scores", "lib/localDemo.ts → buildLocalEvaluation()");
  fileRef("API route", "app/api/evaluate/route.ts");
  hint("Add a rubric: extend scores in types.ts + EVALUATOR_PROMPT + buildLocalEvaluation().");
}

// ---------------------------------------------------------------------------
// Extension map
// ---------------------------------------------------------------------------

if (shouldRun("extend")) {
  heading("Extension Map — where to modify");

  const extensions = [
    ["Add a committee character", "lib/characters.ts + lib/localDemo.ts"],
    ["Add a preset question", "lib/prompts.ts → PRESET_QUESTIONS[]"],
    ["Add an evaluation rubric", "lib/types.ts + lib/prompts.ts + lib/localDemo.ts"],
    ["Add a pipeline stage", "lib/pipeline.ts + lib/prompts.ts (new builder fn)"],
    ["Add an execution backend", "lib/types.ts + lib/executionMode.ts + lib/pipeline.ts"],
    ["Change the model", "lib/pipeline.ts → MODEL constant"],
    ["Add a question-specific local scenario", "lib/localDemo.ts (branch on question key)"],
  ];

  const goalWidth = Math.max(...extensions.map(([goal]) => goal.length));
  for (const [goal, files] of extensions) {
    console.log(
      `  ${ansi.bold}${goal.padEnd(goalWidth)}${ansi.reset}  ${ansi.dim}→${ansi.reset} ${files}`,
    );
  }

  blank();

  console.log(`${ansi.bold}Preset questions${ansi.reset} (${PRESET_QUESTIONS.length} available):\n`);
  for (const pq of PRESET_QUESTIONS) {
    console.log(`  ${ansi.dim}[${pq.category}]${ansi.reset} ${pq.label}`);
  }

  blank();
  hint("Run the web UI to see all of this visually:");
  hint("  npm run dev → http://localhost:3000");
  blank();
  hint("Full architecture and glossary: demo/README.md");
  hint("Pipeline algebra (formal): palgebra/committee-as-palgebra.md");
}

// ---------------------------------------------------------------------------
// Done
// ---------------------------------------------------------------------------

blank();
console.log(`${ansi.dim}Tour complete.${ansi.reset}`);
