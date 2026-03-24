import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://cutopt-pro-web.vercel.app"), // Gerçek domain ile güncellenmelidir
  title: "CutOpt PRO - Üretim Hattınız İçin Akıllı Optimizasyon",
  description: "Alüminyum ve PVC üretiminde firesiz kesim. Saniyeler içinde binlerce kesim planını hazırlayın.",
  keywords: ["optimizasyon", "kesim planı", "alüminyum kesim", "pvc kesim", "fire azaltma", "üretim yazılımı"],
  authors: [{ name: "CutOpt PRO Team" }],
  openGraph: {
    title: "CutOpt PRO - Üretim Hattınız İçin Akıllı Optimizasyon",
    description: "Alüminyum ve PVC üretiminde firesiz kesim. Saniyeler içinde binlerce kesim planını hazırlayın.",
    url: "https://cutopt-pro-web.vercel.app", // Placeholder: Kullanıcıdan gerçek domain'i girmesini isteyeceğiz
    siteName: "CutOpt PRO",
    images: [
      {
        url: "/logo.jpg",
        width: 1200,
        height: 630,
        alt: "CutOpt PRO Logo",
      },
    ],
    locale: "tr_TR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "CutOpt PRO - Akıllı Kesim Optimizasyonu",
    description: "Alüminyum ve PVC üretiminde firesiz kesim. Saniyeler içinde binlerce kesim planını hazırlayın.",
    images: ["/logo.jpg"],
  },
  robots: {
    index: true,
    follow: true,
  },
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
