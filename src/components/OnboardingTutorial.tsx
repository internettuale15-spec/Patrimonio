import { useEffect, useState } from "react";
import { X, LayoutDashboard, Repeat, ShieldCheck, Send, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useAuthStore } from "@/store/authStore";

const STEPS = [
  {
    icon: LayoutDashboard,
    title: "Benvenuto in Famiglia",
    text: "Qui trovi il quadro generale del patrimonio e delle finanze di famiglia. In alto alla Dashboard trovi anche degli avvisi automatici quando c'è qualcosa da sapere (es. un budget superato).",
  },
  {
    icon: Repeat,
    title: "Spese e entrate ricorrenti",
    text: "Quando aggiungi una spesa o un'entrata che si ripete ogni mese (stipendio, mutuo, abbonamenti), scegli \"Mensile\" nel campo Ricorrenza: da quel momento si registra da sola, e la trovi in \"Ricorrenze\" nel menu.",
  },
  {
    icon: Send,
    title: "Registra spese da Telegram",
    text: "Collega Telegram dall'omonima voce nel menu: da lì puoi scrivere al bot messaggi come \"benzina 40\" per registrare una spesa al volo, senza aprire l'app.",
  },
  {
    icon: ShieldCheck,
    title: "Consulente",
    text: "Nella sezione \"Consulente\" trovi alcuni indicatori calcolati sui tuoi dati reali (risparmio, fondo d'emergenza, indebitamento) — utili per farti un'idea generale, sempre aggiornati da soli.",
  },
];

const STORAGE_KEY_PREFIX = "fw_tutorial_seen_";

export function OnboardingTutorial() {
  const profile = useAuthStore((s) => s.profile);
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!profile) return;
    const seen = localStorage.getItem(STORAGE_KEY_PREFIX + profile.id);
    if (!seen) setOpen(true);
  }, [profile]);

  function close() {
    if (profile) localStorage.setItem(STORAGE_KEY_PREFIX + profile.id, "1");
    setOpen(false);
  }

  if (!open) return null;

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center bg-black/50">
      <div className="w-full md:max-w-sm bg-card rounded-t-2xl md:rounded-2xl border border-border overflow-hidden">
        <div className="flex justify-end p-2">
          <button onClick={close} className="p-2 -m-2 rounded-full hover:bg-muted text-muted-foreground" aria-label="Chiudi">
            <X size={16} />
          </button>
        </div>
        <div className="px-6 pb-6 flex flex-col items-center text-center gap-3">
          <span className="flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 text-primary">
            <current.icon size={26} />
          </span>
          <h2 className="font-display font-semibold text-lg">{current.title}</h2>
          <p className="text-sm text-muted-foreground">{current.text}</p>

          <div className="flex items-center gap-1.5 my-2">
            {STEPS.map((_, i) => (
              <span key={i} className={`w-1.5 h-1.5 rounded-full ${i === step ? "bg-primary" : "bg-muted"}`} />
            ))}
          </div>

          <div className="flex items-center gap-2 w-full">
            {!isLast && (
              <Button variant="ghost" onClick={close} className="flex-1 text-muted-foreground">
                Salta
              </Button>
            )}
            <Button
              onClick={() => (isLast ? close() : setStep((s) => s + 1))}
              className="flex-1"
            >
              {isLast ? "Inizia" : "Avanti"} {!isLast && <ArrowRight size={14} />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
