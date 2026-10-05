"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { signOut } from "firebase/auth";
import { Car, FileText, LayoutDashboard, LogOut, Menu, Plus, Settings, Users, X } from "lucide-react";
import { auth } from "@/lib/firebase";
import { cn } from "@/lib/utils";
import { useAuth } from "./AuthProvider";
import { Logo, Spinner } from "./ui";

const NAV = [
  { href: "/dashboard", label: "Panel", icon: LayoutDashboard },
  { href: "/contratos", label: "Contratos", icon: FileText },
  { href: "/clientes", label: "Clientes", icon: Users },
  { href: "/vehiculos", label: "Flota", icon: Car },
  { href: "/configuracion", label: "Configuración", icon: Settings },
];

export function AppShell({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  // El menú móvil queda abierto solo en la ruta donde se abrió (se cierra al navegar)
  const [openAt, setOpenAt] = useState<string | null>(null);
  const open = openAt === pathname;
  const setOpen = (v: boolean) => setOpenAt(v ? pathname : null);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <div className="grid min-h-screen place-items-center">
        <Spinner className="h-10 w-10" />
      </div>
    );
  }

  const initials = (user.displayName || user.email || "U").slice(0, 2).toUpperCase();

  const sidebar = (
    <div className="flex h-full flex-col bg-slate-950 px-4 py-6">
      <div className="px-2">
        <Logo dark />
      </div>

      <Link href="/contratos/nuevo" className="btn-primary mt-8 w-full py-3">
        <Plus className="h-4 w-4" /> Nuevo contrato
      </Link>

      <nav className="mt-8 flex-1 space-y-1">
        <div className="px-3 pb-2 text-[10px] font-bold tracking-[0.2em] text-slate-500 uppercase">Menú</div>
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition",
                active
                  ? "bg-gradient-to-r from-brand-600/25 to-brand-600/5 text-white ring-1 ring-brand-500/30"
                  : "text-slate-400 hover:bg-white/5 hover:text-white",
              )}
            >
              <Icon className={cn("h-[18px] w-[18px]", active ? "text-brand-400" : "text-slate-500 group-hover:text-slate-300")} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="rounded-2xl bg-white/5 p-3 ring-1 ring-white/10">
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand-400 to-brand-700 text-xs font-bold text-white">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold text-white">{user.displayName || "Usuario"}</div>
            <div className="truncate text-xs text-slate-400">{user.email}</div>
          </div>
          <button
            title="Cerrar sesión"
            onClick={() => signOut(auth)}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-white/10 hover:text-white"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen">
      {/* Sidebar escritorio */}
      <aside className="no-print fixed inset-y-0 left-0 z-30 hidden w-72 lg:block">{sidebar}</aside>

      {/* Sidebar móvil */}
      {open && (
        <div className="no-print fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <aside className="animate-fade-up absolute inset-y-0 left-0 w-72">{sidebar}</aside>
          <button onClick={() => setOpen(false)} className="absolute top-4 left-[300px] rounded-full bg-white p-2 shadow">
            <X className="h-5 w-5" />
          </button>
        </div>
      )}

      <div className="lg:pl-72 print:pl-0">
        <header className="no-print sticky top-0 z-20 flex items-center justify-between border-b border-slate-200/70 bg-white/80 px-4 py-3 backdrop-blur lg:hidden">
          <button onClick={() => setOpen(true)} className="rounded-lg p-2 hover:bg-slate-100">
            <Menu className="h-5 w-5" />
          </button>
          <Logo />
          <div className="w-9" />
        </header>
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-10 print:max-w-none print:p-0">{children}</main>
      </div>
    </div>
  );
}
