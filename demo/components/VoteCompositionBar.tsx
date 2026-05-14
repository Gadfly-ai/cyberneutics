import { VoteTally } from "@/lib/insights";

interface VoteCompositionBarProps {
  tally: VoteTally;
  className?: string;
}

export function VoteCompositionBar({ tally, className = "" }: VoteCompositionBarProps) {
  const total = tally.aye + tally.nay + tally.undetermined;
  const denom = total > 0 ? total : 1;
  const pct = (x: number) => `${(x / denom) * 100}%`;

  return (
    <div
      className={`flex h-2 w-full overflow-hidden rounded bg-slate-200 ${className}`}
      title={`Aye ${tally.aye}, Nay ${tally.nay}, Undetermined ${tally.undetermined}`}
    >
      {tally.aye > 0 ? (
        <div className="min-h-full bg-emerald-500" style={{ width: pct(tally.aye) }} />
      ) : null}
      {tally.nay > 0 ? (
        <div className="min-h-full bg-rose-500" style={{ width: pct(tally.nay) }} />
      ) : null}
      {tally.undetermined > 0 ? (
        <div className="min-h-full bg-slate-400" style={{ width: pct(tally.undetermined) }} />
      ) : null}
    </div>
  );
}

export function voteTallySummary(tally: VoteTally): string {
  return `A${tally.aye} N${tally.nay} ?${tally.undetermined}`;
}
