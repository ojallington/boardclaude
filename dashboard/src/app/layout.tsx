import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages, getTranslations } from "next-intl/server";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";

import "./globals.css";

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  variable: "--font-inter",
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("site");
  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();
  const t = await getTranslations("nav");

  const navLinks: ReadonlyArray<{
    href: string;
    label: string;
    highlight?: boolean;
    external?: boolean;
  }> = [
    { href: "/try", label: t("tryIt"), highlight: true },
    { href: "/results", label: t("results") },
    { href: "/boards", label: t("boards") },
    { href: "/#install", label: t("install") },
  ];

  return (
    <html lang={locale} dir={locale === "ar" ? "rtl" : "ltr"} className="dark">
      <body
        className={`${inter.variable} font-sans antialiased bg-gray-950 text-gray-100`}
      >
        <NextIntlClientProvider messages={messages}>
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-lg focus:bg-indigo-600 focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-white focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-gray-950"
          >
            {t("skipToContent")}
          </a>
          <header className="sticky top-0 z-40 border-b border-gray-800/60 bg-gray-950/80 backdrop-blur-md">
            <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
              <Link
                href="/"
                className="text-lg font-bold tracking-tight text-gray-100 transition-colors hover:text-indigo-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950 rounded"
              >
                Board<span className="text-indigo-400">Claude</span>
              </Link>
              <ul className="flex items-center gap-1 sm:gap-2">
                {navLinks.map((link) => (
                  <li key={link.href}>
                    {link.external ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-lg px-3 py-1.5 text-sm font-medium text-gray-300 transition-colors hover:bg-gray-800/60 hover:text-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950"
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link
                        href={link.href}
                        className={
                          link.highlight
                            ? "rounded-lg px-3 py-1.5 text-sm font-medium text-indigo-400 transition-colors hover:bg-indigo-950/60 hover:text-indigo-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950"
                            : "rounded-lg px-3 py-1.5 text-sm font-medium text-gray-300 transition-colors hover:bg-gray-800/60 hover:text-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950"
                        }
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
                <li>
                  <LocaleSwitcher />
                </li>
              </ul>
            </nav>
          </header>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
