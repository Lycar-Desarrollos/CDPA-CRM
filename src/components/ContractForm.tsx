"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Car,
  Check,
  ClipboardCheck,
  CreditCard,
  PenLine,
  Search,
  User,
  UserPlus,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { DamageMap, FuelGauge, SignaturePad } from "./inspection";
import { PersonaFields } from "./PersonaFields";
import { Field, Section, Spinner } from "./ui";
import {
  actualizarContrato,
  actualizarEstadoVehiculo,
  crearContrato,
  guardarCliente,
  useClientes,
  useEmpresa,
  useVehiculos,
} from "@/lib/db";
import {
  ESTADOS_VEHICULO,
  FORMAS_PAGO,
  PERSONA_VACIA,
  VEHICULO_SNAPSHOT_VACIO,
  type Contrato,
  type Vehiculo,
  type VehiculoSnapshot,
} from "@/lib/types";
import { cn, diasEntre, fechaCorta, hoyISO, money, sumarDias } from "@/lib/utils";

type Draft = Omit<Contrato, "id" | "folio"> & { id?: string; folio?: number };

export function contratoVacio(): Draft {
  const hoy = hoyISO();
  return {
    estado: "activo",
    clienteId: null,
    cliente: { ...PERSONA_VACIA },
    hospedaje: "",
    fechaVuelo: "",
    aerolinea: "",
    segundoConductor: { ...PERSONA_VACIA },
    tarjetaTitular: "",
    tarjetaNumero: "",
    vehiculoId: null,
    vehiculo: { ...VEHICULO_SNAPSHOT_VACIO },
    tarifaDiaria: 700,
    dias: 1,
    coberturaTotal: 0,
    cargosAdicionales: 0,
    deduciblePct: 10,
    tipoSeguro: "SEGURO BÁSICO",
    deposito: 0,
    subtotal: 700,
    total: 700,
    fechaEntrega: hoy,
    horaEntrega: "10:00",
    fechaDevolucion: sumarDias(hoy, 1),
    horaDevolucion: "10:00",
    rentadoEn: "",
    entregadoEn: "",
    hayCambio: false,
    cambio: { ...VEHICULO_SNAPSHOT_VACIO },
    formaPago: "EFECTIVO",
    salida: { gasolina: 8, km: "" },
    regreso: { gasolina: 8, km: "" },
    danos: [],
    relevo: "",
    firmaCliente: "",
    notas: "",
  };
}

const PASOS = [
  { t: "Arrendatario", d: "Datos del cliente", icon: User },
  { t: "Vehículo", d: "Auto, fechas y sucursal", icon: Car },
  { t: "Tarifas y pago", d: "Cargos y garantía", icon: CreditCard },
  { t: "Inspección", d: "Daños, gasolina y km", icon: ClipboardCheck },
  { t: "Firma", d: "Confirmación final", icon: PenLine },
];

function snapshotDe(v: Vehiculo): VehiculoSnapshot {
  return {
    descripcion: `${v.marca} ${v.modelo} ${v.anio}`.trim(),
    categoria: v.categoria,
    color: v.color,
    placas: v.placas,
    serie: v.serie,
    pasajeros: v.pasajeros,
  };
}

/* ---------- Selector de vehículo ---------- */
function VehiculoPicker({
  vehiculos,
  selectedId,
  onPick,
}: {
  vehiculos: Vehiculo[];
  selectedId: string | null;
  onPick: (v: Vehiculo) => void;
}) {
  const [q, setQ] = useState("");
  const list = vehiculos.filter((v) =>
    [v.marca, v.modelo, v.placas, v.categoria].join(" ").toLowerCase().includes(q.toLowerCase()),
  );
  if (vehiculos.length === 0)
    return (
      <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
        No hay vehículos en la flota. Puedes capturar los datos manualmente abajo o agregarlos en <b>Flota</b>.
      </p>
    );
  return (
    <div>
      <div className="relative mb-3">
        <Search className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input className="input pl-10" placeholder="Buscar en la flota…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <div className="grid max-h-72 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
        {list.map((v) => {
          const sel = v.id === selectedId;
          const disponible = v.estado === "disponible" || sel;
          return (
            <button
              type="button"
              key={v.id}
              onClick={() => onPick(v)}
              className={cn(
                "flex items-center gap-3 rounded-xl border p-3 text-left transition",
                sel ? "border-brand-500 bg-brand-50 ring-4 ring-brand-500/10" : "border-slate-200 hover:border-slate-300 hover:bg-slate-50",
                !disponible && "opacity-60",
              )}
            >
              <div className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-lg", sel ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-500")}>
                {sel ? <Check className="h-5 w-5" /> : <Car className="h-5 w-5" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-bold text-slate-900">
                  {v.marca} {v.modelo}
                </div>
                <div className="truncate text-xs text-slate-500">
                  {v.placas} · {v.categoria} · {money(v.tarifaDiaria)}/día
                </div>
              </div>
              <span className={cn("badge", ESTADOS_VEHICULO[v.estado].color)}>{ESTADOS_VEHICULO[v.estado].label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SnapshotFields({
  value,
  onChange,
  categorias,
}: {
  value: VehiculoSnapshot;
  onChange: (v: VehiculoSnapshot) => void;
  categorias: string[];
}) {
  const set = (k: keyof VehiculoSnapshot) => (e: React.ChangeEvent<HTMLInputElement>) =>
    onChange({ ...value, [k]: e.target.value.toUpperCase() });
  return (
    <div className="grid gap-4 sm:grid-cols-6">
      <Field label="Vehículo / Categoría" className="sm:col-span-3">
        <input className="input" list="categorias" value={value.categoria} onChange={set("categoria")} />
        <datalist id="categorias">
          {categorias.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
      </Field>
      <Field label="Marca / Modelo / Año" className="sm:col-span-3">
        <input className="input" value={value.descripcion} onChange={set("descripcion")} />
      </Field>
      <Field label="Color" className="sm:col-span-2">
        <input className="input" value={value.color} onChange={set("color")} />
      </Field>
      <Field label="Placas / License plate" className="sm:col-span-2">
        <input className="input font-mono" value={value.placas} onChange={set("placas")} />
      </Field>
      <Field label="Pasajeros" className="sm:col-span-2">
        <input className="input" value={value.pasajeros} onChange={set("pasajeros")} />
      </Field>
      <Field label="Serie" className="sm:col-span-6">
        <input className="input font-mono" value={value.serie} onChange={set("serie")} />
      </Field>
    </div>
  );
}

/* ================= Formulario principal ================= */
export function ContractForm({ initial, clientePreseleccionado }: { initial?: Draft; clientePreseleccionado?: string | null }) {
  const router = useRouter();
  const { data: clientes } = useClientes();
  const { data: vehiculos } = useVehiculos();
  const { data: empresa, loading: loadingEmpresa } = useEmpresa();
  const editando = !!initial?.id;

  const [c, setC] = useState<Draft>(initial ?? contratoVacio());
  const [paso, setPaso] = useState(0);
  const [saving, setSaving] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [showSegundo, setShowSegundo] = useState(!!initial?.segundoConductor?.nombre);
  const aplicadoDefaults = useRef(editando);

  // Valores por defecto de la empresa (sucursal / deducible)
  useEffect(() => {
    if (loadingEmpresa || aplicadoDefaults.current) return;
    aplicadoDefaults.current = true;
    setC((p) => ({
      ...p,
      deduciblePct: empresa.deduciblePct,
      rentadoEn: p.rentadoEn || empresa.sucursales[0] || "",
      entregadoEn: p.entregadoEn || empresa.sucursales[0] || "",
    }));
  }, [loadingEmpresa, empresa]);

  // Cliente preseleccionado (?cliente=)
  useEffect(() => {
    if (!clientePreseleccionado || c.clienteId) return;
    const cl = clientes.find((x) => x.id === clientePreseleccionado);
    if (cl) seleccionarCliente(cl.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientePreseleccionado, clientes]);

  // Recalcular importes
  const subtotal = (Number(c.tarifaDiaria) || 0) * (Number(c.dias) || 0);
  const total = subtotal + (Number(c.coberturaTotal) || 0) + (Number(c.cargosAdicionales) || 0);

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setC((p) => ({ ...p, [k]: v }));

  function seleccionarCliente(id: string) {
    const cl = clientes.find((x) => x.id === id);
    if (!cl) return;
    const persona = { ...PERSONA_VACIA };
    (Object.keys(PERSONA_VACIA) as (keyof typeof PERSONA_VACIA)[]).forEach((k) => {
      persona[k] = (cl[k] as string) ?? "";
    });
    setC((p) => ({
      ...p,
      clienteId: cl.id,
      cliente: persona,
      tarjetaTitular: p.tarjetaTitular || cl.nombre,
    }));
    setBusqueda("");
  }

  function cambiarFechas(k: "fechaEntrega" | "fechaDevolucion", v: string) {
    setC((p) => {
      const n = { ...p, [k]: v };
      n.dias = diasEntre(n.fechaEntrega, n.fechaDevolucion);
      return n;
    });
  }

  const sugerencias = useMemo(() => {
    const s = busqueda.toLowerCase().trim();
    if (!s) return [];
    return clientes
      .filter((x) => [x.nombre, x.telefono, x.licencia, x.email].some((v) => v?.toLowerCase().includes(s)))
      .slice(0, 6);
  }, [busqueda, clientes]);

  function validar(p: number): string | null {
    if (p === 0 && !c.cliente.nombre.trim()) return "Captura el nombre del arrendatario";
    if (p === 1) {
      if (!c.vehiculo.categoria && !c.vehiculo.descripcion) return "Selecciona o captura el vehículo";
      if (!c.fechaEntrega || !c.fechaDevolucion) return "Indica las fechas de entrega y devolución";
      if (c.fechaDevolucion < c.fechaEntrega) return "La devolución no puede ser antes de la entrega";
    }
    return null;
  }

  function siguiente() {
    const err = validar(paso);
    if (err) return toast.error(err);
    setPaso((p) => Math.min(p + 1, PASOS.length - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function guardar() {
    for (let i = 0; i < PASOS.length; i++) {
      const err = validar(i);
      if (err) {
        setPaso(i);
        return toast.error(err);
      }
    }
    setSaving(true);
    try {
      // Guardar/actualizar cliente en la cartera
      const clienteId = await guardarCliente({ ...(c.clienteId ? { id: c.clienteId } : {}), ...c.cliente });
      const payload = {
        ...c,
        clienteId,
        segundoConductor: showSegundo ? c.segundoConductor : { ...PERSONA_VACIA },
        subtotal,
        total,
        tarifaDiaria: Number(c.tarifaDiaria) || 0,
        dias: Number(c.dias) || 0,
        coberturaTotal: Number(c.coberturaTotal) || 0,
        cargosAdicionales: Number(c.cargosAdicionales) || 0,
        deposito: Number(c.deposito) || 0,
        deduciblePct: Number(c.deduciblePct) || 0,
      };
      let id = c.id;
      if (editando && id) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { id: _i, folio: _f, ...rest } = payload;
        await actualizarContrato(id, rest);
        toast.success("Contrato actualizado");
      } else {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { id: _i, folio: _f, ...rest } = payload;
        const res = await crearContrato(rest);
        id = res.id;
        toast.success(`Contrato #${res.folio} creado`);
      }
      if (c.vehiculoId && c.estado === "activo") await actualizarEstadoVehiculo(c.vehiculoId, "rentado", Number(c.salida.km));
      if (initial?.vehiculoId && initial.vehiculoId !== c.vehiculoId) await actualizarEstadoVehiculo(initial.vehiculoId, "disponible");
      router.push(`/contratos/${id}`);
    } catch (e) {
      console.error(e);
      toast.error("No se pudo guardar: " + (e as Error).message);
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
      <div className="space-y-6">
        {/* Stepper */}
        <div className="card overflow-x-auto p-3">
          <ol className="flex min-w-max gap-1">
            {PASOS.map((p, i) => {
              const Icon = p.icon;
              const done = i < paso;
              const act = i === paso;
              return (
                <li key={p.t} className="flex-1">
                  <button
                    type="button"
                    onClick={() => (i <= paso || !validar(paso) ? setPaso(i) : toast.error(validar(paso)!))}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition",
                      act ? "bg-brand-50" : "hover:bg-slate-50",
                    )}
                  >
                    <span
                      className={cn(
                        "grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm font-bold transition",
                        act && "bg-brand-600 text-white shadow-lg shadow-brand-600/30",
                        done && "bg-emerald-500 text-white",
                        !act && !done && "bg-slate-100 text-slate-400",
                      )}
                    >
                      {done ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                    </span>
                    <span className="hidden md:block">
                      <span className={cn("block text-sm font-bold", act ? "text-brand-700" : "text-slate-700")}>{p.t}</span>
                      <span className="block text-[11px] text-slate-400">{p.d}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </div>

        {/* PASO 1 */}
        {paso === 0 && (
          <>
            <Section title="Arrendatario / Renter" icon={<User className="h-5 w-5" />} description="Busca un cliente existente o captura uno nuevo">
              <div className="relative mb-5">
                <Search className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  className="input pl-10"
                  placeholder="Buscar cliente registrado por nombre, teléfono o licencia…"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                />
                {sugerencias.length > 0 && (
                  <div className="absolute z-10 mt-2 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
                    {sugerencias.map((s) => (
                      <button
                        type="button"
                        key={s.id}
                        onClick={() => seleccionarCliente(s.id)}
                        className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm hover:bg-brand-50"
                      >
                        <span className="font-semibold text-slate-800">{s.nombre}</span>
                        <span className="text-xs text-slate-400">{s.telefono || s.licencia}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {c.clienteId && (
                <div className="mb-5 flex items-center justify-between rounded-xl bg-emerald-50 px-4 py-2.5 text-sm text-emerald-800 ring-1 ring-emerald-200">
                  <span>
                    Cliente vinculado: <b>{c.cliente.nombre}</b> — los cambios actualizarán su ficha.
                  </span>
                  <button
                    type="button"
                    className="rounded p-1 hover:bg-emerald-100"
                    onClick={() => setC((p) => ({ ...p, clienteId: null, cliente: { ...PERSONA_VACIA } }))}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
              <PersonaFields value={c.cliente} onChange={(v) => set("cliente", v)} required />
            </Section>

            <Section title="Estancia y vuelo" icon={<ClipboardCheck className="h-5 w-5" />}>
              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="Lugar de hospedaje / Hotel">
                  <input className="input" value={c.hospedaje} onChange={(e) => set("hospedaje", e.target.value.toUpperCase())} />
                </Field>
                <Field label="Fecha de vuelo programado">
                  <input className="input" type="date" value={c.fechaVuelo} onChange={(e) => set("fechaVuelo", e.target.value)} />
                </Field>
                <Field label="Aerolínea">
                  <input className="input" value={c.aerolinea} onChange={(e) => set("aerolinea", e.target.value.toUpperCase())} />
                </Field>
              </div>
            </Section>

            <Section
              title="Segundo conductor / Additional driver"
              icon={<UserPlus className="h-5 w-5" />}
              actions={
                <button type="button" onClick={() => setShowSegundo(!showSegundo)} className={showSegundo ? "btn-secondary" : "btn-primary"}>
                  {showSegundo ? "Quitar" : "Agregar"}
                </button>
              }
            >
              {showSegundo ? (
                <PersonaFields value={c.segundoConductor} onChange={(v) => set("segundoConductor", v)} showEmail={false} />
              ) : (
                <p className="text-sm text-slate-400">Sin conductor adicional.</p>
              )}
            </Section>
          </>
        )}

        {/* PASO 2 */}
        {paso === 1 && (
          <>
            <Section title="Vehículo / Vehicle" icon={<Car className="h-5 w-5" />} description="Selecciona un auto de tu flota">
              <VehiculoPicker
                vehiculos={vehiculos}
                selectedId={c.vehiculoId}
                onPick={(v) =>
                  setC((p) => ({
                    ...p,
                    vehiculoId: v.id,
                    vehiculo: snapshotDe(v),
                    tarifaDiaria: v.tarifaDiaria || p.tarifaDiaria,
                    salida: { ...p.salida, km: p.salida.km || String(v.km || "") },
                  }))
                }
              />
              <div className="my-5 border-t border-dashed border-slate-200" />
              <SnapshotFields value={c.vehiculo} onChange={(v) => set("vehiculo", v)} categorias={empresa.categorias} />
            </Section>

            <Section title="Fechas y sucursales" icon={<ClipboardCheck className="h-5 w-5" />}>
              <div className="grid gap-4 sm:grid-cols-4">
                <Field label="Fecha de entrega">
                  <input className="input" type="date" value={c.fechaEntrega} onChange={(e) => cambiarFechas("fechaEntrega", e.target.value)} />
                </Field>
                <Field label="Hora de entrega">
                  <input className="input" type="time" value={c.horaEntrega} onChange={(e) => set("horaEntrega", e.target.value)} />
                </Field>
                <Field label="Fecha de devolución">
                  <input className="input" type="date" value={c.fechaDevolucion} onChange={(e) => cambiarFechas("fechaDevolucion", e.target.value)} />
                </Field>
                <Field label="Hora de devolución">
                  <input className="input" type="time" value={c.horaDevolucion} onChange={(e) => set("horaDevolucion", e.target.value)} />
                </Field>
                <Field label="Vehículo rentado en" className="sm:col-span-2">
                  <input className="input" list="sucursales" value={c.rentadoEn} onChange={(e) => set("rentadoEn", e.target.value.toUpperCase())} />
                </Field>
                <Field label="Vehículo entregado en" className="sm:col-span-2">
                  <input className="input" list="sucursales" value={c.entregadoEn} onChange={(e) => set("entregadoEn", e.target.value.toUpperCase())} />
                </Field>
                <datalist id="sucursales">
                  {empresa.sucursales.map((s) => (
                    <option key={s} value={s} />
                  ))}
                </datalist>
              </div>
            </Section>

            <Section
              title="En caso de cambio de vehículo"
              icon={<Car className="h-5 w-5" />}
              actions={
                <button type="button" onClick={() => set("hayCambio", !c.hayCambio)} className={c.hayCambio ? "btn-secondary" : "btn-ghost"}>
                  {c.hayCambio ? "Quitar cambio" : "Registrar cambio"}
                </button>
              }
            >
              {c.hayCambio ? (
                <SnapshotFields value={c.cambio} onChange={(v) => set("cambio", v)} categorias={empresa.categorias} />
              ) : (
                <p className="text-sm text-slate-400">Sin cambio de vehículo.</p>
              )}
            </Section>
          </>
        )}

        {/* PASO 3 */}
        {paso === 2 && (
          <>
            <Section title="Tarifas y cargos" icon={<CreditCard className="h-5 w-5" />}>
              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="Tarifa base por día">
                  <input className="input" type="number" min={0} value={c.tarifaDiaria} onChange={(e) => set("tarifaDiaria", Number(e.target.value))} />
                </Field>
                <Field label="Total de días" hint="Se calcula con las fechas, puedes ajustarlo">
                  <input className="input" type="number" min={1} value={c.dias} onChange={(e) => set("dias", Number(e.target.value))} />
                </Field>
                <Field label="Sub-total">
                  <input className="input bg-slate-50 font-bold" readOnly value={money(subtotal)} />
                </Field>
                <Field label="Cargo por cobertura total" hint="0 = N/A">
                  <input className="input" type="number" min={0} value={c.coberturaTotal} onChange={(e) => set("coberturaTotal", Number(e.target.value))} />
                </Field>
                <Field label="Cargos adicionales" hint="0 = N/A">
                  <input className="input" type="number" min={0} value={c.cargosAdicionales} onChange={(e) => set("cargosAdicionales", Number(e.target.value))} />
                </Field>
                <Field label="Depósito en garantía">
                  <input className="input" type="number" min={0} value={c.deposito} onChange={(e) => set("deposito", Number(e.target.value))} />
                </Field>
                <Field label="% Deducible de seguro">
                  <input className="input" type="number" min={0} max={100} value={c.deduciblePct} onChange={(e) => set("deduciblePct", Number(e.target.value))} />
                </Field>
                <Field label="Tipo de seguro" className="sm:col-span-2">
                  <select className="input" value={c.tipoSeguro} onChange={(e) => set("tipoSeguro", e.target.value)}>
                    <option>SEGURO BÁSICO</option>
                    <option>COBERTURA AMPLIA</option>
                    <option>COBERTURA TOTAL</option>
                  </select>
                </Field>
              </div>
            </Section>

            <Section title="Forma de pago y garantía" icon={<CreditCard className="h-5 w-5" />}>
              <div className="mb-5 flex flex-wrap gap-2">
                {FORMAS_PAGO.map((f) => (
                  <button
                    type="button"
                    key={f}
                    onClick={() => set("formaPago", f)}
                    className={cn(
                      "rounded-xl border px-4 py-2 text-sm font-semibold transition",
                      c.formaPago === f ? "border-brand-500 bg-brand-50 text-brand-700 ring-4 ring-brand-500/10" : "border-slate-200 text-slate-600 hover:bg-slate-50",
                    )}
                  >
                    {f}
                  </button>
                ))}
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Titular de la tarjeta">
                  <input className="input" value={c.tarjetaTitular} onChange={(e) => set("tarjetaTitular", e.target.value.toUpperCase())} />
                </Field>
                <Field label="Número de tarjeta" hint="Solo se mostrarán los últimos 4 dígitos en el contrato">
                  <input
                    className="input font-mono"
                    inputMode="numeric"
                    maxLength={19}
                    value={c.tarjetaNumero}
                    onChange={(e) =>
                      set(
                        "tarjetaNumero",
                        e.target.value
                          .replace(/\D/g, "")
                          .slice(0, 16)
                          .replace(/(.{4})/g, "$1 ")
                          .trim(),
                      )
                    }
                  />
                </Field>
              </div>
            </Section>
          </>
        )}

        {/* PASO 4 */}
        {paso === 3 && (
          <>
            <Section title="Inspección de daños" icon={<ClipboardCheck className="h-5 w-5" />} description="Marca los daños visibles al momento de la entrega">
              <DamageMap danos={c.danos} onChange={(d) => set("danos", d)} />
            </Section>
            <div className="grid gap-6 md:grid-cols-2">
              <Section title="Salida" icon={<Car className="h-5 w-5" />} description="Al entregar el vehículo">
                <FuelGauge value={c.salida.gasolina} onChange={(g) => set("salida", { ...c.salida, gasolina: g })} size={200} />
                <Field label="Kilometraje de salida" className="mt-5">
                  <input className="input font-mono" inputMode="numeric" value={c.salida.km} onChange={(e) => set("salida", { ...c.salida, km: e.target.value.replace(/\D/g, "") })} />
                </Field>
              </Section>
              <Section title="Regreso" icon={<Car className="h-5 w-5" />} description="Se completa al recibir el vehículo">
                <FuelGauge value={c.regreso.gasolina} onChange={(g) => set("regreso", { ...c.regreso, gasolina: g })} size={200} />
                <Field label="Kilometraje de regreso" className="mt-5">
                  <input className="input font-mono" inputMode="numeric" value={c.regreso.km} onChange={(e) => set("regreso", { ...c.regreso, km: e.target.value.replace(/\D/g, "") })} />
                </Field>
              </Section>
            </div>
          </>
        )}

        {/* PASO 5 */}
        {paso === 4 && (
          <>
            <Section title="Relevo de responsabilidad por colisión" icon={<ClipboardCheck className="h-5 w-5" />}>
              <p className="mb-4 text-sm text-slate-600">
                Pagando el <b>{c.deduciblePct}%</b> del valor comercial en concepto de deducible. No cubre robo parcial, ni daños menores. No procede si el vehículo es manejado bajo la influencia de bebidas embriagantes y/o sustancias tóxicas.
              </p>
              <div className="grid grid-cols-2 gap-3">
                {(["acepto", "declino"] as const).map((op) => (
                  <button
                    type="button"
                    key={op}
                    onClick={() => set("relevo", op)}
                    className={cn(
                      "rounded-xl border px-4 py-3 text-sm font-bold uppercase transition",
                      c.relevo === op
                        ? op === "acepto"
                          ? "border-emerald-500 bg-emerald-50 text-emerald-700 ring-4 ring-emerald-500/10"
                          : "border-rose-500 bg-rose-50 text-rose-700 ring-4 ring-rose-500/10"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50",
                    )}
                  >
                    {op}
                  </button>
                ))}
              </div>
            </Section>
            <Section title="Firma del arrendatario" icon={<PenLine className="h-5 w-5" />} description="Puede firmar con el dedo en tablet o con el mouse">
              <SignaturePad value={c.firmaCliente} onChange={(v) => set("firmaCliente", v)} />
            </Section>
            <Section title="Estado y observaciones" icon={<ClipboardCheck className="h-5 w-5" />}>
              <div className="mb-4 grid grid-cols-2 gap-3">
                {(
                  [
                    ["reservacion", "Reservación", "El cliente aún no recoge el auto"],
                    ["activo", "Activo (entregado)", "El auto se entrega ahora"],
                  ] as const
                ).map(([k, l, d]) => (
                  <button
                    type="button"
                    key={k}
                    onClick={() => set("estado", k)}
                    className={cn(
                      "rounded-xl border p-4 text-left transition",
                      c.estado === k ? "border-brand-500 bg-brand-50 ring-4 ring-brand-500/10" : "border-slate-200 hover:bg-slate-50",
                    )}
                  >
                    <div className="text-sm font-bold text-slate-900">{l}</div>
                    <div className="text-xs text-slate-500">{d}</div>
                  </button>
                ))}
              </div>
              <Field label="Observaciones (aparecen en el contrato)">
                <textarea className="input min-h-24" value={c.notas} onChange={(e) => set("notas", e.target.value)} />
              </Field>
            </Section>
          </>
        )}

        {/* Navegación */}
        <div className="flex items-center justify-between">
          <button type="button" className="btn-secondary" disabled={paso === 0} onClick={() => setPaso(paso - 1)}>
            <ArrowLeft className="h-4 w-4" /> Anterior
          </button>
          {paso < PASOS.length - 1 ? (
            <button type="button" className="btn-primary" onClick={siguiente}>
              Siguiente <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button type="button" className="btn-primary px-6" onClick={guardar} disabled={saving}>
              {saving ? <Spinner className="h-4 w-4 border-white border-t-transparent" /> : <Check className="h-4 w-4" />}
              {editando ? "Guardar cambios" : "Generar contrato"}
            </button>
          )}
        </div>
      </div>

      {/* Resumen lateral */}
      <aside className="xl:sticky xl:top-8 xl:self-start">
        <div className="overflow-hidden rounded-3xl bg-slate-950 text-white shadow-2xl">
          <div className="relative p-6">
            <div className="absolute -top-16 -right-16 h-48 w-48 rounded-full bg-brand-600/40 blur-3xl" />
            <div className="relative">
              <div className="text-[11px] font-bold tracking-[0.2em] text-slate-400 uppercase">
                {editando ? `Contrato #${initial?.folio}` : `Folio sugerido #${(empresa.folioActual || 0) + 1}`}
              </div>
              <div className="mt-1 truncate text-lg font-bold">{c.cliente.nombre || "Nuevo arrendatario"}</div>
              <div className="mt-0.5 truncate text-sm text-slate-400">
                {c.vehiculo.categoria || "Sin vehículo"} {c.vehiculo.placas && `· ${c.vehiculo.placas}`}
              </div>
            </div>
          </div>
          <div className="space-y-2.5 border-t border-white/10 p-6 text-sm">
            <div className="flex justify-between text-slate-400">
              <span>Periodo</span>
              <span className="text-white">
                {fechaCorta(c.fechaEntrega)} → {fechaCorta(c.fechaDevolucion)}
              </span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>
                {money(c.tarifaDiaria)} × {c.dias} días
              </span>
              <span className="text-white">{money(subtotal)}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Cobertura total</span>
              <span className="text-white">{c.coberturaTotal ? money(c.coberturaTotal) : "N/A"}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Cargos adicionales</span>
              <span className="text-white">{c.cargosAdicionales ? money(c.cargosAdicionales) : "N/A"}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Depósito en garantía</span>
              <span className="text-white">{money(c.deposito)}</span>
            </div>
          </div>
          <div className="flex items-end justify-between bg-gradient-to-r from-brand-600 to-brand-500 p-6">
            <span className="text-xs font-bold tracking-[0.2em] uppercase opacity-80">Total</span>
            <span className="text-3xl font-extrabold">{money(total)}</span>
          </div>
        </div>
      </aside>
    </div>
  );
}
