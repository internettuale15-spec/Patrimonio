import { useState } from "react";
import { cn } from "@/lib/utils";

const PALETTE = [
  "#1F6F54", "#2563EB", "#D97706", "#DC2626", "#7C3AED",
  "#0891B2", "#DB2777", "#65A30D", "#EA580C", "#4338CA",
];

function colorForLabel(label: string): string {
  let hash = 0;
  for (let i = 0; i < label.length; i++) hash = label.charCodeAt(i) + ((hash << 5) - hash);
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

function initialsForLabel(label: string): string {
  const parts = label.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

const SIZE_CLASSES = {
  sm: "w-6 h-6 text-[10px]",
  md: "w-8 h-8 text-xs",
  lg: "w-11 h-11 text-sm",
} as const;

/**
 * Mostra il logo di una banca/broker/ETF/azione/crypto a partire da un URL
 * risolto con `getInvestmentLogoUrl` / `getInstitutionLogoUrl`. Se l'URL è
 * assente o l'immagine fallisce il caricamento (404 su logo non mappato),
 * ricade su un avatar con le iniziali colorato in modo deterministico.
 */
export function AssetLogo({
  label,
  url,
  size = "md",
  className,
}: {
  label: string;
  url?: string | null;
  size?: keyof typeof SIZE_CLASSES;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const showFallback = !url || failed;

  if (showFallback) {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-full font-semibold text-white shrink-0",
          SIZE_CLASSES[size],
          className
        )}
        style={{ backgroundColor: colorForLabel(label) }}
        aria-label={label}
      >
        {initialsForLabel(label)}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-full bg-white border border-border overflow-hidden shrink-0",
        SIZE_CLASSES[size],
        className
      )}
    >
      <img
        src={url}
        alt={label}
        className="w-full h-full object-contain p-1"
        loading="lazy"
        onError={() => setFailed(true)}
      />
    </div>
  );
}
