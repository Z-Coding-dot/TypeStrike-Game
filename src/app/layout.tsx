import type { Metadata, Viewport } from "next";
import { ClientProviders } from "@/components/layout/ClientProviders";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "TypeStrike — Futuristic Typing Arcade",
    template: "%s · TypeStrike",
  },
  description:
    "A bilingual arcade typing game. Type incoming letters, words and sentences to fire your cannon and sharpen your speed.",
  applicationName: "TypeStrike",
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#050b14",
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <head>
        <link
          rel="preload"
          href="/fonts/inter/inter-latin-400-normal.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/vazirmatn/vazirmatn-arabic-400-normal.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
      </head>
      <body>
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
