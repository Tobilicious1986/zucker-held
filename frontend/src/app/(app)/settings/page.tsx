"use client";

import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { useAuthStore } from "@/stores/auth.store";
import { useUiStore } from "@/stores/ui.store";

interface Settings {
  bzMin: number;
  bzMax: number;
  targetBz: number;
  insulinRatio: number;
  correctionFactor: number;
  aiProvider: string;
  notificationsEnabled: boolean;
}

const SETTING_FIELDS: Array<{
  label: string;
  key: keyof Settings;
  section: string;
  type: "number";
}> = [
  { label: "Minimum (mg/dL)",          key: "bzMin",            section: "BZ-Zielbereich", type: "number" },
  { label: "Maximum (mg/dL)",          key: "bzMax",            section: "BZ-Zielbereich", type: "number" },
  { label: "Zielwert (mg/dL)",         key: "targetBz",         section: "BZ-Zielbereich", type: "number" },
  { label: "Insulin-Faktor (g KH/IE)", key: "insulinRatio",     section: "Insulin",        type: "number" },
  { label: "Korrekturfaktor (mg/dL/IE)", key: "correctionFactor", section: "Insulin",       type: "number" },
];

export default function SettingsPage() {
  const router      = useRouter();
  const queryClient = useQueryClient();
  const clearAuth   = useAuthStore((s) => s.clearAuth);
  const profile     = useAuthStore((s) => s.activeProfile);
  const showToast   = useUiStore((s) => s.showToast);

  const { data: settings, isLoading } = useQuery<Settings>({
    queryKey: ["settings"],
    queryFn: () => apiClient.get("/api/v1/settings"),
  });

  const mutation = useMutation({
    mutationFn: (data: Partial<Settings>) => apiClient.put("/api/v1/settings", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      showToast("Einstellungen gespeichert ✅", "success");
    },
    onError: () => showToast("Fehler beim Speichern", "error"),
  });

  function handleLogout() {
    clearAuth();
    router.replace("/login");
  }

  if (isLoading || !settings) {
    return (
      <div className="flex h-full items-center justify-center text-4xl animate-pulse">⏳</div>
    );
  }

  // Felder nach Sektionen gruppieren
  const sections = [...new Set(SETTING_FIELDS.map((f) => f.section))];

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-3 pt-2">
        <button onClick={() => router.back()} className="text-2xl text-zh-muted">←</button>
        <h1 className="text-2xl font-bold">⚙️ Einstellungen</h1>
      </div>

      {/* Profil-Info */}
      <div className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-4">
        <span className="text-4xl">{profile?.avatar}</span>
        <div>
          <p className="font-semibold text-zh-text">{profile?.name}</p>
          <p className="text-sm text-zh-muted capitalize">
            {profile?.role} · {profile?.type === "kind" ? "Kind" : "Erwachsen"}
          </p>
        </div>
      </div>

      {sections.map((section) => (
        <div key={section} className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
          <h2 className="font-semibold text-zh-text">
            {section === "BZ-Zielbereich" ? "🎯" : "💉"} {section}
          </h2>
          {SETTING_FIELDS.filter((f) => f.section === section).map(({ label, key }) => (
            <div key={key}>
              <label className="text-xs text-zh-muted">{label}</label>
              <input
                type="number"
                defaultValue={settings[key] as number}
                onBlur={(e) => {
                  const val = parseFloat(e.target.value);
                  if (!isNaN(val)) mutation.mutate({ [key]: val });
                }}
                className="w-full mt-1 bg-gray-50 rounded-xl px-3 py-2 outline-none text-zh-text"
              />
            </div>
          ))}
        </div>
      ))}

      {/* KI-Provider */}
      <div className="bg-white rounded-2xl p-4 shadow-sm space-y-2">
        <h2 className="font-semibold text-zh-text">🤖 KI-Provider</h2>
        <div className="flex gap-2">
          {["claude", "openai", "gemini"].map((provider) => (
            <button
              key={provider}
              onClick={() => mutation.mutate({ aiProvider: provider })}
              className={`flex-1 py-2 rounded-xl text-sm font-medium capitalize transition-colors ${
                settings.aiProvider === provider
                  ? "bg-zh-green text-white"
                  : "bg-gray-100 text-zh-text"
              }`}
            >
              {provider}
            </button>
          ))}
        </div>
      </div>

      {/* Abmelden */}
      <button
        onClick={handleLogout}
        className="w-full bg-red-50 text-red-600 py-3 rounded-2xl font-semibold"
      >
        🚪 Abmelden
      </button>
    </div>
  );
}
