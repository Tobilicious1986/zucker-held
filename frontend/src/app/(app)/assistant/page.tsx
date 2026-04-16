"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { PageHeader } from "@/components/ui/PageHeader";
import { useUiStore } from "@/stores/ui.store";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface AiEstimateResponse {
  khMin: number;
  khMax: number;
  khMid: number;
  note: string;
}

interface ChatResponse {
  answer: string;
  provider: string;
  usedContext: boolean;
  available: boolean;
  sourceLabel: string;
}

interface SettingsLite {
  aiProvider: string;
  aiChatAvailable: boolean;
  aiAvailabilityReason: string;
}

const CONTEXT_KEY = "zh-ai-context-v1";

const INITIAL_MESSAGE: Message = {
  role: "assistant",
  content:
    "Hallo! Ich bin dein Diabetes-KI-Assistent 🤖\n\nDu kannst mit mir chatten oder eine KH-Schätzung anfordern. Bei Notfällen bitte immer direkt den Notfall-Flow und medizinische Hilfe nutzen.",
};

function renderEstimateMessage(data: AiEstimateResponse): string {
  return `KH-Schätzung\nMitte: ${data.khMid} g\nSpanne: ${data.khMin}–${data.khMax} g\n\n${data.note}`;
}

export default function AssistantPage() {
  const showToast   = useUiStore((s) => s.showToast);
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [input, setInput]       = useState("");
  const [mode, setMode]         = useState<"chat" | "estimate">("chat");
  const [contextSnippet, setContextSnippet] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: settings } = useQuery<SettingsLite>({
    queryKey: ["settings", "assistant-lite"],
    queryFn: () => apiClient.get("/api/v1/settings"),
    staleTime: 60_000,
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(CONTEXT_KEY);
    if (stored) setContextSnippet(stored);
  }, []);

  const estimateMutation = useMutation({
    mutationFn: (description: string) =>
      apiClient.post<AiEstimateResponse>("/api/v1/ai/estimate-kh", { description }),
    onSuccess: (data) => {
      const reply: Message = {
        role: "assistant",
        content: renderEstimateMessage(data),
      };
      setMessages((prev) => [...prev, reply]);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    },
    onError: () => {
      showToast("KI nicht verfügbar. API-Schlüssel in Einstellungen prüfen.", "error");
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Leider konnte ich keine Antwort erhalten. Bitte prüfe den API-Schlüssel in den Einstellungen.",
        },
      ]);
    },
  });

  const chatMutation = useMutation({
    mutationFn: (question: string) =>
      apiClient.post<ChatResponse>("/api/v1/ai/chat", {
        question,
        contextSnippet: contextSnippet.trim() || undefined,
      }),
    onSuccess: (data) => {
      if (!data.available) {
        showToast(data.answer, "warning");
      }
      const reply: Message = {
        role: "assistant",
        content: `${data.answer}\n\nQuelle: ${data.provider} · ${data.sourceLabel}${data.usedContext ? " · mit persönlichem Kontext" : ""}`,
      };
      setMessages((prev) => [...prev, reply]);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    },
    onError: () => {
      showToast("KI-Chat aktuell nicht verfügbar.", "error");
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Ich konnte gerade keine Antwort erzeugen. Bitte später erneut versuchen.",
        },
      ]);
    },
  });

  function handleSend() {
    const pending = estimateMutation.isPending || chatMutation.isPending;
    if (!input.trim() || pending) return;
    if (mode === "chat" && settings && !settings.aiChatAvailable) {
      showToast(settings.aiAvailabilityReason, "warning");
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: settings.aiAvailabilityReason },
      ]);
      return;
    }
    const userMsg: Message = { role: "user", content: input.trim() };
    setMessages((prev) => [...prev, userMsg]);
    if (mode === "estimate") {
      estimateMutation.mutate(input.trim());
    } else {
      chatMutation.mutate(input.trim());
    }
    setInput("");
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  }

  function handleSaveContext() {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(CONTEXT_KEY, contextSnippet);
    showToast("Persönlicher Kontext gespeichert ✅", "success");
  }

  const isPending = estimateMutation.isPending || chatMutation.isPending;
  const chatDisabled = mode === "chat" && settings != null && !settings.aiChatAvailable;

  return (
    <div className="page-shell">
      <div className="page-stack h-full">
        <PageHeader
          title="KI-Assistent"
          subtitle="Chat für allgemeine Fragen oder schnelle KH-Schätzungen mit klar sichtbarer Herkunft."
        />

        <section className="surface-card p-4 space-y-4">
          <div className="segmented">
            <button
              onClick={() => setMode("chat")}
              className={`segmented__item ${mode === "chat" ? "is-active" : ""}`}
            >
              💬 Chat
            </button>
            <button
              onClick={() => setMode("estimate")}
              className={`segmented__item ${mode === "estimate" ? "is-active" : ""}`}
            >
              🍽️ KH-Schätzung
            </button>
          </div>

          {mode === "chat" && settings && (
            <div className={`rounded-2xl px-4 py-3 text-sm ${settings.aiChatAvailable ? "surface-muted text-green-700" : "warning-card text-orange-800"}`}>
              <p className="font-semibold">
                {settings.aiChatAvailable
                  ? `Aktiver Provider: ${settings.aiProvider}`
                  : "Chat vorübergehend nicht aktiv"}
              </p>
              <p className="text-xs mt-1">{settings.aiAvailabilityReason}</p>
            </div>
          )}

          <div className="surface-muted rounded-[1.5rem] p-4 space-y-3">
            <div>
              <p className="field-label">Persönlicher Kontext</p>
              <p className="text-xs text-zh-muted mt-1">
                Optionaler Kontext wird getrennt von allgemeiner Information gekennzeichnet.
              </p>
            </div>
            <textarea
              value={contextSnippet}
              onChange={(e) => setContextSnippet(e.target.value)}
              placeholder="z.B. Auszug aus Therapieplan oder individuelle Hinweise"
              className="textarea-base min-h-24"
            />
            <button onClick={handleSaveContext} className="secondary-button">
              Kontext speichern
            </button>
          </div>

          <p className="text-[11px] text-zh-muted">
            Die KI trifft keine Dosierungs- oder Therapieentscheidungen. Bei Hypo, Hyper, Ketonen, Bewusstseinsveränderung oder schweren Beschwerden sofort Notfall-Flow und medizinische Hilfe nutzen.
          </p>
        </section>

        <section className="surface-card flex-1 min-h-[22rem] p-4 space-y-3">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[88%] px-4 py-3 rounded-[1.5rem] text-sm whitespace-pre-wrap ${
                  m.role === "user"
                    ? "bg-zh-green text-white rounded-br-md"
                    : "surface-muted text-zh-text rounded-bl-md"
                }`}
              >
                {m.content}
              </div>
            </div>
          ))}

          {isPending && (
            <div className="flex justify-start">
              <div className="surface-muted px-4 py-3 rounded-[1.5rem] rounded-bl-md text-sm text-zh-muted">
                <span className="animate-pulse">Denkt nach…</span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </section>

        <section className="surface-card p-4 flex gap-2 safe-bottom">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder={
              mode === "estimate"
                ? "Mahlzeit beschreiben…"
                : chatDisabled
                  ? "Chat ist derzeit deaktiviert"
                  : "Frage stellen…"
            }
            disabled={chatDisabled}
            className="input-base flex-1"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isPending || chatDisabled}
            className="primary-button min-w-14 px-0 disabled:opacity-50"
          >
            ↑
          </button>
        </section>
      </div>
    </div>
  );
}
