import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useRef, useEffect } from "react";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  CheckCircle2,
  XCircle,
  CalendarCheck,
  CalendarX,
  CalendarClock,
  Trash2,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { addDays, format, startOfDay } from "date-fns";
import { es } from "date-fns/locale";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { AppointmentDialog } from "@/components/appointment-dialog";
import { RescheduleDialog } from "@/components/reschedule-dialog";
import { toast } from "sonner";
import type { Appointment, AppointmentStatus, Patient } from "@/lib/mock-data";

export const Route = createFileRoute("/app/agenda")({
  component: AgendaPage,
});

// ── Grid constants ────────────────────────────────────────────────────────────
const GRID_START = 9 * 60;   // 09:00 in minutes
const GRID_END   = 18 * 60;  // 18:00 in minutes
const SLOT_H     = 64;       // px per 30-min slot
const TIME_W     = 56;       // px for the time-label column

const TIME_SLOTS: string[] = [];
for (let m = GRID_START; m <= GRID_END; m += 30) {
  const h = Math.floor(m / 60);
  const min = m % 60;
  TIME_SLOTS.push(`${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`);
}
// TIME_SLOTS: ["09:00", "09:30", ..., "18:00"]  → 19 lines, 18 slots

const TOTAL_H = (TIME_SLOTS.length - 1) * SLOT_H; // 18 × 64 = 1152px

// ── Status styles ─────────────────────────────────────────────────────────────
const statusStyles: Record<
  AppointmentStatus,
  { label: string; block: string; badge: string }
> = {
  pendiente: {
    label: "Pendiente",
    block: "bg-warning border-warning/80 text-white",
    badge: "bg-white/20 text-white border-white/30",
  },
  confirmada: {
    label: "Confirmada",
    block: "bg-success border-success/80 text-white",
    badge: "bg-white/20 text-white border-white/30",
  },
  anulada: {
    label: "Anulada",
    block: "bg-destructive/70 border-destructive/50 text-white opacity-70",
    badge: "bg-white/20 text-white border-white/30",
  },
  atendida: {
    label: "Atendida",
    block: "bg-primary border-primary/80 text-white",
    badge: "bg-white/20 text-white border-white/30",
  },
};

// ── Route component ───────────────────────────────────────────────────────────
function AgendaPage() {
  const { session, activeDoctor, activeLocation } = useStore();
  const [day, setDay]     = useState(() => startOfDay(new Date()));
  const [search, setSearch] = useState("");
  const [open, setOpen]   = useState(false);

  if (!session || !activeDoctor || !activeLocation) return null;

  return (
    <AgendaInner
      doctorId={activeDoctor.id}
      locationId={activeLocation.id}
      locationName={activeLocation.name}
      locationAddress={activeLocation.address}
      day={day}
      setDay={setDay}
      search={search}
      setSearch={setSearch}
      open={open}
      setOpen={setOpen}
    />
  );
}

// ── Inner component ───────────────────────────────────────────────────────────
function AgendaInner({
  doctorId,
  locationId,
  locationName,
  locationAddress,
  day,
  setDay,
  search,
  setSearch,
  open,
  setOpen,
}: {
  doctorId: string;
  locationId: string;
  locationName: string;
  locationAddress: string;
  day: Date;
  setDay: (d: Date) => void;
  search: string;
  setSearch: (s: string) => void;
  open: boolean;
  setOpen: (v: boolean) => void;
}) {
  const { doctorAppointments, patients, setAppointmentStatus, removeAppointment } = useStore();
  const [rescheduleAppt, setRescheduleAppt] = useState<Appointment | null>(null);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [deleteApptId, setDeleteApptId] = useState<string | null>(null);
  const dayStr  = format(day, "yyyy-MM-dd");
  const isToday = dayStr === format(new Date(), "yyyy-MM-dd");

  const all = doctorAppointments(doctorId, locationId);

  const dayAppts = useMemo(() => {
    return all
      .filter((a) => a.date === dayStr)
      .filter((a) => {
        if (!search) return true;
        const p = patients.find((pp) => pp.id === a.patientId);
        return (
          p?.fullName.toLowerCase().includes(search.toLowerCase()) ||
          a.reason.toLowerCase().includes(search.toLowerCase())
        );
      })
      .sort((a, b) => a.time.localeCompare(b.time));
  }, [all, dayStr, search, patients]);

  const counts = useMemo(() => {
    const c = { pendiente: 0, confirmada: 0, anulada: 0, atendida: 0 };
    all.filter((a) => a.date === dayStr).forEach((a) => c[a.status]++);
    return c;
  }, [all, dayStr]);

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Agenda</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {locationName} · {locationAddress}
          </p>
        </div>
        <Button onClick={() => setOpen(true)} size="lg">
          <Plus className="h-4 w-4 mr-2" /> Nueva cita
        </Button>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard label="Pendientes"  value={counts.pendiente}  tone="warning"     icon={Clock}         />
        <KpiCard label="Confirmadas" value={counts.confirmada} tone="success"     icon={CheckCircle2}  />
        <KpiCard label="Atendidas"   value={counts.atendida}   tone="primary"     icon={CalendarCheck} />
        <KpiCard label="Anuladas"    value={counts.anulada}    tone="destructive" icon={CalendarX}     />
      </div>

      {/* Day view card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4 flex-wrap pb-3">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => setDay(addDays(day, -1))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <CardTitle className="text-base capitalize">
              {format(day, "EEEE d 'de' MMMM, yyyy", { locale: es })}
              {isToday && (
                <Badge variant="secondary" className="ml-2 font-normal">Hoy</Badge>
              )}
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={() => setDay(addDays(day, 1))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            {!isToday && (
              <Button variant="ghost" size="sm" onClick={() => setDay(startOfDay(new Date()))}>
                Hoy
              </Button>
            )}
          </div>
          <Input
            placeholder="Buscar paciente o motivo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs"
          />
        </CardHeader>

        <CardContent className="p-0 pb-0">
          <DayGrid
            dayAppts={dayAppts}
            patients={patients}
            isToday={isToday}
            setAppointmentStatus={setAppointmentStatus}
            onNew={() => setOpen(true)}
            onReschedule={(a) => { setRescheduleAppt(a); setRescheduleOpen(true); }}
            onDelete={(id) => setDeleteApptId(id)}
          />
        </CardContent>
      </Card>

      <AppointmentDialog open={open} onOpenChange={setOpen} defaultDate={dayStr} />

      {rescheduleAppt && (
        <RescheduleDialog
          appointment={rescheduleAppt}
          open={rescheduleOpen}
          onOpenChange={(v) => { setRescheduleOpen(v); if (!v) setRescheduleAppt(null); }}
        />
      )}

      <AlertDialog
        open={!!deleteApptId}
        onOpenChange={(v) => { if (!v) setDeleteApptId(null); }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar esta cita?</AlertDialogTitle>
            <AlertDialogDescription>
              La cita será eliminada permanentemente. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteApptId) {
                  removeAppointment(deleteApptId);
                  toast.success("Cita eliminada");
                  setDeleteApptId(null);
                }
              }}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ── Day grid ──────────────────────────────────────────────────────────────────
function DayGrid({
  dayAppts,
  patients,
  isToday,
  setAppointmentStatus,
  onNew,
  onReschedule,
  onDelete,
}: {
  dayAppts: Appointment[];
  patients: Patient[];
  isToday: boolean;
  setAppointmentStatus: (id: string, s: AppointmentStatus) => void;
  onNew: () => void;
  onReschedule: (a: Appointment) => void;
  onDelete: (id: string) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Scroll to current time (or 09:00) on mount
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const now = new Date();
    const nowMin = now.getHours() * 60 + now.getMinutes();
    const clampedMin = Math.min(Math.max(nowMin, GRID_START), GRID_END);
    const targetTop = ((clampedMin - GRID_START) / 30) * SLOT_H - 80;
    el.scrollTop = Math.max(0, targetTop);
  }, [isToday]);

  // Current time indicator offset
  const nowOffset = useMemo(() => {
    if (!isToday) return null;
    const now = new Date();
    const nowMin = now.getHours() * 60 + now.getMinutes();
    if (nowMin < GRID_START || nowMin > GRID_END) return null;
    return ((nowMin - GRID_START) / 30) * SLOT_H;
  }, [isToday]);

  function apptTop(time: string) {
    const [h, m] = time.split(":").map(Number);
    return ((h * 60 + m - GRID_START) / 30) * SLOT_H;
  }

  function apptHeight(durationMin: number) {
    return Math.max((durationMin / 30) * SLOT_H, 28);
  }

  return (
    <div ref={scrollRef} className="overflow-y-auto max-h-[620px] rounded-b-xl [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-400/60 hover:[&::-webkit-scrollbar-thumb]:bg-slate-400">
      <div className="relative select-none" style={{ height: TOTAL_H }}>

        {/* Hour lines + labels */}
        {TIME_SLOTS.map((slot, i) => (
          <div
            key={slot}
            className="absolute left-0 right-0 flex items-start pointer-events-none"
            style={{ top: i * SLOT_H }}
          >
            <div
              className="shrink-0 text-right pr-3 -translate-y-2.5"
              style={{ width: TIME_W }}
            >
              <span className="text-[11px] text-muted-foreground tabular-nums leading-none">
                {slot}
              </span>
            </div>
            <div className="flex-1 border-t border-border/40" />
          </div>
        ))}

        {/* Current-time indicator */}
        {nowOffset !== null && (
          <div
            className="absolute pointer-events-none z-20 flex items-center"
            style={{ top: nowOffset, left: TIME_W, right: 0 }}
          >
            <div className="h-2 w-2 rounded-full bg-black dark:bg-white -ml-1 shrink-0" />
            <div className="flex-1 border-t-2 border-black dark:border-white" />
          </div>
        )}

        {/* Appointments */}
        <TooltipProvider delayDuration={150}>
          {dayAppts.map((a) => {
            const p   = patients.find((pp) => pp.id === a.patientId);
            const s   = statusStyles[a.status];
            const top = apptTop(a.time);
            const h   = apptHeight(a.durationMin);
            if (top < 0 || top >= TOTAL_H) return null;

            return (
              <div
                key={a.id}
                className={`absolute rounded-lg border px-2 py-1 overflow-hidden group transition-shadow hover:shadow-md ${s.block}`}
                style={{
                  top,
                  height: h,
                  left: TIME_W + 8,
                  right: 8,
                }}
              >
                <div className="flex items-start justify-between gap-1 h-full">
                  {/* Content */}
                  <div className="min-w-0 flex-1 overflow-hidden">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[11px] font-semibold tabular-nums opacity-75">
                        {a.time}
                        {h >= 56 && (
                          <span className="font-normal"> · {a.durationMin} min</span>
                        )}
                      </span>
                      <Badge
                        variant="outline"
                        className={`text-[10px] px-1 py-0 h-4 font-normal ${s.badge}`}
                      >
                        {s.label}
                      </Badge>
                    </div>
                    <div className="font-semibold text-sm leading-tight truncate mt-0.5">
                      {p?.fullName ?? "Paciente"}
                    </div>
                    {h >= 60 && (
                      <div className="text-xs truncate opacity-75 leading-tight">
                        {a.reason}
                      </div>
                    )}
                    {h >= 88 && p && (
                      <div className="text-[11px] opacity-60 leading-tight mt-0.5">
                        {p.insurance}
                      </div>
                    )}
                  </div>

                  {/* Action buttons — visible on hover */}
                  <div className="flex flex-row gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    {a.status !== "anulada" && a.status !== "atendida" && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6"
                            onClick={() => onReschedule(a)}
                          >
                            <CalendarClock className="h-3.5 w-3.5 text-white" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Reagendar</TooltipContent>
                      </Tooltip>
                    )}
                    {a.status !== "confirmada" && a.status !== "anulada" && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6"
                            onClick={() => {
                              setAppointmentStatus(a.id, "confirmada");
                              toast.success("Cita confirmada");
                            }}
                          >
                            <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Confirmar</TooltipContent>
                      </Tooltip>
                    )}
                    {a.status !== "atendida" && a.status !== "anulada" && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6"
                            onClick={() => {
                              setAppointmentStatus(a.id, "atendida");
                              toast.success("Marcada como atendida");
                            }}
                          >
                            <CalendarCheck className="h-3.5 w-3.5 text-white" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Marcar atendida</TooltipContent>
                      </Tooltip>
                    )}
                    {a.status !== "anulada" && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6"
                            onClick={() => {
                              setAppointmentStatus(a.id, "anulada");
                              toast("Cita anulada");
                            }}
                          >
                            <XCircle className="h-3.5 w-3.5 text-white" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Anular</TooltipContent>
                      </Tooltip>
                    )}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6"
                          onClick={() => onDelete(a.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5 text-white" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Eliminar cita</TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              </div>
            );
          })}
        </TooltipProvider>

        {/* Empty state overlay */}
        {dayAppts.length === 0 && (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
            style={{ left: TIME_W }}
          >
            <CalendarCheck className="h-9 w-9 opacity-20 mb-2" />
            <p className="text-sm text-muted-foreground opacity-60">Sin citas para este día</p>
            <Button
              variant="link"
              size="sm"
              className="mt-1 pointer-events-auto"
              onClick={onNew}
            >
              Crear una cita
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── KPI card ──────────────────────────────────────────────────────────────────
function KpiCard({
  label,
  value,
  tone,
  icon: Icon,
}: {
  label: string;
  value: number;
  tone: "primary" | "success" | "warning" | "destructive";
  icon: React.ComponentType<{ className?: string }>;
}) {
  const toneMap = {
    primary:     "text-primary bg-primary/10",
    success:     "text-success bg-success/10",
    warning:     "text-warning bg-warning/10",
    destructive: "text-destructive bg-destructive/10",
  };
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${toneMap[tone]}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <div className="text-xs text-muted-foreground">{label}</div>
          <div className="text-xl font-semibold tabular-nums">{value}</div>
        </div>
      </CardContent>
    </Card>
  );
}
