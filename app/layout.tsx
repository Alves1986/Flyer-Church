import type { Metadata } from "next";
import { Bebas_Neue, Manrope } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";

const display = Bebas_Neue({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-display",
});

const body = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-body",
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://flyerchurch.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "FlyerForge — Gerador de Flyers",
  description: "Extraia a identidade visual de um flyer de referência e gere novas artes para cada evento, com preletor e logo próprios.",
  icons: {
    icon: [{ url: "/icon.png", type: "image/png" }],
    apple: [{ url: "/apple-icon.png", type: "image/png" }],
  },
  openGraph: {
    title: "FlyerForge — Gerador de Flyers",
    description: "Extraia a identidade visual de um flyer de referência e gere novas artes para cada evento, com preletor e logo próprios.",
    url: SITE_URL,
    siteName: "FlyerForge",
    images: [{ url: "/opengraph-image.png", width: 1200, height: 630 }],
    locale: "pt_BR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "FlyerForge — Gerador de Flyers",
    description: "Extraia a identidade visual de um flyer de referência e gere novas artes para cada evento, com preletor e logo próprios.",
    images: ["/opengraph-image.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={`${display.variable} ${body.variable}`}>
      <body className="font-body antialiased min-h-screen bg-ink-950 bg-gold-arc bg-fixed">
        <Header />
        <main className="mx-auto max-w-6xl px-5 pb-24 pt-8 sm:px-8">
          {children}
        </main>
      </body>
    </html>
  );
}
