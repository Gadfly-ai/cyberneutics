"use client";

import { majorityCorrectCurve, majorityCorrectProbability } from "@/lib/condorcetJury";
import { buildCondorcetShift } from "@/lib/insights";
import type { CharacterRoundState } from "@/lib/types";
import type { VoteLabel } from "@/lib/voteInference";
import { useCallback, useMemo, useState } from "react";

const ARTIFACT_PATH = "artifacts/condorcet-jury-theorem-and-committee.md";

/** Shown in the live ballot lab when the user clicks a control (what it demonstrates / why it matters). */
const LAB_CONTROL_HINTS = {
  flip: {
    title: "Flip one jury",
    body: "Draws one random jury: each seat is independently correct with probability p (your slider). Green/red squares are per-juror outcomes; the line compares majority-correct vs wrong for that single draw. It demonstrates sampling variability — even when p > ½, any one jury can still get the majority wrong. Useful because the theorem is about long-run probability, not certainty in one shot.",
  },
  batch: {
    title: "Run batch",
    body: "Runs many independent jury draws (trial count below) and reports the fraction where a strict majority of jurors were correct. That empirical rate should hug the theoretical P(majority correct) for your n and p. It demonstrates the law of large numbers calibrating the model. Useful to sanity-check that the simulation matches the math and to see how noisy estimates are at your trial budget.",
  },
  trials400: {
    title: "400 trials",
    body: "A quick Monte Carlo sample: fast feedback, but the empirical percentage can swing a few points from theory. Demonstrates that small batches are cheap but imprecise. Useful when you only want a rough check after changing p or n.",
  },
  trials1600: {
    title: "1,600 trials",
    body: "Default balance between wait time and stability: empirical P usually lands close to the formula. Demonstrates a middling confidence level for the simulation. Useful as the everyday setting when exploring the curve.",
  },
  trials6400: {
    title: "6,400 trials",
    body: "A heavier run: empirical P should track theory very tightly (smaller Monte Carlo error). Demonstrates diminishing returns — more trials mainly shrink noise. Useful when teaching calibration or when you want the batch vs theory gap to be unambiguous.",
  },
  p: {
    title: "Competence p",
    body: "Each juror’s chance of voting with the ground truth, assuming independence. Moving p shows the non‑negotiable Condorcet condition: the classic theorem needs p > ½ for large n to make majority correctness likely. Useful for stress‑testing optimism (high p) vs realistic skill levels and for seeing why p ≤ ½ breaks the “wisdom of crowds” story.",
  },
  n: {
    title: "Jury size n",
    body: "How many independent votes enter the majority. Increasing n (with p > ½) drives P(majority correct) toward 1 — the aggregation benefit. It demonstrates that error rates compound differently than raw competence. Useful for contrasting a tiny committee with a large poll and for relating the chart’s curve shape to your chosen n.",
  },
} as const;

type LabHintId = keyof typeof LAB_CONTROL_HINTS;

export type CondorcetJuryExplorerVariant = "default" | "livePanel";

interface CondorcetJuryExplorerProps {
  /** `livePanel`: compact layout for the Live Interaction sidebar/card. */
  variant?: CondorcetJuryExplorerVariant;
  /** Tighter vertical rhythm when embedded in the observability dock. */
  observabilityCompact?: boolean;
  /** Merged onto the root section (e.g. strip chrome when nested in a dock card). */
  className?: string;
  /** When set (e.g. from the main page), shows inferred votes vs the classical model. */
  characterResponses?: Record<string, CharacterRoundState>;
  isRunning?: boolean;
}

function hasAnyTranscript(state: Record<string, CharacterRoundState> | undefined): boolean {
  if (!state) return false;
  return Object.values(state).some((s) => (s.phase1?.trim() ?? "").length > 0 || (s.phase2?.trim() ?? "").length > 0);
}

function voteDotClass(v: VoteLabel): string {
  if (v === "Aye") return "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.55)]";
  if (v === "Nay") return "bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.45)]";
  return "bg-slate-400";
}

function majorityShort(v: VoteLabel): string {
  if (v === "Aye") return "Aye";
  if (v === "Nay") return "Nay";
  return "Undet.";
}

export function CondorcetJuryExplorer({
  variant = "default",
  observabilityCompact = false,
  className = "",
  characterResponses,
  isRunning = false,
}: CondorcetJuryExplorerProps) {
  const [p, setP] = useState(0.6);
  const [n, setN] = useState(5);
  const [trialBudget, setTrialBudget] = useState<400 | 1600 | 6400>(1600);
  const [sim, setSim] = useState<{
    running: boolean;
    progress: number;
    empirical: number | null;
    trials: number;
  }>({ running: false, progress: 0, empirical: null, trials: 0 });
  const [lastFlip, setLastFlip] = useState<{
    correctPerSeat: boolean[];
    majorityCorrect: boolean;
  } | null>(null);
  const [labHintId, setLabHintId] = useState<LabHintId | null>(null);

  const pAtN = useMemo(() => majorityCorrectProbability(n, p), [n, p]);
  const curve = useMemo(() => majorityCorrectCurve(25, p), [p]);
  const maxProb = useMemo(() => Math.max(...curve.map((pt) => pt.probability), 0.01), [curve]);

  const isLive = variant === "livePanel";
  const liveCondorcet = useMemo(
    () => (characterResponses ? buildCondorcetShift(characterResponses) : null),
    [characterResponses],
  );
  const showLiveBridge = isLive && hasAnyTranscript(characterResponses);
  const shifts = liveCondorcet ? liveCondorcet.rows.filter((r) => r.changed).length : 0;

  const runBatchSimulation = useCallback(() => {
    const trials = trialBudget;
    const need = Math.floor(n / 2) + 1;
    setSim({ running: true, progress: 0, empirical: null, trials });
    const chunk = Math.max(50, Math.floor(trials / 80));
    let wins = 0;
    let processed = 0;

    const step = () => {
      const end = Math.min(processed + chunk, trials);
      for (let t = processed; t < end; t += 1) {
        let correct = 0;
        for (let j = 0; j < n; j += 1) {
          if (Math.random() < p) correct += 1;
        }
        if (correct >= need) wins += 1;
      }
      processed = end;
      const progress = processed / trials;
      if (processed >= trials) {
        setSim({ running: false, progress: 1, empirical: wins / trials, trials });
        return;
      }
      setSim({ running: true, progress, empirical: null, trials });
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [n, p, trialBudget]);

  const flipOneJury = useCallback(() => {
    const correctPerSeat = Array.from({ length: n }, () => Math.random() < p);
    const need = Math.floor(n / 2) + 1;
    const correctCount = correctPerSeat.filter(Boolean).length;
    setLastFlip({
      correctPerSeat,
      majorityCorrect: correctCount >= need,
    });
  }, [n, p]);

  const calibrationDelta =
    sim.empirical !== null ? Math.abs(sim.empirical - pAtN) * 100 : null;
  const calibrationLabel =
    calibrationDelta === null
      ? null
      : calibrationDelta < 2.5
        ? "On target"
        : calibrationDelta < 5
          ? "Close"
          : "Run more trials";

  const rootClass = isLive
    ? observabilityCompact
      ? "mt-2 rounded-lg border border-sky-200 bg-gradient-to-b from-sky-50/90 to-white p-1.5 shadow-sm"
      : "mt-2 rounded-lg border border-sky-200 bg-gradient-to-b from-sky-50/90 to-white p-2.5 shadow-sm"
    : "mt-4 rounded-md border border-slate-200 bg-white p-3";

  return (
    <section className={`${rootClass} ${className}`.trim()}>
      <div className="flex flex-wrap items-baseline justify-between gap-1">
        <div
          className={
            isLive
              ? "text-[10px] font-semibold uppercase tracking-wide text-sky-900"
              : "text-[11px] font-semibold uppercase tracking-wide text-slate-500"
          }
        >
          {isLive ? "Jury theorem · ballot lab" : "Condorcet jury theorem (classical model)"}
        </div>
        {isLive ? (
          <span className="text-[9px] font-medium uppercase tracking-wide text-sky-700/90">
            Play · then compare
          </span>
        ) : null}
      </div>

      <p
        className={
          isLive
            ? observabilityCompact
              ? "mt-1 text-[9px] leading-snug text-sky-950/90"
              : "mt-1.5 text-[10px] leading-snug text-sky-950/90"
            : "mt-2 text-xs leading-relaxed text-slate-700"
        }
      >
        {isLive ? (
          <>
            Classical setup: <strong>n</strong> jurors, each independently “right” with probability{" "}
            <span className="tabular-nums">{p.toFixed(2)}</span>. Majority means strictly more than half
            correct. The <strong>live committee</strong> is deliberative (voices influence each other), so it
            is <strong>not</strong> this model — we still show the theorem so the contrast is explicit. See{" "}
            <code className="rounded bg-white/80 px-0.5 text-[9px] text-slate-800">{ARTIFACT_PATH}</code>.
          </>
        ) : (
          <>
            This curve is the standard <strong>independent-jury</strong> story: each of{" "}
            <span className="font-semibold tabular-nums">{n}</span> voters is correct with probability{" "}
            <span className="font-semibold tabular-nums">{p.toFixed(2)}</span>, votes are independent, and we
            ask for a <strong>strict majority</strong> of correct votes. The live committee above is{" "}
            <strong>deliberative and dependent</strong> by design — it does not satisfy these assumptions. See{" "}
            <code className="rounded bg-slate-100 px-1 text-[10px] text-slate-800">{ARTIFACT_PATH}</code> in
            the repository for the full distinction.
          </>
        )}
      </p>

      {isLive && showLiveBridge && liveCondorcet ? (
        <div
          className={
            observabilityCompact
              ? "mt-1.5 rounded-lg border border-indigo-200/90 bg-gradient-to-br from-indigo-50/95 to-white px-1.5 py-1.5 shadow-sm"
              : "mt-2.5 rounded-lg border border-indigo-200/90 bg-gradient-to-br from-indigo-50/95 to-white px-2 py-2 shadow-sm"
          }
        >
          <div className="flex flex-wrap items-center justify-between gap-1">
            <div className="text-[9px] font-semibold uppercase tracking-wide text-indigo-900">
              This run · inferred assembly
            </div>
            <div className="flex flex-wrap items-center gap-1 text-[9px] text-indigo-950/90">
              <span className="rounded-full bg-white/80 px-1.5 py-0.5 font-semibold tabular-nums ring-1 ring-indigo-200/80">
                R1 {majorityShort(liveCondorcet.majorityBefore)}
              </span>
              <span aria-hidden="true" className="text-indigo-400">
                →
              </span>
              <span className="rounded-full bg-white/80 px-1.5 py-0.5 font-semibold tabular-nums ring-1 ring-indigo-200/80">
                Final {majorityShort(liveCondorcet.majorityAfter)}
              </span>
              {shifts > 0 ? (
                <span className="rounded-full border border-amber-300/80 bg-amber-50 px-1.5 py-0.5 font-semibold text-amber-950">
                  {shifts} flip{shifts === 1 ? "" : "s"}
                </span>
              ) : (
                <span className="rounded-full border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-slate-600">
                  No flips yet
                </span>
              )}
            </div>
          </div>
          <p className="mt-1 text-[9px] leading-snug text-indigo-950/85">
            Dots are <strong>inferred</strong> votes (same rules as the graph above). When flips appear after
            cross-examination, you are watching <strong>dependence</strong> — the thing classical juries assume
            away.
          </p>
          <div className="mt-1.5 overflow-x-auto">
            <table className="w-full min-w-[240px] border-separate border-spacing-y-1 text-[9px]">
              <thead>
                <tr className="text-left text-indigo-800/90">
                  <th className="pr-1 font-medium">Role</th>
                  <th className="pr-1 font-medium">R1</th>
                  <th className="font-medium">Final</th>
                </tr>
              </thead>
              <tbody>
                {liveCondorcet.rows.map((row) => (
                  <tr key={row.name}>
                    <td className="pr-1 font-semibold text-indigo-950">{row.name}</td>
                    <td className="pr-1">
                      <span
                        className={`inline-flex h-4 w-4 items-center justify-center rounded-full ${voteDotClass(row.before)}`}
                        title={row.before}
                      />
                    </td>
                    <td>
                      <span className="inline-flex items-center gap-1">
                        <span
                          className={`inline-flex h-4 w-4 items-center justify-center rounded-full ${voteDotClass(row.after)}`}
                          title={row.after}
                        />
                        {row.changed ? (
                          <span className="text-[8px] font-bold uppercase text-amber-700">Δ</span>
                        ) : null}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {isLive ? (
        <div
          className={
            observabilityCompact
              ? "mt-1.5 rounded-lg border border-sky-200/80 bg-white/90 px-1.5 py-1.5"
              : "mt-2.5 rounded-lg border border-sky-200/80 bg-white/90 px-2 py-2"
          }
        >
          <div className="text-[9px] font-semibold uppercase tracking-wide text-sky-900">Independent ballot lab</div>
          <p className="mt-0.5 text-[9px] leading-snug text-slate-600">
            Draw random juries at your sliders. “Majority correct” means most seats guessed the ground truth —
            the classical story.
          </p>
          <p className="mt-1.5 text-[9px] leading-snug text-slate-500">
            Tap a control below for what it shows and why it matters.
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => {
                setLabHintId("flip");
                flipOneJury();
              }}
              disabled={isRunning || sim.running}
              className="rounded-md border border-sky-300 bg-sky-50 px-2 py-1 text-[10px] font-semibold text-sky-950 shadow-sm transition hover:bg-sky-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Flip one jury
            </button>
            <button
              type="button"
              onClick={() => {
                setLabHintId("batch");
                runBatchSimulation();
              }}
              disabled={isRunning || sim.running}
              className="rounded-md border border-slate-300 bg-slate-900 px-2 py-1 text-[10px] font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Run batch
            </button>
            <div
              role="radiogroup"
              aria-label="Batch trial count"
              className="inline-flex overflow-hidden rounded-md border border-slate-200 bg-slate-100 p-0.5"
            >
              {([400, 1600, 6400] as const).map((t) => {
                const hintKey =
                  t === 400 ? "trials400" : t === 1600 ? "trials1600" : "trials6400";
                return (
                  <button
                    key={t}
                    type="button"
                    role="radio"
                    aria-checked={trialBudget === t}
                    onClick={() => {
                      setTrialBudget(t);
                      setLabHintId(hintKey);
                    }}
                    disabled={sim.running}
                    className={`px-1.5 py-0.5 text-[9px] font-semibold tabular-nums transition ${
                      trialBudget === t ? "rounded bg-white text-slate-900 shadow-sm" : "text-slate-600"
                    } disabled:opacity-50`}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
          </div>
          {labHintId && LAB_CONTROL_HINTS[labHintId] ? (
            <div
              className="mt-2 rounded-md border border-amber-200/90 bg-amber-50/95 px-2 py-1.5 text-[10px] leading-snug text-amber-950 shadow-sm"
              role="status"
            >
              <div className="font-semibold text-amber-950">{LAB_CONTROL_HINTS[labHintId].title}</div>
              <p className="mt-0.5 text-amber-950/95">{LAB_CONTROL_HINTS[labHintId].body}</p>
            </div>
          ) : null}
          {lastFlip ? (
            <div className="mt-2 rounded-md border border-slate-200 bg-slate-50/90 px-2 py-1.5">
              <div className="text-[9px] font-medium text-slate-600">Last single jury — seat correct?</div>
              <div className="mt-1 flex flex-wrap gap-0.5">
                {lastFlip.correctPerSeat.map((ok, i) => (
                  <span
                    key={i}
                    className={`h-5 w-5 rounded-sm ${ok ? "bg-emerald-500/90" : "bg-rose-500/85"}`}
                    title={ok ? "correct" : "wrong"}
                  />
                ))}
              </div>
              <div
                className={`mt-1 text-[10px] font-semibold tabular-nums ${
                  lastFlip.majorityCorrect ? "text-emerald-800" : "text-rose-800"
                }`}
              >
                Majority correct: {lastFlip.majorityCorrect ? "Yes" : "No"} · theory P≈
                {(pAtN * 100).toFixed(1)}%
              </div>
            </div>
          ) : null}
          {sim.running || sim.empirical !== null ? (
            <div className="mt-2 rounded-md border border-slate-200 bg-white px-2 py-1.5">
              <div className="flex items-center justify-between gap-2 text-[9px] text-slate-600">
                <span>Batch progress</span>
                <span className="tabular-nums">{Math.round(sim.progress * 100)}%</span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-sky-600 transition-[width] duration-75 ease-out"
                  style={{ width: `${sim.progress * 100}%` }}
                />
              </div>
              {sim.empirical !== null ? (
                <div className="mt-1.5 space-y-0.5">
                  <div className="flex flex-wrap items-baseline justify-between gap-1">
                    <span className="text-[10px] font-semibold text-slate-800">Empirical</span>
                    <span className="text-sm font-bold tabular-nums text-sky-900">
                      {(sim.empirical * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex flex-wrap items-baseline justify-between gap-1 text-[9px] text-slate-600">
                    <span>Theory (n, p)</span>
                    <span className="font-semibold tabular-nums text-slate-800">{(pAtN * 100).toFixed(1)}%</span>
                  </div>
                  {calibrationLabel ? (
                    <div className="text-[9px] font-semibold uppercase tracking-wide text-slate-500">
                      Calibration · {calibrationLabel}
                      {calibrationDelta !== null ? ` (Δ ${calibrationDelta.toFixed(1)} pts)` : ""}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}

      <div className={isLive ? "mt-2 grid grid-cols-2 gap-2" : "mt-3 grid gap-3 sm:grid-cols-2"}>
        <label className="block text-[11px] text-slate-700">
          <span className={isLive ? "text-[10px] font-medium text-slate-800" : "font-medium text-slate-800"}>
            Competence p
          </span>
          <input
            type="range"
            min={0.05}
            max={0.95}
            step={0.01}
            value={p}
            onChange={(e) => {
              setP(Number(e.target.value));
              if (isLive) setLabHintId("p");
            }}
            className="mt-0.5 w-full accent-sky-600"
          />
          <div className="tabular-nums text-[10px] text-slate-600">{p.toFixed(2)}</div>
        </label>
        <label className="block text-[11px] text-slate-700">
          <span className={isLive ? "text-[10px] font-medium text-slate-800" : "font-medium text-slate-800"}>
            Jury size n
          </span>
          <input
            type="range"
            min={1}
            max={25}
            step={1}
            value={n}
            onChange={(e) => {
              setN(Number(e.target.value));
              if (isLive) setLabHintId("n");
            }}
            className="mt-0.5 w-full accent-sky-600"
          />
          <div className="tabular-nums text-[10px] text-slate-600">{n}</div>
        </label>
      </div>

      <div
        className={
          isLive
            ? "mt-2 rounded border border-sky-200/80 bg-white/90 px-2 py-1.5"
            : "mt-3 rounded border border-slate-200 bg-slate-50 px-3 py-2"
        }
      >
        <div className="text-[10px] text-slate-600">P (strict majority correct)</div>
        <div
          className={
            isLive
              ? "text-base font-semibold tabular-nums text-sky-950"
              : "text-lg font-semibold tabular-nums text-slate-900"
          }
        >
          {(pAtN * 100).toFixed(1)}%
        </div>
      </div>

      <div className={isLive ? "mt-2" : "mt-3"}>
        <div className="mb-0.5 text-[9px] font-medium uppercase tracking-wide text-slate-500">
          P vs n (1 … 25)
        </div>
        <div
          className={`flex items-end gap-px rounded border border-slate-200 bg-slate-100 px-0.5 pb-0.5 pt-1 ${
            isLive ? "h-20" : "h-16"
          }`}
          role="img"
          aria-label="Bar chart of majority-correct probability versus jury size"
        >
          {curve.map((pt) => (
            <div
              key={pt.n}
              className={`min-w-0 flex-1 rounded-t ${pt.n === n ? "bg-sky-600" : "bg-sky-400/80"}`}
              style={{ height: `${Math.max(4, (pt.probability / maxProb) * 100)}%` }}
              title={`n=${pt.n}: ${(pt.probability * 100).toFixed(1)}%`}
            />
          ))}
        </div>
        <div className="mt-0.5 flex justify-between text-[8px] tabular-nums text-slate-500">
          <span>n=1</span>
          <span>n=25</span>
        </div>
      </div>
    </section>
  );
}
