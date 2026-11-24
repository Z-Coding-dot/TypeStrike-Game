"use client";

import { useRouter } from "next/navigation";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { SettingsPanel } from "@/components/settings/SettingsPanel";
import { Card } from "@/components/ui/Card";
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
    <div className="flex min-h-dvh flex-col" dir={direction} lang={language} data-testid="settings-page">
      <Header />
      <main className="mx-auto w-full max-w-[var(--max-content-width)] flex-1 px-3 py-8 sm:px-6 sm:py-12 lg:px-8">
        <div className="mx-auto w-full max-w-2xl">
          <h1 className="text-balance text-2xl font-semibold tracking-tight text-fg sm:text-3xl">
            {t("settings")}
          </h1>
          <p className="mt-2 text-pretty text-sm text-fg-secondary sm:text-base">
            {t("settingsDescription")}
          </p>
          <Card className="mt-6 p-3 sm:p-5">
            <SettingsPanel onRestart={restart} showHeader={false} />
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
