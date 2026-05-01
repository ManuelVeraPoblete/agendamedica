const BASE_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:3001';
const TOKEN_KEY = 'medicapp:token';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function storeToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers as Record<string, string> | undefined),
    },
  });
  const body = await res.json() as { success: boolean; message?: string; data?: unknown };
  if (!res.ok) throw new Error(body.message ?? `Error ${res.status}`);
  return body as T;
}

type AuthLoginResponse = {
  success: true;
  data: {
    token: string;
    user: {
      id: number;
      profileId: number;
      username: string;
      email: string;
      name: string;
      role: 'doctor' | 'secretary' | 'admin';
      specialty?: string;
      avatarColor?: string;
      doctorIds?: number[];
    };
  };
};
type PatientData = {
  fullName: string;
  gender: string;
  documentId: string;
  birthDate: string;
  phone?: string;
  email?: string;
  insurance?: string;
  allergies?: string;
  conditions?: string;
  medications?: string;
  notes?: string;
};
type PatientRecord = {
  id: number;
  doctorId: number;
  fullName: string;
  gender: string;
  documentId: string;
  phone: string | null;
  email: string | null;
  birthDate: string;
  insurance: string | null;
  allergies: string | null;
  conditions: string | null;
  medications: string | null;
  notes: string | null;
  createdAt: string;
};
type CreatePatientResponse = { success: true; data: { patient: PatientRecord } };
type ListPatientsResponse  = { success: true; data: { patients: PatientRecord[] } };

export const api = {
  auth: {
    login: (username: string, password: string) =>
      request<AuthLoginResponse>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      }),
  },
  patients: {
    create: (data: PatientData) =>
      request<CreatePatientResponse>('/api/patients', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    list: () =>
      request<ListPatientsResponse>('/api/patients'),
  },
};
