import type { Metadata } from "next";
import { getDictionary } from "@/lib/i18n";
import { fontVariables } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "Residency Assist — prototype",
  description: "Prototype: a proactive, multilingual voice agent that helps fix returned residency applications on one call.",
  robots: { index: false, follow: false },
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const { locale, dir } = await getDictionary();
  return (
    <html lang={locale} dir={dir} className={`${fontVariables} h-full`}>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
