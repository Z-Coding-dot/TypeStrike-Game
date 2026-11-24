"use client";

import { Crosshair } from "lucide-react";
import Link from "next/link";
import { useI18n } from "@/hooks/useI18n";
import type { UiTextKey } from "@/lib/i18n";

const FOOTER_LINKS: ReadonlyArray<{ href: string; labelKey: UiTextKey }> = [
  { href: "/", labelKey: "home" },
  { href: "/game", labelKey: "game" },
  { href: "/about", labelKey: "about" },
  { href: "/settings", labelKey: "settings" },
  { href: "/admin", labelKey: "dashboard" },
];

export function Footer() {
  const { t } = useI18n();

  return (
    <footer
      data-testid="site-footer"
      className="mt-auto w-full border-t border-[var(--border-subtle)] bg-[rgba(5,11,20,0.7)]"
      style={{ paddingBottom: "var(--safe-bottom)" }}
    >
      <div className="mx-auto flex w-full max-w-[var(--max-content-width)] flex-col gap-4 px-4 py-6 sm:flex-row sm:items-center sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-2">
          <Crosshair aria-hidden="true" size={18} className="shrink-0 text-[var(--color-primary)]" />
          <span className="whitespace-nowrap text-sm font-semibold text-[var(--text-primary)]">TypeStrike</span>
        </div>
        <p className="min-w-0 text-xs leading-relaxed text-[var(--text-muted)] sm:ms-4">{t("footerText")}</p>
        <nav aria-label="Footer navigation" className="flex flex-wrap gap-x-4 gap-y-1 sm:ms-auto">
          {FOOTER_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex min-h-11 items-center text-xs font-medium text-[var(--text-secondary)] transition-colors duration-200 hover:text-[var(--color-primary)] focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              {t(link.labelKey)}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
