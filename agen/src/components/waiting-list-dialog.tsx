import { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useStore } from "@/lib/store";
import { toast } from "sonner";
import type { WaitingListPriority } from "@/lib/mock-data";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

const PRIORITY_LABELS: Record<WaitingListPriority, string> = {
  urgente: "Urgente — necesita hora pronto",
  normal: "Normal — dentro de los próximos días",
  flexible: "Flexible — cuando haya disponibilidad",
};

export function WaitingListDialog({ open, onOpenChange }: Props) {
  const { activeDoctor, doctorPatients, doctorLocations, addToWaitingList } =
    useStore();

  const [patientId, setPatientId] = useState("");
  const [locationId, setLocationId] = useState<string | undefined>(undefined);
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [priority, setPriority] = useState<WaitingListPriority>("normal");

  const patients = useMemo(
    () => (activeDoctor ? doctorPatients(activeDoctor.id) : []),
    [activeDoctor, doctorPatients],
  );
  const locations = useMemo(
    () => (activeDoctor ? doctorLocations(activeDoctor.id) : []),
    [activeDoctor, doctorLocations],
  );

  const reset = () => {
    setPatientId("");
    setLocationId(undefined);
    setReason("");
    setNotes("");
    setPriority("normal");
  };

  const handleSave = () => {
    if (!patientId || !reason.trim()) {
      toast.error("Selecciona un paciente e ingresa el motivo");
      return;
    }
    addToWaitingList({
      patientId,
      locationId: locationId,
      reason: reason.trim(),
      notes: notes.trim() || undefined,
      priority,
    });
    toast.success("Paciente agregado a lista de espera");
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) reset();
        onOpenChange(v);
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Agregar a lista de espera</DialogTitle>
          <DialogDescription>
            El paciente quedará en cola hasta que se le asigne un horario
            disponible.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Paciente *</Label>
            <Select value={patientId} onValueChange={setPatientId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un paciente" />
              </SelectTrigger>
              <SelectContent>
                {patients.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.fullName} · {p.insurance}
                  </SelectItem>
                ))}
                {patients.length === 0 && (
                  <div className="px-3 py-2 text-xs text-muted-foreground">
                    Primero registra un paciente
                  </div>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Prioridad *</Label>
            <Select
              value={priority}
              onValueChange={(v) => setPriority(v as WaitingListPriority)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(
                  Object.entries(PRIORITY_LABELS) as [
                    WaitingListPriority,
                    string,
                  ][]
                ).map(([val, label]) => (
                  <SelectItem key={val} value={val}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Motivo de consulta *</Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ej: Control de presión, dolor torácico, etc."
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label>Consulta preferida</Label>
            <Select
              value={locationId ?? "__none__"}
              onValueChange={(v) =>
                setLocationId(v === "__none__" ? undefined : v)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Sin preferencia" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Sin preferencia</SelectItem>
                {locations.map((l) => (
                  <SelectItem key={l.id} value={l.id}>
                    {l.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Notas adicionales</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Horario preferido, restricciones, etc."
              rows={2}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>Agregar a lista</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
