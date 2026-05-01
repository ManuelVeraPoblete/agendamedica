// In-memory mock data store. Resets on page reload.
// All data is fake and meant for UI prototyping only.

export type Role = "doctor" | "secretary";

export type Specialty =
  | "Medicina General"
  | "Cardiología"
  | "Pediatría"
  | "Dermatología"
  | "Ginecología"
  | "Traumatología"
  | "Psiquiatría"
  | "Oftalmología";

export type AppointmentStatus =
  | "pendiente"
  | "confirmada"
  | "anulada"
  | "atendida";

export type Insurance =
  | "Fonasa"
  | "Isapre Banmédica"
  | "Isapre Colmena"
  | "Isapre Cruz Blanca"
  | "Isapre Vida Tres"
  | "Isapre Consalud"
  | "Particular"
  | "Otro";

export interface Doctor {
  id: string;
  name: string;
  email: string;
  password: string; // mock only — never do this in real apps
  specialty: Specialty;
  avatarColor: string;
}

export interface Secretary {
  id: string;
  name: string;
  email: string;
  password: string;
  doctorIds: string[]; // doctors that gave her access
}

export interface Location {
  id: string;
  doctorId: string;
  name: string;
  address: string;
  type: "clinica" | "centro" | "particular";
  color: string;
}

export type Gender = "masculino" | "femenino" | "otro";

export interface Patient {
  id: string;
  doctorId: string;
  fullName: string;
  gender: Gender;
  documentId: string; // RUT/DNI
  phone: string;
  email: string;
  birthDate: string; // ISO
  insurance: Insurance;
  allergies?: string;
  conditions?: string;
  medications?: string;
  notes?: string;
  createdAt: string;
}

export interface Appointment {
  id: string;
  doctorId: string;
  patientId: string;
  locationId: string;
  date: string; // ISO date (YYYY-MM-DD)
  time: string; // HH:mm
  durationMin: number;
  reason: string; // motivo de consulta
  status: AppointmentStatus;
  createdBy: "doctor" | "secretary";
  monto?: number; // copago en CLP
}

// ---------- Seed ----------

export const doctors: Doctor[] = [
  {
    id: "doc-1",
    name: "Dra. Carla Méndez",
    email: "carla@medic.app",
    password: "demo1234",
    specialty: "Cardiología",
    avatarColor: "oklch(0.72 0.11 230)",
  },
  {
    id: "doc-2",
    name: "Dr. Andrés Rojas",
    email: "andres@medic.app",
    password: "demo1234",
    specialty: "Pediatría",
    avatarColor: "oklch(0.7 0.15 155)",
  },
];

export const secretaries: Secretary[] = [
  {
    id: "sec-1",
    name: "María González",
    email: "maria@medic.app",
    password: "demo1234",
    doctorIds: ["doc-1", "doc-2"],
  },
  {
    id: "sec-2",
    name: "Valentina Torres",
    email: "valentina@medic.app",
    password: "demo1234",
    doctorIds: ["doc-1"],
  },
  {
    id: "sec-3",
    name: "Camila Reyes",
    email: "camila@medic.app",
    password: "demo1234",
    doctorIds: ["doc-2"],
  },
];

export const locations: Location[] = [
  {
    id: "loc-1",
    doctorId: "doc-1",
    name: "Clínica Las Condes",
    address: "Av. Las Condes 12345, Santiago",
    type: "clinica",
    color: "oklch(0.72 0.11 230)",
  },
  {
    id: "loc-2",
    doctorId: "doc-1",
    name: "Consulta Providencia",
    address: "Av. Providencia 2100, of. 504",
    type: "particular",
    color: "oklch(0.7 0.15 155)",
  },
  {
    id: "loc-3",
    doctorId: "doc-2",
    name: "Centro Médico Apoquindo",
    address: "Apoquindo 4500, Las Condes",
    type: "centro",
    color: "oklch(0.78 0.15 75)",
  },
  {
    id: "loc-4",
    doctorId: "doc-2",
    name: "Consulta Particular Ñuñoa",
    address: "Av. Irarrázaval 3820, Ñuñoa",
    type: "particular",
    color: "oklch(0.65 0.18 300)",
  },
];

export const patients: Patient[] = [
  {
    id: "pat-1",
    doctorId: "doc-1",
    fullName: "Juan Pérez Soto",
    gender: "masculino",
    documentId: "12.345.678-9",
    phone: "+56 9 8765 4321",
    email: "juan.perez@mail.com",
    birthDate: "1985-04-12",
    insurance: "Isapre Banmédica",
    conditions: "Hipertensión controlada",
    medications: "Losartán 50mg",
    createdAt: new Date().toISOString(),
  },
  {
    id: "pat-2",
    doctorId: "doc-1",
    fullName: "Ana Silva Rojas",
    gender: "femenino",
    documentId: "15.432.987-1",
    phone: "+56 9 5555 1212",
    email: "ana.silva@mail.com",
    birthDate: "1992-09-03",
    insurance: "Fonasa",
    createdAt: new Date().toISOString(),
  },
  {
    id: "pat-3",
    doctorId: "doc-2",
    fullName: "Tomás Morales (5 años)",
    gender: "masculino",
    documentId: "25.111.222-3",
    phone: "+56 9 7777 8888",
    email: "padre.tomas@mail.com",
    birthDate: "2019-06-21",
    insurance: "Isapre Colmena",
    createdAt: new Date().toISOString(),
  },
  {
    id: "pat-7",
    doctorId: "doc-2",
    fullName: "Sofía Castillo Ibáñez",
    gender: "femenino",
    documentId: "22.987.654-1",
    phone: "+56 9 4455 6677",
    email: "sofia.castillo@mail.com",
    birthDate: "2021-02-14",
    insurance: "Fonasa",
    createdAt: new Date().toISOString(),
  },
  {
    id: "pat-8",
    doctorId: "doc-2",
    fullName: "Martín Díaz Soto",
    gender: "masculino",
    documentId: "23.456.789-0",
    phone: "+56 9 8899 0011",
    email: "mama.martin@mail.com",
    birthDate: "2018-08-30",
    insurance: "Isapre Banmédica",
    allergies: "Ibuprofeno",
    createdAt: new Date().toISOString(),
  },
  {
    id: "pat-9",
    doctorId: "doc-2",
    fullName: "Valentina Herrera Lagos",
    gender: "femenino",
    documentId: "24.321.987-K",
    phone: "+56 9 1122 3344",
    email: "valentina.h@mail.com",
    birthDate: "2016-11-05",
    insurance: "Particular",
    conditions: "Asma leve",
    medications: "Salbutamol en crisis",
    createdAt: new Date().toISOString(),
  },
  {
    id: "pat-4",
    doctorId: "doc-1",
    fullName: "Claudia Vega Moreno",
    gender: "femenino",
    documentId: "17.654.321-K",
    phone: "+56 9 3344 5566",
    email: "claudia.vega@mail.com",
    birthDate: "1978-11-15",
    insurance: "Particular",
    allergies: "Penicilina",
    createdAt: new Date().toISOString(),
  },
  {
    id: "pat-5",
    doctorId: "doc-1",
    fullName: "Roberto Núñez Parra",
    gender: "masculino",
    documentId: "11.223.344-5",
    phone: "+56 9 6677 8899",
    email: "roberto.nunez@mail.com",
    birthDate: "1965-03-22",
    insurance: "Fonasa",
    conditions: "Diabetes tipo 2",
    medications: "Metformina 850mg",
    createdAt: new Date().toISOString(),
  },
  {
    id: "pat-6",
    doctorId: "doc-1",
    fullName: "Patricia Leal Fuentes",
    gender: "femenino",
    documentId: "14.567.890-2",
    phone: "+56 9 9988 7766",
    email: "patricia.leal@mail.com",
    birthDate: "1990-07-08",
    insurance: "Isapre Consalud",
    createdAt: new Date().toISOString(),
  },
];

const today = new Date().toISOString().slice(0, 10);

export const appointments: Appointment[] = [
  {
    id: "apt-1",
    doctorId: "doc-1",
    patientId: "pat-1",
    locationId: "loc-1",
    date: today,
    time: "09:30",
    durationMin: 30,
    reason: "Control de presión arterial",
    status: "atendida",
    createdBy: "secretary",
    monto: 35000,
  },
  {
    id: "apt-2",
    doctorId: "doc-1",
    patientId: "pat-2",
    locationId: "loc-1",
    date: today,
    time: "10:30",
    durationMin: 30,
    reason: "Dolor torácico ocasional",
    status: "atendida",
    createdBy: "doctor",
    monto: 9500,
  },
  {
    id: "apt-3",
    doctorId: "doc-1",
    patientId: "pat-4",
    locationId: "loc-1",
    date: today,
    time: "11:30",
    durationMin: 45,
    reason: "Consulta general",
    status: "atendida",
    createdBy: "secretary",
    monto: 55000,
  },
  {
    id: "apt-4",
    doctorId: "doc-2",
    patientId: "pat-3",
    locationId: "loc-3",
    date: today,
    time: "11:00",
    durationMin: 30,
    reason: "Control niño sano",
    status: "atendida",
    createdBy: "secretary",
    monto: 28000,
  },
  {
    id: "apt-5",
    doctorId: "doc-1",
    patientId: "pat-5",
    locationId: "loc-1",
    date: today,
    time: "12:00",
    durationMin: 30,
    reason: "Hipertensión – control mensual",
    status: "atendida",
    createdBy: "secretary",
    monto: 9500,
  },
  {
    id: "apt-6",
    doctorId: "doc-1",
    patientId: "pat-6",
    locationId: "loc-1",
    date: today,
    time: "15:00",
    durationMin: 30,
    reason: "Arritmia – seguimiento",
    status: "atendida",
    createdBy: "secretary",
    monto: 32000,
  },
  {
    id: "apt-7",
    doctorId: "doc-1",
    patientId: "pat-1",
    locationId: "loc-2",
    date: today,
    time: "16:00",
    durationMin: 45,
    reason: "Ecocardiograma de seguimiento",
    status: "pendiente",
    createdBy: "secretary",
    monto: 40000,
  },
  {
    id: "apt-8",
    doctorId: "doc-1",
    patientId: "pat-2",
    locationId: "loc-1",
    date: today,
    time: "17:00",
    durationMin: 30,
    reason: "Examen de resultados",
    status: "confirmada",
    createdBy: "doctor",
    monto: 9500,
  },
  {
    id: "apt-9",
    doctorId: "doc-2",
    patientId: "pat-7",
    locationId: "loc-3",
    date: today,
    time: "09:00",
    durationMin: 30,
    reason: "Control de desarrollo",
    status: "atendida",
    createdBy: "secretary",
    monto: 22000,
  },
  {
    id: "apt-10",
    doctorId: "doc-2",
    patientId: "pat-8",
    locationId: "loc-3",
    date: today,
    time: "10:00",
    durationMin: 30,
    reason: "Fiebre y tos persistente",
    status: "atendida",
    createdBy: "secretary",
    monto: 28000,
  },
  {
    id: "apt-11",
    doctorId: "doc-2",
    patientId: "pat-9",
    locationId: "loc-3",
    date: today,
    time: "14:00",
    durationMin: 45,
    reason: "Control de asma – evaluación semestral",
    status: "confirmada",
    createdBy: "secretary",
    monto: 35000,
  },
  {
    id: "apt-12",
    doctorId: "doc-2",
    patientId: "pat-3",
    locationId: "loc-3",
    date: today,
    time: "15:30",
    durationMin: 30,
    reason: "Vacunación según calendario",
    status: "pendiente",
    createdBy: "secretary",
    monto: 18000,
  },
];

export type WaitingListPriority = "urgente" | "normal" | "flexible";

export interface WaitingListEntry {
  id: string;
  doctorId: string;
  patientId: string;
  locationId?: string; // preferred location
  reason: string;
  notes?: string;
  priority: WaitingListPriority;
  createdAt: string;
  createdBy: "doctor" | "secretary";
}

export const waitingList: WaitingListEntry[] = [
  {
    id: "wl-1",
    doctorId: "doc-1",
    patientId: "pat-2",
    reason: "Evaluación de resultados de exámenes",
    notes: "Paciente ha llamado varias veces, prefiere horario de mañana",
    priority: "urgente",
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    createdBy: "secretary",
  },
  {
    id: "wl-2",
    doctorId: "doc-1",
    patientId: "pat-4",
    locationId: "loc-1",
    reason: "Primera consulta cardiológica",
    priority: "normal",
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    createdBy: "secretary",
  },
  {
    id: "wl-3",
    doctorId: "doc-1",
    patientId: "pat-5",
    reason: "Control semestral de rutina",
    notes: "Cualquier día de la semana está bien",
    priority: "flexible",
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    createdBy: "secretary",
  },
  {
    id: "wl-4",
    doctorId: "doc-2",
    patientId: "pat-8",
    locationId: "loc-3",
    reason: "Control post-hospitalización – bronconeumonía",
    notes: "Prioridad alta, tuvo complicaciones",
    priority: "urgente",
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    createdBy: "secretary",
  },
];

export const insuranceOptions: Insurance[] = [
  "Fonasa",
  "Isapre Banmédica",
  "Isapre Colmena",
  "Isapre Cruz Blanca",
  "Isapre Vida Tres",
  "Isapre Consalud",
  "Particular",
  "Otro",
];

export const specialtyOptions: Specialty[] = [
  "Medicina General",
  "Cardiología",
  "Pediatría",
  "Dermatología",
  "Ginecología",
  "Traumatología",
  "Psiquiatría",
  "Oftalmología",
];
