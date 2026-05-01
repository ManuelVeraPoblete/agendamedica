import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Stethoscope, Lock, User } from "lucide-react";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    if (typeof window !== "undefined") {
      const raw = window.localStorage.getItem("medicapp:session");
      if (raw) throw redirect({ to: "/app/agenda" });
    }
  },
  component: LoginPage,
});

function LoginPage() {
  const { login } = useStore();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await login({ username, password });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Sesión iniciada");
      window.location.href = "/app/agenda";
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (type: "doctor" | "secretary") => {
    if (type === "doctor") {
      setUsername("carla.mendez");
      setPassword("demo1234");
    } else {
      setUsername("maria.gonzalez");
      setPassword("demo1234");
    }
  };

  return (
    <div className="grid-bg min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="h-10 w-10 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center">
            <Stethoscope className="h-5 w-5 text-primary" />
          </div>
          <div>
            <div className="text-xl font-semibold tracking-tight">MediAgenda</div>
            <div className="text-xs text-muted-foreground">Gestión clínica</div>
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-6 shadow-2xl">
          <h1 className="text-lg font-semibold">Iniciar sesión</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Ingresa tus credenciales para acceder
          </p>

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Usuario</Label>
              <div className="relative">
                <User className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="username"
                  type="text"
                  className="pl-9"
                  placeholder="nombre.apellido"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  autoComplete="username"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <div className="relative">
                <Lock className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  className="pl-9"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </div>
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? "Iniciando sesión..." : "Entrar"}
            </Button>
          </form>

          <div className="mt-5 pt-5 border-t border-border">
            <p className="text-xs text-muted-foreground mb-2">
              Cuentas demo (contraseña: demo1234):
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                className="flex-1"
                onClick={() => fillDemo("doctor")}
              >
                Médico demo
              </Button>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                className="flex-1"
                onClick={() => fillDemo("secretary")}
              >
                Secretaria demo
              </Button>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          MediAgenda · Gestión clínica
        </p>
      </div>
    </div>
  );
}
