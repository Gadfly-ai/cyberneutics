import type { ReactNode } from "react";

interface TechnicalBreakoutProps {
  title: string;
  summary?: string;
  children: ReactNode;
  className?: string;
}

export function AlgorithmBlock({ children }: { children: string }) {
  return (
    <pre className="overflow-x-auto rounded-md border border-slate-200 bg-slate-950 p-3 text-[11px] leading-relaxed text-slate-100">
      <code>{children}</code>
    </pre>
  );
}

export function TechnicalBreakout({
  title,
  summary = "Technical detail",
  children,
  className = "",
}: TechnicalBreakoutProps) {
  return (
    <details className={`rounded-md border border-slate-200 bg-white ${className}`}>
      <summary className="cursor-pointer list-none px-3 py-2 text-xs font-semibold text-slate-800 marker:hidden [&::-webkit-details-marker]:hidden">
        <span className="inline-flex items-center gap-2">
          <span aria-hidden>&rsaquo;</span>
          <span>{summary}</span>
          <span className="font-normal text-slate-500">{title}</span>
        </span>
      </summary>
      <div className="space-y-3 border-t border-slate-200 p-3 text-xs leading-relaxed text-slate-700">
        {children}
      </div>
    </details>
  );
}
