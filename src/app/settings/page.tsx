"use client";

import { ArrowUpRight, SlidersHorizontal } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { SettingsPanel } from "@/components/settings/SettingsPanel";
import { useI18n } from "@/hooks/useI18n";
import { useLanguage } from "@/hooks/useLanguage";
import { requestGameAutostart } from "@/lib/clientSession";

export default function SettingsPage() {
  const { t } = useI18n();
  const { direction, language } = useLanguage();
  const router = useRouter();

  const restart = () => {
    requestGameAutostart();
    router.push("/game");
  };

  return (
    <div
      className="flex min-h-dvh flex-col bg-[var(--layer-app)]"
      dir={direction}
      lang={language}
      data-testid="settings-page"
    >
      <Header />

      <main className="flex-1">
        <section className="ts-page-hero" aria-labelledby="settings-title">
          <div className="ts-page-container ts-page-hero-inner">
            <span className="ts-eyebrow-chip">
              <span aria-hidden="true" className="ts-eyebrow-dot" />
              TypeStrike
            </span>
            <h1 id="settings-title" className="ts-display-title mt-5">{t("settings")}</h1>
            <p className="ts-lead mt-4 text-pretty">{t("settingsDescription")}</p>
          </div>
        </section>

        <div className="ts-page-container pb-16">
          <div className="ts-settings-layout">
            <section aria-label={t("settings")} className="ts-card min-w-0 p-3 sm:p-5">
              <div className="mb-4 flex items-center gap-2 border-b border-[var(--border-default)] pb-3">
                <SlidersHorizontal aria-hidden="true" size={17} className="text-[var(--color-primary)]" />
                <h2 className="text-sm font-semibold text-[var(--text-strong)]">{t("settings")}</h2>
              </div>
              <SettingsPanel onRestart={restart} showHeader={false} />
            </section>

            <aside className="ts-tip-card" aria-labelledby="settings-tips-title">
              <p className="ts-overline">{t("quickStart")}</p>
              <h2 id="settings-tips-title" className="ts-section-title mt-2">{t("settingsTipsTitle")}</h2>
              <div className="ts-tip-list">
                {[t("howStep1"), t("howStep2"), t("howStep3")].map((tip, index) => (
                  <p key={tip} className="ts-tip-row">
                    <span dir="ltr" className="ts-tip-index ts-numeric">{`0${index + 1}`}</span>
                    <span>{tip}</span>
                  </p>
                ))}
              </div>
              <div className="mt-6 border-t border-[var(--border-default)] pt-4">
                <Link
                  href="/about"
                  className="ts-quiet-link focus-visible:outline-2 focus-visible:outline-offset-2"
                >
                  {t("about")}
                  <ArrowUpRight aria-hidden="true" size={15} />
                </Link>
              </div>
            </aside>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
