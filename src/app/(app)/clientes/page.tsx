"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { FilePlus2, IdCard, Mail, Pencil, Phone, Plus, Search, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import { PersonaFields } from "@/components/PersonaFields";
import { ConfirmModal, EmptyState, Field, LoadingBlock, Modal, PageHeader } from "@/components/ui";
import { eliminarCliente, guardarCliente, useClientes, useContratos } from "@/lib/db";
import { PERSONA_VACIA, type Cliente } from "@/lib/types";
import { fechaCorta, hoyISO, money } from "@/lib/utils";

export default function ClientesPage() {
  const { data: clientes, loading } = useClientes();
  const { data: contratos } = useContratos();
  const [q, setQ] = useState("");
  const [edit, setEdit] = useState<Partial<Cliente> | null>(null);
  const [borrar, setBorrar] = useState<Cliente | null>(null);
  const [saving, setSaving] = useState(false);

  const filtrados = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return clientes;
    return clientes.filter((c) =>
      [c.nombre, c.telefono, c.email, c.licencia, c.ciudad].some((v) => v?.toLowerCase().includes(s)),
    );
  }, [clientes, q]);

  const resumen = (id: string) => {
    const cs = contratos.filter((c) => c.clienteId === id && c.estado !== "cancelado");
    return { n: cs.length, total: cs.reduce((s, c) => s + (Number(c.total) || 0), 0) };
  };

  async function guardar() {
    if (!edit?.nombre) return toast.error("El nombre es obligatorio");
    setSaving(true);
    try {
      await guardarCliente(edit);
      toast.success(edit.id ? "Cliente actualizado" : "Cliente registrado");
      setEdit(null);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  const hoy = hoyISO();

  return (
    <div>
      <PageHeader
        title="Clientes"
        subtitle={`${clientes.length} clientes registrados`}
        actions={
          <button className="btn-primary" onClick={() => setEdit({ ...PERSONA_VACIA, notas: "" })}>
            <Plus className="h-4 w-4" /> Nuevo cliente
          </button>
        }
      />

      <div className="relative mb-6 max-w-md">
        <Search className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input className="input pl-10" placeholder="Buscar por nombre, teléfono, licencia…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      {loading ? (
        <LoadingBlock />
      ) : filtrados.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<Users className="h-7 w-7" />}
            title={q ? "Sin resultados" : "Aún no tienes clientes"}
            description="Los clientes también se guardan automáticamente al crear un contrato."
            action={
              !q && (
                <button className="btn-primary" onClick={() => setEdit({ ...PERSONA_VACIA })}>
                  <Plus className="h-4 w-4" /> Registrar cliente
                </button>
              )
            }
          />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtrados.map((c) => {
            const r = resumen(c.id);
            const vencida = c.licenciaVence && c.licenciaVence < hoy;
            return (
              <div key={c.id} className="card animate-fade-up group p-5 transition hover:-translate-y-0.5 hover:shadow-xl">
                <div className="flex items-start gap-3">
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-sm font-bold text-white">
                    {c.nombre
                      .split(" ")
                      .slice(0, 2)
                      .map((p) => p[0])
                      .join("")}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-bold text-slate-900">{c.nombre}</h3>
                    <p className="truncate text-xs text-slate-500">{[c.ciudad, c.cp].filter(Boolean).join(" · ") || "Sin dirección"}</p>
                  </div>
                  <div className="flex transition lg:opacity-0 lg:group-hover:opacity-100">
                    <button className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700" onClick={() => setEdit(c)}>
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600" onClick={() => setBorrar(c)}>
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="mt-4 space-y-1.5 text-sm text-slate-600">
                  {c.telefono && (
                    <p className="flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5 text-slate-400" /> {c.telefono}
                    </p>
                  )}
                  {c.email && (
                    <p className="flex items-center gap-2 truncate">
                      <Mail className="h-3.5 w-3.5 text-slate-400" /> {c.email}
                    </p>
                  )}
                  {c.licencia && (
                    <p className="flex items-center gap-2">
                      <IdCard className="h-3.5 w-3.5 text-slate-400" /> {c.licencia}
                      {c.licenciaVence && (
                        <span className={vencida ? "font-semibold text-rose-600" : "text-slate-400"}>
                          · vence {fechaCorta(c.licenciaVence)}
                        </span>
                      )}
                    </p>
                  )}
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
                  <div className="text-xs text-slate-500">
                    <b className="text-slate-900">{r.n}</b> rentas · <b className="text-slate-900">{money(r.total)}</b>
                  </div>
                  <Link href={`/contratos/nuevo?cliente=${c.id}`} className="flex items-center gap-1 text-xs font-semibold text-brand-600 hover:underline">
                    <FilePlus2 className="h-3.5 w-3.5" /> Contrato
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal
        open={!!edit}
        onClose={() => setEdit(null)}
        title={edit?.id ? "Editar cliente" : "Nuevo cliente"}
        footer={
          <>
            <button className="btn-secondary" onClick={() => setEdit(null)}>
              Cancelar
            </button>
            <button className="btn-primary" onClick={guardar} disabled={saving}>
              Guardar
            </button>
          </>
        }
      >
        {edit && (
          <div className="space-y-4">
            <PersonaFields value={{ ...PERSONA_VACIA, ...edit }} onChange={(p) => setEdit({ ...edit, ...p })} required />
            <Field label="Notas internas">
              <textarea className="input min-h-20" value={edit.notas ?? ""} onChange={(e) => setEdit({ ...edit, notas: e.target.value })} />
            </Field>
          </div>
        )}
      </Modal>

      <ConfirmModal
        open={!!borrar}
        onClose={() => setBorrar(null)}
        title="Eliminar cliente"
        message={`¿Eliminar a ${borrar?.nombre}? Sus contratos existentes no se borrarán.`}
        onConfirm={async () => {
          if (!borrar) return;
          await eliminarCliente(borrar.id);
          toast.success("Cliente eliminado");
        }}
      />
    </div>
  );
}
