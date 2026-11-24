"use client";

import { useEffect, useRef, type ChangeEvent, type CompositionEvent, type KeyboardEvent } from "react";
import { useI18n } from "@/hooks/useI18n";
import { useGameStore } from "@/stores/gameStore";
import { directionForLanguage } from "@/types/language";
import type { TypingAttemptResult } from "@/types/game";

export const TYPING_INPUT_ID = "typestrike-typing-input";

/**
 * Focus the real HTML input after an overlay closes. `immediate` is used by
 * user gestures (mobile keyboard button/canvas tap), where requestAnimationFrame
 * would break the browser's user-activation requirement.
 */
export function focusTypingInput(immediate = false): void {
  if (typeof document === "undefined") return;
  const focus = () => document.getElementById(TYPING_INPUT_ID)?.focus();
  if (immediate) focus();
  else window.requestAnimationFrame(focus);
}

interface TypingInputProps {
  /** Sends the committed value to the engine. Never send raw keystrokes to analytics. */
  onTyping: (value: string) => TypingAttemptResult | void;
  onEscape: () => void;
}

/**
 * An invisible but focusable input. It stays in the accessibility tree so
 * screen readers and IMEs work, while the visual game area remains uncluttered.
 */
export function TypingInput({ onTyping, onEscape }: TypingInputProps) {
  const { language, t } = useI18n();
  const value = useGameStore((state) => state.inputValue);
  const setValue = useGameStore((state) => state.setInputValue);
  const status = useGameStore((state) => state.status);
  const composing = useRef(false);
  const direction = directionForLanguage(language);

  useEffect(() => {
    if (status === "playing") focusTypingInput();
  }, [status]);

  // Keep typing captured even if a browser shortcut or an accidental focus
  // change moves focus off the hidden input. Modifier shortcuts are untouched.
  useEffect(() => {
    if (status !== "playing") return;

    const handleDocumentKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey) return;
      const active = document.activeElement as HTMLElement | null;
      if (active?.id === TYPING_INPUT_ID) return;
      if (composing.current || event.isComposing || event.keyCode === 229) return;
      if (event.key === "Escape") {
        event.preventDefault();
        onEscape();
        return;
      }
      if (event.key.length === 1) focusTypingInput(true);
    };

    document.addEventListener("keydown", handleDocumentKeyDown);
    return () => document.removeEventListener("keydown", handleDocumentKeyDown);
  }, [status, onEscape]);

  const commit = (nextValue: string) => {
    setValue(nextValue);
    onTyping(nextValue);
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextValue = event.target.value;
    const nativeEvent = event.nativeEvent as InputEvent;
    // IME composition is not a committed value. Wait for compositionend.
    if (composing.current || nativeEvent.isComposing) {
      setValue(nextValue);
      return;
    }
    commit(nextValue);
  };

  const handleCompositionStart = () => {
    composing.current = true;
  };

  const handleCompositionUpdate = () => {
    // Intentionally do not validate or forward partially composed text.
  };

  const handleCompositionEnd = (event: CompositionEvent<HTMLInputElement>) => {
    composing.current = false;
    commit(event.currentTarget.value);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape" && !composing.current && !event.nativeEvent.isComposing) {
      event.preventDefault();
      onEscape();
    }
  };

  return (
    <div className="ts-sr-only" data-testid="typing-input-wrapper">
      <label htmlFor={TYPING_INPUT_ID} data-testid="typing-label">
        {t("targetLabel")}
      </label>
      <input
        id={TYPING_INPUT_ID}
        data-testid="typing-input"
        className="ts-sr-only"
        type="text"
        value={value}
        onChange={handleChange}
        onCompositionStart={handleCompositionStart}
        onCompositionUpdate={handleCompositionUpdate}
        onCompositionEnd={handleCompositionEnd}
        onKeyDown={handleKeyDown}
        dir={direction}
        lang={language}
        autoComplete="off"
        autoCapitalize="off"
        autoCorrect="off"
        inputMode="text"
        enterKeyHint="done"
        spellCheck={false}
        style={{ fontSize: "16px" }}
        aria-label={t("targetLabel")}
      />
    </div>
  );
}
