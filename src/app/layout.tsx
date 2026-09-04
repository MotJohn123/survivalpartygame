import type { Metadata } from "next";
import { DM_Sans, Oswald } from "next/font/google";
import "./globals.css";
import PwaRegister from "./PwaRegister";

const bodyFont = DM_Sans({
  variable: "--font-body",
  subsets: ["latin"],
});

const displayFont = Oswald({
  variable: "--font-display",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Survival Party | Vstup do divočiny",
  description: "Víkendová výprava pro přátele.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="cs" className={`${bodyFont.variable} ${displayFont.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col"><PwaRegister />{children}</body>
    </html>
  );
}
