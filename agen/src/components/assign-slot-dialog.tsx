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
import { AlertTriangle, User, MapPin } from "lucide-react";
import { useStore } from "@/lib/store";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import type { WaitingListEntry } from "@/lib/mock-data";

interface Props {
  entry: WaitingListEntry;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

const PRIORITY_COLOR: Record<string, string> = {
  urgente: "bg-destructive/10 text-destructive border-destructive/30",
  normal: "bg-blue-500/10 text-blue-600 border-blue-200",
  flexible: "bg-muted text-muted-foreground border-border",
};

function timeToMin(t: string) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

export function AssignSlotDialog({ entry, open, onOpenChange }: Props) {
  const {
    patients,
    doctorLocations,
    doctorAppointments,
    activateFromWaitingList,
  } = useStore();

  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [time, setTime] = useState("09:00");
  const [duration, setDuration] = useState("30");
  const [locationId, setLocationId] = useState(entry.locationId ?? "");

  const patient = patients.find((p) => p.id === entry.patientId);
  const locations = useMemo(
    () => doctorLocations(entry.doctorId),
    [doctorLocations, entry.doctorId],
  );

  const conflict = useMemo(() => {
    if (!date || !time || !locationId) return false;
    const selStart = timeToMin(time);
    const selEnd = selStart + parseInt(duration, 10);
    return doctorAppointments(entry.doctorId).some((a) => {
      if (a.date !== date || a.locationId !== locationId) return false;
      if (a.status === "anulada") return false;
      const aStart = timeToMin(a.time);
      const aEnd = aStart + a.durationMin;
      return selStart < aEnd && selEnd > aStart;
    });
  }, [date, time, duration, locationId, entry.doctorId, doctorAppointments]);

  const reset = () => {
    setDate(today);
    setTime("09:00");
    setDuration("30");
    setLocationId(entry.locationId ?? "");
  };

  const handleConfirm = () => {
    if (!date || !time || !locationId) {
      toast.error("Completa fecha, hora y consulta");
      return;
    }
    if (conflict) {
      toast.error("Ese horario ya está ocupado, elige otro");
      return;
    }
    activateFromWaitingList(entry.id, date, time, locationId, parseInt(duration, 10));
    toast.success(`Cita confirmada para ${patient?.fullName ?? "paciente"}`);
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
          <DialogTitle>Asignar horario</DialogTitle>
          <DialogDescription>
            Elige fecha, hora y consulta para confirmar la cita del paciente en
            espera.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1">
          {/* Patient info card */}
          <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="font-medium text-sm">
                  {patient?.fullName ?? "—"}
                </span>
              </div>
              <Badge
                variant="outline"
                className={`text-xs ${PRIORITY_COLOR[entry.priority]}`}
              >
                {entry.priority}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground pl-6">{entry.reason}</p>
            {entry.notes && (
              <p className="text-xs text-muted-foreground/70 pl-6 italic">
                {entry.notes}
              </p>
            )}
            <p className="text-xs text-muted-foreground pl-6">
              En espera{" "}
              {formatDistanceToNow(new Date(entry.createdAt), {
                addSuffix: true,
                locale: es,
              })}
            </p>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" /> Consulta *
            </Label>
            <Select value={locationId} onValueChange={setLocationId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona consulta" />
              </SelectTrigger>
              <SelectContent>
                {locations.map((l) => (
                  <SelectItem key={l.id} value={l.id}>
                    {l.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date + Time + Duration */}
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

          {/* Conflict warning */}
          {conflict && (
            <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>
                Ese horario ya está ocupado en esta consulta. Elige otra hora o
                fecha.
              </span>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={conflict}>
            Confirmar cita
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
