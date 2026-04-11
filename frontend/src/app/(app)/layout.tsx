"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/stores/auth.store";
import { useUiStore } from "@/stores/ui.store";

const NAV_ITEMS = [
  { href: "/dashboard", emoji: "🏠", label: "Home"    },
  { href: "/bz",        emoji: "🩸", label: "BZ"      },
  { href: "/insulin",   emoji: "💉", label: "Insulin" },
  { href: "/meal",      emoji: "🍽️", label: "Mahlzeit"},
  { href: "/history",   emoji: "📊", label: "Verlauf" },
];

const TOAST_BG: Record<string, string> = {
  success: "bg-green-500",
  error:   "bg-red-500",
  warning: "bg-orange-400",
  info:    "bg-blue-500",
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter();
  const pathname = usePathname();
  const token    = useAuthStore((s) => s.token);
  const toasts   = useUiStore((s) => s.toasts);
  const dismissToast = useUiStore((s) => s.dismissToast);

  useEffect(() => {
    if (!token) router.replace("/login");
  }, [token, router]);

  if (!token) return null;

  return (
    <div className="flex flex-col h-full max-w-lg mx-auto relative">
      {/* Seiten-Inhalt */}
      <main className="flex-1 overflow-y-auto pb-20">{children}</main>

      {/* Bottom-Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 safe-bottom z-40">
        <div className="flex justify-around py-2 max-w-lg mx-auto">
          {NAV_ITEMS.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href + "/"));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-colors ${
                  active ? "text-zh-green" : "text-zh-muted"
                }`}
              >
                <span className="text-2xl leading-none">{item.emoji}</span>
                <span className="text-xs font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Toast-Container */}
      <div className="fixed top-4 right-4 flex flex-col gap-2 z-50 max-w-xs w-full pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            onClick={() => dismissToast(t.id)}
            className={`${TOAST_BG[t.type] ?? "bg-gray-700"} text-white px-4 py-3 rounded-xl shadow-lg text-sm cursor-pointer pointer-events-auto`}
          >
            {t.message}
          </div>
        ))}
      </div>
    </div>
  );
}
