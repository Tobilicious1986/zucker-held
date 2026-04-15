"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { apiClient, ApiError } from "@/lib/api-client";
import { useAuthStore, type ProfileInfo } from "@/stores/auth.store";

const AVATARS = ["🦊","🐻","🐶","🦁","🐯","🦋","🐸","🦄","🐼","🦖","🐉","🦅"];

interface RegisterResponse {
  token: string;
  refreshToken: string;
  profile: ProfileInfo;
}

interface Props {
  onCancel: () => void;
}

export function RegisterForm({ onCancel }: Props) {
  const router  = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  const [name, setName]         = useState("");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [avatar, setAvatar]     = useState("🦊");
  const [type, setType]         = useState<"kind" | "erwachsen">("erwachsen");
  const [error, setError]       = useState<string | null>(null);

  const registerMutation = useMutation({
    mutationFn: () =>
      apiClient.post<RegisterResponse>("/api/v1/auth/register", {
        name,
        email,
        password,
        avatar,
        type,
      }),
    onSuccess: (data) => {
      setAuth(data.token, data.refreshToken, data.profile);
      router.replace("/dashboard");
    },
    onError: (err: unknown) => {
      if (err instanceof ApiError && err.status === 409) {
        setError("Diese E-Mail-Adresse ist bereits vergeben.");
        return;
      }
      setError("Registrierung fehlgeschlagen. Bitte später erneut versuchen.");
    },
  });

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Bitte gib einen Namen ein.");
      return;
    }
    if (!email.includes("@")) {
      setError("Bitte eine gültige E-Mail-Adresse eingeben.");
      return;
    }
    if (password.length < 8) {
      setError("Das Passwort muss mindestens 8 Zeichen haben.");
      return;
    }

    registerMutation.mutate();
  }

  return (
    <div className="w-full max-w-sm space-y-5">
      <div className="surface-hero p-6 text-center">
        <div className="text-5xl mb-3">{avatar}</div>
        <p className="page-eyebrow">Willkommen bei Zucker-Held</p>
        <h1 className="page-title mt-2">Neues Konto</h1>
        <p className="page-subtitle">Erstelle dein persönliches Profil.</p>
      </div>

      <form onSubmit={handleSubmit} className="surface-card p-6 space-y-4">
        <div className="space-y-1">
          <label className="text-sm font-semibold text-zh-text">Name</label>
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="z. B. Malte"
            maxLength={100}
            className="input-base w-full"
            autoFocus
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-semibold text-zh-text">E-Mail</label>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="name@beispiel.de"
            className="input-base w-full"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-semibold text-zh-text">Passwort</label>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Mindestens 8 Zeichen"
            minLength={8}
            className="input-base w-full"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-semibold text-zh-text">Ich bin…</label>
          <div className="flex gap-2">
            {(["kind", "erwachsen"] as const).map((currentType) => (
              <button
                key={currentType}
                type="button"
                onClick={() => setType(currentType)}
                className={`flex-1 rounded-[1.2rem] border-2 py-3 text-sm font-semibold transition-all ${
                  type === currentType
                    ? "border-zh-green bg-zh-green/10 text-zh-green"
                    : "border-gray-200 text-zh-muted"
                }`}
              >
                {currentType === "kind" ? "👦 Kind / Jugendlich" : "🧑 Erwachsen"}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-zh-text">Dein Avatar</label>
          <div className="grid grid-cols-6 gap-2">
            {AVATARS.map((currentAvatar) => (
              <button
                key={currentAvatar}
                type="button"
                onClick={() => setAvatar(currentAvatar)}
                className={`h-11 w-full rounded-[1rem] text-2xl transition-all ${
                  avatar === currentAvatar
                    ? "bg-zh-green/20 ring-2 ring-zh-green scale-110"
                    : "bg-gray-50 hover:bg-gray-100"
                }`}
              >
                {currentAvatar}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
        )}

        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="secondary-button w-full"
            disabled={registerMutation.isPending}
          >
            Zurück
          </button>
          <button
            type="submit"
            disabled={registerMutation.isPending}
            className="primary-button w-full disabled:opacity-50"
          >
            {registerMutation.isPending ? "Registriere…" : "Konto erstellen"}
          </button>
        </div>
      </form>
    </div>
  );
}
