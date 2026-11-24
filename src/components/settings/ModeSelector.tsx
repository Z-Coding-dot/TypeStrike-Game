"use client";

import { Check, FileText, Target, Type } from "lucide-react";
import { useI18n } from "@/hooks/useI18n";
import { MODE_DESCRIPTIONS, MODE_LABELS } from "@/lib/constants";
import { useSettingsStore } from "@/stores/settingsStore";
import type { GameMode } from "@/types/game";

export interface ModeSelectorProps {
  variant?: "compact" | "full";
  className?: string;
}

const MODE_ORDER: GameMode[] = ["letters", "words", "sentences"];
const MODE_ICONS = { letters: Type, words: Target, sentences: FileText } as const;

export function ModeSelector({ variant = "full", className = "" }: ModeSelectorProps) {
  const { language, t } = useI18n();
  const selectedMode = useSettingsStore((state) => state.mode);
  const setMode = useSettingsStore((state) => state.setMode);
  const compact = variant === "compact";

  return (
    <div
      role="group"
      aria-label={t("mode")}
      data-testid="mode-selector"
      className={[
        compact ? "flex flex-wrap gap-2" : "grid w-full gap-3 sm:grid-cols-3",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {MODE_ORDER.map((mode) => {
        const selected = selectedMode === mode;
        const Icon = MODE_ICONS[mode];
        const label = MODE_LABELS[language][mode];
        const description = MODE_DESCRIPTIONS[language][mode];

        if (compact) {
          return (
            <button
              key={mode}
              type="button"
              aria-pressed={selected}
              data-testid={`mode-${mode}`}
              onClick={() => setMode(mode)}
              className={[
                "ts-chip min-h-11 cursor-pointer px-3 transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2",
                selected
                  ? "ts-chip-active"
                  : "hover:border-[var(--border-glow)] hover:text-[var(--text-primary)]",
              ].join(" ")}
            >
              {selected ? <Check aria-hidden="true" size={14} /> : null}
              <span className="whitespace-nowrap">{label}</span>
            </button>
          );
        }

        return (
          <button
            key={mode}
            type="button"
            aria-pressed={selected}
            data-testid={`mode-${mode}`}
            onClick={() => setMode(mode)}
            style={
              selected
                ? { borderColor: "var(--color-primary)", boxShadow: "var(--shadow-glow)" }
                : undefined
            }
            className={[
              "ts-card group flex min-h-44 w-full min-w-0 cursor-pointer flex-col items-start gap-3 p-4 text-start",
              "transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-glow)]",
              "focus-visible:outline-2 focus-visible:outline-offset-2",
            ].join(" ")}
          >
            <span className="inline-flex size-10 items-center justify-center rounded-md border border-[var(--border-subtle)] bg-[rgba(34,211,238,0.08)] text-[var(--color-primary)]">
              <Icon aria-hidden="true" size={20} />
            </span>
            <span className="flex w-full items-center gap-2">
              <span className="min-w-0 text-sm font-semibold text-[var(--text-primary)]">{label}</span>
              {selected ? (
                <Check aria-hidden="true" size={16} className="ms-auto shrink-0 text-[var(--color-primary)]" />
              ) : null}
            </span>
            <span className="min-w-0 text-sm leading-relaxed text-[var(--text-secondary)]">
              {description}
            </span>
          </button>
        );
      })}
    </div>
  );
}
