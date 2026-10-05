"use client";

import Link from "next/link";
import { Suspense, useEffect, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  KeyRound,
  MessageCircle,
  Pencil,
  Printer,
  Trash2,
  Undo2,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { ContractDocument } from "@/components/ContractDocument";
import { FitToWidth } from "@/components/FitToWidth";
import { FuelGauge } from "@/components/inspection";
import { ConfirmModal, Field, LoadingBlock, Modal } from "@/components/ui";
import { actualizarContrato, actualizarEstadoVehiculo, eliminarContrato, useContrato, useEmpresa } from "@/lib/db";
import { ESTADOS_CONTRATO, type EstadoContrato } from "@/lib/types";
import { cn, fechaCorta, hora12, money } from "@/lib/utils";

function Detalle() {
  const { id } = useParams<{ id: string }>();
  const params = useSearchParams();
  const router = useRouter();
  const { data: c, loading } = useContrato(id);
  const { data: empresa } = useEmpresa();
  const [recibir, setRecibir] = useState(false);
  const [regreso, setRegreso] = useState({ gasolina: 8, km: "" });
  const [borrar, setBorrar] = useState(false);
  const [cancelar, setCancelar] = useState(false);
  const printed = useRef(false);

  useEffect(() => {
    if (c && params.get("print") && !printed.current) {
      printed.current = true;
      setTimeout(() => window.print(), 600);
    }
  }, [c, params]);

  if (loading) return <LoadingBlock />;
  if (!c)
    return (
      <div className="card p-10 text-center">
        <p className="text-slate-500">Contrato no encontrado.</p>
        <Link href="/contratos" className="btn-secondary mt-4">
          Volver
        </Link>
      </div>
    );

  async function cambiarEstado(estado: EstadoContrato, extra: Record<string, unknown> = {}) {
    try {
      await actualizarContrato(c!.id, { estado, ...extra });
      if (estado === "activo") await actualizarEstadoVehiculo(c!.vehiculoId, "rentado");
      if (estado === "finalizado" || estado === "cancelado")
        await actualizarEstadoVehiculo(c!.vehiculoId, "disponible", Number((extra.regreso as { km?: string })?.km));
      toast.success(`Contrato marcado como ${ESTADOS_CONTRATO[estado].label.toLowerCase()}`);
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  const whatsapp = () => {
    const tel = (c.cliente.telefono || "").replace(/\D/g, "");
    const msg = encodeURIComponent(
      `Hola ${c.cliente.nombre}, le saluda ${empresa.nombreComercial}.\n\n` +
        `Contrato #${c.folio}\nVehículo: ${c.vehiculo.categoria} ${c.vehiculo.placas}\n` +
        `Entrega: ${fechaCorta(c.fechaEntrega)} ${hora12(c.horaEntrega)} en ${c.rentadoEn}\n` +
        `Devolución: ${fechaCorta(c.fechaDevolucion)} ${hora12(c.horaDevolucion)} en ${c.entregadoEn}\n` +
        `Total: ${money(c.total)}\n\n¡Gracias por su preferencia!`,
    );
    window.open(`https://wa.me/${tel.length === 10 ? "52" + tel : tel}?text=${msg}`, "_blank");
  };

  const est = ESTADOS_CONTRATO[c.estado];

  return (
    <div>
      {/* Encabezado */}
      <div className="no-print mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-center gap-3 sm:gap-4">
          <button onClick={() => router.push("/contratos")} className="btn-secondary h-11 w-11 shrink-0 p-0">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <h1 className="text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl">Contrato #{c.folio}</h1>
              <span className={cn("badge", est.color)}>{est.label}</span>
            </div>
            <p className="truncate text-sm text-slate-500">
              {c.cliente.nombre} · {fechaCorta(c.fechaEntrega)} → {fechaCorta(c.fechaDevolucion)} · {money(c.total)}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="btn-primary" onClick={() => window.print()}>
            <Printer className="h-4 w-4" /> Imprimir / PDF
          </button>
          {c.cliente.telefono && (
            <button className="btn-secondary" onClick={whatsapp}>
              <MessageCircle className="h-4 w-4 text-emerald-600" /> WhatsApp
            </button>
          )}
          <Link href={`/contratos/${c.id}/editar`} className="btn-secondary">
            <Pencil className="h-4 w-4" /> Editar
          </Link>
        </div>
      </div>

      <div className="grid gap-6 2xl:grid-cols-[1fr_320px]">
        {/* Documento */}
        <div className="min-w-0 rounded-3xl bg-slate-200/60 p-2 sm:p-6 lg:p-8 print:bg-transparent print:p-0">
          <FitToWidth>
            <ContractDocument c={c} empresa={empresa} />
          </FitToWidth>
        </div>

        {/* Acciones */}
        <aside className="no-print space-y-4 2xl:sticky 2xl:top-8 2xl:self-start">
          <div className="card p-5">
            <h3 className="mb-4 text-sm font-bold tracking-wide text-slate-500 uppercase">Flujo de la renta</h3>
            <ol className="relative space-y-4 border-l-2 border-slate-100 pl-5">
              {(["reservacion", "activo", "finalizado"] as const).map((e) => {
                const orden = ["reservacion", "activo", "finalizado"];
                const done = c.estado !== "cancelado" && orden.indexOf(c.estado) >= orden.indexOf(e);
                return (
                  <li key={e} className="relative">
                    <span
                      className={cn(
                        "absolute top-0.5 -left-[27px] grid h-4 w-4 place-items-center rounded-full ring-4 ring-white",
                        done ? "bg-emerald-500" : "bg-slate-200",
                      )}
                    />
                    <div className={cn("text-sm font-semibold", done ? "text-slate-900" : "text-slate-400")}>
                      {ESTADOS_CONTRATO[e].label}
                    </div>
                  </li>
                );
              })}
            </ol>

            <div className="mt-5 space-y-2">
              {c.estado === "reservacion" && (
                <button className="btn-primary w-full" onClick={() => cambiarEstado("activo")}>
                  <KeyRound className="h-4 w-4" /> Entregar vehículo
                </button>
              )}
              {c.estado === "activo" && (
                <button
                  className="btn-primary w-full bg-emerald-600 shadow-emerald-600/25 hover:bg-emerald-700"
                  onClick={() => {
                    setRegreso({ gasolina: c.regreso?.gasolina ?? 8, km: c.regreso?.km || "" });
                    setRecibir(true);
                  }}
                >
                  <CheckCircle2 className="h-4 w-4" /> Recibir vehículo
                </button>
              )}
              {(c.estado === "finalizado" || c.estado === "cancelado") && (
                <button className="btn-secondary w-full" onClick={() => cambiarEstado("activo")}>
                  <Undo2 className="h-4 w-4" /> Reabrir contrato
                </button>
              )}
              {(c.estado === "reservacion" || c.estado === "activo") && (
                <button className="btn-ghost w-full text-rose-600 hover:bg-rose-50" onClick={() => setCancelar(true)}>
                  <XCircle className="h-4 w-4" /> Cancelar contrato
                </button>
              )}
            </div>
          </div>

          <div className="card space-y-3 p-5 text-sm">
            <h3 className="text-sm font-bold tracking-wide text-slate-500 uppercase">Resumen</h3>
            <div className="flex justify-between">
              <span className="text-slate-500">Vehículo</span>
              <span className="font-semibold">{c.vehiculo.categoria}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Placas</span>
              <span className="font-mono font-semibold">{c.vehiculo.placas || "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Días</span>
              <span className="font-semibold">{c.dias}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Forma de pago</span>
              <span className="font-semibold">{c.formaPago}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Firma</span>
              <span className={cn("font-semibold", c.firmaCliente ? "text-emerald-600" : "text-amber-600")}>
                {c.firmaCliente ? "Firmado" : "Pendiente"}
              </span>
            </div>
            <div className="flex items-end justify-between border-t border-slate-100 pt-3">
              <span className="text-slate-500">Total</span>
              <span className="text-2xl font-extrabold text-slate-900">{money(c.total)}</span>
            </div>
            {c.createdBy && <p className="pt-1 text-xs text-slate-400">Creado por {c.createdBy}</p>}
          </div>

          <button className="btn-ghost w-full text-slate-400 hover:bg-rose-50 hover:text-rose-600" onClick={() => setBorrar(true)}>
            <Trash2 className="h-4 w-4" /> Eliminar contrato
          </button>
        </aside>
      </div>

      <Modal
        open={recibir}
        onClose={() => setRecibir(false)}
        title="Recibir vehículo"
        size="md"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setRecibir(false)}>
              Cancelar
            </button>
            <button
              className="btn-primary"
              onClick={async () => {
                await cambiarEstado("finalizado", { regreso });
                setRecibir(false);
              }}
            >
              <CheckCircle2 className="h-4 w-4" /> Finalizar renta
            </button>
          </>
        }
      >
        <p className="mb-4 text-sm text-slate-500">Registra el nivel de gasolina y kilometraje con que regresa el vehículo.</p>
        <FuelGauge value={regreso.gasolina} onChange={(g) => setRegreso({ ...regreso, gasolina: g })} size={220} />
        <Field label="Kilometraje de regreso" className="mt-5">
          <input
            className="input font-mono"
            inputMode="numeric"
            value={regreso.km}
            onChange={(e) => setRegreso({ ...regreso, km: e.target.value.replace(/\D/g, "") })}
            placeholder={c.salida?.km ? `Salida: ${c.salida.km}` : ""}
          />
        </Field>
        {c.salida?.km && regreso.km && Number(regreso.km) >= Number(c.salida.km) && (
          <p className="mt-2 text-sm text-slate-500">
            Recorrido: <b>{(Number(regreso.km) - Number(c.salida.km)).toLocaleString("es-MX")} km</b>
          </p>
        )}
      </Modal>

      <ConfirmModal
        open={cancelar}
        onClose={() => setCancelar(false)}
        title="Cancelar contrato"
        message="El contrato quedará como cancelado y el vehículo volverá a estar disponible."
        confirmText="Cancelar contrato"
        onConfirm={() => cambiarEstado("cancelado")}
      />
      <ConfirmModal
        open={borrar}
        onClose={() => setBorrar(false)}
        title="Eliminar contrato"
        message={`Se eliminará permanentemente el contrato #${c.folio}. Esta acción no se puede deshacer.`}
        onConfirm={async () => {
          await eliminarContrato(c.id);
          if (c.estado === "activo") await actualizarEstadoVehiculo(c.vehiculoId, "disponible");
          toast.success("Contrato eliminado");
          router.push("/contratos");
        }}
      />
    </div>
  );
}

export default function ContratoPage() {
  return (
    <Suspense fallback={<LoadingBlock />}>
      <Detalle />
    </Suspense>
  );
}
