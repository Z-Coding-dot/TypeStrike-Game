"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Crosshair, Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { LanguageSelector } from "@/components/settings/LanguageSelector";
import { IconButton } from "@/components/ui/IconButton";
import { useI18n } from "@/hooks/useI18n";
import type { UiTextKey } from "@/lib/i18n";

const NAV_ITEMS: ReadonlyArray<{ href: string; labelKey: UiTextKey }> = [
  { href: "/", labelKey: "home" },
  { href: "/game", labelKey: "game" },
  { href: "/about", labelKey: "about" },
  { href: "/settings", labelKey: "settings" },
  { href: "/admin", labelKey: "dashboard" },
];

export function Header() {
  const { t } = useI18n();
  const pathname = usePathname();
  // Deriving the open flag from the current path closes the menu on navigation
  // without setting state synchronously inside an effect.
  const [menuState, setMenuState] = useState({ path: pathname, open: false });
  const menuOpen = menuState.path === pathname && menuState.open;
  const reduceMotion = useReducedMotion();

  const toggleMenu = () =>
    setMenuState((current) => ({
      path: pathname,
      open: !(current.path === pathname && current.open),
    }));
  const closeMenu = () => setMenuState({ path: pathname, open: false });

  const linkClass = (href: string) =>
    [
      "flex min-h-11 items-center whitespace-nowrap rounded-md px-2 text-xs font-medium transition-colors duration-200 lg:px-3 lg:text-sm",
      "focus-visible:outline-2 focus-visible:outline-offset-2",
      pathname === href
        ? "bg-[rgba(34,211,238,0.1)] text-[var(--color-primary)]"
        : "text-[var(--text-secondary)] hover:bg-[rgba(148,163,184,0.1)] hover:text-[var(--text-primary)]",
    ].join(" ");

  return (
    <header
      data-testid="site-header"
      className="relative z-40 w-full border-b border-[var(--border-subtle)] bg-[rgba(5,11,20,0.94)]"
      style={{ paddingTop: "var(--safe-top)" }}
    >
      <div className="mx-auto flex w-full max-w-[var(--max-content-width)] items-center gap-1.5 px-3 py-2 sm:gap-3 sm:px-6 lg:px-8">
        <Link
          href="/"
          aria-label="TypeStrike"
          onClick={closeMenu}
          className="flex min-h-11 min-w-0 items-center gap-2 rounded-md text-[var(--text-primary)] transition-opacity duration-200 hover:opacity-85 focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          <Crosshair aria-hidden="true" size={22} className="shrink-0 text-[var(--color-primary)]" />
          <span className="ts-glow-text hidden whitespace-nowrap text-sm font-semibold tracking-wide min-[380px]:inline sm:text-base">
            TypeStrike
          </span>
          <span className="hidden whitespace-nowrap text-xs text-[var(--text-muted)] lg:inline">
            {t("brandTagline")}
          </span>
        </Link>

        <nav aria-label="Main navigation" className="ms-auto hidden items-center gap-0.5 md:flex lg:gap-1">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={pathname === item.href ? "page" : undefined}
              className={linkClass(item.href)}
            >
              {t(item.labelKey)}
            </Link>
          ))}
        </nav>

        <div className="ms-auto flex shrink-0 items-center gap-2 md:ms-0">
          <LanguageSelector compact />
          <IconButton
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            aria-controls="mobile-navigation"
            data-testid="mobile-menu-toggle"
            className="md:hidden"
            icon={menuOpen ? <X size={20} /> : <Menu size={20} />}
            onClick={toggleMenu}
          />
        </div>
      </div>

      <AnimatePresence initial={false}>
        {menuOpen ? (
          <motion.nav
            id="mobile-navigation"
            aria-label="Mobile navigation"
            className="overflow-hidden border-t border-[var(--border-subtle)] bg-[rgba(5,11,20,0.98)] px-4 pb-3 pt-2 md:hidden"
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -6 }}
            transition={{ duration: reduceMotion ? 0 : 0.18 }}
          >
            <div className="flex flex-col gap-1">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={pathname === item.href ? "page" : undefined}
                  className={linkClass(item.href)}
                  onClick={closeMenu}
                >
                  {t(item.labelKey)}
                </Link>
              ))}
            </div>
          </motion.nav>
        ) : null}
      </AnimatePresence>
    </header>
  );
}
