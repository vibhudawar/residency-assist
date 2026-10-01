import { Doto, Geist_Mono, Readex_Pro } from "next/font/google";

/** The hall's three voices. Shared by the root layout and global-error (which renders its own document). */
export const readex = Readex_Pro({ variable: "--font-readex", subsets: ["latin", "arabic"], display: "swap" });
export const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"], display: "swap" });
export const doto = Doto({ variable: "--font-doto", subsets: ["latin"], weight: ["700", "900"], display: "swap" });
export const fontVariables = `${readex.variable} ${geistMono.variable} ${doto.variable}`;
