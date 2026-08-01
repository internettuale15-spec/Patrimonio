import { Label, Select, Input } from "@/components/ui/Field";
import type { RecurrenceType } from "@/types";

interface RecurrenceFieldsProps {
  value: RecurrenceType;
  onChange: (type: RecurrenceType) => void;
  dayOfMonth: number;
  onDayOfMonthChange: (day: number) => void;
}

export function RecurrenceFields({ value, onChange, dayOfMonth, onDayOfMonthChange }: RecurrenceFieldsProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="flex flex-col gap-1">
        <Label>Ricorrenza</Label>
        <Select value={value} onChange={(e) => onChange(e.target.value as RecurrenceType)}>
          <option value="una_tantum">Una tantum</option>
          <option value="mensile">Mensile</option>
          <option value="annuale">Annuale</option>
        </Select>
      </div>
      {value === "mensile" && (
        <div className="flex flex-col gap-1">
          <Label>Giorno del mese</Label>
          <Input
            type="number"
            min={1}
            max={28}
            value={dayOfMonth}
            onChange={(e) => onDayOfMonthChange(Number(e.target.value))}
          />
        </div>
      )}
    </div>
  );
}
