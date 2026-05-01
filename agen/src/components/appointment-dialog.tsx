import { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  defaultDate?: string;
}

export function AppointmentDialog({ open, onOpenChange, defaultDate }: Props) {
  const {
    activeDoctor,
    activeLocation,
    doctorPatients,
    addAppointment,
  } = useStore();

  const [patientId, setPatientId] = useState("");
  const [date, setDate] = useState(defaultDate ?? "");
  const [time, setTime] = useState("09:00");
  const [duration, setDuration] = useState("30");
  const [reason, setReason] = useState("");
  const [monto, setMonto] = useState("");

  const patients = useMemo(
    () => (activeDoctor ? doctorPatients(activeDoctor.id) : []),
    [activeDoctor, doctorPatients],
  );

  const reset = () => {
    setPatientId("");
    setTime("09:00");
    setDuration("30");
    setReason("");
    setMonto("");
  };

  const handleSave = () => {
    if (!patientId || !date || !time || !reason.trim()) {
      toast.error("Completa paciente, fecha, hora y motivo");
      return;
    }
    if (!activeLocation) return;
    addAppointment({
      patientId,
      locationId: activeLocation.id,
      date,
      time,
      durationMin: parseInt(duration, 10),
      reason: reason.trim(),
      status: "pendiente",
      monto: monto ? parseInt(monto, 10) : undefined,
    });
    toast.success("Cita creada");
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) reset();
        if (v && defaultDate) setDate(defaultDate);
        onOpenChange(v);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nueva cita</DialogTitle>
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
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2 col-span-1">
              <Label>Fecha *</Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="space-y-2 col-span-1">
              <Label>Hora *</Label>
              <Input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            </div>
            <div className="space-y-2 col-span-1">
              <Label>Duración</Label>
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 min</SelectItem>
                  <SelectItem value="30">30 min</SelectItem>
                  <SelectItem value="45">45 min</SelectItem>
                  <SelectItem value="60">60 min</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Motivo de consulta *</Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ej: Control de presión arterial, dolor abdominal, etc."
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label>Copago / Monto (CLP)</Label>
            <Input
              type="number"
              min="0"
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              placeholder="Ej: 35000"
            />
          </div>
          {activeLocation && (
            <p className="text-xs text-muted-foreground">
              La cita se agendará en <strong>{activeLocation.name}</strong>.
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>Crear cita</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
