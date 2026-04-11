"use client";

import { useState, useRef } from "react";
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

const INITIAL_MESSAGE: Message = {
  role: "assistant",
  content:
    "Hallo! Ich bin dein Diabetes-KI-Assistent 🤖\n\nDu kannst mir Fragen zu deiner Erkrankung stellen, z.B. die Kohlenhydrate einer Mahlzeit schätzen oder Tipps zum Umgang mit bestimmten Situationen erfragen.\n\nWas möchtest du wissen?",
};

export default function AssistantPage() {
  const showToast   = useUiStore((s) => s.showToast);
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [input, setInput]       = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const mutation = useMutation({
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

  function handleSend() {
    if (!input.trim() || mutation.isPending) return;
    const userMsg: Message = { role: "user", content: input.trim() };
    setMessages((prev) => [...prev, userMsg]);
    mutation.mutate(input.trim());
    setInput("");
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b bg-white flex-shrink-0">
        <h1 className="text-xl font-bold">🤖 KI-Assistent</h1>
        <p className="text-xs text-zh-muted">Claude · GPT-4o · Gemini</p>
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

        {mutation.isPending && (
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
          placeholder="Frage stellen oder Mahlzeit beschreiben…"
          className="flex-1 bg-gray-100 rounded-2xl px-4 py-3 text-sm outline-none"
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || mutation.isPending}
          className="bg-zh-green text-white w-12 h-12 rounded-2xl text-xl disabled:opacity-50 flex items-center justify-center flex-shrink-0"
        >
          ↑
        </button>
      </div>
    </div>
  );
}
