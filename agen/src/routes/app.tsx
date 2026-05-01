import {
  createFileRoute,
  Link,
  Outlet,
  redirect,
  useLocation,
  useNavigate,
} from "@tanstack/react-router";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  Users,
  MapPin,
  LogOut,
  Stethoscope,
  ChevronDown,
  BarChart2,
  CalendarCheck,
  Clock,
  ShieldCheck,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/app")({
  beforeLoad: () => {
    if (typeof window !== "undefined") {
      const raw = window.localStorage.getItem("medicapp:session");
      if (!raw) throw redirect({ to: "/" });
    }
  },
  component: AppLayout,
});

function AppLayout() {
  const {
    hydrated,
    session,
    activeDoctor,
    activeLocation,
    doctorLocations,
    doctorWaitingList,
    doctors,
    secretaries,
    logout,
    switchLocation,
    switchDoctor,
  } = useStore();
  const navigate = useNavigate();
  const location = useLocation();

  if (!hydrated) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
    </div>
  );
  if (!session || !activeDoctor) return null;

  const locs = doctorLocations(activeDoctor.id);
  const me =
    session.role === "doctor"
      ? activeDoctor.name
      : secretaries.find((s) => s.id === session.userId)?.name ?? "Secretaria";

  const myDoctors = session.role === "secretary"
    ? doctors.filter((d) =>
        secretaries.find((s) => s.id === session.userId)?.doctorIds.includes(d.id)
      )
    : [];

  const handleLocationChange = (id: string) => switchLocation(id);

  const handleDoctorChange = (newDoctorId: string) => {
    const firstLoc = doctorLocations(newDoctorId)[0];
    if (firstLoc) switchDoctor(newDoctorId, firstLoc.id);
  };

  const handleLogout = () => {
    logout();
    navigate({ to: "/" });
  };

  const waitingCount = doctorWaitingList(activeDoctor.id).length;

  const navItems = [
    { to: "/app/agenda", label: "Agenda", icon: Calendar },
    { to: "/app/pacientes", label: "Pacientes", icon: Users },
    ...(session.role === "doctor"
      ? [{ to: "/app/lugares", label: "Lugares", icon: MapPin }]
      : []),
    {
      to: "/app/lista-espera",
      label: "Lista de Espera",
      icon: Clock,
      badge: waitingCount > 0 ? waitingCount : undefined,
    },
  ];

  const informesItems =
    session.role === "secretary"
      ? [
          {
            to: "/app/informes/atenciones-diarias",
            label: "Atenciones Diarias",
            icon: CalendarCheck,
          },
          {
            to: "/app/informes/por-prevision",
            label: "Por Previsión",
            icon: ShieldCheck,
          },
        ]
      : [];

  return (
    <div className="min-h-screen flex bg-background text-foreground">
      {/* Sidebar */}
      <aside className="print:hidden w-64 shrink-0 border-r border-border bg-sidebar flex flex-col">
        <div className="px-5 py-5 flex items-center gap-2 border-b border-border">
          <div className="h-9 w-9 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center">
            <Stethoscope className="h-4.5 w-4.5 text-primary" />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold">MediAgenda</div>
            <div className="text-[11px] text-muted-foreground">
              Demo prototipo
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => {
            const active = location.pathname.startsWith(item.to);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="flex-1">{item.label}</span>
                {"badge" in item && item.badge !== undefined && (
                  <span className="h-5 min-w-5 rounded-full bg-primary text-primary-foreground text-[10px] font-semibold flex items-center justify-center px-1">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}

          {informesItems.length > 0 && (
            <div className="pt-3">
              <div className="flex items-center gap-2 px-3 pb-1">
                <BarChart2 className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Informes
                </span>
              </div>
              {informesItems.map((item) => {
                const active = location.pathname.startsWith(item.to);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`flex items-center gap-3 pl-6 pr-3 py-2 rounded-lg text-sm transition-colors ${
                      active
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          )}
        </nav>

        <div className="p-3 border-t border-border">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-full flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-sidebar-accent/60 transition-colors text-left">
                <div
                  className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold"
                  style={{
                    background: `color-mix(in oklab, ${activeDoctor.avatarColor} 25%, transparent)`,
                    color: activeDoctor.avatarColor,
                  }}
                >
                  {me
                    .split(" ")
                    .map((p) => p[0])
                    .slice(0, 2)
                    .join("")}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{me}</div>
                  <div className="text-[11px] text-muted-foreground capitalize">
                    {session.role === "doctor" ? "Médico" : "Secretaria"}
                  </div>
                </div>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                {session.role === "secretary"
                  ? `Asistiendo a ${activeDoctor.name}`
                  : "Mi cuenta"}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" /> Cerrar sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="print:hidden h-14 border-b border-border flex items-center justify-between px-6 bg-background/80 backdrop-blur">
          <div className="flex items-center gap-3">
            {session.role === "secretary" && myDoctors.length > 1 ? (
              <>
                <Stethoscope className="h-4 w-4 text-muted-foreground shrink-0" />
                <Select value={activeDoctor.id} onValueChange={handleDoctorChange}>
                  <SelectTrigger className="w-[240px] h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {myDoctors.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.name} · {d.specialty}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </>
            ) : (
              <>
                <Badge variant="outline" className="font-normal">
                  {activeDoctor.specialty}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {activeDoctor.name}
                </span>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <Select
              value={activeLocation?.id ?? ""}
              onValueChange={handleLocationChange}
            >
              <SelectTrigger className="w-[260px] h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {locs.map((l) => (
                  <SelectItem key={l.id} value={l.id}>
                    {l.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
