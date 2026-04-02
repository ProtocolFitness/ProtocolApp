"use client";

import { useQuery } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import { Playfair_Display } from "next/font/google";
import { db } from "@/lib/db";

const playfair = Playfair_Display({ subsets: ["latin"], style: "italic", weight: "700" });

async function getPostCount() {
  return db.posts.count();
}

export default function Header() {
  const { data: count = 0 } = useQuery({
    queryKey: ["postCount"],
    queryFn: getPostCount,
  });

  return (
    <header className="sticky top-0 z-40 bg-black/90 backdrop-blur-xl border-b border-zinc-800/40">
      <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
        <h1 className={`${playfair.className} text-[26px] text-white tracking-tight`}>
          Looksmaxx
        </h1>

        <div className="flex items-center gap-3">
          {count > 0 && (
            <span className="text-xs text-zinc-600 tabular-nums">{count}</span>
          )}
          <button
            aria-label="Notifications"
            className="text-zinc-400 hover:text-white transition-colors active:scale-90"
          >
            <Bell size={21} strokeWidth={1.8} />
          </button>
        </div>
      </div>
    </header>
  );
}
