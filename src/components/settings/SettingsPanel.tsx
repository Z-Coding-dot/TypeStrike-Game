"use client";

import { MessageSquare, RotateCcw, Settings2, Sparkles, Trash, Volume2, X } from "lucide-react";
import { useId, type ReactNode } from "react";
import { IconButton } from "@/components/ui/IconButton";
import { Button } from "@/components/ui/Button";
import { useI18n } from "@/hooks/useI18n";
import { useGameStore } from "@/stores/gameStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { useStatsStore } from "@/stores/statsStore";
import { LanguageSelector } from "./LanguageSelector";
import { ModeSelector } from "./ModeSelector";

export interface SettingsPanelProps {
  compact?: boolean;
  onClose?: () => void;
  /** Overrides the default restart event (used by the standalone settings page). */
  onRestart?: () => void;
  /** Set false when the surrounding page already provides the heading. */
  showHeader?: boolean;
}

interface ToggleRowProps {
  label: string;
  onText: string;
  offText: string;
  checked: boolean;
  icon: ReactNode;
  testId: string;
  onChange: (checked: boolean) => void;
}

function ToggleRow({ label, onText, offText, checked, icon, testId, onChange }: ToggleRowProps) {
  const labelId = useId();

  return (
    <div className="flex min-h-11 items-center justify-between gap-3 rounded-md border border-[var(--border-default)] bg-[var(--layer-input)] px-3 py-2">
      <span className="flex min-w-0 items-center gap-2 text-sm text-[var(--text-default)]">
        <span aria-hidden="true" className="shrink-0 text-[var(--color-primary)]">
          {icon}
        </span>
        <span id={labelId} className="min-w-0 break-words">
          {label}
        </span>
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={labelId}
        data-testid={testId}
        onClick={() => onChange(!checked)}
        className="flex min-h-11 min-w-16 shrink-0 cursor-pointer items-center justify-end gap-2 rounded-md px-1 text-xs text-[var(--text-subtle)] transition-colors duration-200 hover:text-[var(--text-strong)] focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        <span aria-hidden="true" className="whitespace-nowrap">
          {checked ? onText : offText}
        </span>
        <span
          aria-hidden="true"
          className={[
            "relative block h-6 w-11 shrink-0 rounded-full border transition-colors duration-200",
            checked
              ? "border-[var(--border-accent)] bg-[var(--surface-selected)]"
              : "border-[var(--border-strong)] bg-[var(--surface-hover)]",
          ].join(" ")}
        >
          <span
            className={[
              "absolute top-0.5 block size-5 rounded-full bg-current transition-all duration-200",
              checked ? "text-[var(--color-primary)]" : "text-[var(--text-muted)]",
            ].join(" ")}
            style={{ insetInlineStart: checked ? "calc(100% - 1.375rem)" : "0.125rem" }}
          />
        </span>
      </button>
    </div>
  );
}

interface SliderRowProps {
  label: string;
  value: number;
  displayValue: string;
  min: number;
  max: number;
  step: number;
  testId: string;
  onChange: (value: number) => void;
}

function SliderRow({ label, value, displayValue, min, max, step, testId, onChange }: SliderRowProps) {
  const inputId = useId();

  return (
    <div className="rounded-md border border-[var(--border-default)] bg-[var(--layer-input)] px-3 py-2">
      <div className="flex min-h-8 items-center justify-between gap-3">
        <label htmlFor={inputId} className="min-w-0 text-sm text-[var(--text-default)]">
          {label}
        </label>
        <span dir="ltr" className="ts-numeric shrink-0 text-xs text-[var(--text-subtle)]">
          {displayValue}
        </span>
      </div>
      <input
        id={inputId}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        data-testid={testId}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-11 w-full cursor-pointer accent-[var(--color-primary)] focus-visible:outline-2 focus-visible:outline-offset-2"
      />
    </div>
  );
}

export function SettingsPanel({
  compact = false,
  onClose,
  onRestart: onRestartRequested,
  showHeader = true,
}: SettingsPanelProps) {
  const { t } = useI18n();
  const speechNotice = useGameStore((state) => state.speechNotice);
  const soundEnabled = useSettingsStore((state) => state.soundEnabled);
  const speechEnabled = useSettingsStore((state) => state.speechEnabled);
  const speechRate = useSettingsStore((state) => state.speechRate);
  const speechVolume = useSettingsStore((state) => state.speechVolume);
  const animationsEnabled = useSettingsStore((state) => state.animationsEnabled);
  const setSoundEnabled = useSettingsStore((state) => state.setSoundEnabled);
  const setSpeechEnabled = useSettingsStore((state) => state.setSpeechEnabled);
  const setSpeechRate = useSettingsStore((state) => state.setSpeechRate);
  const setSpeechVolume = useSettingsStore((state) => state.setSpeechVolume);
  const setAnimationsEnabled = useSettingsStore((state) => state.setAnimationsEnabled);
  const resetStatistics = useStatsStore((state) => state.resetStatistics);

  const restartGame = () => {
    if (onRestartRequested) onRestartRequested();
    else window.dispatchEvent(new CustomEvent("typestrike:restart"));
    onClose?.();
  };

  const confirmReset = () => {
    if (window.confirm(t("resetStatsConfirm"))) {
      resetStatistics();
    }
  };

  return (
    <section
      aria-label={t("settings")}
      data-testid="settings-panel"
      className={[
        "ts-panel w-full max-w-full",
        compact ? "gap-3 p-3" : "gap-5 p-4 sm:p-5",
        "grid",
      ].join(" ")}
    >
      {showHeader ? (
        <div className="flex items-center gap-2 border-b border-[var(--border-default)] pb-3">
          <Settings2 aria-hidden="true" size={18} className="shrink-0 text-[var(--color-primary)]" />
          <h2 className="min-w-0 text-base font-semibold text-[var(--text-strong)]">{t("settings")}</h2>
          {onClose ? (
            <IconButton
              aria-label="Close settings"
              icon={<X size={18} />}
              onClick={onClose}
              className="ms-auto"
            />
          ) : null}
        </div>
      ) : null}

      {speechNotice ? (
        <p
          role="status"
          aria-live="polite"
          dir="auto"
          className="rounded-md border border-[var(--border-accent)] bg-[var(--surface-selected)] px-3 py-2 text-sm text-[var(--text-strong)]"
        >
          {speechNotice}
        </p>
      ) : null}

      <div className="grid min-w-0 gap-3">
        <div className="min-w-0">
          <h3 className="ts-overline mb-2">
            {t("language")}
          </h3>
          <LanguageSelector />
        </div>

        <div className="min-w-0">
          <h3 className="ts-overline mb-2">
            {t("mode")}
          </h3>
          <ModeSelector variant="compact" />
        </div>

        <div className="grid min-w-0 gap-2">
          <ToggleRow
            label={t("sound")}
            onText={t("on")}
            offText={t("off")}
            checked={soundEnabled}
            icon={<Volume2 size={16} />}
            testId="settings-sound"
            onChange={setSoundEnabled}
          />
          <ToggleRow
            label={t("speech")}
            onText={t("on")}
            offText={t("off")}
            checked={speechEnabled}
            icon={<MessageSquare size={16} />}
            testId="settings-speech"
            onChange={setSpeechEnabled}
          />
          <SliderRow
            label={t("speechRate")}
            value={speechRate}
            displayValue={`${speechRate.toFixed(1)}×`}
            min={0.5}
            max={2}
            step={0.1}
            testId="settings-rate"
            onChange={setSpeechRate}
          />
          <SliderRow
            label={t("speechVolume")}
            value={speechVolume}
            displayValue={`${Math.round(speechVolume * 100)}%`}
            min={0}
            max={1}
            step={0.05}
            testId="settings-volume"
            onChange={setSpeechVolume}
          />
          <ToggleRow
            label={t("animations")}
            onText={t("on")}
            offText={t("off")}
            checked={animationsEnabled}
            icon={<Sparkles size={16} />}
            testId="settings-animations"
            onChange={setAnimationsEnabled}
          />
        </div>

        <div className="flex flex-wrap gap-2 border-t border-[var(--border-default)] pt-3">
          <Button variant="secondary" icon={<RotateCcw size={16} />} onClick={restartGame}>
            {t("restart")}
          </Button>
          <Button variant="danger" icon={<Trash size={16} />} onClick={confirmReset}>
            {t("resetStats")}
          </Button>
        </div>
      </div>
    </section>
  );
}
