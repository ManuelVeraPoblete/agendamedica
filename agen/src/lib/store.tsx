import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  appointments as seedAppointments,
  doctors as seedDoctors,
  locations as seedLocations,
  patients as seedPatients,
  secretaries as seedSecretaries,
  waitingList as seedWaitingList,
  type Appointment,
  type AppointmentStatus,
  type Doctor,
  type Gender,
  type Insurance,
  type Location,
  type Patient,
  type Role,
  type Secretary,
  type WaitingListEntry,
} from "./mock-data";
import { api, storeToken, clearToken } from "./api";

interface Session {
  role: Role;
  userId: string; // doctor or secretary id
  doctorId: string; // active doctor context (own if doctor, selected if secretary)
  locationId: string;
}

interface StoreContextValue {
  // session
  hydrated: boolean;
  session: Session | null;
  login: (input: {
    username: string;
    password: string;
  }) => Promise<{ ok: true } | { ok: false; error: string }>;
  logout: () => void;
  switchLocation: (locationId: string) => void;
  switchDoctor: (doctorId: string, locationId: string) => void;

  // raw collections
  doctors: Doctor[];
  secretaries: Secretary[];
  locations: Location[];
  patients: Patient[];
  appointments: Appointment[];

  // derived helpers
  activeDoctor: Doctor | null;
  activeLocation: Location | null;
  doctorLocations: (doctorId: string) => Location[];
  doctorPatients: (doctorId: string) => Patient[];
  doctorAppointments: (doctorId: string, locationId?: string) => Appointment[];

  // waiting list
  waitingList: WaitingListEntry[];
  doctorWaitingList: (doctorId: string) => WaitingListEntry[];
  addToWaitingList: (
    e: Omit<WaitingListEntry, "id" | "doctorId" | "createdAt" | "createdBy">,
  ) => WaitingListEntry | null;
  removeFromWaitingList: (id: string) => void;
  activateFromWaitingList: (
    id: string,
    date: string,
    time: string,
    locationId: string,
    durationMin: number,
    monto?: number,
  ) => Appointment | null;

  // mutations
  addPatient: (
    p: Omit<Patient, "id" | "createdAt" | "doctorId">,
  ) => Promise<Patient | null>;
  updatePatient: (id: string, patch: Partial<Patient>) => void;
  addLocation: (l: Omit<Location, "id" | "doctorId">) => Location | null;
  removeLocation: (id: string) => void;
  addAppointment: (
    a: Omit<Appointment, "id" | "doctorId" | "createdBy">,
  ) => Appointment | null;
  setAppointmentStatus: (id: string, status: AppointmentStatus) => void;
  rescheduleAppointment: (id: string, date: string, time: string, durationMin: number) => void;
  removeAppointment: (id: string) => void;
}

const StoreContext = createContext<StoreContextValue | null>(null);

const SESSION_KEY = "medicapp:session";

const colorPool = [
  "oklch(0.72 0.11 230)",
  "oklch(0.7 0.15 155)",
  "oklch(0.78 0.15 75)",
  "oklch(0.65 0.18 300)",
  "oklch(0.7 0.18 25)",
];

function randomId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [doctors] = useState<Doctor[]>(seedDoctors);
  const [secretaries] = useState<Secretary[]>(seedSecretaries);
  const [locations, setLocations] = useState<Location[]>(seedLocations);
  const [patients, setPatients] = useState<Patient[]>(seedPatients);
  const [appointments, setAppointments] =
    useState<Appointment[]>(seedAppointments);
  const [waitingListEntries, setWaitingListEntries] =
    useState<WaitingListEntry[]>(seedWaitingList);

  // Start as null so server and initial client render match (no hydration mismatch).
  // localStorage is read after mount in the effect below.
  const [session, setSession] = useState<Session | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(SESSION_KEY);
      if (raw) setSession(JSON.parse(raw) as Session);
    } catch {}
    setHydrated(true);
  }, []);

  const persistSession = useCallback((s: Session | null) => {
    setSession(s);
    if (typeof window === "undefined") return;
    if (s) window.localStorage.setItem(SESSION_KEY, JSON.stringify(s));
    else window.localStorage.removeItem(SESSION_KEY);
  }, []);

  const login = useCallback<StoreContextValue["login"]>(
    async ({ username, password }) => {
      let serverUser: Awaited<ReturnType<typeof api.auth.login>>["data"]["user"];
      try {
        const result = await api.auth.login(username, password);
        storeToken(result.data.token);
        serverUser = result.data.user;
      } catch (err) {
        return { ok: false, error: err instanceof Error ? err.message : "Credenciales inválidas" };
      }

      if (serverUser.role === "doctor") {
        const d = doctors.find(
          (x) => x.email.toLowerCase() === serverUser.email.toLowerCase(),
        );
        if (!d) return { ok: false, error: "Médico no encontrado en el sistema local" };
        const firstLoc = locations.find((l) => l.doctorId === d.id);
        if (!firstLoc) return { ok: false, error: "Sin lugares de atención configurados" };
        persistSession({ role: "doctor", userId: d.id, doctorId: d.id, locationId: firstLoc.id });
        return { ok: true };
      }

      if (serverUser.role === "secretary") {
        const s = secretaries.find(
          (x) => x.email.toLowerCase() === serverUser.email.toLowerCase(),
        );
        if (!s) return { ok: false, error: "Secretaria no encontrada en el sistema local" };
        const firstDoctorId = s.doctorIds[0];
        const firstLoc = locations.find((l) => l.doctorId === firstDoctorId);
        if (!firstDoctorId || !firstLoc) return { ok: false, error: "Sin médicos o lugares configurados" };
        persistSession({ role: "secretary", userId: s.id, doctorId: firstDoctorId, locationId: firstLoc.id });
        return { ok: true };
      }

      return { ok: false, error: "Rol no soportado" };
    },
    [doctors, secretaries, locations, persistSession],
  );

  const logout = useCallback(() => {
    clearToken();
    persistSession(null);
  }, [persistSession]);

  const switchLocation = useCallback(
    (locationId: string) => {
      if (!session) return;
      persistSession({ ...session, locationId });
    },
    [session, persistSession],
  );

  const switchDoctor = useCallback(
    (newDoctorId: string, newLocationId: string) => {
      if (!session) return;
      if (session.role === "secretary") {
        const sec = secretaries.find((s) => s.id === session.userId);
        if (!sec?.doctorIds.includes(newDoctorId)) return;
      }
      persistSession({ ...session, doctorId: newDoctorId, locationId: newLocationId });
    },
    [session, secretaries, persistSession],
  );

  const activeDoctor = useMemo(
    () => doctors.find((d) => d.id === session?.doctorId) ?? null,
    [doctors, session],
  );
  const activeLocation = useMemo(
    () => locations.find((l) => l.id === session?.locationId) ?? null,
    [locations, session],
  );

  const doctorLocations = useCallback(
    (doctorId: string) => locations.filter((l) => l.doctorId === doctorId),
    [locations],
  );

  const doctorPatients = useCallback(
    (doctorId: string) => patients.filter((p) => p.doctorId === doctorId),
    [patients],
  );

  const doctorAppointments = useCallback(
    (doctorId: string, locationId?: string) =>
      appointments
        .filter(
          (a) =>
            a.doctorId === doctorId &&
            (locationId ? a.locationId === locationId : true),
        )
        .sort((a, b) =>
          a.date === b.date
            ? a.time.localeCompare(b.time)
            : a.date.localeCompare(b.date),
        ),
    [appointments],
  );

  const addPatient = useCallback<StoreContextValue["addPatient"]>(
    async (p) => {
      if (!session) return null;
      const result = await api.patients.create(p);
      const s = result.data.patient;
      const newP: Patient = {
        id:          String(s.id),
        doctorId:    session.doctorId,
        fullName:    s.fullName,
        gender:      s.gender as Gender,
        documentId:  s.documentId,
        phone:       s.phone       ?? "",
        email:       s.email       ?? "",
        birthDate:   s.birthDate,
        insurance:   (s.insurance  ?? "Fonasa") as Insurance,
        allergies:   s.allergies   ?? undefined,
        conditions:  s.conditions  ?? undefined,
        medications: s.medications ?? undefined,
        notes:       s.notes       ?? undefined,
        createdAt:   s.createdAt,
      };
      setPatients((prev) => [newP, ...prev]);
      return newP;
    },
    [session],
  );

  const updatePatient = useCallback(
    (id: string, patch: Partial<Patient>) => {
      setPatients((prev) =>
        prev.map((p) => (p.id === id ? { ...p, ...patch } : p)),
      );
    },
    [],
  );

  const addLocation = useCallback<StoreContextValue["addLocation"]>(
    (l) => {
      if (!session || session.role !== "doctor") return null;
      const newL: Location = {
        ...l,
        id: randomId("loc"),
        doctorId: session.doctorId,
        color:
          l.color || colorPool[Math.floor(Math.random() * colorPool.length)],
      };
      setLocations((prev) => [...prev, newL]);
      return newL;
    },
    [session],
  );

  const removeLocation = useCallback((id: string) => {
    setLocations((prev) => prev.filter((l) => l.id !== id));
  }, []);

  const addAppointment = useCallback<StoreContextValue["addAppointment"]>(
    (a) => {
      if (!session) return null;
      const newA: Appointment = {
        ...a,
        id: randomId("apt"),
        doctorId: session.doctorId,
        createdBy: session.role,
      };
      setAppointments((prev) => [...prev, newA]);
      return newA;
    },
    [session],
  );

  const setAppointmentStatus = useCallback(
    (id: string, status: AppointmentStatus) => {
      setAppointments((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status } : a)),
      );
    },
    [],
  );

  const rescheduleAppointment = useCallback(
    (id: string, date: string, time: string, durationMin: number) => {
      setAppointments((prev) =>
        prev.map((a) => (a.id === id ? { ...a, date, time, durationMin, status: "confirmada" } : a)),
      );
    },
    [],
  );

  const removeAppointment = useCallback((id: string) => {
    setAppointments((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const doctorWaitingList = useCallback(
    (doctorId: string) =>
      waitingListEntries
        .filter((e) => e.doctorId === doctorId)
        .sort((a, b) => {
          const order = { urgente: 0, normal: 1, flexible: 2 };
          const byPriority = order[a.priority] - order[b.priority];
          return byPriority !== 0
            ? byPriority
            : a.createdAt.localeCompare(b.createdAt);
        }),
    [waitingListEntries],
  );

  const addToWaitingList = useCallback<StoreContextValue["addToWaitingList"]>(
    (e) => {
      if (!session) return null;
      const entry: WaitingListEntry = {
        ...e,
        id: randomId("wl"),
        doctorId: session.doctorId,
        createdAt: new Date().toISOString(),
        createdBy: session.role,
      };
      setWaitingListEntries((prev) => [entry, ...prev]);
      return entry;
    },
    [session],
  );

  const removeFromWaitingList = useCallback((id: string) => {
    setWaitingListEntries((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const activateFromWaitingList = useCallback<
    StoreContextValue["activateFromWaitingList"]
  >(
    (id, date, time, locationId, durationMin, monto) => {
      if (!session) return null;
      const entry = waitingListEntries.find((e) => e.id === id);
      if (!entry) return null;
      const newA: Appointment = {
        id: randomId("apt"),
        doctorId: entry.doctorId,
        patientId: entry.patientId,
        locationId,
        date,
        time,
        durationMin,
        reason: entry.reason,
        status: "confirmada",
        createdBy: session.role,
        monto,
      };
      setAppointments((prev) => [...prev, newA]);
      setWaitingListEntries((prev) => prev.filter((e) => e.id !== id));
      return newA;
    },
    [session, waitingListEntries],
  );

  const value: StoreContextValue = {
    hydrated,
    session,
    login,
    logout,
    switchLocation,
    switchDoctor,
    doctors,
    secretaries,
    locations,
    patients,
    appointments,
    activeDoctor,
    activeLocation,
    doctorLocations,
    doctorPatients,
    doctorAppointments,
    waitingList: waitingListEntries,
    doctorWaitingList,
    addToWaitingList,
    removeFromWaitingList,
    activateFromWaitingList,
    addPatient,
    updatePatient,
    addLocation,
    removeLocation,
    addAppointment,
    setAppointmentStatus,
    rescheduleAppointment,
    removeAppointment,
  };

  return (
    <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
