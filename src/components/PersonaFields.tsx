"use client";

import type { Persona } from "@/lib/types";
import { Field } from "./ui";

export function PersonaFields({
  value,
  onChange,
  required = false,
  showEmail = true,
}: {
  value: Persona;
  onChange: (p: Persona) => void;
  required?: boolean;
  showEmail?: boolean;
}) {
  const set = (k: keyof Persona) => (e: React.ChangeEvent<HTMLInputElement>) =>
    onChange({ ...value, [k]: e.target.type === "date" ? e.target.value : e.target.value.toUpperCase() });

  return (
    <div className="grid gap-4 sm:grid-cols-6">
      <Field label="Nombre / Name" className="sm:col-span-6">
        <input className="input" required={required} value={value.nombre} onChange={set("nombre")} placeholder="APELLIDOS NOMBRE(S)" />
      </Field>
      <Field label="Dirección / Address" className="sm:col-span-4">
        <input className="input" value={value.direccion} onChange={set("direccion")} />
      </Field>
      <Field label="Colonia" className="sm:col-span-2">
        <input className="input" value={value.colonia} onChange={set("colonia")} />
      </Field>
      <Field label="Ciudad / City" className="sm:col-span-3">
        <input className="input" value={value.ciudad} onChange={set("ciudad")} />
      </Field>
      <Field label="C.P." className="sm:col-span-1">
        <input className="input" value={value.cp} onChange={set("cp")} inputMode="numeric" />
      </Field>
      <Field label="Teléfono / Phone" className="sm:col-span-2">
        <input className="input" value={value.telefono} onChange={set("telefono")} inputMode="tel" />
      </Field>
      {showEmail && (
        <Field label="Correo electrónico" className="sm:col-span-6">
          <input
            className="input"
            type="email"
            value={value.email}
            onChange={(e) => onChange({ ...value, email: e.target.value.toLowerCase() })}
          />
        </Field>
      )}
      <Field label="Licencia N° / License" className="sm:col-span-2">
        <input className="input" value={value.licencia} onChange={set("licencia")} />
      </Field>
      <Field label="Vencimiento / Exp" className="sm:col-span-2">
        <input className="input" type="date" value={value.licenciaVence} onChange={set("licenciaVence")} />
      </Field>
      <Field label="Lugar de expedición" className="sm:col-span-2">
        <input className="input" value={value.licenciaLugar} onChange={set("licenciaLugar")} />
      </Field>
    </div>
  );
}
