"use client";

import type { ReactNode } from "react";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { useI18n } from "@/hooks/useI18n";
import { useLanguage } from "@/hooks/useLanguage";

export function AdminLayout({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  const { direction, language } = useLanguage();

  return (
    <div className="flex min-h-dvh flex-col" dir={direction} lang={language} data-testid="admin-layout">
      <Header />
      <main className="ts-page-container flex-1 py-6 sm:py-8">
        <header className="mb-6">
          <p className="ts-chip w-fit" data-testid="admin-badge">
            {t("dashboard")}
          </p>
          <h1 id="admin-title" className="mt-3 text-2xl font-semibold tracking-tight text-fg sm:text-3xl">
            {t("adminTitle")}
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-fg-secondary">{t("adminDescription")}</p>
        </header>
        {children}
      </main>
      <Footer />
    </div>
  );
}
