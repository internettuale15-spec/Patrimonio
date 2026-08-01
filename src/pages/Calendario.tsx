import { useState } from "react";
import { Plus, Bell, AlertTriangle } from "lucide-react";
import StatCard from "@/components/StatCard";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { DeadlineForm } from "@/components/calendar/DeadlineForm";
import { DeadlineList } from "@/components/calendar/DeadlineList";
import { useDeadlines } from "@/hooks/useDeadlines";
import { useAuthStore } from "@/store/authStore";

export default function Calendario() {
  const { householdId } = useAuthStore();
  const { upcoming, overdue, notifyCount, loading, refetch, togglePaid, deleteDeadline } = useDeadlines(householdId);
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Calendario</h1>
          <p className="text-sm text-muted-foreground">Mutuo, bollette, assicurazioni, PAC, abbonamenti</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Plus size={16} /> Nuova scadenza
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Notifiche Attive" value={String(notifyCount)} icon={Bell} accent={notifyCount > 0 ? "danger" : "default"} />
        <StatCard label="Scadute" value={String(overdue.length)} icon={AlertTriangle} accent={overdue.length > 0 ? "danger" : "default"} />
      </div>

      {!loading && overdue.length > 0 && (
        <div className="rounded-xl border border-danger/30 bg-danger/5 p-4">
          <h2 className="text-sm font-medium mb-3 text-danger">Scadute</h2>
          <DeadlineList deadlines={overdue} onTogglePaid={togglePaid} onDelete={deleteDeadline} />
        </div>
      )}

      <div className="rounded-xl border border-border bg-card p-4">
        <h2 className="text-sm font-medium mb-3">Prossime scadenze</h2>
        <DeadlineList deadlines={upcoming} onTogglePaid={togglePaid} onDelete={deleteDeadline} />
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nuova scadenza">
        {householdId && (
          <DeadlineForm householdId={householdId} onSuccess={() => { setModalOpen(false); refetch(); }} />
        )}
      </Modal>
    </div>
  );
}
