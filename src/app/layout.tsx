import type { Metadata } from "next";
import { Doto, Geist_Mono, Readex_Pro } from "next/font/google";
import { getDictionary } from "@/lib/i18n";
import "./globals.css";

const readex = Readex_Pro({ variable: "--font-readex", subsets: ["latin", "arabic"], display: "swap" });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"], display: "swap" });
const doto = Doto({ variable: "--font-doto", subsets: ["latin"], weight: ["700", "900"], display: "swap" });

export const metadata: Metadata = {
  title: "Residency Assist — prototype",
  description: "Prototype: a proactive, multilingual voice agent that helps fix returned residency applications on one call.",
  robots: { index: false, follow: false },
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const { locale, dir } = await getDictionary();
  return (
    <html lang={locale} dir={dir} className={`${readex.variable} ${geistMono.variable} ${doto.variable} h-full`}>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
