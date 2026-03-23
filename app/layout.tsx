import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CutOpt PRO - Üretim Hattınız İçin Akıllı Optimizasyon",
  description: "Alüminyum ve PVC üretiminde firesiz kesim. Saniyeler içinde binlerce kesim planını hazırlayın.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body
        className={`${inter.variable} font-sans antialiased text-slate-300 bg-[#0B0F19] selection:bg-blue-500/30 overflow-x-hidden`}
      >
        {children}
      </body>
    </html>
  );
}
