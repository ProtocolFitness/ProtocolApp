"use client";

import { CheckCircle2, Droplets, Scissors, Shirt, Dumbbell, FileText } from "lucide-react";
import type { Post, TaskCategory } from "@/types";

const CAT_ICON: Record<TaskCategory, React.ElementType> = {
  skin:     Droplets,
  grooming: Scissors,
  style:    Shirt,
  fitness:  Dumbbell,
};

const CAT_COLOR: Record<TaskCategory, string> = {
  skin:     "text-sky-400 bg-sky-400/10",
  grooming: "text-violet-400 bg-violet-400/10",
  style:    "text-amber-400 bg-amber-400/10",
  fitness:  "text-emerald-400 bg-emerald-400/10",
};

function formatDate(date: Date) {
  const d = new Date(date);
  const now = new Date();
  const diffH = Math.floor((now.getTime() - d.getTime()) / 3_600_000);
  if (diffH < 1) return "just now";
  if (diffH < 24) return `${diffH}h ago`;
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(d);
}

export function TaskCard({ post }: { post: Post }) {
  const cat = post.taskCategory;
  const Icon = cat ? CAT_ICON[cat] : CheckCircle2;
  const colorClass = cat ? CAT_COLOR[cat] : "text-zinc-400 bg-zinc-800";

  return (
    <article className="py-3 px-4">
      <div className="flex items-start gap-3 bg-zinc-900/60 border border-zinc-800/50 rounded-2xl px-4 py-3">
        <div className={`flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center ${colorClass}`}>
          <Icon size={15} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold text-white flex items-center gap-1.5">
            <CheckCircle2 size={13} className="text-emerald-400 flex-shrink-0" />
            Completed a task
          </p>
          <p className="text-sm text-zinc-300 leading-snug mt-0.5">{post.taskTitle}</p>
          <p className="text-[11px] text-zinc-600 mt-1">{formatDate(post.createdAt)}</p>
        </div>
      </div>
    </article>
  );
}

export function ReportCard({ post }: { post: Post }) {
  return (
    <article className="py-3 px-4">
      <div className="flex items-start gap-3 bg-violet-500/5 border border-violet-500/20 rounded-2xl px-4 py-3">
        <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-violet-400/10 flex items-center justify-center">
          <FileText size={15} className="text-violet-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold text-violet-300">Weekly Report</p>
          <p className="text-sm text-zinc-300 leading-snug mt-0.5">{post.reportSummary}</p>
          <p className="text-[11px] text-zinc-600 mt-1">{formatDate(post.createdAt)}</p>
        </div>
      </div>
    </article>
  );
}
