"use client";

import type { AIComment } from "@/types";

export default function AIComments({ comments }: { comments: AIComment[] }) {
  if (comments.length === 0) return null;

  return (
    <div className="space-y-2 pt-2">
      <p className="text-[10px] font-semibold text-zinc-600 uppercase tracking-widest">
        AI Comments
      </p>
      {comments.map((comment, index) => (
        <div
          key={`${comment.focus}-${index}`}
          className="rounded-xl border border-zinc-800/60 bg-zinc-900 px-3 py-2.5"
        >
          <div className="flex items-center justify-between gap-3">
            <span className="text-[10px] uppercase tracking-wider text-zinc-500">
              {comment.focus}
            </span>
            <span className="text-[10px] text-zinc-600">AI</span>
          </div>
          <p className="text-[12px] text-zinc-300 leading-snug mt-1">{comment.text}</p>
        </div>
      ))}
    </div>
  );
}
