"use client";

import { Languages } from "lucide-react";
import { useI18n } from "@/hooks/useI18n";
import { useLanguage } from "@/hooks/useLanguage";
import { LANGUAGE_DEFINITIONS, type LanguageCode } from "@/types/language";

export interface LanguageSelectorProps {
  compact?: boolean;
  className?: string;
}

const LANGUAGE_ORDER: LanguageCode[] = ["en", "fa-AF"];

export function LanguageSelector({ compact = false, className = "" }: LanguageSelectorProps) {
  const { language, setLanguage } = useLanguage();
  const { t } = useI18n();

  return (
    <div
      role="group"
      aria-label={t("language")}
      data-testid="language-selector"
      className={["inline-flex min-w-0 flex-wrap items-center gap-2", className].filter(Boolean).join(" ")}
    >
      {compact ? null : (
        <Languages aria-hidden="true" size={18} className="shrink-0 text-[var(--color-primary)]" />
      )}
      {LANGUAGE_ORDER.map((code) => {
        const definition = LANGUAGE_DEFINITIONS[code];
        const selected = language === code;
        return (
          <button
            key={code}
            type="button"
            lang={code}
            aria-pressed={selected}
            data-testid={`language-${code === "en" ? "en" : "fa"}`}
            onClick={() => setLanguage(code)}
            className={[
              "ts-chip min-h-11 cursor-pointer px-3 transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2",
              selected
                ? "ts-chip-active"
                : "hover:border-[var(--border-accent)] hover:text-[var(--text-strong)]",
            ].join(" ")}
          >
            <span dir={definition.direction} lang={code} className="whitespace-nowrap">
              {definition.nativeLabel}
            </span>
            {code !== "en" && !compact ? (
              <span dir="ltr" className={`whitespace-nowrap ${selected ? "opacity-85" : "text-[var(--text-subtle)]"}`}>
                {definition.label}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
