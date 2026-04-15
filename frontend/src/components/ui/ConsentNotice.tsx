"use client";

import type { ReactNode } from "react";

type ConsentTone = "info" | "warning" | "success";

interface ConsentNoticeProps {
  title: string;
  text: string;
  tone?: ConsentTone;
  badge?: string;
  action?: ReactNode;
}

const TONE_CLASSES: Record<ConsentTone, string> = {
  info: "border-blue-200 bg-blue-50 text-blue-900",
  warning: "border-orange-200 bg-orange-50 text-orange-900",
  success: "border-green-200 bg-green-50 text-green-900",
};

const TONE_EMOJI: Record<ConsentTone, string> = {
  info: "ℹ️",
  warning: "⚠️",
  success: "✅",
};

export function ConsentNotice({
  title,
  text,
  tone = "info",
  badge = "Freigabehinweis",
  action,
}: ConsentNoticeProps) {
  return (
    <aside className={`rounded-[1.4rem] border px-4 py-4 shadow-sm ${TONE_CLASSES[tone]}`}>
      <div className="flex items-start gap-3">
        <span className="text-xl">{TONE_EMOJI[tone]}</span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] opacity-75">
            {badge}
          </p>
          <h3 className="mt-1 text-sm font-bold leading-tight">{title}</h3>
          <p className="mt-1 text-sm leading-6 opacity-90">{text}</p>
          {action ? <div className="mt-3">{action}</div> : null}
        </div>
      </div>
    </aside>
  );
}

export default ConsentNotice;
