import type { Metadata } from "next";
import { Bebas_Neue, Manrope } from "next/font/google";
import "./globals.css";
import DashboardLayout from "@/components/DashboardLayout";

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
  title: "Flyer Church — Gerador de Flyers",
  description: "Extraia a identidade visual de um flyer de referência e gere novas artes para cada evento, com preletor e logo próprios.",
  icons: {
    icon: [{ url: "/icon.png", type: "image/png" }],
    apple: [{ url: "/apple-icon.png", type: "image/png" }],
  },
  openGraph: {
    title: "Flyer Church — Gerador de Flyers",
    description: "Extraia a identidade visual de um flyer de referência e gere novas artes para cada evento, com preletor e logo próprios.",
    url: SITE_URL,
    siteName: "Flyer Church",
    images: [{ url: "/opengraph-image.png", width: 1200, height: 630 }],
    locale: "pt_BR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Flyer Church — Gerador de Flyers",
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
      <body className="font-body antialiased min-h-screen">
        <DashboardLayout>
          {children}
        </DashboardLayout>
      </body>
    </html>
  );
}
