import { useState } from "react";
import { Plus, Target } from "lucide-react";
import StatCard from "@/components/StatCard";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { GoalForm } from "@/components/goals/GoalForm";
import { GoalCard } from "@/components/goals/GoalCard";
import { useGoals } from "@/hooks/useGoals";
import { useAuthStore } from "@/store/authStore";

export default function Obiettivi() {
  const { householdId } = useAuthStore();
  const { goals, loading, refetch, completedCount, addContribution, deleteGoal } = useGoals(householdId);
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Obiettivi</h1>
          <p className="text-sm text-muted-foreground">Fondo emergenza, vacanze, casa, futuro dei figli...</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Plus size={16} /> Nuovo obiettivo
        </Button>
      </div>

      <StatCard label="Obiettivi Raggiunti" value={`${completedCount} / ${goals.length}`} icon={Target} />

      {!loading && (
        <div className="grid md:grid-cols-2 gap-3">
          {goals.map((goal) => (
            <GoalCard key={goal.id} goal={goal} onContribute={(amount) => addContribution(goal.id, amount)} onDelete={deleteGoal} />
          ))}
        </div>
      )}

      {!loading && goals.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-10">
          Nessun obiettivo ancora. Creane uno per iniziare a tracciare i tuoi risparmi.
        </p>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nuovo obiettivo">
        {householdId && (
          <GoalForm householdId={householdId} onSuccess={() => { setModalOpen(false); refetch(); }} />
        )}
      </Modal>
    </div>
  );
}
