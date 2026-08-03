import { ChevronLeft, ChevronRight } from "lucide-react";

export function MonthNavigator({
  viewDate, onChange,
}: {
  viewDate: Date;
  onChange: (d: Date) => void;
}) {
  const label = viewDate.toLocaleDateString("it-IT", { month: "long", year: "numeric" });
  const isCurrentMonth =
    viewDate.getFullYear() === new Date().getFullYear() && viewDate.getMonth() === new Date().getMonth();

  function shift(delta: number) {
    onChange(new Date(viewDate.getFullYear(), viewDate.getMonth() + delta, 1));
  }

  return (
    <div className="flex items-center gap-1">
      <button onClick={() => shift(-1)} className="p-1.5 rounded-full hover:bg-muted text-muted-foreground" aria-label="Mese precedente">
        <ChevronLeft size={16} />
      </button>
      <span className="text-sm font-medium capitalize min-w-[9rem] text-center">{label}</span>
      <button
        onClick={() => shift(1)}
        disabled={isCurrentMonth}
        className="p-1.5 rounded-full hover:bg-muted text-muted-foreground disabled:opacity-30 disabled:pointer-events-none"
        aria-label="Mese successivo"
      >
        <ChevronRight size={16} />
      </button>
      {!isCurrentMonth && (
        <button
          onClick={() => onChange(new Date())}
          className="text-xs text-primary hover:underline ml-1"
        >
          Torna a oggi
        </button>
      )}
    </div>
  );
}
