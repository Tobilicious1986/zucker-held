"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { useAuthStore, type ProfileInfo } from "@/stores/auth.store";
import { useUiStore } from "@/stores/ui.store";

interface ProfileListItem {
  id: string;
  name: string;
  avatar: string;
  type: "kind" | "erwachsen";
  role: "patient" | "admin" | "caregiver" | "observer";
  hasPin: boolean;
}

interface AuthResponse {
  token: string;
  refreshToken: string;
  user: ProfileInfo;
}

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const showToast = useUiStore((s) => s.showToast);

  const [selectedProfile, setSelectedProfile] = useState<ProfileListItem | null>(null);
  const [pin, setPin] = useState("");

  const { data: profiles = [], isLoading } = useQuery<ProfileListItem[]>({
    queryKey: ["profiles"],
    queryFn: () => apiClient.get("/api/v1/profiles"),
  });

  const loginMutation = useMutation({
    mutationFn: (vars: { profileId: string; pin?: string }) =>
      apiClient.post<AuthResponse>("/api/v1/auth/login", vars),
    onSuccess: (data) => {
      setAuth(data.token, data.refreshToken, data.user);
      router.replace("/dashboard");
    },
    onError: () => {
      showToast("Falscher PIN. Bitte erneut versuchen.", "error");
      setPin("");
    },
  });

  function handleProfileSelect(profile: ProfileListItem) {
    if (!profile.hasPin) {
      loginMutation.mutate({ profileId: profile.id });
    } else {
      setSelectedProfile(profile);
      setPin("");
    }
  }

  function handlePinKey(key: string) {
    if (key === "⌫") {
      setPin((p) => p.slice(0, -1));
      return;
    }
    if (pin.length >= 4) return;
    const newPin = pin + key;
    setPin(newPin);
    if (newPin.length === 4 && selectedProfile) {
      loginMutation.mutate({ profileId: selectedProfile.id, pin: newPin });
    }
  }

  if (selectedProfile) {
    return (
      <div className="min-h-screen bg-zh-bg flex flex-col items-center justify-center p-6 relative">
        <button
          onClick={() => { setSelectedProfile(null); setPin(""); }}
          className="absolute top-4 left-4 text-zh-muted text-2xl"
        >
          ←
        </button>
        <div className="text-6xl mb-4">{selectedProfile.avatar}</div>
        <h1 className="text-2xl font-bold text-zh-text mb-1">{selectedProfile.name}</h1>
        <p className="text-zh-muted mb-8">PIN eingeben</p>

        {/* PIN-Punkte */}
        <div className="flex gap-4 mb-8">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`w-4 h-4 rounded-full border-2 transition-all ${
                i < pin.length ? "bg-zh-green border-zh-green" : "border-gray-300"
              }`}
            />
          ))}
        </div>

        {/* PIN-Tastatur */}
        <div className="grid grid-cols-3 gap-3 w-72">
          {["1","2","3","4","5","6","7","8","9","","0","⌫"].map((key, idx) => (
            <button
              key={idx}
              disabled={!key}
              onClick={() => key && handlePinKey(key)}
              className={`h-16 rounded-2xl text-2xl font-semibold transition-all active:scale-95 ${
                key
                  ? "bg-white shadow text-zh-text hover:bg-gray-50"
                  : "invisible"
              }`}
            >
              {key}
            </button>
          ))}
        </div>

        {loginMutation.isPending && (
          <p className="mt-6 text-zh-muted animate-pulse">Anmelden…</p>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zh-bg flex flex-col items-center justify-center p-6">
      <div className="text-6xl mb-2">🩸</div>
      <h1 className="text-3xl font-bold text-zh-text mb-1">Zucker-Held</h1>
      <p className="text-zh-muted mb-10">Wer bist du?</p>

      {isLoading ? (
        <div className="text-4xl animate-pulse">⏳</div>
      ) : (
        <div className="flex flex-col gap-4 w-full max-w-sm">
          {profiles.map((p) => (
            <button
              key={p.id}
              onClick={() => handleProfileSelect(p)}
              className="bg-white rounded-2xl p-4 flex items-center gap-4 shadow-sm hover:shadow-md transition-all active:scale-98"
            >
              <span className="text-4xl">{p.avatar}</span>
              <div className="text-left flex-1">
                <div className="font-semibold text-zh-text">{p.name}</div>
                <div className="text-sm text-zh-muted capitalize">
                  {p.role} · {p.type === "kind" ? "Kind" : "Erwachsen"}
                </div>
              </div>
              {p.hasPin && <span className="text-gray-400">🔒</span>}
            </button>
          ))}
          {profiles.length === 0 && (
            <p className="text-center text-zh-muted text-sm">
              Keine Profile gefunden.<br />Bitte Backend starten.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
