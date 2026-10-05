"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowUpRight, CalendarClock, Car, DollarSign, FileText, Plus, Users } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { LoadingBlock, PageHeader } from "@/components/ui";
import { useClientes, useContratos, useVehiculos } from "@/lib/db";
import { ESTADOS_CONTRATO } from "@/lib/types";
import { cn, fechaCorta, hoyISO, MESES, money } from "@/lib/utils";

function Stat({
  label,
  value,
  icon,
  accent,
  hint,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  accent: string;
  hint?: string;
}) {
  return (
    <div className="card animate-fade-up relative overflow-hidden p-5">
      <div className={cn("absolute -top-8 -right-8 h-28 w-28 rounded-full opacity-10", accent)} />
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">{label}</p>
          <p className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">{value}</p>
          {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
        </div>
        <div className={cn("grid h-11 w-11 place-items-center rounded-xl text-white shadow-lg", accent)}>{icon}</div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const { data: contratos, loading } = useContratos();
  const { data: vehiculos } = useVehiculos();
  const { data: clientes } = useClientes();

  const stats = useMemo(() => {
    const now = new Date();
    const mes = contratos.filter((c) => {
      const d = new Date(c.createdAt ?? 0);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() && c.estado !== "cancelado";
    });
    const ingresosMes = mes.reduce((s, c) => s + (Number(c.total) || 0), 0);
    const activos = contratos.filter((c) => c.estado === "activo").length;
    const disponibles = vehiculos.filter((v) => v.estado === "disponible").length;

    // Ingresos últimos 6 meses
    const serie = Array.from({ length: 6 }).map((_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      const total = contratos
        .filter((c) => {
          const cd = new Date(c.createdAt ?? 0);
          return cd.getMonth() === d.getMonth() && cd.getFullYear() === d.getFullYear() && c.estado !== "cancelado";
        })
        .reduce((s, c) => s + (Number(c.total) || 0), 0);
      return { mes: MESES[d.getMonth()].slice(0, 3), total };
    });

    const hoy = hoyISO();
    const devolucionesHoy = contratos.filter((c) => c.estado === "activo" && c.fechaDevolucion <= hoy);
    const entregasProximas = contratos
      .filter((c) => c.estado === "reservacion")
      .sort((a, b) => a.fechaEntrega.localeCompare(b.fechaEntrega))
      .slice(0, 5);

    return { ingresosMes, activos, disponibles, serie, devolucionesHoy, entregasProximas, mesCount: mes.length };
  }, [contratos, vehiculos]);

  if (loading) return <LoadingBlock />;

  const saludo = (() => {
    const h = new Date().getHours();
    return h < 12 ? "Buenos días" : h < 19 ? "Buenas tardes" : "Buenas noches";
  })();

  return (
    <div>
      <PageHeader
        title={`${saludo}${user?.displayName ? `, ${user.displayName.split(" ")[0]}` : ""} 👋`}
        subtitle="Este es el resumen de tu operación de renta."
        actions={
          <Link href="/contratos/nuevo" className="btn-primary">
            <Plus className="h-4 w-4" /> Nuevo contrato
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Ingresos del mes" value={money(stats.ingresosMes)} icon={<DollarSign className="h-5 w-5" />} accent="bg-brand-600" hint={`${stats.mesCount} contratos este mes`} />
        <Stat label="Rentas activas" value={stats.activos} icon={<FileText className="h-5 w-5" />} accent="bg-emerald-500" hint="Vehículos en circulación" />
        <Stat label="Autos disponibles" value={`${stats.disponibles}/${vehiculos.length}`} icon={<Car className="h-5 w-5" />} accent="bg-violet-500" hint="Listos para rentar" />
        <Stat label="Clientes" value={clientes.length} icon={<Users className="h-5 w-5" />} accent="bg-amber-500" hint="En tu cartera" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <div className="card p-6 xl:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-slate-900">Ingresos</h2>
              <p className="text-xs text-slate-500">Últimos 6 meses</p>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.serie} margin={{ left: -10, right: 10 }}>
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0b6bcb" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#0b6bcb" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" vertical={false} />
                <XAxis dataKey="mes" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "#64748b" }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "#64748b" }} tickFormatter={(v) => `$${Number(v) / 1000}k`} />
                <Tooltip formatter={(v) => money(Number(v))} contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0" }} />
                <Area type="monotone" dataKey="total" stroke="#0b6bcb" strokeWidth={3} fill="url(#g1)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-6">
          <div className="mb-4 flex items-center gap-2">
            <CalendarClock className="h-5 w-5 text-brand-600" />
            <h2 className="font-bold text-slate-900">Agenda</h2>
          </div>
          <p className="mb-2 text-[11px] font-bold tracking-wider text-rose-500 uppercase">Devoluciones pendientes</p>
          {stats.devolucionesHoy.length === 0 ? (
            <p className="mb-4 text-sm text-slate-400">Sin devoluciones vencidas.</p>
          ) : (
            <ul className="mb-4 space-y-2">
              {stats.devolucionesHoy.map((c) => (
                <li key={c.id}>
                  <Link href={`/contratos/${c.id}`} className="flex items-center justify-between rounded-xl bg-rose-50 px-3 py-2 text-sm hover:bg-rose-100">
                    <span className="font-semibold text-slate-800">#{c.folio} · {c.cliente.nombre}</span>
                    <span className="text-xs text-rose-600">{fechaCorta(c.fechaDevolucion)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <p className="mb-2 text-[11px] font-bold tracking-wider text-amber-600 uppercase">Próximas entregas</p>
          {stats.entregasProximas.length === 0 ? (
            <p className="text-sm text-slate-400">No hay reservaciones pendientes.</p>
          ) : (
            <ul className="space-y-2">
              {stats.entregasProximas.map((c) => (
                <li key={c.id}>
                  <Link href={`/contratos/${c.id}`} className="flex items-center justify-between rounded-xl bg-amber-50 px-3 py-2 text-sm hover:bg-amber-100">
                    <span className="font-semibold text-slate-800">#{c.folio} · {c.cliente.nombre}</span>
                    <span className="text-xs text-amber-700">{fechaCorta(c.fechaEntrega)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="card mt-6 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4">
          <h2 className="font-bold text-slate-900">Contratos recientes</h2>
          <Link href="/contratos" className="flex items-center gap-1 text-sm font-semibold text-brand-600 hover:underline">
            Ver todos <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-[11px] font-bold tracking-wider text-slate-500 uppercase">
              <tr>
                <th className="px-4 py-3 sm:px-6">Folio</th>
                <th className="px-4 py-3 sm:px-6">Cliente</th>
                <th className="hidden px-6 py-3 md:table-cell">Vehículo</th>
                <th className="hidden px-6 py-3 lg:table-cell">Periodo</th>
                <th className="hidden px-6 py-3 sm:table-cell">Estado</th>
                <th className="px-4 py-3 text-right sm:px-6">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {contratos.slice(0, 6).map((c) => (
                <tr key={c.id} className="transition hover:bg-slate-50/70">
                  <td className="px-4 py-3.5 sm:px-6">
                    <Link href={`/contratos/${c.id}`} className="font-bold text-brand-600 hover:underline">
                      #{c.folio}
                    </Link>
                  </td>
                  <td className="max-w-[160px] truncate px-4 py-3.5 font-semibold text-slate-800 sm:max-w-none sm:px-6">{c.cliente.nombre}</td>
                  <td className="hidden px-6 py-3.5 text-slate-600 md:table-cell">{c.vehiculo.categoria} {c.vehiculo.placas && `· ${c.vehiculo.placas}`}</td>
                  <td className="hidden px-6 py-3.5 text-slate-600 lg:table-cell">
                    {fechaCorta(c.fechaEntrega)} → {fechaCorta(c.fechaDevolucion)}
                  </td>
                  <td className="hidden px-6 py-3.5 sm:table-cell">
                    <span className={cn("badge", ESTADOS_CONTRATO[c.estado].color)}>{ESTADOS_CONTRATO[c.estado].label}</span>
                  </td>
                  <td className="px-4 py-3.5 text-right font-bold whitespace-nowrap text-slate-900 sm:px-6">{money(c.total)}</td>
                </tr>
              ))}
              {contratos.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    Aún no hay contratos. ¡Crea el primero!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
