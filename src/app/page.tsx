"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  BookOpen,
  Crosshair,
  Keyboard,
  Languages,
  MousePointer2,
  Play,
  ShieldCheck,
  TrendingUp,
  Zap,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { AdSlot } from "@/components/layout/AdSlot";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { LanguageSelector } from "@/components/settings/LanguageSelector";
import { ModeSelector } from "@/components/settings/ModeSelector";
import { Card } from "@/components/ui/Card";
import { useI18n } from "@/hooks/useI18n";
import type { UiTextKey } from "@/lib/i18n";

const HOW_STEPS: ReadonlyArray<{ textKey: UiTextKey; icon: ReactNode }> = [
  { textKey: "howStep1", icon: <MousePointer2 size={18} /> },
  { textKey: "howStep2", icon: <Keyboard size={18} /> },
  { textKey: "howStep3", icon: <ShieldCheck size={18} /> },
];

const FEATURES: ReadonlyArray<{ textKey: UiTextKey; icon: ReactNode }> = [
  { textKey: "feature1", icon: <Zap size={18} /> },
  { textKey: "feature2", icon: <Languages size={18} /> },
  { textKey: "feature3", icon: <TrendingUp size={18} /> },
  { textKey: "feature4", icon: <BookOpen size={18} /> },
];

export default function HomePage() {
  const { t } = useI18n();
  const reduceMotion = useReducedMotion();

  return (
    <div className="flex min-h-dvh flex-col">
      <Header />

      <main className="mx-auto w-full max-w-[var(--max-content-width)] flex-1 px-4 pb-16 pt-10 sm:px-6 sm:pt-14 lg:px-8">
        <motion.section
          aria-labelledby="hero-title"
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.35, ease: "easeOut" }}
          className="grid items-center gap-6 sm:gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]"
        >
          <div className="min-w-0 text-start">
            <span className="ts-chip min-w-0 w-fit max-w-full border-[var(--border-glow)] text-[var(--color-primary)]">
              <Crosshair aria-hidden="true" size={14} className="shrink-0" />
              <span className="min-w-0 break-words">{t("brandTagline")}</span>
            </span>
            <h1
              id="hero-title"
              data-testid="hero-title"
              className="ts-glow-text mt-5 break-words text-balance text-[clamp(1.75rem,6vw,3.25rem)] font-semibold leading-[1.15] text-[var(--text-primary)]"
            >
              {t("heroTitle")}
            </h1>
            <p className="mt-4 max-w-xl text-pretty text-sm leading-relaxed text-[var(--text-secondary)] sm:text-base">
              {t("heroDescription")}
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-3 sm:justify-start">
              <Link
                href="/game"
                data-testid="play-now"
                className="ts-btn ts-btn-primary min-h-12 w-full cursor-pointer justify-center px-6 text-sm transition-all duration-200 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 sm:w-auto sm:px-7"
              >
                <Play aria-hidden="true" size={17} />
                {t("playNow")}
              </Link>
              <div className="flex w-full min-w-0 flex-wrap items-center justify-center gap-2 sm:w-auto sm:justify-start">
                <span className="text-xs font-medium text-[var(--text-muted)]">{t("language")}</span>
                <LanguageSelector compact />
              </div>
            </div>
          </div>

          <div
            aria-hidden="true"
            className="pointer-events-none relative mx-auto flex aspect-square size-[min(72vw,320px,100%)] max-w-full items-center justify-center"
          >
            <div className="absolute inset-0 rounded-full border border-[rgba(34,211,238,0.12)]" />
            <div className="absolute inset-[12%] rounded-full border border-[rgba(59,130,246,0.2)]" />
            <div className="absolute inset-[26%] rounded-full border border-dashed border-[rgba(139,92,246,0.28)]" />
            <div className="absolute inset-y-0 start-1/2 w-px -translate-x-1/2 bg-[rgba(34,211,238,0.12)]" />
            <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-[rgba(34,211,238,0.12)]" />
            <div className="relative flex size-24 items-center justify-center rounded-full border-2 border-[var(--color-primary)] bg-[rgba(34,211,238,0.08)] shadow-[var(--shadow-glow-strong)]">
              <Crosshair size={40} className="text-[var(--color-primary)]" />
            </div>
            <span className="absolute top-[14%] end-[6%] hidden rounded-md border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2 py-1 text-[10px] font-semibold text-[var(--color-primary)] sm:block">
              {t("wpm")}
            </span>
            <span className="absolute bottom-[14%] start-[6%] hidden rounded-md border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2 py-1 text-[10px] font-semibold text-[var(--color-accent)] sm:block">
              {t("accuracy")}
            </span>
          </div>
        </motion.section>

        <section aria-labelledby="modes-heading" className="mt-16 sm:mt-20">
          <h2 id="modes-heading" className="text-xl font-semibold text-[var(--text-primary)] sm:text-2xl">
            {t("gameModes")}
          </h2>
          <div className="mt-5">
            <ModeSelector variant="full" />
          </div>
        </section>

        <section aria-labelledby="how-heading" className="mt-16 sm:mt-20">
          <h2 id="how-heading" className="text-xl font-semibold text-[var(--text-primary)] sm:text-2xl">
            {t("howToPlay")}
          </h2>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {HOW_STEPS.map((step, index) => (
              <Card key={step.textKey} className="h-full">
                <div className="flex items-center gap-2">
                  <span className="inline-flex size-8 items-center justify-center rounded-md border border-[var(--border-subtle)] text-xs font-semibold text-[var(--color-primary)]">
                    {index + 1}
                  </span>
                  <span aria-hidden="true" className="text-[var(--color-primary)]">
                    {step.icon}
                  </span>
                </div>
                <p className="mt-3 break-words text-sm leading-relaxed text-[var(--text-secondary)]">
                  {t(step.textKey)}
                </p>
              </Card>
            ))}
          </div>
        </section>

        <section aria-labelledby="features-heading" className="mt-16 sm:mt-20">
          <h2 id="features-heading" className="text-xl font-semibold text-[var(--text-primary)] sm:text-2xl">
            {t("features")}
          </h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((feature) => (
              <Card key={feature.textKey} className="h-full">
                <span aria-hidden="true" className="inline-flex size-9 items-center justify-center rounded-md bg-[rgba(34,211,238,0.08)] text-[var(--color-primary)]">
                  {feature.icon}
                </span>
                <p className="mt-3 break-words text-sm leading-relaxed text-[var(--text-secondary)]">
                  {t(feature.textKey)}
                </p>
              </Card>
            ))}
          </div>
        </section>

        <div className="mt-14">
          <AdSlot placement="content" />
        </div>
      </main>

      <div className="mx-auto w-full max-w-[var(--max-content-width)] px-4 pb-8 sm:px-6 lg:px-8">
        <AdSlot placement="bottom" />
      </div>

      <Footer />
    </div>
  );
}
