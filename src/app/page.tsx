"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowUpRight,
  BookOpen,
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
import { ModeSelector } from "@/components/settings/ModeSelector";
import { useI18n } from "@/hooks/useI18n";
import { useLanguage } from "@/hooks/useLanguage";
import type { UiTextKey } from "@/lib/i18n";

const HOW_STEPS: ReadonlyArray<{ textKey: UiTextKey; icon: ReactNode }> = [
  { textKey: "howStep1", icon: <MousePointer2 size={18} /> },
  { textKey: "howStep2", icon: <Keyboard size={18} /> },
  { textKey: "howStep3", icon: <ShieldCheck size={18} /> },
];

const FEATURES: ReadonlyArray<{ textKey: UiTextKey; icon: ReactNode }> = [
  { textKey: "feature1", icon: <Zap size={19} /> },
  { textKey: "feature2", icon: <Languages size={19} /> },
  { textKey: "feature3", icon: <TrendingUp size={19} /> },
  { textKey: "feature4", icon: <BookOpen size={19} /> },
];

const PREVIEW_STATS: ReadonlyArray<{ labelKey: UiTextKey; value: string }> = [
  { labelKey: "wpm", value: "72" },
  { labelKey: "accuracy", value: "98%" },
  { labelKey: "score", value: "1,280" },
];

export default function HomePage() {
  const { t } = useI18n();
  const { direction, language } = useLanguage();
  const reduceMotion = useReducedMotion();
  const entrance = reduceMotion ? { opacity: 0 } : { opacity: 0, y: 14 };

  return (
    <div className="flex min-h-dvh flex-col bg-[var(--layer-app)]" dir={direction} lang={language}>
      <Header />

      <main className="flex-1">
        <section className="ts-hero-stage" aria-labelledby="hero-title">
          <div className="ts-page-container ts-hero-inner">
            <motion.div
              initial={entrance}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: reduceMotion ? 0 : 0.4, ease: "easeOut" }}
              className="min-w-0 text-start"
            >
              <span className="ts-eyebrow-chip">
                <span aria-hidden="true" className="ts-eyebrow-dot" />
                {t("heroKicker")}
              </span>
              <h1
                id="hero-title"
                data-testid="hero-title"
                className="ts-display-title mt-5 break-words text-balance"
              >
                {t("heroTitle")}
              </h1>
              <p className="ts-lead mt-5 text-pretty">{t("heroDescription")}</p>

              <div className="ts-hero-actions">
                <Link
                  href="/game"
                  data-testid="play-now"
                  className="ts-btn ts-btn-primary min-h-12 cursor-pointer px-7 focus-visible:outline-2 focus-visible:outline-offset-2"
                >
                  <Play aria-hidden="true" size={17} />
                  {t("playNow")}
                </Link>
                <Link
                  href="/about"
                  className="ts-quiet-link focus-visible:outline-2 focus-visible:outline-offset-2"
                >
                  {t("about")}
                  <ArrowUpRight aria-hidden="true" size={15} />
                </Link>
              </div>

              <div className="ts-proof-row">
                <span className="ts-proof-item">
                  <Zap aria-hidden="true" size={14} />
                  {t("feature1")}
                </span>
                <span className="ts-proof-item">
                  <Languages aria-hidden="true" size={14} />
                  {t("feature2")}
                </span>
                <span className="ts-proof-item">
                  <ShieldCheck aria-hidden="true" size={14} />
                  {t("feature4")}
                </span>
              </div>
            </motion.div>

            <motion.div
              aria-hidden="true"
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: reduceMotion ? 0 : 0.5, delay: reduceMotion ? 0 : 0.1, ease: "easeOut" }}
              className="w-full max-w-lg lg:justify-self-end"
            >
              <div className="ts-preview-card">
                <div className="ts-preview-head">
                  <span dir="ltr" className="text-xs font-semibold tracking-wide text-[var(--text-strong)]">
                    TypeStrike <span className="text-[var(--text-subtle)]">{"// live"}</span>
                  </span>
                  <span className="ts-chip">
                    <span className="ts-eyebrow-dot" />
                    {t("level")}
                    <span dir="ltr" className="ts-numeric">03</span>
                  </span>
                </div>
                <div className="ts-preview-window">
                  <div className="ts-preview-radar" />
                  <div className="ts-preview-beam" />
                  <div className="ts-preview-target" dir="ltr">
                    strike <span className="text-[var(--color-accent)]">target</span>
                  </div>
                  <div className="ts-preview-ship" />
                </div>
                <dl className="ts-preview-stats">
                  {PREVIEW_STATS.map((stat) => (
                    <div key={stat.labelKey} className="ts-preview-stat">
                      <dt className="ts-overline">{t(stat.labelKey)}</dt>
                      <dd dir="ltr" className="ts-numeric">{stat.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </motion.div>
          </div>
        </section>

        <div className="ts-page-container">
          <section aria-labelledby="modes-heading" className="ts-section">
            <div className="ts-section-head">
              <p className="ts-overline">{t("quickStart")}</p>
              <h2 id="modes-heading" className="ts-section-title">{t("gameModes")}</h2>
              <p className="ts-section-subtitle">{t("feature1")}</p>
            </div>
            <div className="mt-6">
              <ModeSelector variant="full" />
            </div>
          </section>

          <section aria-labelledby="how-heading" className="ts-section">
            <div className="ts-section-head">
              <p className="ts-overline">{t("quickStart")}</p>
              <h2 id="how-heading" className="ts-section-title">{t("howToPlay")}</h2>
            </div>
            <div className="ts-step-grid">
              {HOW_STEPS.map((step, index) => (
                <article key={step.textKey} className="ts-step-card">
                  <div className="flex items-center gap-3">
                    <span dir="ltr" className="ts-step-number ts-numeric">{index + 1}</span>
                    <span aria-hidden="true" className="text-[var(--color-primary)]">{step.icon}</span>
                  </div>
                  <p className="text-pretty">{t(step.textKey)}</p>
                </article>
              ))}
            </div>
          </section>

          <section aria-labelledby="features-heading" className="ts-section">
            <div className="ts-section-head">
              <p className="ts-overline">TypeStrike</p>
              <h2 id="features-heading" className="ts-section-title">{t("features")}</h2>
            </div>
            <div className="ts-feature-grid">
              {FEATURES.map((feature) => (
                <article key={feature.textKey} className="ts-feature-card">
                  <span aria-hidden="true" className="ts-feature-icon">{feature.icon}</span>
                  <p className="text-pretty">{t(feature.textKey)}</p>
                </article>
              ))}
            </div>
          </section>

          <section aria-labelledby="cta-heading" className="ts-section">
            <div className="ts-cta-band">
              <div className="min-w-0">
                <h2 id="cta-heading" className="ts-cta-title">{t("ctaTitle")}</h2>
                <p className="ts-lead mt-2 text-pretty">{t("ctaDescription")}</p>
              </div>
              <Link
                href="/game"
                className="ts-btn ts-btn-primary min-h-12 cursor-pointer px-6 focus-visible:outline-2 focus-visible:outline-offset-2"
              >
                <Play aria-hidden="true" size={17} />
                {t("playNow")}
              </Link>
            </div>
          </section>

          <div className="pb-4">
            <AdSlot placement="content" />
          </div>
        </div>

        <div className="ts-page-container pb-8">
          <AdSlot placement="bottom" />
        </div>
      </main>

      <Footer />
    </div>
  );
}
