import { useState } from "react";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { useStore } from "@/lib/store";
import { insuranceOptions, type Insurance, type Gender } from "@/lib/mock-data";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export function PatientDialog({ open, onOpenChange }: Props) {
  const { addPatient } = useStore();
  const [fullName, setFullName] = useState("");
  const [gender, setGender] = useState<Gender>("femenino");
  const [documentId, setDocumentId] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date(1990, 0));
  const [insurance, setInsurance] = useState<Insurance>("Fonasa");
  const [allergies, setAllergies] = useState("");
  const [conditions, setConditions] = useState("");
  const [medications, setMedications] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setFullName("");
    setGender("femenino");
    setDocumentId("");
    setPhone("");
    setEmail("");
    setBirthDate("");
    setCalendarMonth(new Date(1990, 0));
    setInsurance("Fonasa");
    setAllergies("");
    setConditions("");
    setMedications("");
    setNotes("");
  };

  const handleSave = async () => {
    if (!fullName.trim() || !documentId.trim() || !birthDate) {
      toast.error("Completa nombre, documento y fecha de nacimiento");
      return;
    }
    setSaving(true);
    try {
      await addPatient({
        fullName: fullName.trim(),
        gender,
        documentId: documentId.trim(),
        phone: phone.trim(),
        email: email.trim(),
        birthDate,
        insurance,
        allergies: allergies.trim() || undefined,
        conditions: conditions.trim() || undefined,
        medications: medications.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      toast.success("Paciente registrado");
      reset();
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al guardar paciente");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) reset();
        onOpenChange(v);
      }}
    >
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Nuevo paciente</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2 max-h-[65vh] overflow-y-auto pr-1">

          {/* Nombre + Género */}
          <div className="space-y-2">
            <Label>Nombre completo *</Label>
            <Input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Juan Pérez Soto"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Género *</Label>
              <Select value={gender} onValueChange={(v) => setGender(v as Gender)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="femenino">Femenino</SelectItem>
                  <SelectItem value="masculino">Masculino</SelectItem>
                  <SelectItem value="otro">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Fecha de nacimiento *</Label>
              <div className="flex gap-2">
                <Input
                  type="date"
                  value={birthDate}
                  max={format(new Date(), "yyyy-MM-dd")}
                  onChange={(e) => {
                    const val = e.target.value;
                    setBirthDate(val);
                    if (val) {
                      const parsed = parseISO(val);
                      if (!isNaN(parsed.getTime())) setCalendarMonth(parsed);
                    }
                  }}
                  className="flex-1"
                />
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="icon" className="shrink-0">
                      <CalendarIcon className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <Calendar
                      mode="single"
                      captionLayout="dropdown"
                      selected={birthDate ? parseISO(birthDate) : undefined}
                      onSelect={(d) => {
                        if (d) {
                          setBirthDate(format(d, "yyyy-MM-dd"));
                          setCalendarMonth(d);
                        }
                      }}
                      month={calendarMonth}
                      onMonthChange={setCalendarMonth}
                      startMonth={new Date(1920, 0)}
                      endMonth={new Date()}
                      disabled={{ after: new Date() }}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          {/* Documento + Previsión */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Documento (RUT/DNI) *</Label>
              <Input
                value={documentId}
                onChange={(e) => setDocumentId(e.target.value)}
                placeholder="12.345.678-9"
              />
            </div>
            <div className="space-y-2">
              <Label>Previsión / Seguro</Label>
              <Select
                value={insurance}
                onValueChange={(v) => setInsurance(v as Insurance)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {insuranceOptions.map((i) => (
                    <SelectItem key={i} value={i}>
                      {i}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Contacto */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Teléfono</Label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+56 9 ..."
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="paciente@mail.com"
              />
            </div>
          </div>

          {/* Antecedentes clínicos */}
          <div className="space-y-2">
            <Label>Alergias conocidas</Label>
            <Textarea
              value={allergies}
              onChange={(e) => setAllergies(e.target.value)}
              placeholder="Ej: Penicilina, aspirina, látex..."
              rows={2}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Enfermedades presentes</Label>
              <Textarea
                value={conditions}
                onChange={(e) => setConditions(e.target.value)}
                placeholder="Ej: Hipertensión, diabetes tipo 2..."
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label>Medicamentos actuales</Label>
              <Textarea
                value={medications}
                onChange={(e) => setMedications(e.target.value)}
                placeholder="Ej: Losartán 50mg, Metformina 850mg..."
                rows={2}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Notas adicionales</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Cualquier otro antecedente relevante..."
              rows={2}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Guardando..." : "Guardar paciente"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
