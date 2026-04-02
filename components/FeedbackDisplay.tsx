"use client";

import {
  formatCategoryLabel,
  getCategorySummaries,
  getComment,
  getDailyProgram,
  getOverallScore,
  getPriorityOrder,
  getStructuralRead,
  getTopImprovements,
  getWeeklyFocus,
  scoreToRating,
} from "@/lib/feedback";
import type { AIFeedback } from "@/types";

interface FeedbackDisplayProps {
  feedback: AIFeedback;
}

function ScoreRing({ score }: { score: number }) {
  const r = 18;
  const circ = 2 * Math.PI * r;
  const dash = (score / 10) * circ;
  const color =
    score >= 8 ? "#34d399" : score >= 6 ? "#818cf8" : score >= 4 ? "#fbbf24" : "#f87171";

  return (
    <div className="relative flex-shrink-0 w-14 h-14">
      <svg width="56" height="56" viewBox="0 0 56 56" className="-rotate-90">
        <circle cx="28" cy="28" r={r} fill="none" stroke="#27272a" strokeWidth="4" />
        <circle
          cx="28"
          cy="28"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-sm font-bold leading-none">{score}</span>
        <span className="text-[9px] text-zinc-500 leading-none">/10</span>
      </div>
    </div>
  );
}

function MetricCard({
  label,
  score,
  notes,
}: {
  label: string;
  score: number;
  notes: string;
}) {
  return (
    <div className="rounded-xl border border-zinc-800/60 bg-zinc-900 p-3 space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-semibold text-zinc-300 uppercase tracking-wider">{label}</span>
        <span className="text-[11px] font-medium text-zinc-500">{scoreToRating(score)}</span>
      </div>
      <p className="text-lg font-bold text-white tabular-nums">{score.toFixed(1)}</p>
      <p className="text-[11px] text-zinc-500 leading-snug">{notes}</p>
    </div>
  );
}

export default function FeedbackDisplay({ feedback }: FeedbackDisplayProps) {
  const overallScore = getOverallScore(feedback);
  const summaries = getCategorySummaries(feedback);
  const priorityOrder = getPriorityOrder(feedback);
  const comment = getComment(feedback);
  const structuralRead = getStructuralRead(feedback);
  const improvements = getTopImprovements(feedback);
  const weeklyFocus = getWeeklyFocus(feedback);
  const dailyProgram = getDailyProgram(feedback);

  return (
    <div className="space-y-4 pt-3 border-t border-zinc-800/40">
      <div className="flex items-start gap-3">
        <ScoreRing score={overallScore} />
        <div className="space-y-1.5">
          <p className="text-[13px] text-zinc-300 leading-relaxed">{comment.text}</p>
          <p className="text-[11px] text-zinc-500">
            Focus: <span className="text-zinc-300">{comment.focus}</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {summaries.map((item) => (
          <MetricCard
            key={item.key}
            label={item.label}
            score={item.score}
            notes={item.notes}
          />
        ))}
      </div>

      <div className="rounded-xl border border-zinc-800/60 bg-zinc-900 p-3 space-y-2">
        <p className="text-[10px] font-semibold text-zinc-600 uppercase tracking-widest">
          Structural Read
        </p>
        <p className="text-[12px] text-zinc-300">
          Face shape: {structuralRead.faceShape}
        </p>
        <p className="text-[11px] text-zinc-500">
          Symmetry {structuralRead.symmetryScore.toFixed(2)} • Width/height {structuralRead.widthToHeight.toFixed(2)} • Eye spacing {structuralRead.eyeSpacing.toFixed(2)}
        </p>
      </div>

      <div className="space-y-2">
        <p className="text-[10px] font-semibold text-zinc-600 uppercase tracking-widest">
          Priority Order
        </p>
        <div className="flex flex-wrap gap-2">
          {priorityOrder.map((item, index) => (
            <span
              key={`${item}-${index}`}
              className="rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1 text-[11px] text-zinc-300"
            >
              {index + 1}. {formatCategoryLabel(item)}
            </span>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-[10px] font-semibold text-zinc-600 uppercase tracking-widest">
          Top Improvements
        </p>
        <div className="space-y-2">
          {improvements.map((item, i) => (
            <div key={i} className="flex items-start gap-2.5">
              <span className="flex-shrink-0 mt-0.5 w-[18px] h-[18px] rounded-full bg-white/[0.05] border border-zinc-700/60 flex items-center justify-center text-[9px] text-zinc-400 font-bold">
                {i + 1}
              </span>
              <p className="text-[12px] text-zinc-300 leading-snug">{item}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-zinc-800/60 bg-zinc-900 p-3 space-y-2">
        <p className="text-[10px] font-semibold text-zinc-600 uppercase tracking-widest">
          Weekly Focus
        </p>
        <p className="text-[12px] text-zinc-300 leading-snug">{weeklyFocus}</p>
        <div className="space-y-1.5 pt-1">
          {dailyProgram.slice(0, 4).map((item, index) => (
            <div key={`${item.task}-${index}`} className="flex items-center justify-between gap-3">
              <p className="text-[12px] text-zinc-300">{item.task}</p>
              <span className="text-[10px] uppercase tracking-wider text-zinc-500">{item.priority}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
