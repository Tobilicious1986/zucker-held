"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { useAuthStore } from "@/stores/auth.store";
import { useUiStore } from "@/stores/ui.store";

const NAV_ITEMS = [
  { href: "/dashboard", emoji: "🏠", label: "Home"    },
  { href: "/bz",        emoji: "🩸", label: "BZ"      },
  { href: "/insulin",   emoji: "💉", label: "Insulin" },
  { href: "/meal",      emoji: "🍽️", label: "Mahlzeit"},
  { href: "/history",   emoji: "📊", label: "Verlauf" },
];

interface ThemeSettings {
  themeMode?: "light" | "dark" | "system";
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter();
  const pathname = usePathname();
  const token    = useAuthStore((s) => s.token);
  const ageGroup = useAuthStore((s) => s.activeProfile?.ageGroup ?? "adult");
  const toasts   = useUiStore((s) => s.toasts);
  const dismissToast = useUiStore((s) => s.dismissToast);
  const { data: themeSettings } = useQuery<ThemeSettings>({
    queryKey: ["settings", "theme"],
    queryFn: () => apiClient.get("/api/v1/settings"),
    enabled: !!token,
    staleTime: 5 * 60_000,
  });

  useEffect(() => {
    if (!token) router.replace("/login");
  }, [token, router]);

  useEffect(() => {
    const root = document.documentElement;
    const mode = themeSettings?.themeMode ?? "dark";
    if (mode === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const applySystemTheme = () => {
        root.setAttribute("data-theme", mediaQuery.matches ? "dark" : "light");
      };
      applySystemTheme();
      const add = mediaQuery.addEventListener?.bind(mediaQuery);
      const remove = mediaQuery.removeEventListener?.bind(mediaQuery);
      if (add && remove) {
        add("change", applySystemTheme);
        return () => remove("change", applySystemTheme);
      }
      mediaQuery.addListener(applySystemTheme);
      return () => mediaQuery.removeListener(applySystemTheme);
    }

    root.setAttribute("data-theme", mode);
    return () => {};
  }, [themeSettings?.themeMode]);

  useEffect(() => {
    document.documentElement.setAttribute("data-age-group", ageGroup);
  }, [ageGroup]);

  if (!token) return null;

  return (
    <div className="app-shell flex flex-col">
      <main className="app-main flex-1 overflow-y-auto">{children}</main>

      <nav className="bottom-nav-shell">
        <div className="bottom-nav">
          {NAV_ITEMS.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href + "/"));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-pill ${active ? "nav-pill--active" : ""}`}
              >
                <span className="nav-pill__icon">{item.emoji}</span>
                <span className="nav-pill__label">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="toast-stack">
        {toasts.map((t) => (
          <div
            key={t.id}
            onClick={() => dismissToast(t.id)}
            className={`toast-card ${
              t.type === "success"
                ? "toast-card--success"
                : t.type === "error"
                  ? "toast-card--error"
                  : t.type === "warning"
                    ? "toast-card--warning"
                    : "toast-card--info"
            }`}
          >
            {t.message}
          </div>
        ))}
      </div>
    </div>
  );
}
