"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  Sparkles,
  Zap,
  Palette,
  Type,
  Image,
  ArrowRight,
  Check,
  Star,
  Layers,
  Cpu,
} from "lucide-react";
import NextImage from "next/image";

const INK = "#0A0A0A";
const PAPER = "#FCFCFA";
const PAPER_SOFT = "#F7F5F0";
const MUTED = "#6B604E";
const BORDER = "#EAE7E0";
const GOLD = "#B8860B";
const GOLD_DARK = "#9A6B08";
const GOLD_LIGHT = "#DCC177";

const FEATURES = [
  {
    id: "dna",
    size: "large",
    icon: Palette,
    title: "Brand DNA",
    desc: "A alma da sua igreja memorizada. Cores, fontes e atmosfera aplicadas automaticamente em cada arte, garantindo que sua marca seja reconhecida instantaneamente.",
    tag: "Exclusivo",
  },
  {
    id: "extract",
    size: "small",
    icon: Sparkles,
    title: "Extração",
    desc: "Transforme referências em templates editáveis.",
  },
  {
    id: "render",
    size: "small",
    icon: Type,
    title: "Precisão",
    desc: "Renderização pixel-perfeita via canvas.",
  },
  {
    id: "library",
    size: "medium",
    icon: Image,
    title: "Media Hub",
    desc: "Sua biblioteca de logos e preletores organizada por IA.",
  },
  {
    id: "collab",
    size: "medium",
    icon: Layers,
    title: "Equipes",
    desc: "Fluxo de aprovação entre designers e pastores.",
  },
  {
    id: "fast",
    size: "small",
    icon: Zap,
    title: "Velocidade",
    desc: "Do conceito ao flyer em 30 segundos.",
  },
];

const PLANS = [
  {
    name: "Gratuito",
    price: 0,
    features: ["5 gerações/mês", "1 template salvo", "Suporte comunitário"],
    cta: "Começar grátis",
    popular: false,
  },
  {
    name: "Pro",
    price: 49,
    features: [
      "100 gerações/mês",
      "Brand DNA completo",
      "Biblioteca inteligente",
      "Até 3 usuários",
    ],
    cta: "Assinar Pro",
    popular: true,
  },
  {
    name: "Igreja",
    price: 149,
    features: [
      "250 gerações/mês",
      "Brand DNA + Overrides",
      "Acesso à API",
      "Suporte dedicado",
    ],
    cta: "Falar com vendas",
    popular: false,
  },
];

function StaticHeader() {
  return (
    <header className="sticky top-0 z-50 border-b-2 border-[BORDER] bg-[PAPER]/70 backdrop-blur-xl">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 sm:px-10">
        <Link href="/" className="group flex items-center gap-3">
          <NextImage
            src="/brand/mark.svg"
            alt="Flyer Church"
            width={32}
            height={32}
            className="h-8 w-8 rounded-lg transition-transform duration-300 group-hover:scale-110"
            priority
          />
          <span className="font-display text-xl tracking-tighter text-[INK]">
            FLYER<span className="text-[GOLD]"> CHURCH</span>
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-10">
          {["Funcionalidades", "Processo", "Planos"].map((item) => (
            <Link
              key={item}
              href={`#${item.toLowerCase()}`}
              className="text-sm font-medium text-[MUTED] hover:text-[INK] transition-colors"
            >
              {item}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-5">
          <Link
            href="/onboarding"
            className="text-sm font-medium text-[MUTED] hover:text-[INK] transition-colors"
          >
            Entrar
          </Link>
          <Link
            href="/onboarding"
            className="hidden sm:block px-5 py-2 rounded-full text-sm font-semibold transition-all shadow-soft bg-[INK] text-[PAPER] hover:bg-[#1A160F]"
          >
            Começar grátis
          </Link>
        </div>
      </nav>
    </header>
  );
}

export default function LandingClient() {
  return (
    <div className="min-h-screen bg-[PAPER] text-[INK] font-body selection:bg-[GOLD]/30">
      <StaticHeader />

      <main>
        {/* HERO */}
        <section className="relative mx-auto max-w-7xl px-6 py-24 sm:px-10 lg:py-32">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(184,134,11,0.08),transparent_40%)] pointer-events-none" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="lg:col-span-7"
            >
              <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${GOLD_DARK} text-xs font-bold uppercase tracking-wider mb-6`}>
                <Sparkles size={12} /> Identidade Visual para Igrejas
              </div>
              <h1 className="font-display text-5xl tracking-wide leading-[0.9] mb-8 text-[INK]">
                Excelência visual
                <br />
                <span className="text-[GOLD]">em cada culto.</span>
              </h1>
              <p className="text-xl text-[MUTED] max-w-xl mb-10 leading-relaxed">
                Transforme a essência da sua igreja em arte. Defina seu Brand DNA e gere flyers profissionais consistentes em segundos, não horas.
              </p>

              <div className="flex flex-wrap gap-4">
                <Link
                  href="/onboarding"
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-[INK] text-[PAPER] text-lg font-bold hover:bg-[#1A160F] transition-all shadow-premium"
                >
                  Começar grátis <ArrowRight size={20} />
                </Link>
                <Link
                  href="#processo"
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-full text-lg font-medium transition-all border-2 border-[BORDER] hover:border-[GOLD] hover:text-[GOLD_DARK]"
                >
                  Ver como funciona
                </Link>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.2 }}
              className="lg:col-span-5 relative"
            >
              <div className="relative z-10 rounded-3xl border-2 border-[BORDER] bg-[PAPER] p-4 shadow-premium overflow-hidden group">
                <div className="aspect-[4/5] rounded-2xl bg-[PAPER_SOFT] flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-[GOLD]/20 to-transparent" />
                  <div className="absolute inset-0">
                    <div className="absolute top-1/4 left-1/3 w-40 h-40 bg-[GOLD] rounded-full blur-3xl opacity-30" />
                    <div className="absolute bottom-1/4 right-1/4 w-56 h-56 bg-[GOLD_LIGHT] rounded-full blur-3xl opacity-25" />
                    <div className="absolute top-1/3 right-1/2 w-20 h-20 bg-[INK] rounded-full blur-2xl opacity-10" />
                  </div>
                </div>
              </div>
              <div className="mt-8 flex justify-center">
                <div className="text-sm font-medium text-[GOLD_DARK]">
                  Brand DNA · composição em destaque
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* FEATURES BENTO */}
        <section id="funcionalidades" className="mx-auto max-w-7xl px-6 py-24 sm:px-10">
          <div className="mb-12 text-center">
            <h2 className="font-display text-4xl lg:text-5xl tracking-wide mb-4 text-[INK]">
              Tudo para a sua comunicação.
            </h2>
            <p className="text-[MUTED] max-w-xl mx-auto">
              Uma infraestrutura completa para designers e pastors que buscam excelência visual.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {FEATURES.map((f) => (
              <motion.div
                key={f.id}
                whileHover={{ y: -5 }}
                className={`group p-8 rounded-3xl border-2 border-[BORDER] bg-[PAPER] transition-all hover:shadow-premium hover:border-[GOLD] ${
                  f.size === "large" ? "md:col-span-2" : f.size === "medium" ? "md:row-span-2 flex flex-col justify-between" : ""
                }`}
              >
                <div className="flex items-start justify-between mb-6">
                  <div className="h-12 w-12 rounded-2xl bg-[GOLD]/10 text-[GOLD_DARK] flex items-center justify-center group-hover:bg-[GOLD] group-hover:text-[PAPER] transition-colors">
                    <f.icon size={24} />
                  </div>
                  {f.tag && (
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[GOLD_DARK] px-2 py-1 rounded-md bg-[GOLD]/10">
                      {f.tag}
                    </span>
                  )}
                </div>
                <div>
                  <h3 className="font-display text-2xl tracking-wide mb-3 text-[INK]">
                    {f.title}
                  </h3>
                  <p className="text-[MUTED] leading-relaxed">{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* PROCESSO */}
        <section id="processo" className="bg-[INK] text-[PAPER] py-20">
          <div className="mx-auto max-w-7xl px-6 sm:px-10 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="font-display text-4xl lg:text-5xl tracking-wide mb-6 leading-tight text-[PAPER]">
                Não é sobre copiar,
                <br />
                é sobre <span className="text-[GOLD]">memorizar.</span>
              </h2>
              <div className="space-y-5 text-[MUTED] text-base leading-relaxed">
                <p>
                  Enquanto outros sistemas pedem referências a cada nova arte, o Flyer Church cria o{" "}
                  <strong className="text-[PAPER]">Brand DNA</strong> da sua igreja.
                </p>
                <p>
                  Nós mapeamos sua paleta, tipografia e atmosfera. Uma vez definida, a IA gera cada novo
                  flyer do zero, mas com a alma da sua marca.
                </p>
              </div>
              <div className="mt-8 flex flex-wrap gap-6">
                <div className="flex items-center gap-2 text-sm font-medium text-[GOLD]">
                  <Check className="text-[GOLD]" size={16} /> Cores Exatas
                </div>
                <div className="flex items-center gap-2 text-sm font-medium text-[GOLD]">
                  <Check className="text-[GOLD]" size={16} /> Fontes Institucionais
                </div>
                <div className="flex items-center gap-2 text-sm font-medium text-[GOLD]">
                  <Check className="text-[GOLD]" size={16} /> Atmosfera Única
                </div>
              </div>
            </div>
            <div className="relative aspect-square bg-[BORDER]/10 rounded-full flex items-center justify-center p-12">
              <div className="relative z-10 bg-[PAPER] text-[INK] p-8 rounded-3xl shadow-premium max-w-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-3 w-3 rounded-full bg-[GOLD]" />
                  <div className="h-3 w-3 rounded-full bg-[GOLD_LIGHT]" />
                  <div className="h-3 w-3 rounded-full bg-[GOLD]/60" />
                </div>
                <p className="font-mono text-sm text-[MUTED] mb-4">Brand DNA · Configurado</p>
                <div className="space-y-2">
                  <div className="h-2 w-full bg-[BORDER] rounded" />
                  <div className="h-2 w-3/4 bg-[BORDER] rounded" />
                  <div className="h-2 w-1/2 bg-[GOLD] rounded" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* PLANOS */}
        <section id="planos" className="mx-auto max-w-7xl px-6 py-24 sm:px-10">
          <div className="mb-16 text-center">
            <h2 className="font-display text-4xl tracking-wide mb-4 text-[INK]">
              Planos Transparentes.
            </h2>
            <p className="text-[MUTED]">
              Escolha o nível de escala para a sua comunicação.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className={`p-12 rounded-3xl transition-all ${
                  plan.popular
                    ? "bg-[PAPER] border-2 border-[GOLD] shadow-premium scale-[1.02] relative z-10"
                    : "bg-[PAPER_SOFT] border-2 border-[BORDER]"
                }`}
              >
                {plan.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-bold uppercase tracking-widest text-[INK] bg-[GOLD] px-3 py-1 rounded-full">
                    Mais Popular
                  </span>
                )}
                <h3 className="font-display text-2xl mb-2 text-[INK]">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-8">
                  <span className="text-4xl font-bold text-[INK]">R$ {plan.price}</span>
                  <span className="text-[MUTED]">/mês</span>
                </div>
                <ul className="space-y-5 mb-10">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-[MUTED]">
                      <Check size={16} className="text-[GOLD] mt-0.5 flex-shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/onboarding"
                  className={`block text-center py-4 rounded-full font-semibold transition-all ${
                    plan.popular
                      ? "bg-[GOLD] text-[INK] hover:bg-[GOLD_LIGHT] shadow-goldGlow"
                      : "bg-[PAPER] text-[INK] border-2 border-[BORDER] hover:border-[GOLD] hover:text-[GOLD_DARK]"
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* CTA FINAL */}
        <section className="mx-auto max-w-5xl px-6 py-24 text-center">
          <div className="rounded-[3rem] bg-[INK] text-[PAPER] p-12 lg:p-20 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[GOLD]/10 blur-3xl rounded-full" />
            <h2 className="font-display text-4xl lg:text-5xl tracking-wide mb-8 relative z-10 text-[PAPER]">
              Pronto para elevar o
              <br />
              padrão da sua igreja?
            </h2>
            <Link
              href="/onboarding"
              className="inline-flex items-center gap-2 px-10 py-5 rounded-full bg-[GOLD] text-[INK] text-lg font-bold hover:bg-[GOLD_LIGHT] transition-all relative z-10 shadow-goldGlow"
            >
              Criar conta grátis <ArrowRight size={20} />
            </Link>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="border-t-2 border-[BORDER] bg-[PAPER] py-12">
        <div className="mx-auto max-w-7xl px-6 sm:px-10 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-3">
            <NextImage src="/brand/mark.svg" alt="Flyer Church" width={24} height={24} />
            <span className="font-display font-bold text-[INK]">FLYER CHURCH</span>
          </div>
          <div className="flex gap-8 text-sm text-[MUTED]">
            <Link href="#" className="hover:text-[INK] transition-colors">Privacidade</Link>
            <Link href="#" className="hover:text-[INK] transition-colors">Termos</Link>
            <Link href="#" className="hover:text-[INK] transition-colors">LGPD</Link>
          </div>
          <p className="text-xs text-[#A69C87]">
            © 2025 Flyer Church. Excelência em Comunicação.
          </p>
        </div>
      </footer>
    </div>
  );
}
