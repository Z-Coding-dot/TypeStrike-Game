"use client";

import { Crosshair } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
  const pathname = usePathname();

  return (
    <footer
      data-testid="site-footer"
      className="ts-site-footer"
      style={{ paddingBottom: "var(--safe-bottom)" }}
    >
      <div className="ts-page-container flex flex-col gap-5 py-7 sm:flex-row sm:items-start">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span aria-hidden="true" className="ts-brand-mark">
              <Crosshair size={16} />
            </span>
            <span dir="ltr" className="whitespace-nowrap text-sm font-semibold text-[var(--text-strong)]">
              TypeStrike
            </span>
          </div>
          <p className="mt-3 max-w-xs text-xs leading-relaxed text-[var(--text-subtle)]">{t("footerText")}</p>
        </div>

        <nav aria-label="Footer navigation" className="flex flex-wrap gap-x-2 gap-y-1 sm:ms-auto">
          {FOOTER_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={pathname === link.href ? "page" : undefined}
              className="ts-nav-link min-h-11 px-2 text-xs focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              {t(link.labelKey)}
            </Link>
          ))}
        </nav>
      </div>
      <div className="ts-page-container pb-5">
        <div className="ts-divider-glow" />
      </div>
    </footer>
  );
}
