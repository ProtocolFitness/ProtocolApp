"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import { Sparkles } from "lucide-react";
import { Playfair_Display } from "next/font/google";
import { db } from "@/lib/db";
import {
  formatCategoryLabel,
  getCategorySummaries,
  getComment,
  getDailyProgram,
  getOverallScore,
  getPriorityOrder,
  getTopImprovements,
  getWeeklyFocus,
} from "@/lib/feedback";
import { useAppStore } from "@/lib/store";
import { analyzePostLocally, regeneratePostCommentsLocally } from "@/lib/post-actions";
import AIComments from "@/components/AIComments";
import type { Post } from "@/types";

const playfair = Playfair_Display({ subsets: ["latin"], style: "italic", weight: "700" });

async function fetchLatest(): Promise<Post | null> {
  const posts = await db.posts.orderBy("createdAt").reverse().toArray();
  return posts.find((item) => !item.type || item.type === "photo") ?? null;
}

function ScoreRing({ score }: { score: number }) {
  const r = 20;
  const circ = 2 * Math.PI * r;
  const dash = (score / 10) * circ;
  const color =
    score >= 8 ? "#34d399" : score >= 6 ? "#818cf8" : score >= 4 ? "#fbbf24" : "#f87171";

  return (
    <div className="relative flex-shrink-0 w-14 h-14">
      <svg width="56" height="56" viewBox="0 0 56 56" className="-rotate-90">
        <circle cx="28" cy="28" r={r} fill="none" stroke="#27272a" strokeWidth="3.5" />
        <circle
          cx="28"
          cy="28"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-base font-bold leading-none">{score.toFixed(1)}</span>
        <span className="text-[9px] text-zinc-500 leading-none">/10</span>
      </div>
    </div>
  );
}

export default function AnalyzePage() {
  const queryClient = useQueryClient();
  const { analyzingPostId, setAnalyzingPostId } = useAppStore();
  const [error, setError] = useState<string | null>(null);
  const [commentsError, setCommentsError] = useState<string | null>(null);
  const [loadingComments, setLoadingComments] = useState(false);

  const { data: post, isLoading } = useQuery({
    queryKey: ["latestPost"],
    queryFn: fetchLatest,
  });

  const isAnalyzing = !!post?.id && analyzingPostId === post.id;
  const hasAnalysis = !!post?.aiFeedback;
  const overallScore = post?.aiFeedback ? getOverallScore(post.aiFeedback) : 0;
  const summaries = post?.aiFeedback ? getCategorySummaries(post.aiFeedback) : [];
  const priorities = post?.aiFeedback ? getPriorityOrder(post.aiFeedback) : [];
  const comment = post?.aiFeedback ? getComment(post.aiFeedback) : null;
  const improvements = post?.aiFeedback ? getTopImprovements(post.aiFeedback) : [];
  const weeklyFocus = post?.aiFeedback ? getWeeklyFocus(post.aiFeedback) : "";
  const dailyProgram = post?.aiFeedback ? getDailyProgram(post.aiFeedback) : [];
  const comments = post?.aiComments ?? [];

  const handleAnalyze = async () => {
    if (!post?.id || hasAnalysis || isAnalyzing) return;
    setError(null);
    setAnalyzingPostId(post.id);
    try {
      await analyzePostLocally(post);
      queryClient.invalidateQueries({ queryKey: ["latestPost"] });
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["program"] });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setAnalyzingPostId(null);
    }
  };

  const handleGenerateComments = async () => {
    if (!post?.id || loadingComments) return;
    setCommentsError(null);
    setLoadingComments(true);
    try {
      await regeneratePostCommentsLocally(post);
      queryClient.invalidateQueries({ queryKey: ["latestPost"] });
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    } catch (err) {
      setCommentsError(err instanceof Error ? err.message : "Comment generation failed");
    } finally {
      setLoadingComments(false);
    }
  };

  return (
    <div className="h-[100dvh] overflow-hidden flex flex-col bg-black">
      <header className="flex-shrink-0 bg-black/90 backdrop-blur-xl border-b border-zinc-800/40 z-10">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center gap-2">
          <Sparkles size={17} className="text-zinc-500" />
          <h1 className={`${playfair.className} text-[22px] text-white`}>Analyze</h1>
        </div>
      </header>

      <div className="flex-1 min-h-0 flex flex-col max-w-lg mx-auto w-full pb-16">
        {isLoading && (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-5 h-5 border-2 border-zinc-700 border-t-white rounded-full animate-spin" />
          </div>
        )}

        {!isLoading && !post && (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center px-6">
            <Sparkles size={36} className="text-zinc-700" />
            <p className="text-base font-semibold text-zinc-400">No photos yet</p>
            <p className="text-sm text-zinc-600">Tap + to upload your first photo.</p>
          </div>
        )}

        {!isLoading && post && (
          <>
            <div
              className="relative w-full flex-shrink-0"
              style={{ height: "clamp(160px, 38dvh, 360px)" }}
            >
              <Image
                src={post.image}
                alt="Most recent photo"
                fill
                className="object-cover"
                unoptimized
              />
              <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black to-transparent" />
              <span className="absolute top-3 right-3 text-[11px] text-zinc-300 bg-black/50 backdrop-blur-sm px-2 py-1 rounded-full">
                {new Intl.DateTimeFormat("en-US", {
                  month: "short", day: "numeric", year: "numeric",
                }).format(new Date(post.createdAt))}
              </span>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-4 pt-3 pb-2 flex flex-col gap-3">
              {!hasAnalysis && (
                <div className="flex-1 flex flex-col items-center justify-center gap-4">
                  {error && (
                    <p className="text-xs text-red-400 bg-red-950/40 border border-red-900/40 rounded-lg px-3 py-2 w-full text-center">
                      {error}
                    </p>
                  )}
                  <button
                    onClick={handleAnalyze}
                    disabled={isAnalyzing}
                    className="flex items-center gap-2.5 px-8 py-3.5 bg-white text-black text-sm font-bold rounded-full shadow-lg shadow-white/10 hover:bg-zinc-100 active:scale-95 disabled:opacity-50 transition-all"
                  >
                    {isAnalyzing ? (
                      <>
                        <span className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Sparkles size={15} />
                        Analyze this photo
                      </>
                    )}
                  </button>
                  <p className="text-xs text-zinc-600">Structured appearance model + action plan</p>
                </div>
              )}

              {hasAnalysis && post.aiFeedback && (
                <>
                  <div className="flex items-start gap-3 flex-shrink-0">
                    <ScoreRing score={overallScore} />
                    <div className="space-y-1">
                      <p className="text-[13px] text-zinc-300 leading-relaxed pt-1">
                        {comment?.text}
                      </p>
                      <p className="text-[11px] text-zinc-500">
                        Focus: <span className="text-zinc-300">{comment?.focus}</span>
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 flex-shrink-0">
                    {summaries.map((item) => (
                      <div
                        key={item.key}
                        className="rounded-xl border border-zinc-800/60 bg-zinc-900 p-3"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] font-semibold text-zinc-300">{item.label}</span>
                          <span className="text-[11px] text-zinc-500">{item.score.toFixed(1)}</span>
                        </div>
                        <p className="text-[11px] text-zinc-500 leading-snug mt-1.5">{item.notes}</p>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2">
                    <p className="text-[10px] font-semibold text-zinc-600 uppercase tracking-widest">
                      Priority Order
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {priorities.map((item, index) => (
                        <span
                          key={`${item}-${index}`}
                          className="rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1 text-[11px] text-zinc-300"
                        >
                          {index + 1}. {formatCategoryLabel(item)}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex-shrink-0 space-y-1.5 pb-2">
                    <p className="text-[10px] font-semibold text-zinc-600 uppercase tracking-widest">
                      Top improvements
                    </p>
                    {improvements.map((item, i) => (
                      <div key={i} className="flex items-start gap-2.5">
                        <span className="flex-shrink-0 mt-0.5 w-[18px] h-[18px] rounded-full bg-white/[0.05] border border-zinc-700/60 flex items-center justify-center text-[9px] text-zinc-400 font-bold">
                          {i + 1}
                        </span>
                        <p className="text-[12px] text-zinc-300 leading-snug">{item}</p>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-xl border border-zinc-800/60 bg-zinc-900 p-3 space-y-2">
                    <p className="text-[10px] font-semibold text-zinc-600 uppercase tracking-widest">
                      Weekly focus
                    </p>
                    <p className="text-[12px] text-zinc-300 leading-snug">{weeklyFocus}</p>
                    {dailyProgram.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        {dailyProgram.slice(0, 3).map((item, index) => (
                          <div key={`${item.task}-${index}`} className="flex items-center justify-between gap-3">
                            <p className="text-[12px] text-zinc-300">{item.task}</p>
                            <span className="text-[10px] uppercase tracking-wider text-zinc-500">{item.priority}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 pb-2">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-[10px] font-semibold text-zinc-600 uppercase tracking-widest">
                        AI comments
                      </p>
                      <button
                        onClick={handleGenerateComments}
                        disabled={loadingComments}
                        className="text-[11px] text-zinc-500 hover:text-zinc-300 transition-colors disabled:opacity-40"
                      >
                        {loadingComments ? "Generating..." : comments.length > 0 ? "Refresh comments" : "Generate comments"}
                      </button>
                    </div>
                    {commentsError && (
                      <p className="text-xs text-red-400 bg-red-950/40 border border-red-900/40 rounded-lg px-3 py-2">
                        {commentsError}
                      </p>
                    )}
                    <AIComments comments={comments} />
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
