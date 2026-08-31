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

  return (
    <header className="sticky top-0 z-40 border-b border-gold-500/10 bg-ink-950/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
        <Link href="/" className="group flex items-center gap-3">
          <Image
            src="/brand/mark.svg"
            alt="FlyerForge"
            width={32}
            height={32}
            className="h-8 w-8 rounded-lg shadow-glow transition-transform duration-200 group-hover:scale-105"
            priority
          />
          <span className="font-display text-xl tracking-wide text-parchment-100">
            FLYER<span className="text-gold-400">FORGE</span>
          </span>
        </Link>

        <div className="flex items-center gap-5">
          {!isMarca && (
            <Link
              href="/marca"
              className="text-sm text-parchment-500 transition-colors hover:text-gold-300"
            >
              Marca
            </Link>
          )}
          {!isBiblioteca && (
            <Link
              href="/biblioteca"
              className="text-sm text-parchment-500 transition-colors hover:text-gold-300"
            >
              Biblioteca
            </Link>
          )}
          {!isHistorico && (
            <Link
              href="/flyers/historico"
              className="text-sm text-parchment-500 transition-colors hover:text-gold-300"
            >
              Histórico
            </Link>
          )}
          {!isHome && (
            <Link
              href="/"
              className="text-sm text-parchment-500 transition-colors hover:text-gold-300"
            >
              ← Painel
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
