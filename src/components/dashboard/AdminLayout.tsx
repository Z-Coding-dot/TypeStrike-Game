"use client";

import type { ReactNode } from "react";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { useI18n } from "@/hooks/useI18n";
import { useLanguage } from "@/hooks/useLanguage";

export function AdminLayout({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  const { direction } = useLanguage();

  return (
    <div className="flex min-h-dvh flex-col" dir={direction} data-testid="admin-layout">
      <Header />
      <main className="mx-auto w-full max-w-[var(--max-content-width)] min-w-0 flex-1 px-3 py-6 sm:px-6 lg:px-8">
        <header className="mb-6">
          <p className="ts-chip w-fit" data-testid="admin-badge">
            {t("dashboard")}
          </p>
          <h1 id="admin-title" className="mt-3 text-2xl font-bold tracking-tight text-fg sm:text-3xl">
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
