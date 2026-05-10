"use client";

import { useRef } from "react";
import { repoBlobUrl } from "@/lib/repoUrls";

const DEMO_README_URL = repoBlobUrl("demo/README.md");
const ADVERSARIAL_COMMITTEES_URL = repoBlobUrl("artifacts/adversarial-committees.md");

const GLOSSARY: { term: string; definition: string }[] = [
  {
    term: "Adversarial committee",
    definition:
      "Several model-backed roles with different lenses answer the same question in rounds, so disagreement and blind spots surface before any single narrative wins.",
  },
  {
    term: "Naive path",
    definition:
      "One completion from one system prompt on your question—the baseline “single voice” answer the committee is compared against.",
  },
  {
    term: "Phase / round",
    definition:
      "A committee stage: first responses, cross-examination, then optional follow-up rounds. Local demo uses fixed scripts; API mode runs the full pipeline.",
  },
  {
    term: "Server-Sent Events (SSE)",
    definition:
      "How `/api/committee` streams partial text to the browser so you see characters type incrementally.",
  },
  {
    term: "Execution mode",
    definition:
      "Auto, local, or API: whether this run uses in-repo demo text or calls Anthropic. Your API key stays on the server (`.env.local`), never in the browser.",
  },
  {
    term: "Local demo",
    definition:
      "Deterministic canned answers and scores—works with no key so you can explore the UI and code paths offline.",
  },
  {
    term: "Evaluator / rubric",
    definition:
      "Structured scores on a transcript (clarity, dissent capture, etc.). The UI runs evaluation separately for the naive output and the committee transcript.",
  },
  {
    term: "Characters",
    definition:
      "The fixed roster (Maya, Frankie, Joe, Vic, Tammy)—each has a system prompt defining how they push back; see `lib/characters.ts` in the repo.",
  },
  {
    term: "Research (API only)",
    definition:
      "Before round one, each character can run a research step; local demo skips this and uses scripted round-one text.",
  },
];

export function AboutDemoDialog() {
  const dialogRef = useRef<HTMLDialogElement>(null);

  return (
    <>
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        className="rounded-full border border-slate-300 bg-white px-3 py-1 text-slate-700 transition hover:border-sky-500"
      >
        About this demo
      </button>
      <dialog
        ref={dialogRef}
        className="w-[min(100%,36rem)] max-w-[calc(100vw-2rem)] rounded-2xl border border-slate-300 bg-white p-0 shadow-xl backdrop:bg-slate-900/45 open:flex open:max-h-[min(85vh,40rem)] open:flex-col"
        aria-labelledby="about-demo-title"
      >
        <div className="flex min-h-0 max-h-[min(85vh,40rem)] flex-col">
          <header className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-200 px-5 py-4">
            <h2 id="about-demo-title" className="text-base font-semibold text-slate-900">
              About this demo
            </h2>
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              className="rounded-md border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Close
            </button>
          </header>
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 text-sm leading-relaxed text-slate-700">
            <p className="mb-3">
              The same question goes down two paths: a <strong>single-call “naive” answer</strong> and an{" "}
              <strong>adversarial committee</strong> (multiple characters, multiple rounds). Both can be scored with
              the same rubric so you can compare architectures, not just prose.
            </p>
            <p className="mb-4">
              This illustrates ideas from the Cyberneutics repo—especially{" "}
              <a
                href={ADVERSARIAL_COMMITTEES_URL}
                target="_blank"
                rel="noreferrer"
                className="font-medium text-sky-700 underline-offset-2 hover:underline"
              >
                adversarial committees
              </a>
              . Built for <strong>your machine</strong>; optional Anthropic key for live models.
            </p>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Key terms</h3>
            <dl className="space-y-3">
              {GLOSSARY.map(({ term, definition }) => (
                <div key={term}>
                  <dt className="font-semibold text-slate-900">{term}</dt>
                  <dd className="mt-0.5 text-slate-600">{definition}</dd>
                </div>
              ))}
            </dl>
          </div>
          <footer className="shrink-0 border-t border-slate-200 px-5 py-3 text-xs text-slate-600">
            <a
              href={DEMO_README_URL}
              target="_blank"
              rel="noreferrer"
              className="font-medium text-sky-700 underline-offset-2 hover:underline"
            >
              Full documentation: demo/README.md on GitHub
            </a>
            <span className="text-slate-400"> — architecture, modes, and troubleshooting.</span>
          </footer>
        </div>
      </dialog>
    </>
  );
}
