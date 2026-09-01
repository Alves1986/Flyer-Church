"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft, Check, Sparkles, Users, Mail, Loader2, AlertCircle, Image as ImageIcon, Wand2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import UploadDropzone from "@/components/UploadDropzone";
import { CATEGORIAS_EVENTO } from "@/lib/categorias";
import { CategoriaEvento } from "@/lib/types";

type Step = 1 | 2 | 3;

interface OnboardingClientProps {
  initialUserEmail: string;
}

interface OrgData {
  name: string;
  slug: string;
  denomination: string;
  teamSize: string;
}

interface TemplateData {
  templateId: string | null;
  referencia: { previewUrl: string; base64: string; mimeType: string } | null;
  nome: string;
  categoria: CategoriaEvento | "";
}

interface InviteData {
  emails: string[];
}

export default function OnboardingClient({ initialUserEmail }: OnboardingClientProps) {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [orgData, setOrgData] = useState<OrgData>({
    name: "",
    slug: "",
    denomination: "",
    teamSize: "1-5",
  });

  const [templateData, setTemplateData] = useState<TemplateData>({
    templateId: null,
    referencia: null,
    nome: "",
    categoria: "",
  });

  const [inviteData, setInviteData] = useState<InviteData>({
    emails: [""],
  });

  const canProceedStep1 = orgData.name.trim() && orgData.slug.trim();
  const canProceedStep2 = templateData.templateId !== null;
  const canProceedStep3 = true;

  async function handleStep1Submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/onboarding/org", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(orgData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro ao criar organização");

      setStep(2);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function handleStep2Submit(e: React.FormEvent) {
    e.preventDefault();
    if (!templateData.referencia) {
      setError("Envie um flyer de referência");
      return;
    }
    if (!templateData.nome.trim()) {
      setError("Dê um nome ao template");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const extractRes = await fetch("/api/extract", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          imageBase64: templateData.referencia.base64,
          mimeType: templateData.referencia.mimeType,
          provider: "openrouter",
          model: "",
          apiKey: undefined,
        }),
      });

      const extractData = await extractRes.json();
      if (!extractRes.ok) throw new Error(extractData.error ?? "Falha na extração");

      const { variaveisTexto, variaveisImagem } = await extractVariables(extractData.prompt);

      const saveRes = await fetch("/api/templates", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          id: crypto.randomUUID(),
          nome: templateData.nome.trim(),
          criadoEm: new Date().toISOString(),
          promptExtraido: extractData.prompt.trim(),
          variaveisTexto,
          variaveisImagem,
          categoria: templateData.categoria || undefined,
          thumbnailBase64: templateData.referencia.base64,
        }),
      });

      if (!saveRes.ok) {
        const err = await saveRes.json();
        throw new Error(err.error ?? "Erro ao salvar template");
      }

      const saved = await saveRes.json();
      setTemplateData((s) => ({ ...s, templateId: saved.template?.id ?? saved.id }));

      setStep(3);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function handleStep3Submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const validEmails = inviteData.emails.filter((e) => e.trim() && e.includes("@"));

    try {
      for (const email of validEmails) {
        await fetch("/api/onboarding/invite", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ email: email.trim(), role: "designer" }),
        });
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  function goBack() {
    setStep((s) => (s === 1 ? 1 : s === 2 ? 1 : 2) as Step);
    setError(null);
  }

  function addEmail() {
    setInviteData((s) => ({ ...s, emails: [...s.emails, ""] }));
  }

  function removeEmail(index: number) {
    setInviteData((s) => ({ ...s, emails: s.emails.filter((_, i) => i !== index) }));
  }

  function updateEmail(index: number, value: string) {
    setInviteData((s) => ({
      ...s,
      emails: s.emails.map((e, i) => (i === index ? value : e)),
    }));
  }

  const steps = [
    { number: 1, label: "Igreja", icon: <Sparkles className="h-5 w-5" />, title: "Dados da igreja" },
    { number: 2, label: "Template", icon: <Wand2 className="h-5 w-5" />, title: "Primeiro template" },
    { number: 3, label: "Equipe", icon: <Users className="h-5 w-5" />, title: "Convidar equipe" },
  ];

  return (
    <div className="mx-auto max-w-2xl py-12 px-4">
      <div className="mb-10 text-center">
        <h1 className="font-display text-3xl tracking-wide text-parchment-100">Bem-vindo ao FlyerForge</h1>
        <p className="mt-2 text-parchment-500">Vamos configurar sua igreja em 3 passos rápidos</p>
      </div>

      <div className="mb-8 flex items-center justify-center gap-2">
        {steps.map((s, i) => (
          <motion.div
            key={s.number}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="flex items-center gap-2"
          >
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-medium transition-colors ${
                s.number < step
                  ? "bg-emerald-500 text-ink-950"
                  : s.number === step
                  ? "bg-gold-500 text-ink-950"
                  : "bg-ink-900/50 border border-gold-500/20 text-parchment-400"
              }`}
            >
              {s.number < step ? <Check className="h-5 w-5" /> : s.icon}
            </div>
            {i < steps.length - 1 && (
              <motion.div
                className={`h-1 w-16 rounded transition-colors ${
                  s.number < step ? "bg-emerald-500" : "bg-gold-500/20"
                }`}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: s.number < step ? 1 : 0 }}
              />
            )}
          </motion.div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6 flex items-start gap-2 rounded-xl border border-red-500/20 bg-red-500/5 p-3 text-xs text-red-300"
          >
            <AlertCircle size={14} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.form
            key="step1"
            onSubmit={handleStep1Submit}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            <h2 className="font-display text-xl text-parchment-100">1. Dados da igreja</h2>

            <div>
              <label className="mb-2 block text-sm font-medium text-parchment-100">Nome da igreja</label>
              <input
                value={orgData.name}
                onChange={(e) => setOrgData((s) => ({ ...s, name: e.target.value }))}
                placeholder="Ex: Igreja Batista Central"
                className="w-full rounded-xl border border-gold-500/15 bg-ink-900/70 px-4 py-3 text-sm text-parchment-100 outline-none transition-colors placeholder:text-parchment-500/60 focus:border-gold-400/50"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-parchment-100">Slug (URL personalizada)</label>
              <div className="flex items-center gap-2">
                <span className="text-parchment-500">flyerforge.app/</span>
                <input
                  value={orgData.slug}
                  onChange={(e) => setOrgData((s) => ({ ...s, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") }))}
                  placeholder="igreja-central"
                  className="flex-1 rounded-xl border border-gold-500/15 bg-ink-900/70 px-4 py-3 text-sm text-parchment-100 outline-none transition-colors placeholder:text-parchment-500/60 focus:border-gold-400/50"
                  required
                />
              </div>
              <p className="mt-1 text-xs text-parchment-500">Apenas letras minúsculas, números e hífens</p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-parchment-100">Denominação (opcional)</label>
              <input
                value={orgData.denomination}
                onChange={(e) => setOrgData((s) => ({ ...s, denomination: e.target.value }))}
                placeholder="Ex: Batista, Presbiteriana, Assembleia de Deus"
                className="w-full rounded-xl border border-gold-500/15 bg-ink-900/70 px-4 py-3 text-sm text-parchment-100 outline-none transition-colors placeholder:text-parchment-500/60 focus:border-gold-400/50"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-parchment-100">Tamanho da equipe de mídia</label>
              <select
                value={orgData.teamSize}
                onChange={(e) => setOrgData((s) => ({ ...s, teamSize: e.target.value }))}
                className="w-full rounded-xl border border-gold-500/15 bg-ink-900/70 px-4 py-3 text-sm text-parchment-100 outline-none transition-colors focus:border-gold-400/50"
              >
                <option value="1-5">1 a 5 pessoas</option>
                <option value="6-15">6 a 15 pessoas</option>
                <option value="16-50">16 a 50 pessoas</option>
                <option value="50+">Mais de 50</option>
              </select>
            </div>

            <motion.button
              type="submit"
              disabled={!canProceedStep1 || loading}
              whileHover={{ scale: canProceedStep1 ? 1.01 : 1 }}
              whileTap={{ scale: canProceedStep1 ? 0.98 : 1 }}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-gold-500 to-gold-700 px-6 py-3 text-sm font-semibold text-ink-950 shadow-glow disabled:cursor-not-allowed disabled:opacity-40"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Criando organização...
                </>
              ) : (
                <>
                  Próximo
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </motion.button>
          </motion.form>
        )}

        {step === 2 && (
          <motion.form
            key="step2"
            onSubmit={handleStep2Submit}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            <h2 className="font-display text-xl text-parchment-100">2. Primeiro template</h2>
            <p className="text-parchment-500">
              Envie um flyer de referência. Extrairemos a identidade visual automaticamente.
            </p>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-[220px_1fr]">
              <UploadDropzone
                label="Flyer de referência"
                hint="PNG ou JPG, formato retrato"
                aspect="portrait"
                value={templateData.referencia}
                onChange={(v) => setTemplateData((s) => ({ ...s, referencia: v, templateId: null }))}
              />

              <div className="flex flex-col gap-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-parchment-100">Nome do template</label>
                  <input
                    value={templateData.nome}
                    onChange={(e) => setTemplateData((s) => ({ ...s, nome: e.target.value }))}
                    placeholder="Ex: Culto de Domingo — Matriz"
                    className="w-full rounded-xl border border-gold-500/15 bg-ink-900/70 px-4 py-3 text-sm text-parchment-100 outline-none transition-colors placeholder:text-parchment-500/60 focus:border-gold-400/50"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-parchment-100">Categoria do evento</label>
                  <select
                    value={templateData.categoria}
                    onChange={(e) => setTemplateData((s) => ({ ...s, categoria: e.target.value as CategoriaEvento | "" }))}
                    className="w-full rounded-xl border border-gold-500/15 bg-ink-900/70 px-3 py-2.5 text-sm text-parchment-100 outline-none transition-colors focus:border-gold-400/50"
                  >
                    <option value="">Sem categoria</option>
                    {CATEGORIAS_EVENTO.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nome}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <motion.button
                type="button"
                onClick={goBack}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-gold-500/20 bg-gold-500/10 px-4 py-3 text-sm font-medium text-gold-200"
              >
                <ArrowLeft className="h-5 w-5" />
                Voltar
              </motion.button>

              <motion.button
                type="submit"
                disabled={!canProceedStep2 || loading}
                whileHover={{ scale: canProceedStep2 ? 1.01 : 1 }}
                whileTap={{ scale: canProceedStep2 ? 0.98 : 1 }}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-gold-500 to-gold-700 px-6 py-3 text-sm font-semibold text-ink-950 shadow-glow disabled:cursor-not-allowed disabled:opacity-40"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Extraindo e salvando...
                  </>
                ) : (
                  <>
                    Extrair e salvar
                    <ArrowRight className="h-5 w-5" />
                  </>
                )}
              </motion.button>
            </div>
          </motion.form>
        )}

        {step === 3 && (
          <motion.form
            key="step3"
            onSubmit={handleStep3Submit}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            <h2 className="font-display text-xl text-parchment-100">3. Convidar equipe (opcional)</h2>
            <p className="text-parchment-500">
              Adicione membros da equipe de mídia. Eles receberão um email para acessar o FlyerForge.
            </p>

            <div className="space-y-3">
              {inviteData.emails.map((email, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    value={email}
                    onChange={(e) => updateEmail(index, e.target.value)}
                    placeholder={index === 0 ? "seu@email.com" : "outro@email.com"}
                    type="email"
                    className="flex-1 rounded-xl border border-gold-500/15 bg-ink-900/70 px-4 py-3 text-sm text-parchment-100 outline-none transition-colors placeholder:text-parchment-500/60 focus:border-gold-400/50"
                  />
                  {inviteData.emails.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeEmail(index)}
                      className="p-2 rounded-lg text-parchment-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      title="Remover"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  )}
                </div>
              ))}

              {inviteData.emails.length < 5 && (
                <button
                  type="button"
                  onClick={addEmail}
                  className="w-full py-2 text-sm text-parchment-400 hover:text-gold-300"
                >
                  + Adicionar outro membro
                </button>
              )}
            </div>

            <p className="text-xs text-parchment-500">Role padrão: Designer (pode criar/editar templates e flyers)</p>

            <div className="flex gap-3">
              <motion.button
                type="button"
                onClick={goBack}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-gold-500/20 bg-gold-500/10 px-4 py-3 text-sm font-medium text-gold-200"
              >
                <ArrowLeft className="h-5 w-5" />
                Voltar
              </motion.button>

              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-gold-500 to-gold-700 px-6 py-3 text-sm font-semibold text-ink-950 shadow-glow"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Finalizando...
                  </>
                ) : (
                  <>
                    Concluir configuração
                    <ArrowRight className="h-5 w-5" />
                  </>
                )}
              </motion.button>
            </div>

            <p className="text-center text-xs text-parchment-500">
              Pode pular e convidar depois em <span className="underline">Configurações → Equipe</span>
            </p>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}

async function extractVariables(prompt: string) {
  const textVars: string[] = [];
  const imageVars: string[] = [];

  const textMatches = prompt.match(/\[([A-Z_]+)\]/g);
  if (textMatches) {
    for (const match of textMatches) {
      const varName = match.slice(1, -1);
      if (["FOTO_PRELETOR_ANEXADA", "LOGO_IGREJA_ANEXADO"].includes(varName)) {
        imageVars.push(varName);
      } else {
        textVars.push(varName);
      }
    }
  }

  return { variaveisTexto: [...new Set(textVars)], variaveisImagem: [...new Set(imageVars)] };
}