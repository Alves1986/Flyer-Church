"use client";

import { useCallback, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ImagePlus, X } from "lucide-react";

interface UploadDropzoneProps {
  label: string;
  hint?: string;
  value: { previewUrl: string; base64: string; mimeType: string } | null;
  onChange: (file: { previewUrl: string; base64: string; mimeType: string } | null) => void;
  aspect?: "square" | "portrait" | "wide";
}

function fileToBase64(file: File): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const [, base64] = result.split(",");
      resolve({ base64, mimeType: file.type });
    };
    reader.onerror = () => reject(new Error("Falha ao ler o arquivo"));
    reader.readAsDataURL(file);
  });
}

const aspectClass = {
  square: "aspect-square",
  portrait: "aspect-[3/4]",
  wide: "aspect-[16/9]",
};

export default function UploadDropzone({
  label,
  hint,
  value,
  onChange,
  aspect = "wide",
}: UploadDropzoneProps) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    async (file: File | undefined) => {
      if (!file) return;
      const { base64, mimeType } = await fileToBase64(file);
      onChange({ previewUrl: URL.createObjectURL(file), base64, mimeType });
    },
    [onChange]
  );

  return (
    <div>
      <p className="mb-2 text-sm font-medium text-parchment-100">{label}</p>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          void handleFile(e.dataTransfer.files?.[0]);
        }}
        onClick={() => !value && inputRef.current?.click()}
        className={`relative overflow-hidden rounded-2xl border transition-all duration-200 ${aspectClass[aspect]} ${
          value ? "border-gold-500/30" : "cursor-pointer border-dashed border-gold-500/25 hover:border-gold-400/50 hover:bg-gold-500/[0.03]"
        } ${dragging ? "border-gold-400 bg-gold-500/[0.06] shadow-glow" : ""}`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => void handleFile(e.target.files?.[0])}
        />

        {value ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={value.previewUrl}
              alt={label}
              className="h-full w-full object-cover"
            />
            <motion.button
              type="button"
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.94 }}
              onClick={(e) => {
                e.stopPropagation();
                onChange(null);
              }}
              className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-ink-950/80 text-parchment-100 ring-1 ring-gold-500/30 backdrop-blur-sm"
            >
              <X size={14} />
            </motion.button>
          </>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 px-4 text-center">
            <ImagePlus className="text-gold-400/70" size={22} />
            <p className="text-xs text-parchment-500">
              {hint ?? "Arraste uma imagem ou clique para enviar"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
