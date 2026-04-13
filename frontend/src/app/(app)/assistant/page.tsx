"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
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
}

const CONTEXT_KEY = "zh-ai-context-v1";

const INITIAL_MESSAGE: Message = {
  role: "assistant",
  content:
    "Hallo! Ich bin dein Diabetes-KI-Assistent 🤖\n\nDu kannst mit mir chatten oder eine KH-Schätzung anfordern. Bei Notfällen bitte immer direkt den Notfall-Flow und medizinische Hilfe nutzen.",
};

export default function AssistantPage() {
  const showToast   = useUiStore((s) => s.showToast);
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [input, setInput]       = useState("");
  const [mode, setMode]         = useState<"chat" | "estimate">("chat");
  const [contextSnippet, setContextSnippet] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

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
        content: `📊 KH-Schätzung: **${data.khMid} g** (${data.khMin}–${data.khMax} g)\n\n${data.note}`,
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
      const reply: Message = {
        role: "assistant",
        content: `${data.answer}\n\nQuelle: ${data.provider}${data.usedContext ? " · mit persönlichem Kontext" : ""}`,
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

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b bg-white flex-shrink-0 space-y-3">
        <h1 className="text-xl font-bold">🤖 KI-Assistent</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setMode("chat")}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
              mode === "chat" ? "bg-zh-green text-white" : "bg-gray-100 text-zh-text"
            }`}
          >
            💬 Chat
          </button>
          <button
            onClick={() => setMode("estimate")}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
              mode === "estimate" ? "bg-zh-green text-white" : "bg-gray-100 text-zh-text"
            }`}
          >
            🍽️ KH-Schätzung
          </button>
        </div>
        <div className="rounded-xl bg-gray-50 p-3 space-y-2">
          <p className="text-xs font-semibold text-zh-text">Persönlicher Kontext (optional)</p>
          <textarea
            value={contextSnippet}
            onChange={(e) => setContextSnippet(e.target.value)}
            placeholder="z.B. Auszug aus Therapieplan oder individuelle Hinweise"
            className="w-full bg-white rounded-xl px-3 py-2 text-xs text-zh-text outline-none min-h-16"
          />
          <button
            onClick={handleSaveContext}
            className="text-xs text-zh-green font-semibold"
          >
            Kontext speichern
          </button>
        </div>
        <p className="text-[11px] text-zh-muted">
          Die KI ersetzt keine ärztliche Entscheidung. Bei Notfällen sofort Notfall-Flow nutzen.
        </p>
      </div>

      {/* Nachrichtenverlauf */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm whitespace-pre-wrap ${
                m.role === "user"
                  ? "bg-zh-green text-white rounded-br-sm"
                  : "bg-white shadow-sm text-zh-text rounded-bl-sm"
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}

        {isPending && (
          <div className="flex justify-start">
            <div className="bg-white shadow-sm px-4 py-3 rounded-2xl rounded-bl-sm text-sm text-zh-muted">
              <span className="animate-pulse">Denkt nach…</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Eingabe */}
      <div className="p-4 bg-white border-t flex gap-2 safe-bottom flex-shrink-0">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          placeholder={mode === "estimate" ? "Mahlzeit beschreiben…" : "Frage stellen…"}
          className="flex-1 bg-gray-100 rounded-2xl px-4 py-3 text-sm outline-none"
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || isPending}
          className="bg-zh-green text-white w-12 h-12 rounded-2xl text-xl disabled:opacity-50 flex items-center justify-center flex-shrink-0"
        >
          ↑
        </button>
      </div>
    </div>
  );
}
