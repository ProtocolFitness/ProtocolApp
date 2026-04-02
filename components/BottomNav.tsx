"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Home, Sparkles, Plus, ClipboardList, User } from "lucide-react";
import imageCompression from "browser-image-compression";
import { db } from "@/lib/db";

export default function BottomNav() {
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  // ── Upload ──────────────────────────────────────────────────────────────
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const compressed = await imageCompression(file, {
        maxSizeMB: 1,
        maxWidthOrHeight: 1080,
        useWebWorker: true,
      });
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (ev) => resolve(ev.target?.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(compressed);
      });
      await db.posts.add({ image: base64, createdAt: new Date(), aiFeedback: null, aiComments: null });
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["postCount"] });
    } catch (err) {
      console.error("Upload failed:", err);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-black/85 backdrop-blur-xl border-t border-zinc-800/60">
        <div className="max-w-lg mx-auto h-16 flex items-center justify-around px-2">

          {/* Home */}
          <NavLink href="/" active={pathname === "/"} label="Home">
            <Home size={22} strokeWidth={pathname === "/" ? 2.5 : 1.8} />
          </NavLink>

          {/* Analyze */}
          <NavLink href="/analyze" active={pathname === "/analyze"} label="Analyze">
            <Sparkles size={22} strokeWidth={pathname === "/analyze" ? 2.5 : 1.8} />
          </NavLink>

          {/* Add Photo — primary center button */}
          <button
            onClick={() => !uploading && fileInputRef.current?.click()}
            disabled={uploading}
            className="relative flex items-center justify-center w-14 h-14 -mt-5 rounded-full bg-white text-black shadow-lg shadow-white/20 ring-1 ring-white/10 hover:bg-zinc-100 active:scale-90 disabled:opacity-60 transition-all"
            aria-label="Add photo"
          >
            {uploading ? (
              <span className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
            ) : (
              <Plus size={26} strokeWidth={2.5} />
            )}
          </button>

          {/* Program */}
          <NavLink href="/program" active={pathname === "/program"} label="Program">
            <ClipboardList size={22} strokeWidth={pathname === "/program" ? 2.5 : 1.8} />
          </NavLink>

          {/* Profile */}
          <NavLink href="/profile" active={pathname === "/profile"} label="Profile">
            <User size={22} strokeWidth={pathname === "/profile" ? 2.5 : 1.8} />
          </NavLink>

        </div>
        {/* iOS safe area */}
        <div className="h-[env(safe-area-inset-bottom,0px)]" />
      </nav>
    </>
  );
}

function NavLink({
  href,
  active,
  label,
  children,
}: {
  href: string;
  active: boolean;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all active:scale-90 ${
        active ? "text-white" : "text-zinc-500 hover:text-zinc-200"
      }`}
    >
      {children}
      <span className="text-[10px] font-medium">{label}</span>
    </Link>
  );
}
