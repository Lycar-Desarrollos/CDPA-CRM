"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Eye, FileText, Plus, Printer, Search } from "lucide-react";
import { EmptyState, LoadingBlock, PageHeader } from "@/components/ui";
import { useContratos } from "@/lib/db";
import { ESTADOS_CONTRATO, type EstadoContrato } from "@/lib/types";
import { cn, fechaCorta, money } from "@/lib/utils";

export default function ContratosPage() {
  const { data: contratos, loading, error } = useContratos();
  const [q, setQ] = useState("");
  const [estado, setEstado] = useState<EstadoContrato | "todos">("todos");

  const filtrados = useMemo(() => {
    const s = q.toLowerCase().trim();
    return contratos.filter(
      (c) =>
        (estado === "todos" || c.estado === estado) &&
        (!s ||
          String(c.folio).includes(s) ||
          [c.cliente?.nombre, c.vehiculo?.placas, c.vehiculo?.categoria, c.cliente?.telefono].some((v) =>
            v?.toLowerCase().includes(s),
          )),
    );
  }, [contratos, q, estado]);

  const total = filtrados.filter((c) => c.estado !== "cancelado").reduce((s, c) => s + (Number(c.total) || 0), 0);

  return (
    <div>
      <PageHeader
        title="Contratos"
        subtitle={`${filtrados.length} contratos · ${money(total)}`}
        actions={
          <Link href="/contratos/nuevo" className="btn-primary">
            <Plus className="h-4 w-4" /> Nuevo contrato
          </Link>
        }
      />

      <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          {(["todos", ...Object.keys(ESTADOS_CONTRATO)] as (EstadoContrato | "todos")[]).map((e) => (
            <button
              key={e}
              onClick={() => setEstado(e)}
              className={cn(
                "rounded-full px-4 py-1.5 text-sm font-semibold transition",
                estado === e ? "bg-slate-900 text-white shadow" : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50",
              )}
            >
              {e === "todos" ? "Todos" : ESTADOS_CONTRATO[e].label}
              <span className="ml-1.5 opacity-60">
                {e === "todos" ? contratos.length : contratos.filter((c) => c.estado === e).length}
              </span>
            </button>
          ))}
        </div>
        <div className="relative w-full max-w-sm">
          <Search className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input className="input pl-10" placeholder="Folio, cliente, placas…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-xl bg-rose-50 p-4 text-sm text-rose-700 ring-1 ring-rose-200">
          Error al leer Firestore: {error}. Verifica que la base de datos esté creada y las reglas publicadas.
        </div>
      )}

      <div className="card overflow-hidden">
        {loading ? (
          <LoadingBlock />
        ) : filtrados.length === 0 ? (
          <EmptyState
            icon={<FileText className="h-7 w-7" />}
            title="No hay contratos"
            description="Crea tu primer contrato de renta con folio automático."
            action={
              <Link href="/contratos/nuevo" className="btn-primary">
                <Plus className="h-4 w-4" /> Nuevo contrato
              </Link>
            }
          />
        ) : (
          <>
          {/* Móvil: tarjetas */}
          <ul className="divide-y divide-slate-100 md:hidden">
            {filtrados.map((c) => (
              <li key={c.id}>
                <Link href={`/contratos/${c.id}`} className="block px-4 py-4 active:bg-slate-50">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-mono font-bold text-brand-600">#{c.folio}</span>
                    <span className={cn("badge", ESTADOS_CONTRATO[c.estado]?.color)}>{ESTADOS_CONTRATO[c.estado]?.label}</span>
                  </div>
                  <div className="mt-1 truncate font-semibold text-slate-800">{c.cliente?.nombre}</div>
                  <div className="mt-0.5 flex items-center justify-between gap-3 text-xs text-slate-500">
                    <span className="truncate">
                      {c.vehiculo?.categoria} {c.vehiculo?.placas && `· ${c.vehiculo.placas}`}
                    </span>
                    <span className="shrink-0">
                      {fechaCorta(c.fechaEntrega)} → {fechaCorta(c.fechaDevolucion)}
                    </span>
                  </div>
                  <div className="mt-2 text-right text-base font-extrabold text-slate-900">{money(c.total)}</div>
                </Link>
              </li>
            ))}
          </ul>
          {/* Escritorio: tabla */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                <tr>
                  <th className="px-6 py-3">Folio</th>
                  <th className="px-6 py-3">Arrendatario</th>
                  <th className="px-6 py-3">Vehículo</th>
                  <th className="px-6 py-3">Entrega</th>
                  <th className="px-6 py-3">Devolución</th>
                  <th className="px-6 py-3">Estado</th>
                  <th className="px-6 py-3 text-right">Total</th>
                  <th className="px-6 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtrados.map((c) => (
                  <tr key={c.id} className="group transition hover:bg-slate-50/70">
                    <td className="px-6 py-4">
                      <Link href={`/contratos/${c.id}`} className="font-mono font-bold text-brand-600 hover:underline">
                        #{c.folio}
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-800">{c.cliente?.nombre}</div>
                      <div className="text-xs text-slate-400">{c.cliente?.telefono}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-700">{c.vehiculo?.categoria}</div>
                      <div className="font-mono text-xs text-slate-400">{c.vehiculo?.placas}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{fechaCorta(c.fechaEntrega)}</td>
                    <td className="px-6 py-4 text-slate-600">{fechaCorta(c.fechaDevolucion)}</td>
                    <td className="px-6 py-4">
                      <span className={cn("badge", ESTADOS_CONTRATO[c.estado]?.color)}>{ESTADOS_CONTRATO[c.estado]?.label}</span>
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-slate-900">{money(c.total)}</td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-1">
                        <Link href={`/contratos/${c.id}`} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700" title="Ver">
                          <Eye className="h-4 w-4" />
                        </Link>
                        <Link href={`/contratos/${c.id}?print=1`} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700" title="Imprimir">
                          <Printer className="h-4 w-4" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </>
        )}
      </div>
    </div>
  );
}
