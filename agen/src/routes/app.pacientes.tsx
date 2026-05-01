import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Phone, Mail, IdCard, AlertCircle, Activity, Pill } from "lucide-react";
import { PatientDialog } from "@/components/patient-dialog";
import { format, parseISO, differenceInYears } from "date-fns";

export const Route = createFileRoute("/app/pacientes")({
  component: PatientsPage,
});

function PatientsPage() {
  const { activeDoctor, doctorPatients } = useStore();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const all = activeDoctor ? doctorPatients(activeDoctor.id) : [];
  const filtered = useMemo(() => {
    if (!query) return all;
    const q = query.toLowerCase();
    return all.filter(
      (p) =>
        p.fullName.toLowerCase().includes(q) ||
        p.documentId.toLowerCase().includes(q) ||
        p.email.toLowerCase().includes(q) ||
        p.phone.toLowerCase().includes(q),
    );
  }, [all, query]);

  if (!activeDoctor) return null;

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Pacientes</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {all.length} paciente{all.length !== 1 ? "s" : ""} registrado
            {all.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button size="lg" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> Nuevo paciente
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por nombre, documento, teléfono..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            <p className="text-sm">No se encontraron pacientes.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filtered.map((p) => {
            const age = differenceInYears(new Date(), parseISO(p.birthDate));
            const initials = p.fullName
              .split(" ")
              .map((n) => n[0])
              .slice(0, 2)
              .join("");
            return (
              <Card key={p.id} className="hover:border-primary/40 transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-3">
                    <div className="h-11 w-11 rounded-full bg-primary/15 text-primary flex items-center justify-center font-semibold shrink-0">
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base truncate">
                        {p.fullName}
                      </CardTitle>
                      <div className="text-xs text-muted-foreground mt-0.5 capitalize">
                        {p.gender} · {age} años · {format(parseISO(p.birthDate), "dd-MM-yyyy")}
                      </div>
                    </div>
                    <Badge variant="outline" className="font-normal">
                      {p.insurance}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 space-y-1.5 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <IdCard className="h-3.5 w-3.5" />
                    <span>{p.documentId}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-3.5 w-3.5" />
                    <span>{p.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground truncate">
                    <Mail className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{p.email}</span>
                  </div>
                  {(p.allergies || p.conditions || p.medications || p.notes) && (
                    <div className="pt-2 border-t border-border mt-2 space-y-1">
                      {p.allergies && (
                        <div className="flex items-start gap-1.5 text-xs text-destructive/80">
                          <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-px" />
                          <span><span className="font-medium">Alergias:</span> {p.allergies}</span>
                        </div>
                      )}
                      {p.conditions && (
                        <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
                          <Activity className="h-3.5 w-3.5 shrink-0 mt-px" />
                          <span><span className="font-medium">Enfermedades:</span> {p.conditions}</span>
                        </div>
                      )}
                      {p.medications && (
                        <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
                          <Pill className="h-3.5 w-3.5 shrink-0 mt-px" />
                          <span><span className="font-medium">Medicamentos:</span> {p.medications}</span>
                        </div>
                      )}
                      {p.notes && (
                        <p className="text-xs text-muted-foreground italic pl-5">{p.notes}</p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <PatientDialog open={open} onOpenChange={setOpen} />
    </div>
  );
}
