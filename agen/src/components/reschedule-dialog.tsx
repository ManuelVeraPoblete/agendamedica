import { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertTriangle, User } from "lucide-react";
import { useStore } from "@/lib/store";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { Appointment } from "@/lib/mock-data";

interface Props {
  appointment: Appointment;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

const STATUS_COLOR: Record<string, string> = {
  pendiente:  "bg-amber-500/10 text-amber-700 border-amber-200",
  confirmada: "bg-blue-500/10 text-blue-600 border-blue-200",
  atendida:   "bg-emerald-500/10 text-emerald-700 border-emerald-200",
  anulada:    "bg-muted text-muted-foreground border-border",
};

function timeToMin(t: string) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

export function RescheduleDialog({ appointment, open, onOpenChange }: Props) {
  const { patients, doctorAppointments, rescheduleAppointment } = useStore();

  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(appointment.date);
  const [time, setTime] = useState(appointment.time);
  const [duration, setDuration] = useState(String(appointment.durationMin));

  const patient = patients.find((p) => p.id === appointment.patientId);

  const conflict = useMemo(() => {
    if (!date || !time) return false;
    const selStart = timeToMin(time);
    const selEnd = selStart + parseInt(duration, 10);
    return doctorAppointments(appointment.doctorId).some((a) => {
      if (a.id === appointment.id) return false;
      if (a.date !== date || a.locationId !== appointment.locationId) return false;
      if (a.status === "anulada") return false;
      const aStart = timeToMin(a.time);
      const aEnd = aStart + a.durationMin;
      return selStart < aEnd && selEnd > aStart;
    });
  }, [date, time, duration, appointment, doctorAppointments]);

  const reset = () => {
    setDate(appointment.date);
    setTime(appointment.time);
    setDuration(String(appointment.durationMin));
  };

  const handleConfirm = () => {
    if (!date || !time) {
      toast.error("Completa fecha y hora");
      return;
    }
    if (conflict) {
      toast.error("Ese horario ya está ocupado, elige otro");
      return;
    }
    rescheduleAppointment(appointment.id, date, time, parseInt(duration, 10));
    toast.success(`Cita reagendada para el ${format(new Date(date + "T12:00:00"), "d 'de' MMMM", { locale: es })} a las ${time}`);
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
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Reagendar cita</DialogTitle>
          <DialogDescription>
            Cambia la fecha u hora de la cita. El estado pasará a confirmada.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1">
          {/* Patient info */}
          <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-1">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="font-medium text-sm">{patient?.fullName ?? "—"}</span>
              </div>
              <Badge variant="outline" className={`text-xs ${STATUS_COLOR[appointment.status]}`}>
                {appointment.status}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground pl-6">{appointment.reason}</p>
            <p className="text-xs text-muted-foreground pl-6">
              Actualmente: {format(new Date(appointment.date + "T12:00:00"), "d 'de' MMMM yyyy", { locale: es })} · {appointment.time}
            </p>
          </div>

          {/* New date / time / duration */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2 col-span-1">
              <Label>Fecha *</Label>
              <Input
                type="date"
                value={date}
                min={today}
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

          {conflict && (
            <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>Ese horario ya está ocupado. Elige otra hora o fecha.</span>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={conflict}>
            Reagendar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
