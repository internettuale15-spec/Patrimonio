import { cn } from "@/lib/utils";

interface ProgressRingProps {
  pct: number; // 0..1 (può superare 1, viene clampato per il disegno)
  size?: number;
  strokeWidth?: number;
  colorClass?: string; // es. "stroke-primary", "stroke-danger" — ignorato se si passa `color`
  color?: string; // colore CSS/hex diretto, ha priorità su colorClass
  children?: React.ReactNode;
}

export function ProgressRing({
  pct, size = 56, strokeWidth = 6, colorClass = "stroke-primary", color, children,
}: ProgressRingProps) {
  const clamped = Math.max(0, Math.min(pct, 1));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - clamped);

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className="stroke-muted"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={cn("transition-all duration-500", !color && colorClass)}
          style={color ? { stroke: color } : undefined}
        />
      </svg>
      {children && (
        <div className="absolute inset-0 flex items-center justify-center text-xs font-display font-semibold">
          {children}
        </div>
      )}
    </div>
  );
}
