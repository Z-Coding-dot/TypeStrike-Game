"use client";

import { Crosshair } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LanguageSelector } from "@/components/settings/LanguageSelector";
import { useI18n } from "@/hooks/useI18n";
import type { UiTextKey } from "@/lib/i18n";

const NAV_ITEMS: ReadonlyArray<{ href: string; labelKey: UiTextKey }> = [
  { href: "/", labelKey: "home" },
  { href: "/game", labelKey: "game" },
  { href: "/about", labelKey: "about" },
  { href: "/settings", labelKey: "settings" },
  { href: "/admin", labelKey: "dashboard" },
];

/**
 * One persistent navigation bar at every width. The links are never hidden
 * behind a toggle, so keyboard, screen-reader and touch users all get the
 * same navigation model. On narrow screens the row scrolls horizontally
 * inside the header instead of overflowing the document.
 */
export function Header() {
  const { t } = useI18n();
  const pathname = usePathname();

  return (
    <header
      data-testid="site-header"
      className="ts-site-header"
      style={{ paddingTop: "var(--safe-top)" }}
    >
      <div className="ts-page-container ts-header-grid">
        <Link href="/" dir="ltr" aria-label="TypeStrike" className="ts-brand">
          <span aria-hidden="true" className="ts-brand-mark">
            <Crosshair size={18} />
          </span>
          <span className="ts-brand-name">TypeStrike</span>
          <span className="ts-brand-tagline">{t("brandTagline")}</span>
        </Link>

        <div className="ts-header-actions">
          <LanguageSelector compact />
        </div>

        <nav aria-label="Main navigation" className="ts-header-nav ts-scrollbar-thin">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={pathname === item.href ? "page" : undefined}
              className="ts-nav-link"
            >
              {t(item.labelKey)}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
