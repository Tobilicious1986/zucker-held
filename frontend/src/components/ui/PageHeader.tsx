"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  showBack?: boolean;
  onBack?: () => void;
  trailing?: ReactNode;
}

export function PageHeader({
  title,
  subtitle,
  eyebrow,
  showBack = true,
  onBack,
  trailing,
}: PageHeaderProps) {
  const router = useRouter();

  return (
    <header className="page-header">
      {showBack ? (
        <button
          type="button"
          onClick={() => (onBack ? onBack() : router.back())}
          className="page-header__back"
          aria-label="Zurück"
        >
          ←
        </button>
      ) : null}

      <div className="page-header__body">
        {eyebrow ? <p className="page-eyebrow">{eyebrow}</p> : null}
        <h1 className="page-title">{title}</h1>
        {subtitle ? <p className="page-subtitle">{subtitle}</p> : null}
      </div>

      {trailing ? <div className="page-header__action">{trailing}</div> : null}
    </header>
  );
}

export default PageHeader;
