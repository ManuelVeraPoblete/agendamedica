import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DollarSign, Printer, Stethoscope } from "lucide-react";
import type { Insurance } from "@/lib/mock-data";

export const Route = createFileRoute("/app/informes/por-prevision")({
  component: PorPrevisionPage,
});

type GroupKey = "Fonasa" | "Isapre Banmédica" | "Otras Isapres" | "Particular";

const GROUP_ORDER: GroupKey[] = [
  "Fonasa",
  "Isapre Banmédica",
  "Otras Isapres",
  "Particular",
];

const GROUP_COLOR: Record<GroupKey, string> = {
  "Fonasa":           "bg-emerald-500/10 text-emerald-700 border-emerald-200",
  "Isapre Banmédica": "bg-blue-500/10 text-blue-700 border-blue-200",
  "Otras Isapres":    "bg-violet-500/10 text-violet-700 border-violet-200",
  "Particular":       "bg-amber-500/10 text-amber-700 border-amber-200",
};

function getGroup(insurance: Insurance): GroupKey {
  if (insurance === "Fonasa") return "Fonasa";
  if (insurance === "Isapre Banmédica") return "Isapre Banmédica";
  if (insurance.startsWith("Isapre")) return "Otras Isapres";
  return "Particular";
}

function formatCLP(n: number) {
  return n.toLocaleString("es-CL", {
    style: "currency",
    currency: "CLP",
    minimumFractionDigits: 0,
  });
}

function PorPrevisionPage() {
  const { session, activeDoctor, activeLocation, doctorAppointments, patients } =
    useStore();
  const today = new Date().toISOString().slice(0, 10);
  const [selectedDate, setSelectedDate] = useState(today);

  const allAppointments = useMemo(
    () => (session ? doctorAppointments(session.doctorId) : []),
    [session, doctorAppointments],
  );

  const atendidas = useMemo(
    () =>
      allAppointments.filter(
        (a) => a.date === selectedDate && a.status === "atendida",
      ),
    [allAppointments, selectedDate],
  );

  type Entry = {
    count: number;
    total: number;
    items: Array<{
      time: string;
      patientName: string;
      insurance: Insurance;
      reason: string;
      monto: number;
    }>;
  };

  const byGroup = useMemo(() => {
    const map = new Map<GroupKey, Entry>(
      GROUP_ORDER.map((g) => [g, { count: 0, total: 0, items: [] }]),
    );
    for (const apt of atendidas) {
      const patient = patients.find((p) => p.id === apt.patientId);
      if (!patient) continue;
      const g = getGroup(patient.insurance);
      const entry = map.get(g)!;
      entry.count++;
      entry.total += apt.monto ?? 0;
      entry.items.push({
        time: apt.time,
        patientName: patient.fullName,
        insurance: patient.insurance,
        reason: apt.reason,
        monto: apt.monto ?? 0,
      });
    }
    return map;
  }, [atendidas, patients]);

  const totalMonto = atendidas.reduce((s, a) => s + (a.monto ?? 0), 0);
  const activeGroups = GROUP_ORDER.filter((g) => (byGroup.get(g)?.count ?? 0) > 0);

  const formattedDate = (() => {
    try {
      return format(parseISO(selectedDate), "EEEE d 'de' MMMM yyyy", { locale: es });
    } catch {
      return selectedDate;
    }
  })();

  return (
    <div className="space-y-6 max-w-5xl">

      {/* Print-only header */}
      <div className="hidden print:block border-b border-border pb-4 mb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl border border-border flex items-center justify-center">
              <Stethoscope className="h-5 w-5" />
            </div>
            <div>
              <div className="font-semibold text-base">MediAgenda</div>
              <div className="text-xs text-muted-foreground">
                {activeDoctor?.name} · {activeDoctor?.specialty}
              </div>
            </div>
          </div>
          <div className="text-right text-sm text-muted-foreground">
            {activeLocation?.name && <div>{activeLocation.name}</div>}
            <div>
              Impreso el{" "}
              {format(new Date(), "d 'de' MMMM yyyy, HH:mm", { locale: es })}
            </div>
          </div>
        </div>
      </div>

      {/* Screen header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 print:hidden">
        <div>
          <h1 className="text-xl font-semibold">Atenciones por Previsión</h1>
          <p className="text-sm text-muted-foreground capitalize">{formattedDate}</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="border border-input rounded-md px-3 py-1.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <Button variant="outline" className="gap-2" onClick={() => window.print()}>
            <Printer className="h-4 w-4" />
            Exportar PDF
          </Button>
        </div>
      </div>

      {/* Print-only title */}
      <div className="hidden print:block">
        <h1 className="text-xl font-bold">Informe de Atenciones por Previsión</h1>
        <p className="text-sm text-muted-foreground capitalize">{formattedDate}</p>
      </div>

      {/* Summary */}
      <Card className="print-card w-fit">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <DollarSign className="h-4 w-4 print:hidden" />
            Total recaudado
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">{formatCLP(totalMonto)}</p>
        </CardContent>
      </Card>

      {/* Breakdown */}
      {atendidas.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground text-sm">
            No hay atenciones registradas para este día.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {activeGroups.map((g) => {
            const entry = byGroup.get(g)!;
            return (
              <Card key={g} className="print-card">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={`${GROUP_COLOR[g]} font-medium`}>
                        {g}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {entry.count} {entry.count === 1 ? "atención" : "atenciones"}
                      </span>
                    </div>
                    <span className="font-semibold text-sm">{formatCLP(entry.total)}</span>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-muted-foreground">
                        <th className="text-left py-1.5 font-medium w-16">Hora</th>
                        <th className="text-left py-1.5 font-medium">Paciente</th>
                        <th className="text-left py-1.5 font-medium">Previsión</th>
                        <th className="text-left py-1.5 font-medium hidden md:table-cell print:table-cell">Motivo</th>
                        <th className="text-right py-1.5 font-medium">Monto</th>
                      </tr>
                    </thead>
                    <tbody>
                      {entry.items
                        .sort((a, b) => a.time.localeCompare(b.time))
                        .map((item, i) => (
                          <tr key={i} className="border-b border-border/50 last:border-0">
                            <td className="py-2 text-muted-foreground tabular-nums">{item.time}</td>
                            <td className="py-2 font-medium">{item.patientName}</td>
                            <td className="py-2 text-muted-foreground">{item.insurance}</td>
                            <td className="py-2 text-muted-foreground hidden md:table-cell print:table-cell truncate max-w-[200px]">
                              {item.reason}
                            </td>
                            <td className="py-2 text-right tabular-nums">
                              {item.monto > 0 ? formatCLP(item.monto) : "—"}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                    <tfoot>
                      <tr className="font-semibold border-t border-border">
                        <td colSpan={4} className="pt-2 text-right text-muted-foreground">
                          Subtotal {g}
                        </td>
                        <td className="pt-2 text-right">{formatCLP(entry.total)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </CardContent>
              </Card>
            );
          })}

          {/* Grand total */}
          <div className="flex justify-end print-card">
            <div className="bg-muted/50 border border-border rounded-lg px-6 py-3 flex items-center gap-8">
              <span className="text-sm text-muted-foreground">
                Total general ({atendidas.length}{" "}
                {atendidas.length === 1 ? "atención" : "atenciones"})
              </span>
              <span className="text-lg font-bold">{formatCLP(totalMonto)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
