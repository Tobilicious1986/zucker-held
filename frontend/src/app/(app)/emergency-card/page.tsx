"use client";

import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

interface Contact {
  name?: string;
  phone?: string;
}

interface Settings {
  bzMin: number;
  bzMax: number;
  contacts: string;
}

function parseContacts(raw: string): Contact[] {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default function EmergencyCardPage() {
  const router = useRouter();
  const { data: settings } = useQuery<Settings>({
    queryKey: ["settings", "emergency-card"],
    queryFn: () => apiClient.get("/api/v1/settings"),
  });

  const contacts = parseContacts(settings?.contacts ?? "[]");

  return (
    <>
      <div className="p-4 pb-10 space-y-4">
        <div className="flex items-center gap-3 pt-2 print:hidden">
          <button onClick={() => router.back()} className="text-2xl text-zh-muted">←</button>
          <h1 className="text-2xl font-bold">🆘 Notfall-Karte</h1>
        </div>

        <div className="print-card max-w-3xl mx-auto bg-white rounded-[2rem] shadow-lg border border-red-100 p-6 space-y-6">
          <div className="text-center">
            <p className="text-sm uppercase tracking-[0.25em] text-red-500 font-semibold">
              Zucker-Held
            </p>
            <h2 className="text-3xl font-bold text-zh-text mt-2">Notfall-Karte</h2>
            <p className="text-sm text-zh-muted mt-2">
              Zielbereich: {settings?.bzMin ?? 70} bis {settings?.bzMax ?? 180} mg/dL
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <section className="rounded-3xl bg-red-50 border border-red-100 p-5 space-y-3">
              <h3 className="text-lg font-bold text-red-700">⬇️ Unterzucker (Hypo)</h3>
              <ol className="space-y-2 text-sm text-zh-text list-decimal pl-5">
                <li>4 Traubenzucker oder schnelle Kohlenhydrate geben.</li>
                <li>15 Minuten warten und ruhig bleiben.</li>
                <li>Erneut BZ messen.</li>
                <li>Wenn keine Besserung: Eltern / Betreuer sofort anrufen.</li>
              </ol>
            </section>

            <section className="rounded-3xl bg-orange-50 border border-orange-100 p-5 space-y-3">
              <h3 className="text-lg font-bold text-orange-700">⬆️ Hoher BZ (Hyper)</h3>
              <ol className="space-y-2 text-sm text-zh-text list-decimal pl-5">
                <li>Wasser trinken lassen.</li>
                <li>Eltern / Betreuer informieren.</li>
                <li>Nach 1 Stunde Ketone messen.</li>
                <li>Bei hohen Ketonen oder Unwohlsein ärztliche Hilfe holen.</li>
              </ol>
            </section>
          </div>

          <section className="rounded-3xl bg-green-50 border border-green-100 p-5 space-y-3">
            <h3 className="text-lg font-bold text-green-700">📞 Wichtige Kontakte</h3>
            {contacts.length > 0 ? (
              <div className="grid gap-2">
                {contacts.map((contact, index) => (
                  <div
                    key={`${contact.name ?? "kontakt"}-${index}`}
                    className="flex items-center justify-between rounded-2xl bg-white px-4 py-3"
                  >
                    <span className="font-medium text-zh-text">{contact.name ?? "Kontakt"}</span>
                    <span className="text-sm text-zh-muted">{contact.phone ?? "Keine Nummer"}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-zh-muted">
                Noch keine Kontakte hinterlegt. Bitte in den Einstellungen ergänzen.
              </p>
            )}
          </section>

          <div className="rounded-3xl bg-gray-50 p-4 text-sm text-zh-muted">
            Diese Karte ist als schnelle Hilfe gedacht. Bei Bewusstlosigkeit oder schweren Symptomen
            sofort den Rettungsdienst rufen.
          </div>
        </div>

        <div className="print:hidden flex justify-center">
          <button
            onClick={() => window.print()}
            className="bg-zh-green text-white px-6 py-3 rounded-2xl font-semibold shadow-sm"
          >
            🖨️ Drucken
          </button>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          body {
            background: white !important;
          }

          body * {
            visibility: hidden;
          }

          .print-card,
          .print-card * {
            visibility: visible;
          }

          .print-card {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            border: 0;
            border-radius: 0;
            box-shadow: none;
            padding: 24px;
          }
        }
      `}</style>
    </>
  );
}
