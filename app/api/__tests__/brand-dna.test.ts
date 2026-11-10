import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/brand-dna/propose/route";
import { NextRequest } from "next/server";

vi.mock("@/lib/openrouter", () => ({
  callOpenRouterChat: vi.fn(),
  isOpenRouterConfigured: vi.fn(),
}));

import { callOpenRouterChat, isOpenRouterConfigured } from "@/lib/openrouter";

describe("/api/brand-dna/propose", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(isOpenRouterConfigured).mockReturnValue(true);
  });

  it("retorna 400 se campos obrigatórios faltando", async () => {
    const req = new NextRequest("http://localhost/api/brand-dna/propose", {
      method: "POST",
      body: JSON.stringify({ respostas: { nomeIgreja: "" } }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("nome da igreja e o tom de voz");
  });

  it("retorna 501 se OpenRouter não configurado e sem apiKey", async () => {
    vi.mocked(isOpenRouterConfigured).mockReturnValueOnce(false);

    const req = new NextRequest("http://localhost/api/brand-dna/propose", {
      method: "POST",
      body: JSON.stringify({
        respostas: { nomeIgreja: "Igreja Teste", tomDeVoz: "acolhedor" },
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(501);
    const data = await res.json();
    expect(data.error).toContain("Nenhuma chave da OpenRouter configurada");
  });
});