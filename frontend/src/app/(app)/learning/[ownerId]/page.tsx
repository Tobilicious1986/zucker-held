"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { useAuthStore } from "@/stores/auth.store";

interface LearningAccessResponse {
  hasAccess: boolean;
  ownerName: string;
  emergencyContacts: Array<{ name?: string; phone?: string }>;
  hypoHint: string;
  hyperHint: string;
  ketoneHint: string;
  relationshipKind: "SELF" | "FAMILY" | "PROFESSIONAL" | "SCHOOL" | "LEARNING_GUEST";
  purpose: string;
  everydayPackage: {
    title: string;
    audience: string;
    actionCards: Array<{ title: string; text: string }>;
    safetyNote: string;
  };
}

/**
 * Sprint 15 — NET-03: LEARNING_ONLY-Flow.
 * Zeigt nur Notfallhilfe und Lerninhalte — keine Messwerte, keine medizinischen Daten.
 */
export default function LearningPage() {
  const { ownerId } = useParams<{ ownerId: string }>();
  const router      = useRouter();
  const profile     = useAuthStore((s) => s.activeProfile);

  const { data, isLoading, isError } = useQuery<LearningAccessResponse>({
    queryKey: ["learning-access", ownerId],
    queryFn:  () => apiClient.get(`/api/v1/profiles/${ownerId}/learning-access`),
    enabled:  !!profile,
    retry:    false,
  });

  if (!profile) {
    router.replace("/login");
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-4xl animate-pulse">⏳</div>
    );
  }

  if (isError || !data?.hasAccess) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-5 gap-4">
        <div className="text-5xl">🔒</div>
        <p className="text-center text-zh-text font-semibold">Kein Zugriff</p>
        <p className="text-sm text-zh-muted text-center">
          Du hast keinen Lernzugang für dieses Profil oder die Freigabe ist abgelaufen.
        </p>
        <button onClick={() => router.replace("/login")} className="primary-button">
          Zurück zum Login
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen page-shell">
      <div className="page-stack max-w-xl mx-auto">

        {/* Header */}
        <section className="surface-hero p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="page-eyebrow">Lern- & Notfallzugang · keine Messwerte</p>
              <h1 className="page-title mt-3">{data.ownerName}</h1>
              <p className="page-subtitle">
                Dieser Zugang zeigt ausschließlich Notfallhinweise und Lerninhalte.
              </p>
              <p className="mt-3 rounded-[1.1rem] bg-white/10 px-3 py-2 text-sm text-white/80">
                {data.purpose}
              </p>
            </div>
            <div className="rounded-[1.6rem] bg-white/15 px-4 py-3 text-4xl shadow-lg">🎓</div>
          </div>
        </section>

        {/* Notfall-SOS */}
        <section className="surface-card p-5 space-y-3">
          <div>
            <p className="section-eyebrow">Notfall</p>
            <h2 className="section-title text-xl mt-2">Sofort-Hilfe</h2>
          </div>

          <a
            href="tel:112"
            className="primary-button w-full text-center block text-lg font-bold"
          >
            🚨 Notruf 112
          </a>

          {data.emergencyContacts.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-zh-text">Notfallkontakte</p>
              {data.emergencyContacts.map((c, i) => (
                <div key={i} className="surface-muted rounded-[1.25rem] p-3 flex items-center justify-between">
                  <span className="text-sm font-medium text-zh-text">{c.name ?? "—"}</span>
                  {c.phone && (
                    <a href={`tel:${c.phone}`} className="text-zh-green font-semibold text-sm">
                      📞 {c.phone}
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Alltagspaket Sport/Schule */}
        <section className="surface-card p-5 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="section-eyebrow">Alltagspaket</p>
              <h2 className="section-title text-xl mt-2">{data.everydayPackage.title}</h2>
              <p className="section-subtitle mt-1">{data.everydayPackage.audience}</p>
            </div>
            <span className="status-pill status-pill--neutral">Keine Messwerte</span>
          </div>

          <div className="space-y-2">
            {data.everydayPackage.actionCards.map((card) => (
              <div key={card.title} className="surface-muted rounded-[1.25rem] p-4">
                <p className="font-semibold text-zh-text text-sm">{card.title}</p>
                <p className="text-sm text-zh-muted mt-1 leading-relaxed">{card.text}</p>
              </div>
            ))}
          </div>

          <div className="rounded-[1.25rem] bg-blue-50 border border-blue-100 p-4 text-sm text-blue-700 leading-relaxed">
            {data.everydayPackage.safetyNote}
          </div>
        </section>

        {/* Hypo */}
        <section className="surface-card p-5 space-y-3">
          <div>
            <p className="section-eyebrow text-red-600">Unterzucker (Hypo)</p>
            <h2 className="section-title text-xl mt-2">Blutzucker unter 70 mg/dL</h2>
          </div>
          <div className="rounded-[1.25rem] bg-red-50 border border-red-100 p-4 text-sm text-red-800 leading-relaxed">
            {data.hypoHint}
          </div>
        </section>

        {/* Hyper */}
        <section className="surface-card p-5 space-y-3">
          <div>
            <p className="section-eyebrow text-orange-600">Überzucker (Hyper)</p>
            <h2 className="section-title text-xl mt-2">Blutzucker über 250 mg/dL</h2>
          </div>
          <div className="rounded-[1.25rem] bg-orange-50 border border-orange-100 p-4 text-sm text-orange-800 leading-relaxed">
            {data.hyperHint}
          </div>
        </section>

        {/* Ketone */}
        <section className="surface-card p-5 space-y-3">
          <div>
            <p className="section-eyebrow text-purple-600">Ketone</p>
            <h2 className="section-title text-xl mt-2">Ketoazidose-Risiko</h2>
          </div>
          <div className="rounded-[1.25rem] bg-purple-50 border border-purple-100 p-4 text-sm text-purple-800 leading-relaxed">
            {data.ketoneHint}
          </div>
        </section>

        {/* Hinweis */}
        <div className="rounded-[1.25rem] bg-gray-50 border border-gray-100 p-4 text-sm text-zh-muted">
          <p className="font-medium text-zh-text">Dieser Zugang ist bewusst eingeschränkt</p>
          <p className="mt-1 leading-relaxed">
            Du siehst keine Echtzeit-Messwerte und keine persönlichen Gesundheitsdaten.
            Dieser Lernzugang dient nur Notfallhilfe und Aufklärung.
          </p>
        </div>

        <button
          onClick={() => router.replace("/login")}
          className="ghost-button w-full"
        >
          ← Zurück zur Profilauswahl
        </button>
      </div>
    </div>
  );
}
