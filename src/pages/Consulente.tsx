import { ShieldCheck, ShieldAlert, ShieldQuestion, Info } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useDashboardData } from "@/hooks/useDashboardData";
import { usePatrimonio } from "@/hooks/usePatrimonio";
import { useInvestments, INVESTMENT_TYPE_LABELS } from "@/hooks/useInvestments";
import { formatPercent, cn } from "@/lib/utils";

type Verdict = "good" | "warning" | "bad" | "unknown";

interface Indicator {
  label: string;
  value: string;
  verdict: Verdict;
  explanation: string;
}

const VERDICT_STYLE: Record<Verdict, { icon: typeof ShieldCheck; className: string }> = {
  good: { icon: ShieldCheck, className: "bg-income/10 text-income" },
  warning: { icon: ShieldAlert, className: "bg-goal/10 text-goal" },
  bad: { icon: ShieldAlert, className: "bg-danger/10 text-danger" },
  unknown: { icon: ShieldQuestion, className: "bg-muted text-muted-foreground" },
};

export default function Consulente() {
  const { householdId } = useAuthStore();
  const { loading: loadingDash, summary } = useDashboardData();
  const { loading: loadingPatr, totalAssets, totalLiabilities, liquidity } = usePatrimonio(householdId);
  const { loading: loadingInv, investments, totalValue: investmentsTotal } = useInvestments(householdId);

  const loading = loadingDash || loadingPatr || loadingInv;

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-sm text-muted-foreground">Analisi in corso...</div>;
  }

  const indicators: Indicator[] = [];

  // 1. Tasso di risparmio
  if (summary.monthlyIncome > 0) {
    const rate = summary.monthlySavings / summary.monthlyIncome;
    indicators.push({
      label: "Tasso di risparmio",
      value: formatPercent(rate),
      verdict: rate >= 0.2 ? "good" : rate >= 0.1 ? "warning" : "bad",
      explanation:
        rate >= 0.2
          ? "Stai mettendo da parte una quota sana del reddito mensile (indicativamente sopra il 20% è considerato un buon traguardo)."
          : rate >= 0.1
          ? "Risparmi qualcosa ogni mese, ma c'è margine: puntare al 20% del reddito è un obiettivo comune per chi vuole costruire riserve più solide."
          : "Il risparmio mensile è basso o negativo. Vale la pena guardare le categorie di spesa più pesanti per capire dove intervenire.",
    });
  } else {
    indicators.push({
      label: "Tasso di risparmio",
      value: "—",
      verdict: "unknown",
      explanation: "Servono entrate registrate questo mese per calcolarlo.",
    });
  }

  // 2. Fondo d'emergenza (mesi coperti dalla liquidità)
  const avgMonthlyExpense = summary.yearlyExpense > 0 ? summary.yearlyExpense / 12 : summary.monthlyExpense;
  if (avgMonthlyExpense > 0) {
    const months = liquidity / avgMonthlyExpense;
    indicators.push({
      label: "Fondo d'emergenza",
      value: `${months.toFixed(1)} mesi`,
      verdict: months >= 6 ? "good" : months >= 3 ? "warning" : "bad",
      explanation:
        months >= 6
          ? "La liquidità disponibile copre 6 mesi o più di spese — un margine di sicurezza solido per gli imprevisti."
          : months >= 3
          ? "Hai una riserva di base, ma la soglia comunemente indicata come confortevole è tra 3 e 6 mesi di spese coperte."
          : "La liquidità copre meno di 3 mesi di spese. Un fondo d'emergenza più ampio riduce il rischio in caso di imprevisti.",
    });
  }

  // 3. Indebitamento rispetto al patrimonio
  const grossAssets = totalAssets + investmentsTotal;
  if (grossAssets > 0) {
    const debtRatio = totalLiabilities / grossAssets;
    indicators.push({
      label: "Indebitamento",
      value: formatPercent(debtRatio),
      verdict: debtRatio <= 0.3 ? "good" : debtRatio <= 0.5 ? "warning" : "bad",
      explanation:
        debtRatio <= 0.3
          ? "I debiti residui (mutuo, prestiti) sono contenuti rispetto al patrimonio complessivo."
          : debtRatio <= 0.5
          ? "L'indebitamento è nella media, ma tenerlo d'occhio nel tempo aiuta a non farlo crescere ulteriormente."
          : "I debiti pesano per più della metà del patrimonio lordo — vale la pena valutare un piano di rientro più aggressivo se possibile.",
    });
  }

  // 4. Diversificazione investimenti
  if (investments.length > 0 && investmentsTotal > 0) {
    const byType = new Map<string, number>();
    investments.forEach((i) => byType.set(i.type, (byType.get(i.type) ?? 0) + i.value));
    const [topType, topValue] = [...byType.entries()].sort((a, b) => b[1] - a[1])[0];
    const concentration = topValue / investmentsTotal;
    indicators.push({
      label: "Diversificazione investimenti",
      value: `${formatPercent(concentration)} in ${INVESTMENT_TYPE_LABELS[topType as keyof typeof INVESTMENT_TYPE_LABELS]}`,
      verdict: concentration <= 0.5 ? "good" : concentration <= 0.75 ? "warning" : "bad",
      explanation:
        concentration <= 0.5
          ? "Il portafoglio è distribuito su più tipologie di investimento, senza una concentrazione eccessiva."
          : concentration <= 0.75
          ? "Più della metà degli investimenti è concentrata in una sola tipologia — non necessariamente un problema, ma da monitorare."
          : "Gli investimenti sono fortemente concentrati in un'unica tipologia, il che aumenta l'esposizione a un singolo rischio.",
    });
  }

  // 5. Aderenza al budget
  if (summary.budgetUsedPct > 0) {
    indicators.push({
      label: "Aderenza al budget",
      value: formatPercent(summary.budgetUsedPct),
      verdict: summary.budgetUsedPct <= 0.9 ? "good" : summary.budgetUsedPct <= 1 ? "warning" : "bad",
      explanation:
        summary.budgetUsedPct <= 0.9
          ? "Sei entro i budget impostati per le categorie con un tetto di spesa."
          : summary.budgetUsedPct <= 1
          ? "Ti stai avvicinando al limite dei budget impostati questo mese."
          : "Hai superato il totale dei budget impostati per questo mese in una o più categorie.",
    });
  }

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-semibold">Consulente</h1>
        <p className="text-sm text-muted-foreground">
          Indicatori calcolati sui tuoi dati reali, aggiornati automaticamente ogni mese.
        </p>
      </div>

      <div className="rounded-xl bg-muted/60 p-3 flex items-start gap-2 text-xs text-muted-foreground">
        <Info size={14} className="mt-0.5 shrink-0" />
        <p>
          Queste sono informazioni generali basate su soglie comunemente usate in ambito di
          pianificazione familiare, non una consulenza finanziaria personalizzata. Per decisioni
          importanti (mutui, investimenti, ristrutturazione del debito) rivolgiti a un professionista.
        </p>
      </div>

      {indicators.length === 0 && (
        <p className="text-sm text-muted-foreground py-6 text-center">
          Servono più dati registrati (entrate, spese, patrimonio) per calcolare i primi indicatori.
        </p>
      )}

      <div className="flex flex-col gap-3">
        {indicators.map((ind) => {
          const { icon: Icon, className } = VERDICT_STYLE[ind.verdict];
          return (
            <div key={ind.label} className="rounded-2xl border border-border bg-card p-4 flex gap-3">
              <span className={cn("flex items-center justify-center w-10 h-10 rounded-full shrink-0", className)}>
                <Icon size={18} />
              </span>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">{ind.label}</span>
                  <span className="font-display font-semibold tabular-nums">{ind.value}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{ind.explanation}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
