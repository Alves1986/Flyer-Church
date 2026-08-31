"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { AlertTriangle, History, ImageOff, Star } from "lucide-react";
import { getGeneratedFlyers, getTemplates } from "@/lib/store";
import { getFormatoPreset } from "@/lib/formatos";
import { STATUS_FLYER_CORES, STATUS_FLYER_ORDEM, STATUS_FLYER_ROTULOS } from "@/lib/statusFlyer";
import { FlyerTemplate, GeneratedFlyer, StatusFlyer } from "@/lib/types";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.05 } },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
};

function formatarData(iso: string): string {
  try {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export default function HistoricoPage() {
  const [flyers, setFlyers] = useState<GeneratedFlyer[]>([]);
  const [templates, setTemplates] = useState<FlyerTemplate[]>([]);
  const [status, setStatus] = useState<"carregando" | "pronto" | "indisponivel">("carregando");
  const [erro, setErro] = useState<string | null>(null);
  const [filtroStatus, setFiltroStatus] = useState<StatusFlyer | "todos">("todos");

  useEffect(() => {
    getTemplates().then(setTemplates);
    getGeneratedFlyers()
      .then((data) => {
        setFlyers(data);
        setStatus("pronto");
      })
      .catch((e) => {
        setErro((e as Error).message);
        setStatus("indisponivel");
      });
  }, []);

  function nomeTemplate(templateId: string): string {
    return templates.find((t) => t.id === templateId)?.nome ?? "Template removido";
  }

  const statusUsados = STATUS_FLYER_ORDEM.filter((s) => flyers.some((f) => (f.status ?? "gerado") === s));
  const flyersFiltrados =
    filtroStatus === "todos" ? flyers : flyers.filter((f) => (f.status ?? "gerado") === filtroStatus);

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="mb-10 flex flex-col gap-2 border-b border-gold-500/10 pb-8"
      >
        <p className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-gold-500/80">
          <History size={13} /> Estúdio de flyers
        </p>
        <h1 className="font-display text-4xl leading-none tracking-wide text-parchment-100 sm:text-5xl">
          Histórico de flyers
        </h1>
        <p className="mt-3 max-w-lg text-sm text-parchment-500">
          Toda arte gerada fica registrada aqui, com o status de aprovação e a
          avaliação de quem revisou.
        </p>
      </motion.div>

      {status === "carregando" && (
        <p className="text-sm text-parchment-500">Carregando histórico…</p>
      )}

      {status === "indisponivel" && (
        <div className="flex items-start gap-2 rounded-xl border border-gold-500/15 bg-ink-900/50 p-4 text-sm text-parchment-400">
          <AlertTriangle size={16} className="mt-0.5 shrink-0 text-gold-500/70" />
          <span>
            {erro ??
              "Histórico indisponível no momento."} Conecte um banco Postgres ao
            projeto na Vercel para acompanhar o histórico entre navegadores.
          </span>
        </div>
      )}

      {status === "pronto" && flyers.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gold-500/20 py-20 text-center">
          <History className="mb-3 text-gold-500/50" size={28} />
          <p className="text-parchment-300">Nenhum flyer gerado ainda.</p>
          <p className="mt-1 text-sm text-parchment-500">
            Gere um flyer a partir de um template para ele aparecer aqui.
          </p>
        </div>
      )}

      {status === "pronto" && flyers.length > 0 && (
        <>
          {statusUsados.length > 1 && (
            <div className="mb-6 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setFiltroStatus("todos")}
                className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
                  filtroStatus === "todos"
                    ? "border-gold-400/60 bg-gold-500/15 text-gold-200"
                    : "border-gold-500/15 text-parchment-500 hover:border-gold-500/30 hover:text-parchment-300"
                }`}
              >
                Todos
              </button>
              {statusUsados.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setFiltroStatus(s)}
                  className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
                    filtroStatus === s
                      ? "border-gold-400/60 bg-gold-500/15 text-gold-200"
                      : "border-gold-500/15 text-parchment-500 hover:border-gold-500/30 hover:text-parchment-300"
                  }`}
                >
                  {STATUS_FLYER_ROTULOS[s]}
                </button>
              ))}
            </div>
          )}

          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
          >
            {flyersFiltrados.map((f) => {
              const s = f.status ?? "gerado";
              const formato = f.formatoId ? getFormatoPreset(f.formatoId) : undefined;
              return (
                <motion.div key={f.id} variants={item}>
                  <Link
                    href={`/flyers/novo/${f.templateId}`}
                    className="group block overflow-hidden rounded-2xl border border-gold-500/12 bg-ink-900/60 transition-all duration-200 hover:-translate-y-0.5 hover:border-gold-500/30 hover:shadow-glow"
                  >
                    <div className="relative flex aspect-[4/5] items-center justify-center overflow-hidden bg-ink-950/60">
                      {f.imagemUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={f.imagemUrl}
                          alt={nomeTemplate(f.templateId)}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <ImageOff className="text-parchment-500/30" size={28} />
                      )}
                      <span
                        className={`absolute left-2.5 top-2.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${STATUS_FLYER_CORES[s]}`}
                      >
                        {STATUS_FLYER_ROTULOS[s]}
                      </span>
                    </div>

                    <div className="p-4">
                      <h3 className="mb-1 font-display text-lg tracking-wide text-parchment-100">
                        {nomeTemplate(f.templateId)}
                      </h3>
                      <p className="mb-2 text-xs text-parchment-500">
                        {formatarData(f.criadoEm)}
                        {formato ? ` · ${formato.nome}` : ""}
                      </p>

                      {typeof f.avaliacao === "number" && (
                        <div className="mb-1 flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((n) => (
                            <Star
                              key={n}
                              size={13}
                              className={
                                n <= f.avaliacao!
                                  ? "fill-gold-400 text-gold-400"
                                  : "text-parchment-500/25"
                              }
                            />
                          ))}
                        </div>
                      )}

                      {f.motivoRejeicao && (
                        <p className="mt-1 text-xs text-red-300/80">
                          Motivo: {f.motivoRejeicao}
                        </p>
                      )}
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        </>
      )}
    </div>
  );
}
