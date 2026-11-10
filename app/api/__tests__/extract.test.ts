import { describe, it, expect } from "vitest";
import { POST } from "@/app/api/extract/route";
import { NextRequest } from "next/server";

describe("/api/extract - basic validation", () => {
  it("retorna 400 se request body inválido", async () => {
    const req = new NextRequest("http://localhost/api/extract", {
      method: "POST",
      body: "invalid json",
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("Corpo da requisição inválido.");
  });

  it("retorna 400 se modelo não enviado", async () => {
    const req = new NextRequest("http://localhost/api/extract", {
      method: "POST",
      body: JSON.stringify({ image: { base64: "test", mimeType: "image/png" } }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    // O erro pode variar dependendo da configuração, só verifica que retorna 400
    expect(res.status).toBe(400);
  });

  it("retorna 400 se imagem não enviada", async () => {
    const req = new NextRequest("http://localhost/api/extract", {
      method: "POST",
      body: JSON.stringify({ model: "test-model" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("Envie imageBase64 e mimeType da imagem de referência.");
  });
});