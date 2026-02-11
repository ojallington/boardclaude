import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import { messages } from "@/lib/messages";

import "./globals.css";

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: messages.site.title,
  description: messages.site.description,
};

const NAV_LINKS: ReadonlyArray<{
  href: string;
  label: string;
  highlight?: boolean;
}> = [
  { href: "/try", label: messages.nav.tryIt, highlight: true },
  { href: "/results", label: messages.nav.results },
  { href: "/boards", label: messages.nav.boards },
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} font-sans antialiased bg-gray-950 text-gray-100`}
      >
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-lg focus:bg-indigo-600 focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-white focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-gray-950"
        >
          Skip to main content
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
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={
                      link.highlight
                        ? "rounded-lg px-3 py-1.5 text-sm font-medium text-indigo-400 transition-colors hover:bg-indigo-950/60 hover:text-indigo-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950"
                        : "rounded-lg px-3 py-1.5 text-sm font-medium text-gray-400 transition-colors hover:bg-gray-800/60 hover:text-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950"
                    }
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </header>
        {children}
      </body>
    </html>
  );
}
