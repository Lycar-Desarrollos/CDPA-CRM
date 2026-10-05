"use client";

import { useState } from "react";
import { Building2, FileSignature, Hash, MapPin, Plus, Save, Tags, X } from "lucide-react";
import { toast } from "sonner";
import { Field, LoadingBlock, PageHeader, Section } from "@/components/ui";
import { guardarEmpresa, useEmpresa } from "@/lib/db";
import type { Empresa } from "@/lib/types";

function ListEditor({ items, onChange, placeholder }: { items: string[]; onChange: (v: string[]) => void; placeholder: string }) {
  const [nuevo, setNuevo] = useState("");
  const add = () => {
    const v = nuevo.trim().toUpperCase();
    if (!v || items.includes(v)) return;
    onChange([...items, v]);
    setNuevo("");
  };
  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-2">
        {items.map((s) => (
          <span key={s} className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 py-1 pr-1.5 pl-3 text-sm font-semibold text-brand-700 ring-1 ring-brand-100">
            {s}
            <button onClick={() => onChange(items.filter((x) => x !== s))} className="rounded-full p-0.5 hover:bg-brand-100">
              <X className="h-3.5 w-3.5" />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          className="input"
          placeholder={placeholder}
          value={nuevo}
          onChange={(e) => setNuevo(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), add())}
        />
        <button className="btn-secondary" onClick={add}>
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export default function ConfiguracionPage() {
  const { data, loading } = useEmpresa();
  if (loading) return <LoadingBlock />;
  return <ConfiguracionForm inicial={data} />;
}

function ConfiguracionForm({ inicial }: { inicial: Empresa }) {
  const [e, setE] = useState<Empresa>(inicial);
  const [saving, setSaving] = useState(false);

  const set = (k: keyof Empresa) => (ev: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setE({ ...e, [k]: ev.target.value });

  async function guardar() {
    setSaving(true);
    try {
      await guardarEmpresa({ ...e!, folioActual: Number(e!.folioActual) || 0, deduciblePct: Number(e!.deduciblePct) || 0 });
      toast.success("Configuración guardada");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Configuración"
        subtitle="Datos del arrendador que aparecen en cada contrato"
        actions={
          <button className="btn-primary" onClick={guardar} disabled={saving}>
            <Save className="h-4 w-4" /> Guardar cambios
          </button>
        }
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <Section title="Empresa / Arrendador" icon={<Building2 className="h-5 w-5" />}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nombre del arrendador" className="sm:col-span-2">
              <input className="input" value={e.arrendador} onChange={set("arrendador")} />
            </Field>
            <Field label="Nombre comercial">
              <input className="input" value={e.nombreComercial} onChange={set("nombreComercial")} />
            </Field>
            <Field label="RFC">
              <input className="input" value={e.rfc} onChange={set("rfc")} />
            </Field>
            <Field label="Dirección" className="sm:col-span-2">
              <input className="input" value={e.direccion} onChange={set("direccion")} />
            </Field>
            <Field label="Teléfonos">
              <input className="input" value={e.telefonos} onChange={set("telefonos")} />
            </Field>
            <Field label="Correo">
              <input className="input" value={e.email} onChange={set("email")} />
            </Field>
            <Field label="Color de marca" hint="Se usa en los encabezados del contrato">
              <div className="flex gap-2">
                <input type="color" className="h-[42px] w-14 cursor-pointer rounded-xl border border-slate-200" value={e.colorMarca} onChange={set("colorMarca")} />
                <input className="input font-mono" value={e.colorMarca} onChange={set("colorMarca")} />
              </div>
            </Field>
          </div>
        </Section>

        <Section title="Folios y seguro" icon={<Hash className="h-5 w-5" />}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Último folio emitido" hint={`El siguiente contrato será el #${Number(e.folioActual) + 1}`}>
              <input className="input font-mono" type="number" value={e.folioActual} onChange={set("folioActual")} />
            </Field>
            <Field label="% Deducible por defecto">
              <input className="input" type="number" value={e.deduciblePct} onChange={set("deduciblePct")} />
            </Field>
            <Field label="Aviso de cobertura de seguro" className="sm:col-span-2">
              <textarea className="input min-h-24" value={e.avisoSeguro} onChange={set("avisoSeguro")} />
            </Field>
          </div>
        </Section>

        <Section title="Sucursales" icon={<MapPin className="h-5 w-5" />} description="Lugares de entrega y devolución">
          <ListEditor items={e.sucursales} onChange={(v) => setE({ ...e, sucursales: v })} placeholder="Ej. MERIDA APTO" />
        </Section>

        <Section title="Categorías de vehículo" icon={<Tags className="h-5 w-5" />}>
          <ListEditor items={e.categorias} onChange={(v) => setE({ ...e, categorias: v })} placeholder="Ej. SEDAN STD" />
        </Section>

        <div className="lg:col-span-2">
          <Section title="Cláusulas del contrato" icon={<FileSignature className="h-5 w-5" />} description="Cada línea se imprime como un párrafo">
            <textarea className="input min-h-44 leading-relaxed" value={e.clausulas} onChange={set("clausulas")} />
          </Section>
        </div>
      </div>
    </div>
  );
}
