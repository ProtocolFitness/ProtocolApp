"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import { Sparkles, MoreHorizontal, TrendingUp, Bookmark } from "lucide-react";
import { getOverallScore } from "@/lib/feedback";
import { useAppStore } from "@/lib/store";
import { analyzePostLocally, regeneratePostCommentsLocally } from "@/lib/post-actions";
import AIComments from "./AIComments";
import FeedbackDisplay from "./FeedbackDisplay";
import { ReportCard, TaskCard } from "./TaskCard";
import type { Post } from "@/types";

function formatDate(date: Date) {
  const d = new Date(date);
  const now = new Date();
  const diffH = Math.floor((now.getTime() - d.getTime()) / 3_600_000);
  if (diffH < 1) return "just now";
  if (diffH < 24) return `${diffH}h ago`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 7) return `${diffD}d ago`;
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(d);
}

function PhotoPostCard({ post }: { post: Post }) {
  const queryClient = useQueryClient();
  const { analyzingPostId, setAnalyzingPostId } = useAppStore();
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [commentsError, setCommentsError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(true);
  const [loadingComments, setLoadingComments] = useState(false);

  const isAnalyzing = analyzingPostId === post.id;
  const hasAnalysis = !!post.aiFeedback;
  const comments = post.aiComments ?? [];

  const handleAnalyze = async () => {
    if (!post.id || hasAnalysis || isAnalyzing) return;
    setAnalyzeError(null);
    setAnalyzingPostId(post.id);

    try {
      await analyzePostLocally(post);
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["postCount"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["program"] });
    } catch (err) {
      setAnalyzeError(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setAnalyzingPostId(null);
    }
  };

  const handleGenerateComments = async () => {
    if (!post.id || loadingComments) return;
    setCommentsError(null);
    setLoadingComments(true);
    try {
      await regeneratePostCommentsLocally(post);
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    } catch (err) {
      setCommentsError(err instanceof Error ? err.message : "Comment generation failed");
    } finally {
      setLoadingComments(false);
    }
  };

  return (
    <article className="py-2">
      <div className="flex items-center justify-between px-4 mb-3">
        <div className="flex items-center gap-2.5">
          <div
            className="p-[2px] rounded-full flex-shrink-0"
            style={{
              background: hasAnalysis
                ? "linear-gradient(135deg, #a78bfa, #60a5fa)"
                : "linear-gradient(135deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)",
            }}
          >
            <div className="p-[2px] bg-black rounded-full">
              <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center">
                <span className="text-[11px] font-bold text-zinc-300">Y</span>
              </div>
            </div>
          </div>

          <div>
            <p className="text-[13px] font-semibold text-white leading-tight">you</p>
            <p className="text-[11px] text-zinc-500 leading-tight">{formatDate(post.createdAt)}</p>
          </div>
        </div>

        <button className="text-zinc-500 hover:text-white transition-colors p-1 -mr-1">
          <MoreHorizontal size={18} />
        </button>
      </div>

      <div className="relative w-full aspect-square bg-zinc-900">
        <Image
          src={post.image}
          alt={`Photo from ${formatDate(post.createdAt)}`}
          fill
          className="object-cover"
          unoptimized
        />
      </div>

      <div className="px-4 pt-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={handleAnalyze}
            disabled={hasAnalysis || isAnalyzing}
            aria-label={hasAnalysis ? "Analyzed" : "Analyze"}
            className={`transition-all active:scale-90 ${
              hasAnalysis
                ? "text-violet-400"
                : "text-zinc-300 hover:text-white"
            } disabled:cursor-default`}
          >
            {isAnalyzing ? (
              <span className="w-[22px] h-[22px] flex items-center justify-center">
                <span className="w-[14px] h-[14px] border-[1.5px] border-zinc-600 border-t-white rounded-full animate-spin" />
              </span>
            ) : (
              <Sparkles
                size={24}
                strokeWidth={1.8}
                fill={hasAnalysis ? "currentColor" : "none"}
              />
            )}
          </button>

          <button className="text-zinc-600 hover:text-zinc-400 transition-colors active:scale-90">
            <TrendingUp size={24} strokeWidth={1.8} />
          </button>
        </div>

        <button className="text-zinc-600 hover:text-zinc-400 transition-colors active:scale-90">
          <Bookmark size={24} strokeWidth={1.8} />
        </button>
      </div>

      {hasAnalysis && post.aiFeedback && (
        <div className="px-4 pt-2">
          <p className="text-[13px] font-semibold text-white">
            Score{" "}
            <span className="text-violet-400">{getOverallScore(post.aiFeedback).toFixed(1)}/10</span>
          </p>
        </div>
      )}

      {!hasAnalysis && !isAnalyzing && (
        <div className="px-4 pt-2">
          <button
            onClick={handleAnalyze}
            className="text-[13px] text-zinc-500 hover:text-zinc-200 transition-colors"
          >
            <span className="font-semibold text-zinc-300">Analyze</span>{" "}
            tap sparkle to get structured feedback
          </button>
        </div>
      )}

      {analyzeError && (
        <div className="px-4 pt-2">
          <p className="text-xs text-red-400 bg-red-950/40 border border-red-900/40 rounded-lg px-3 py-2">
            {analyzeError}
          </p>
        </div>
      )}

      {hasAnalysis && (
        <div className="px-4 pt-1 pb-1">
          <button
            onClick={() => setExpanded((e) => !e)}
            className="text-[12px] text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            {expanded ? "hide analysis" : "view analysis"}
          </button>
        </div>
      )}

      {hasAnalysis && expanded && post.aiFeedback && (
        <div className="px-4 pb-2 pt-1">
          <FeedbackDisplay feedback={post.aiFeedback} />
          <div className="pt-2">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[10px] font-semibold text-zinc-600 uppercase tracking-widest">
                Post Notes
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
              <p className="mt-2 text-xs text-red-400 bg-red-950/40 border border-red-900/40 rounded-lg px-3 py-2">
                {commentsError}
              </p>
            )}
            <AIComments comments={comments} />
          </div>
        </div>
      )}
    </article>
  );
}

export default function PostCard({ post }: { post: Post }) {
  if (post.type === "task") return <TaskCard post={post} />;
  if (post.type === "report") return <ReportCard post={post} />;
  return <PhotoPostCard post={post} />;
}
