"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Header() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const isHistorico = pathname === "/flyers/historico";
  const isBiblioteca = pathname === "/biblioteca";
  const isMarca = pathname === "/marca";
  const isAnalytics = pathname === "/analytics";

  // Se estiver na Home (Landing Page), não mostra as abas internas do sistema
  if (isHome) {
    return (
      <header className="sticky top-0 z-40 border-b-2 border-[#EAE7E0] bg-[#FCFCFA]/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
          <Link href="/" className="group flex items-center gap-3">
            <Image
              src="/brand/mark.svg"
              alt="Flyer Church"
              width={32}
              height={32}
              className="h-8 w-8 rounded-lg shadow-[0_0_20px_rgba(184,134,11,0.15)] transition-transform duration-200 group-hover:scale-105"
              priority
            />
            <span className="font-display text-xl tracking-wide text-[#0A0A0A]">
              FLYER<span className="text-[#B8860B]"> CHURCH</span>
            </span>
          </Link>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-40 border-b-2 border-[#2A2418] bg-[#0B0A08]/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
        <Link href="/" className="group flex items-center gap-3">
          <Image
            src="/brand/mark.svg"
            alt="Flyer Church"
            width={32}
            height={32}
            className="h-8 w-8 rounded-lg shadow-[0_0_20px_rgba(184,134,11,0.15)] transition-transform duration-200 group-hover:scale-105"
            priority
          />
          <span className="font-display text-xl tracking-wide text-[#F5F0E4]">
            FLYER<span className="text-[#B8860B]"> CHURCH</span>
          </span>
        </Link>

        <div className="flex items-center gap-5">
          {!isMarca && (
            <Link
              href="/marca"
              className="text-sm text-[#A69C87] transition-colors hover:text-[#B8860B]"
            >
              Marca
            </Link>
          )}
          {!isBiblioteca && (
            <Link
              href="/biblioteca"
              className="text-sm text-[#A69C87] transition-colors hover:text-[#B8860B]"
            >
              Biblioteca
            </Link>
          )}
          {!isHistorico && (
            <Link
              href="/flyers/historico"
              className="text-sm text-[#A69C87] transition-colors hover:text-[#B8860B]"
            >
              Histórico
            </Link>
          )}
          {!isAnalytics && (
            <Link
              href="/analytics"
              className="text-sm text-[#A69C87] transition-colors hover:text-[#B8860B]"
            >
              Analytics
            </Link>
          )}
          {!isHome && (
            <Link
              href="/"
              className="text-sm text-[#A69C87] transition-colors hover:text-[#B8860B]"
            >
              ← Painel
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
