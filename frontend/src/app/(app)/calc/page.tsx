"use client";

import { useRouter } from "next/navigation";

export default function CalcPage() {
  const router = useRouter();
  return (
    <div className="p-4">
      <div className="flex items-center gap-3 pt-2 mb-4">
        <button onClick={() => router.back()} className="text-2xl text-zh-muted">←</button>
        <h1 className="text-2xl font-bold">🧮 KH-Rechner</h1>
      </div>
      <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
        <p className="text-5xl mb-4">🚧</p>
        <p className="font-semibold text-zh-text mb-2">Kommt bald</p>
        <p className="text-zh-muted text-sm">
          KH-Rechner mit Lebensmittel-Datenbank,<br />Barcode-Scanner und Open Food Facts<br />
          wird in Phase 2b implementiert.
        </p>
      </div>
    </div>
  );
}
