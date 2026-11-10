"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Sparkles, ExternalLink, CheckCircle2 } from "lucide-react";
import { AssetBiblioteca, AssetSuggestion } from "@/lib/tiposAsset";
import { assetSrc } from "@/lib/tiposAsset";

interface SmartSuggestProps {
  suggestions: AssetSuggestion[];
  assets: AssetBiblioteca[];
  onSelect: (asset: AssetBiblioteca) => void;
  label: string;
  emptyMessage?: string;
}

function SmartSuggest({
  suggestions,
  assets,
  onSelect,
  label,
  emptyMessage = "Nenhuma sugestão inteligente disponível.",
}: SmartSuggestProps) {
  const suggestedAssets = useMemo(() => {
    const assetMap = new Map(assets.map((a) => [a.id, a]));
    return suggestions
      .map((s) => assetMap.get(s.assetId))
      .filter((a): a is AssetBiblioteca => a !== undefined);
  }, [suggestions, assets]);

  if (suggestedAssets.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gold-500/20 bg-ink-900/30 p-4 text-center">
        <Sparkles className="mx-auto mb-2 text-gold-500/50" size={20} />
        <p className="text-xs text-parchment-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3"
    >
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-parchment-300 flex items-center gap-1">
          <Sparkles className="h-3.5 w-3.5 text-gold-400" />
          {label}
        </label>
        <span className="px-2 py-0.5 rounded-full bg-gold-500/15 border border-gold-500/30 text-[10px] font-medium text-gold-200">
          {suggestedAssets.length} sugestão{suggestedAssets.length > 1 ? "ões" : ""}
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {suggestedAssets.map((asset, index) => (
          <motion.button
            key={asset.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => onSelect(asset)}
            className="relative h-16 w-16 overflow-hidden rounded-lg border border-gold-500/20 transition-all hover:border-gold-400/60 hover:shadow-glow group"
          >
            <img
              src={assetSrc(asset)}
              alt={asset.nome}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ink-950/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
              <span className="text-[10px] text-parchment-200 truncate block w-full">{asset.nome}</span>
            </div>
            <div className="absolute top-1 right-1 flex items-center gap-1 bg-gold-500/90 text-ink-950 px-1.5 py-0.5 rounded text-[9px] font-medium">
              <Sparkles className="h-2.5 w-2.5" />
              Sugerido
            </div>
            <div className="absolute bottom-1 left-1 bg-emerald-500/90 text-white px-1.5 py-0.5 rounded text-[9px] font-medium">
              <CheckCircle2 className="h-2.5 w-2.5 mr-0.5" />
              Score: {(suggestions[index]?.score * 100).toFixed(0)}%
            </div>
          </motion.button>
        ))}
      </div>

      <p className="text-[10px] text-parchment-500/70">
        Clique para selecionar. Baseado em uso recente e aprovações.
      </p>
    </motion.div>
  );
}

export default SmartSuggest;