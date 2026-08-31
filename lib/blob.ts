/**
 * Upload opcional de imagens para o Vercel Blob.
 *
 * Sem `BLOB_READ_WRITE_TOKEN` configurado, o app continua funcionando
 * normalmente enviando as imagens como base64 embutido nas chamadas de
 * API (comportamento original) — isso só é usado para persistir logos,
 * fotos de preletor e flyers gerados quando quiser manter histórico no
 * banco de dados.
 */
export function isBlobConfigured(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

export async function uploadBase64ToBlob(
  filename: string,
  base64: string,
  mimeType: string
): Promise<string> {
  const { put } = await import("@vercel/blob");
  const buffer = Buffer.from(base64, "base64");
  const blob = await put(filename, buffer, {
    access: "public",
    contentType: mimeType,
    addRandomSuffix: true,
  });
  return blob.url;
}
