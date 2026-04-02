"use client";

import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import { db } from "@/lib/db";
import PostCard from "./PostCard";
import { TaskCard, ReportCard } from "./TaskCard";
import type { Post } from "@/types";

async function fetchPosts() {
  return db.posts.orderBy("createdAt").reverse().toArray();
}

// ── Stories strip — only photo posts ────────────────────────────────────────

function StoriesStrip({ posts }: { posts: Post[] }) {
  const photos = posts.filter((p) => !p.type || p.type === "photo").slice(0, 6);
  if (photos.length === 0) return null;

  return (
    <div className="border-b border-zinc-800/40">
      <div className="flex gap-4 overflow-x-auto px-4 py-3 no-scrollbar">
        {photos.map((post, i) => (
          <div key={post.id} className="flex-shrink-0 flex flex-col items-center gap-1.5">
            <div
              className="p-[2.5px] rounded-full"
              style={{
                background: post.aiFeedback
                  ? "linear-gradient(135deg, #a78bfa, #60a5fa)"
                  : "linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)",
              }}
            >
              <div className="p-[2px] bg-black rounded-full">
                <div className="relative w-[56px] h-[56px] rounded-full overflow-hidden bg-zinc-800">
                  <Image
                    src={post.image}
                    alt={`Entry ${i + 1}`}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
              </div>
            </div>
            <span className="text-[10px] text-zinc-500 tabular-nums">
              {new Date(post.createdAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main feed ────────────────────────────────────────────────────────────────

export default function Feed() {
  const { data: posts, isLoading, isError } = useQuery({
    queryKey: ["posts"],
    queryFn: fetchPosts,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-5 h-5 border-2 border-zinc-700 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-sm text-red-400">Failed to load posts.</p>
      </div>
    );
  }

  const photoPosts = posts?.filter((p) => !p.type || p.type === "photo") ?? [];

  if (!posts || posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center px-6">
        <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-5">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="1.5" className="w-7 h-7 text-zinc-600">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
            <circle cx="12" cy="13" r="4" />
          </svg>
        </div>
        <h2 className="text-base font-semibold text-zinc-300 mb-1.5">Start your journey</h2>
        <p className="text-sm text-zinc-600 leading-relaxed">
          Upload your first photo to begin tracking your appearance progress.
        </p>
      </div>
    );
  }

  return (
    <div className="-mx-4">
      <StoriesStrip posts={photoPosts} />
      <div className="divide-y divide-zinc-800/20">
        {posts.map((post) => {
          if (post.type === "task") return <TaskCard key={post.id} post={post} />;
          if (post.type === "report") return <ReportCard key={post.id} post={post} />;
          return <PostCard key={post.id} post={post} />;
        })}
      </div>
    </div>
  );
}
