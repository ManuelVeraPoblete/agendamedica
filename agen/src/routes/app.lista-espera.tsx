import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
import {
  Clock,
  Plus,
  CalendarPlus,
  Trash2,
  User,
  MapPin,
  FileText,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { WaitingListDialog } from "@/components/waiting-list-dialog";
import { AssignSlotDialog } from "@/components/assign-slot-dialog";
import { toast } from "sonner";
import type { WaitingListEntry, WaitingListPriority } from "@/lib/mock-data";

export const Route = createFileRoute("/app/lista-espera")({
  beforeLoad: () => {
    if (typeof window !== "undefined") {
      const raw = window.localStorage.getItem("medicapp:session");
      if (!raw) throw redirect({ to: "/" });
    }
  },
  component: WaitingListPage,
});

const PRIORITY_COLOR: Record<WaitingListPriority, string> = {
  urgente: "bg-destructive/10 text-destructive border-destructive/30",
  normal: "bg-blue-500/10 text-blue-600 border-blue-200",
  flexible: "bg-muted text-muted-foreground border-border",
};

const PRIORITY_LABEL: Record<WaitingListPriority, string> = {
  urgente: "Urgente",
  normal: "Normal",
  flexible: "Flexible",
};

function WaitingListPage() {
  const { session, patients, doctorWaitingList, removeFromWaitingList, locations } =
    useStore();

  const [addOpen, setAddOpen] = useState(false);
  const [assignEntry, setAssignEntry] = useState<WaitingListEntry | null>(null);
  const [assignOpen, setAssignOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const entries = session ? doctorWaitingList(session.doctorId) : [];

  const getPatient = (patientId: string) =>
    patients.find((p) => p.id === patientId);

  const getLocation = (locationId?: string) =>
    locationId ? locations.find((l) => l.id === locationId) : null;

  const handleDelete = () => {
    if (!deleteId) return;
    removeFromWaitingList(deleteId);
    toast.success("Eliminado de lista de espera");
    setDeleteId(null);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Lista de Espera</h1>
          <p className="text-sm text-muted-foreground">
            {entries.length === 0
              ? "Sin pacientes en espera"
              : `${entries.length} ${entries.length === 1 ? "paciente" : "pacientes"} en espera`}
          </p>
        </div>
        <Button onClick={() => setAddOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Agregar paciente
        </Button>
      </div>

      {/* Empty state */}
      {entries.length === 0 && (
        <Card>
          <CardContent className="py-16 flex flex-col items-center gap-3 text-center">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
              <Clock className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium">Lista vacía</p>
              <p className="text-sm text-muted-foreground mt-1">
                Cuando la agenda esté llena, agrega pacientes aquí para
                asignarles hora cuando haya disponibilidad.
              </p>
            </div>
            <Button
              variant="outline"
              className="mt-2 gap-2"
              onClick={() => setAddOpen(true)}
            >
              <Plus className="h-4 w-4" />
              Agregar primer paciente
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Entries */}
      <div className="space-y-3">
        {entries.map((entry, index) => {
          const patient = getPatient(entry.patientId);
          const preferredLoc = getLocation(entry.locationId);

          return (
            <Card
              key={entry.id}
              className="transition-colors hover:border-border/80"
            >
              <CardContent className="py-4 px-5">
                <div className="flex items-start gap-4">
                  {/* Position number */}
                  <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center text-xs font-semibold text-muted-foreground shrink-0 mt-0.5">
                    {index + 1}
                  </div>

                  {/* Main info */}
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium">
                        {patient?.fullName ?? "Paciente desconocido"}
                      </span>
                      {patient && (
                        <span className="text-xs text-muted-foreground">
                          {patient.insurance}
                        </span>
                      )}
                      <Badge
                        variant="outline"
                        className={`text-xs ${PRIORITY_COLOR[entry.priority]}`}
                      >
                        {PRIORITY_LABEL[entry.priority]}
                      </Badge>
                    </div>

                    <div className="flex items-start gap-1.5 text-sm text-muted-foreground">
                      <FileText className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                      <span>{entry.reason}</span>
                    </div>

                    {entry.notes && (
                      <p className="text-xs text-muted-foreground/70 italic pl-5">
                        {entry.notes}
                      </p>
                    )}

                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        En espera{" "}
                        {formatDistanceToNow(new Date(entry.createdAt), {
                          addSuffix: true,
                          locale: es,
                        })}
                      </span>
                      {preferredLoc && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {preferredLoc.name}
                        </span>
                      )}
                      {!preferredLoc && entry.locationId === undefined && (
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          Sin consulta preferida
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      size="sm"
                      className="gap-1.5"
                      onClick={() => { setAssignEntry(entry); setAssignOpen(true); }}
                    >
                      <CalendarPlus className="h-3.5 w-3.5" />
                      Asignar hora
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => setDeleteId(entry.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Dialogs */}
      <WaitingListDialog open={addOpen} onOpenChange={setAddOpen} />

      {assignEntry && (
        <AssignSlotDialog
          entry={assignEntry}
          open={assignOpen}
          onOpenChange={(v) => {
            setAssignOpen(v);
            if (!v) setAssignEntry(null);
          }}
        />
      )}

      <AlertDialog
        open={!!deleteId}
        onOpenChange={(v) => {
          if (!v) setDeleteId(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar de lista de espera?</AlertDialogTitle>
            <AlertDialogDescription>
              El paciente será removido de la lista. Esta acción no se puede
              deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
