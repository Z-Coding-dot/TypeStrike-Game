"use client";

import { BookOpen, Crosshair, Languages, Play, TrendingUp } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/Card";
import { useI18n } from "@/hooks/useI18n";
import type { UiTextKey } from "@/lib/i18n";

const ABOUT_FEATURES: ReadonlyArray<{ textKey: UiTextKey; icon: ReactNode }> = [
  { textKey: "feature1", icon: <Crosshair size={18} /> },
  { textKey: "feature2", icon: <Languages size={18} /> },
  { textKey: "feature3", icon: <TrendingUp size={18} /> },
  { textKey: "feature4", icon: <BookOpen size={18} /> },
];

export default function AboutPage() {
  const { t } = useI18n();

  return (
    <div className="flex min-h-dvh flex-col">
      <Header />
      <main className="mx-auto w-full max-w-[var(--max-content-width)] flex-1 px-4 pb-16 pt-10 sm:px-6 sm:pt-14 lg:px-8">
        <div className="max-w-3xl">
          <span className="ts-chip w-fit border-[var(--border-glow)] text-[var(--color-primary)]">
            <Crosshair aria-hidden="true" size={14} />
            TypeStrike
          </span>
          <h1
            data-testid="about-title"
            className="ts-glow-text mt-5 break-words text-balance text-[clamp(1.75rem,5vw,3rem)] font-semibold leading-[1.15] text-[var(--text-primary)]"
          >
            {t("aboutTitle")}
          </h1>
          <p className="mt-4 text-pretty text-sm leading-relaxed text-[var(--text-secondary)] sm:text-base">
            {t("aboutBody")}
          </p>
          <div className="mt-7">
            <Link
              href="/game"
              className="ts-btn ts-btn-primary min-h-12 cursor-pointer px-6 text-sm transition-all duration-200 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              <Play aria-hidden="true" size={17} />
              {t("playNow")}
            </Link>
          </div>
        </div>

        <section aria-labelledby="about-features-heading" className="mt-14">
          <h2 id="about-features-heading" className="text-xl font-semibold text-[var(--text-primary)] sm:text-2xl">
            {t("features")}
          </h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {ABOUT_FEATURES.map((feature) => (
              <Card key={feature.textKey} className="h-full">
                <div className="flex items-start gap-3">
                  <span aria-hidden="true" className="shrink-0 text-[var(--color-primary)]">
                    {feature.icon}
                  </span>
                  <p className="min-w-0 break-words text-sm leading-relaxed text-[var(--text-secondary)]">
                    {t(feature.textKey)}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
