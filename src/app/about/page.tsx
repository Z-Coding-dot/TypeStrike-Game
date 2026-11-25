"use client";

import {
  ArrowUpRight,
  BookOpen,
  Crosshair,
  Languages,
  Play,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { useI18n } from "@/hooks/useI18n";
import { useLanguage } from "@/hooks/useLanguage";
import type { UiTextKey } from "@/lib/i18n";

const ABOUT_FEATURES: ReadonlyArray<{ textKey: UiTextKey; icon: ReactNode }> = [
  { textKey: "feature1", icon: <Crosshair size={19} /> },
  { textKey: "feature2", icon: <Languages size={19} /> },
  { textKey: "feature3", icon: <TrendingUp size={19} /> },
  { textKey: "feature4", icon: <BookOpen size={19} /> },
];

const PRINCIPLES: ReadonlyArray<{ textKey: UiTextKey; icon: ReactNode }> = [
  { textKey: "howStep2", icon: <Crosshair size={18} /> },
  { textKey: "howStep3", icon: <ShieldCheck size={18} /> },
  { textKey: "feature4", icon: <BookOpen size={18} /> },
];

const ABOUT_STATS: ReadonlyArray<{ labelKey: UiTextKey; value: string }> = [
  { labelKey: "mode", value: "03" },
  { labelKey: "lives", value: "03" },
  { labelKey: "language", value: "02" },
];

export default function AboutPage() {
  const { t } = useI18n();
  const { direction, language } = useLanguage();

  return (
    <div className="flex min-h-dvh flex-col bg-[var(--layer-app)]" dir={direction} lang={language}>
      <Header />

      <main className="flex-1">
        <section className="ts-page-hero" aria-labelledby="about-title">
          <div className="ts-page-container ts-page-hero-inner">
            <span className="ts-eyebrow-chip">
              <span aria-hidden="true" className="ts-eyebrow-dot" />
              TypeStrike
            </span>
            <h1
              id="about-title"
              data-testid="about-title"
              className="ts-display-title mt-5 break-words text-balance"
            >
              {t("aboutTitle")}
            </h1>
            <p className="ts-lead mt-5 text-pretty">{t("aboutBody")}</p>
            <div className="ts-hero-actions">
              <Link
                href="/game"
                className="ts-btn ts-btn-primary min-h-12 cursor-pointer px-6 focus-visible:outline-2 focus-visible:outline-offset-2"
              >
                <Play aria-hidden="true" size={17} />
                {t("playNow")}
              </Link>
              <Link
                href="/settings"
                className="ts-quiet-link focus-visible:outline-2 focus-visible:outline-offset-2"
              >
                {t("settings")}
                <ArrowUpRight aria-hidden="true" size={15} />
              </Link>
            </div>
          </div>
        </section>

        <div className="ts-page-container">
          <section aria-labelledby="about-story-heading" className="ts-section">
            <div className="ts-section-head">
              <p className="ts-overline">{t("brandTagline")}</p>
              <h2 id="about-story-heading" className="ts-section-title">{t("aboutStoryTitle")}</h2>
              <p className="ts-section-subtitle">{t("aboutStoryBody")}</p>
            </div>
            <dl className="ts-stat-row">
              {ABOUT_STATS.map((stat) => (
                <div key={stat.labelKey} className="ts-stat-tile">
                  <dt className="ts-overline">{t(stat.labelKey)}</dt>
                  <dd dir="ltr" className="ts-stat-value ts-numeric">{stat.value}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section aria-labelledby="about-principles-heading" className="ts-section">
            <div className="ts-section-head">
              <p className="ts-overline">{t("howToPlay")}</p>
              <h2 id="about-principles-heading" className="ts-section-title">{t("quickStart")}</h2>
            </div>
            <div className="ts-step-grid">
              {PRINCIPLES.map((item, index) => (
                <article key={item.textKey} className="ts-step-card">
                  <div className="flex items-center gap-3">
                    <span dir="ltr" className="ts-step-number ts-numeric">{index + 1}</span>
                    <span aria-hidden="true" className="text-[var(--color-primary)]">{item.icon}</span>
                  </div>
                  <p className="text-pretty">{t(item.textKey)}</p>
                </article>
              ))}
            </div>
          </section>

          <section aria-labelledby="about-features-heading" className="ts-section">
            <div className="ts-section-head">
              <p className="ts-overline">TypeStrike</p>
              <h2 id="about-features-heading" className="ts-section-title">{t("features")}</h2>
            </div>
            <div className="ts-feature-grid">
              {ABOUT_FEATURES.map((feature) => (
                <article key={feature.textKey} className="ts-feature-card">
                  <span aria-hidden="true" className="ts-feature-icon">{feature.icon}</span>
                  <p className="text-pretty">{t(feature.textKey)}</p>
                </article>
              ))}
            </div>
          </section>

          <section aria-labelledby="about-cta-heading" className="ts-section">
            <div className="ts-cta-band">
              <div className="min-w-0">
                <h2 id="about-cta-heading" className="ts-cta-title">{t("ctaTitle")}</h2>
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
        </div>
      </main>

      <Footer />
    </div>
  );
}
