"use client";

import { useMemo, useState } from "react";
import { Car, Gauge, Pencil, Plus, Search, Trash2, Users as UsersIcon } from "lucide-react";
import { toast } from "sonner";
import { ConfirmModal, EmptyState, Field, LoadingBlock, Modal, PageHeader } from "@/components/ui";
import { eliminarVehiculo, guardarVehiculo, useEmpresa, useVehiculos } from "@/lib/db";
import { ESTADOS_VEHICULO, type EstadoVehiculo, type Vehiculo } from "@/lib/types";
import { cn, money } from "@/lib/utils";

const VACIO: Partial<Vehiculo> = {
  marca: "",
  modelo: "",
  anio: String(new Date().getFullYear()),
  categoria: "SEDAN STD",
  color: "",
  placas: "",
  serie: "",
  pasajeros: 5,
  tarifaDiaria: 700,
  km: 0,
  estado: "disponible",
};

const GRADIENTES = [
  "from-sky-500 to-blue-700",
  "from-violet-500 to-indigo-700",
  "from-emerald-500 to-teal-700",
  "from-amber-500 to-orange-600",
  "from-rose-500 to-pink-700",
  "from-slate-600 to-slate-900",
];

export default function VehiculosPage() {
  const { data: vehiculos, loading } = useVehiculos();
  const { data: empresa } = useEmpresa();
  const [q, setQ] = useState("");
  const [filtro, setFiltro] = useState<EstadoVehiculo | "todos">("todos");
  const [edit, setEdit] = useState<Partial<Vehiculo> | null>(null);
  const [borrar, setBorrar] = useState<Vehiculo | null>(null);

  const filtrados = useMemo(() => {
    const s = q.toLowerCase();
    return vehiculos.filter(
      (v) =>
        (filtro === "todos" || v.estado === filtro) &&
        (!s || [v.marca, v.modelo, v.placas, v.categoria, v.color].some((x) => x?.toLowerCase().includes(s))),
    );
  }, [vehiculos, q, filtro]);

  const conteo = (e: EstadoVehiculo) => vehiculos.filter((v) => v.estado === e).length;

  async function guardar() {
    if (!edit?.marca || !edit?.placas) return toast.error("Marca y placas son obligatorias");
    try {
      await guardarVehiculo({
        ...edit,
        pasajeros: Number(edit.pasajeros) || 0,
        tarifaDiaria: Number(edit.tarifaDiaria) || 0,
        km: Number(edit.km) || 0,
      });
      toast.success(edit.id ? "Vehículo actualizado" : "Vehículo agregado a la flota");
      setEdit(null);
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  const up = (k: keyof Vehiculo, upper = true) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setEdit({ ...edit, [k]: upper ? e.target.value.toUpperCase() : e.target.value });

  return (
    <div>
      <PageHeader
        title="Flota"
        subtitle="Administra los vehículos disponibles para renta"
        actions={
          <button className="btn-primary" onClick={() => setEdit({ ...VACIO })}>
            <Plus className="h-4 w-4" /> Agregar vehículo
          </button>
        }
      />

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {(["todos", "disponible", "rentado", "mantenimiento"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFiltro(f)}
              className={cn(
                "rounded-full px-4 py-1.5 text-sm font-semibold transition",
                filtro === f ? "bg-slate-900 text-white shadow" : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50",
              )}
            >
              {f === "todos" ? `Todos (${vehiculos.length})` : `${ESTADOS_VEHICULO[f].label} (${conteo(f)})`}
            </button>
          ))}
        </div>
        <div className="relative w-full max-w-xs">
          <Search className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input className="input pl-10" placeholder="Buscar placas, modelo…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </div>

      {loading ? (
        <LoadingBlock />
      ) : filtrados.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<Car className="h-7 w-7" />}
            title="No hay vehículos"
            description="Agrega los autos de tu flota para seleccionarlos rápidamente al crear contratos."
            action={
              <button className="btn-primary" onClick={() => setEdit({ ...VACIO })}>
                <Plus className="h-4 w-4" /> Agregar vehículo
              </button>
            }
          />
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {filtrados.map((v, i) => (
            <div key={v.id} className="card animate-fade-up group overflow-hidden transition hover:-translate-y-0.5 hover:shadow-xl">
              <div className={cn("relative h-32 bg-gradient-to-br p-5 text-white", GRADIENTES[i % GRADIENTES.length])}>
                <Car className="absolute -right-4 -bottom-6 h-36 w-36 opacity-15" strokeWidth={1.2} />
                <div className="flex items-start justify-between">
                  <span className={cn("badge bg-white/90", ESTADOS_VEHICULO[v.estado].color)}>{ESTADOS_VEHICULO[v.estado].label}</span>
                  <div className="flex gap-1 transition lg:opacity-0 lg:group-hover:opacity-100">
                    <button className="rounded-lg bg-white/20 p-1.5 backdrop-blur hover:bg-white/30" onClick={() => setEdit(v)}>
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button className="rounded-lg bg-white/20 p-1.5 backdrop-blur hover:bg-rose-500" onClick={() => setBorrar(v)}>
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="absolute bottom-4 left-5">
                  <div className="text-xs font-semibold tracking-widest opacity-80">{v.categoria}</div>
                  <div className="text-xl font-extrabold">
                    {v.marca} {v.modelo}
                  </div>
                </div>
              </div>
              <div className="p-5">
                <div className="flex items-center justify-between">
                  <div className="rounded-lg border-2 border-slate-800 bg-white px-2.5 py-0.5 font-mono text-sm font-black tracking-widest">
                    {v.placas}
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-extrabold text-slate-900">{money(v.tarifaDiaria)}</div>
                    <div className="text-[11px] text-slate-400">por día</div>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="rounded-xl bg-slate-50 py-2">
                    <div className="font-bold text-slate-800">{v.anio}</div>
                    <div className="text-slate-400">Año</div>
                  </div>
                  <div className="rounded-xl bg-slate-50 py-2">
                    <div className="flex items-center justify-center gap-1 font-bold text-slate-800">
                      <UsersIcon className="h-3 w-3" /> {v.pasajeros}
                    </div>
                    <div className="text-slate-400">Pasajeros</div>
                  </div>
                  <div className="rounded-xl bg-slate-50 py-2">
                    <div className="flex items-center justify-center gap-1 font-bold text-slate-800">
                      <Gauge className="h-3 w-3" /> {Number(v.km || 0).toLocaleString("es-MX")}
                    </div>
                    <div className="text-slate-400">Km</div>
                  </div>
                </div>
                <div className="mt-3 truncate text-xs text-slate-400">
                  {v.color} · Serie {v.serie || "—"}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={!!edit}
        onClose={() => setEdit(null)}
        title={edit?.id ? "Editar vehículo" : "Nuevo vehículo"}
        footer={
          <>
            <button className="btn-secondary" onClick={() => setEdit(null)}>
              Cancelar
            </button>
            <button className="btn-primary" onClick={guardar}>
              Guardar
            </button>
          </>
        }
      >
        {edit && (
          <div className="grid gap-4 sm:grid-cols-6">
            <Field label="Marca" className="sm:col-span-2">
              <input className="input" value={edit.marca} onChange={up("marca")} placeholder="NISSAN" />
            </Field>
            <Field label="Modelo" className="sm:col-span-2">
              <input className="input" value={edit.modelo} onChange={up("modelo")} placeholder="VERSA" />
            </Field>
            <Field label="Año" className="sm:col-span-2">
              <input className="input" value={edit.anio} onChange={up("anio")} />
            </Field>
            <Field label="Categoría" className="sm:col-span-3">
              <select className="input" value={edit.categoria} onChange={up("categoria")}>
                {empresa.categorias.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </Field>
            <Field label="Color" className="sm:col-span-3">
              <input className="input" value={edit.color} onChange={up("color")} />
            </Field>
            <Field label="Placas" className="sm:col-span-2">
              <input className="input font-mono" value={edit.placas} onChange={up("placas")} />
            </Field>
            <Field label="Número de serie (VIN)" className="sm:col-span-4">
              <input className="input font-mono" value={edit.serie} onChange={up("serie")} maxLength={17} />
            </Field>
            <Field label="Pasajeros" className="sm:col-span-2">
              <input className="input" type="number" value={edit.pasajeros} onChange={up("pasajeros", false)} />
            </Field>
            <Field label="Tarifa diaria (MXN)" className="sm:col-span-2">
              <input className="input" type="number" value={edit.tarifaDiaria} onChange={up("tarifaDiaria", false)} />
            </Field>
            <Field label="Kilometraje" className="sm:col-span-2">
              <input className="input" type="number" value={edit.km} onChange={up("km", false)} />
            </Field>
            <Field label="Estado" className="sm:col-span-6">
              <div className="grid grid-cols-3 gap-2">
                {(Object.keys(ESTADOS_VEHICULO) as EstadoVehiculo[]).map((e) => (
                  <button
                    type="button"
                    key={e}
                    onClick={() => setEdit({ ...edit, estado: e })}
                    className={cn(
                      "rounded-xl border px-3 py-2.5 text-sm font-semibold transition",
                      edit.estado === e ? "border-brand-500 bg-brand-50 text-brand-700 ring-4 ring-brand-500/10" : "border-slate-200 text-slate-600 hover:bg-slate-50",
                    )}
                  >
                    {ESTADOS_VEHICULO[e].label}
                  </button>
                ))}
              </div>
            </Field>
          </div>
        )}
      </Modal>

      <ConfirmModal
        open={!!borrar}
        onClose={() => setBorrar(null)}
        title="Eliminar vehículo"
        message={`¿Eliminar ${borrar?.marca} ${borrar?.modelo} (${borrar?.placas}) de la flota?`}
        onConfirm={async () => {
          if (!borrar) return;
          await eliminarVehiculo(borrar.id);
          toast.success("Vehículo eliminado");
        }}
      />
    </div>
  );
}
