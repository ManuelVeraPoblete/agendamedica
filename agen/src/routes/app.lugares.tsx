import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MapPin, Plus, Trash2, Building2, Hospital, Home } from "lucide-react";
import { toast } from "sonner";
import type { Location } from "@/lib/mock-data";

export const Route = createFileRoute("/app/lugares")({
  beforeLoad: () => {
    if (typeof window !== "undefined") {
      const raw = window.localStorage.getItem("medicapp:session");
      if (raw) {
        const s = JSON.parse(raw);
        if (s.role !== "doctor") throw redirect({ to: "/app/agenda" });
      }
    }
  },
  component: LocationsPage,
});

const typeMeta: Record<
  Location["type"],
  { label: string; icon: React.ComponentType<{ className?: string }> }
> = {
  clinica: { label: "Clínica", icon: Hospital },
  centro: { label: "Centro médico", icon: Building2 },
  particular: { label: "Consulta particular", icon: Home },
};

function LocationsPage() {
  const { activeDoctor, doctorLocations, addLocation, removeLocation } =
    useStore();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [type, setType] = useState<Location["type"]>("clinica");

  if (!activeDoctor) return null;

  const locs = doctorLocations(activeDoctor.id);

  const handleSave = () => {
    if (!name.trim() || !address.trim()) {
      toast.error("Completa nombre y dirección");
      return;
    }
    addLocation({ name: name.trim(), address: address.trim(), type, color: "" });
    toast.success("Lugar agregado");
    setName("");
    setAddress("");
    setType("clinica");
    setOpen(false);
  };

  const handleRemove = (id: string) => {
    if (locs.length === 1) {
      toast.error("Debes mantener al menos un lugar");
      return;
    }
    removeLocation(id);
    toast("Lugar eliminado");
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Lugares de atención
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Centros, clínicas o consultas particulares donde atiendes
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="lg">
              <Plus className="h-4 w-4 mr-2" /> Agregar lugar
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nuevo lugar de atención</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Nombre</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: Clínica Las Condes"
                />
              </div>
              <div className="space-y-2">
                <Label>Dirección</Label>
                <Input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Av. Las Condes 12345, Santiago"
                />
              </div>
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={type} onValueChange={(v) => setType(v as Location["type"])}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="clinica">Clínica</SelectItem>
                    <SelectItem value="centro">Centro médico</SelectItem>
                    <SelectItem value="particular">Consulta particular</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave}>Guardar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {locs.map((l) => {
          const meta = typeMeta[l.type];
          const Icon = meta.icon;
          return (
            <Card key={l.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start gap-3">
                  <div
                    className="h-10 w-10 rounded-lg flex items-center justify-center"
                    style={{
                      background: `color-mix(in oklab, ${l.color} 22%, transparent)`,
                      color: l.color,
                    }}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base">{l.name}</CardTitle>
                    <Badge variant="outline" className="mt-1 font-normal">
                      {meta.label}
                    </Badge>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleRemove(l.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-start gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{l.address}</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
