import type { Contrato, Empresa } from "@/lib/types";
import { enmascararTarjeta, fechaCorta, fracGasolina, hora12, MESES, money, numeroALetras } from "@/lib/utils";
import { DamageMap, FuelGauge, Odometer } from "./inspection";

/* Celda etiqueta / valor estilo formulario */
function Row({ label, value, strong }: { label: string; value?: React.ReactNode; strong?: boolean }) {
  return (
    <div className="flex min-h-[20px] items-stretch border-b border-slate-300 last:border-b-0">
      <div className="flex w-[44%] shrink-0 items-center bg-slate-50 px-1.5 text-[7.5px] leading-tight font-bold tracking-wide text-slate-600 uppercase">
        {label}
      </div>
      <div
        className={`flex flex-1 items-center border-l border-slate-300 px-1.5 text-[9px] leading-tight uppercase ${
          strong ? "font-extrabold text-slate-900" : "font-semibold text-slate-800"
        }`}
      >
        {value || <span className="text-slate-300">—</span>}
      </div>
    </div>
  );
}

function Box({ title, children, color }: { title: string; children: React.ReactNode; color: string }) {
  return (
    <div className="overflow-hidden rounded-[5px] border border-slate-400">
      <div className="px-2 py-[3px] text-[8px] font-extrabold tracking-[0.15em] text-white uppercase" style={{ background: color }}>
        {title}
      </div>
      {children}
    </div>
  );
}

export function ContractDocument({ c, empresa }: { c: Contrato; empresa: Empresa }) {
  const color = empresa.colorMarca || "#0b6bcb";
  const fecha = c.createdAt ? new Date(c.createdAt) : new Date();
  const comercial = empresa.nombreComercial.split(" ");
  const marca = comercial[0] ?? "";
  const resto = comercial.slice(1).join(" ");

  return (
    <div
      className="print-area mx-auto bg-white text-slate-900 shadow-2xl"
      style={{ width: "8.5in", minHeight: "11in", padding: "0.3in", fontFamily: "Arial, Helvetica, sans-serif" }}
    >
      {/* ---------- Encabezado ---------- */}
      <div className="flex items-stretch gap-3">
        <div className="flex w-[150px] shrink-0 flex-col items-center justify-center rounded-md border-2 py-1.5" style={{ borderColor: color }}>
          <div className="text-[34px] leading-none font-black tracking-tight" style={{ color }}>
            {marca}
          </div>
          <div className="text-[9px] font-extrabold tracking-[0.18em]">{resto}</div>
        </div>
        <div className="flex flex-1 flex-col justify-center text-[9px] leading-snug">
          <div className="text-[13px] font-black tracking-wide">{empresa.arrendador}</div>
          <div className="font-semibold">RFC: {empresa.rfc}</div>
          <div>{empresa.direccion}</div>
          <div>
            TEL: {empresa.telefonos} · {empresa.email}
          </div>
        </div>
        <div className="flex w-[120px] shrink-0 flex-col items-center justify-center rounded-md border-2 border-slate-800">
          <div className="text-[8px] font-bold tracking-[0.2em] text-slate-500">CONTRATO / FOLIO</div>
          <div className="text-[22px] font-black text-red-600">{c.folio}</div>
          <div className="text-[8px] font-semibold text-slate-500">
            {fecha.toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" }).toUpperCase()}
          </div>
        </div>
      </div>

      <div className="mt-2 rounded-[4px] px-2 py-1 text-center text-[8.5px] font-extrabold tracking-wide text-white" style={{ background: color }}>
        {empresa.avisoSeguro}
      </div>

      {/* ---------- Cuerpo en dos columnas ---------- */}
      <div className="mt-2 grid grid-cols-2 gap-2">
        <div className="space-y-2">
          <Box title="Arrendatario / Renter" color={color}>
            <Row label="Nombre / Name" value={c.cliente.nombre} strong />
            <Row label="Dirección / Address" value={c.cliente.direccion} />
            <Row label="Colonia" value={c.cliente.colonia} />
            <Row label="Ciudad / City" value={c.cliente.ciudad} />
            <Row label="C.P." value={c.cliente.cp} />
            <Row
              label="Teléfono / Phone / Email"
              value={[c.cliente.telefono, c.cliente.email].filter(Boolean).join(" · ")}
            />
            <Row label="Licencia N° / License" value={c.cliente.licencia} />
            <Row label="Vencimiento / Exp" value={fechaCorta(c.cliente.licenciaVence)} />
            <Row label="Lugar de expedición" value={c.cliente.licenciaLugar} />
            <Row label="Hospedaje / Hotel name" value={c.hospedaje} />
            <Row label="Fecha de vuelo programado" value={fechaCorta(c.fechaVuelo)} />
            <Row label="Aerolínea" value={c.aerolinea} />
          </Box>

          <Box title="Segundo conductor / Additional driver" color={color}>
            <Row label="Nombre / Name" value={c.segundoConductor.nombre} />
            <Row label="Dirección / Address" value={c.segundoConductor.direccion} />
            <Row label="Colonia" value={c.segundoConductor.colonia} />
            <Row label="Ciudad / C.P." value={[c.segundoConductor.ciudad, c.segundoConductor.cp].filter(Boolean).join(" · ")} />
            <Row label="Teléfono" value={c.segundoConductor.telefono} />
            <Row label="Licencia N°" value={c.segundoConductor.licencia} />
            <Row
              label="Vencimiento / Lugar exp."
              value={[fechaCorta(c.segundoConductor.licenciaVence), c.segundoConductor.licenciaLugar].filter(Boolean).join(" · ")}
            />
          </Box>

          <Box title="Garantía / Tarjeta" color={color}>
            <Row label="Titular de la tarjeta" value={c.tarjetaTitular} />
            <Row label="Número de tarjeta" value={enmascararTarjeta(c.tarjetaNumero)} />
            <Row label="Forma de pago" value={c.formaPago} strong />
          </Box>
        </div>

        <div className="space-y-2">
          <Box title="Vehículo y tarifas / Vehicle & rates" color={color}>
            <div className="grid grid-cols-2">
              <div className="border-r border-slate-300">
                <Row label="Vehículo / Vehicle" value={c.vehiculo.categoria || c.vehiculo.descripcion} strong />
                <Row label="Modelo" value={c.vehiculo.descripcion} />
                <Row label="Color" value={c.vehiculo.color} />
                <Row label="Placas / Plate" value={c.vehiculo.placas} />
                <Row label="Serie" value={c.vehiculo.serie} />
                <Row label="Pasajeros" value={c.vehiculo.pasajeros} />
              </div>
              <div>
                <Row label="Tarifa por día / Daily rate" value={money(c.tarifaDiaria)} />
                <Row label="Total de días / Days" value={c.dias} />
                <Row label="Sub-total" value={money(c.subtotal)} />
                <Row label="Cobertura total" value={c.coberturaTotal ? money(c.coberturaTotal) : "N/A"} />
                <Row label="Cargos adicionales" value={c.cargosAdicionales ? money(c.cargosAdicionales) : "N/A"} />
                <Row label="Depósito en garantía" value={money(c.deposito)} />
              </div>
            </div>
            <div className="grid grid-cols-2 border-t border-slate-300">
              <div className="border-r border-slate-300">
                <Row label="Entrega / Pick up" value={`${fechaCorta(c.fechaEntrega)} ${hora12(c.horaEntrega)}`} />
                <Row label="Devolución / Return" value={`${fechaCorta(c.fechaDevolucion)} ${hora12(c.horaDevolucion)}`} />
              </div>
              <div>
                <Row label="% Deducible" value={`${c.deduciblePct} % ${c.tipoSeguro}`} />
                <div className="flex min-h-[20px] items-center justify-between px-2" style={{ background: color }}>
                  <span className="text-[9px] font-black tracking-widest text-white">TOTAL</span>
                  <span className="text-[13px] font-black text-white">{money(c.total)}</span>
                </div>
              </div>
            </div>
          </Box>

          <Box title="Sucursales" color={color}>
            <div className="grid grid-cols-2">
              <div className="border-r border-slate-300">
                <Row label="Rentado en" value={c.rentadoEn} />
              </div>
              <div>
                <Row label="Entregado en" value={c.entregadoEn} />
              </div>
            </div>
          </Box>

          <Box title="En caso de cambio de vehículo" color={color}>
            <div className="grid grid-cols-2">
              <div className="border-r border-slate-300">
                <Row label="Vehículo" value={c.hayCambio ? c.cambio.categoria || c.cambio.descripcion : ""} />
                <Row label="Color" value={c.hayCambio ? c.cambio.color : ""} />
              </div>
              <div>
                <Row label="Placas" value={c.hayCambio ? c.cambio.placas : ""} />
                <Row label="Serie" value={c.hayCambio ? c.cambio.serie : ""} />
              </div>
            </div>
          </Box>

          <Box title="Inspección del vehículo" color={color}>
            <div className="p-1.5">
              <DamageMap danos={c.danos || []} print />
              <div className="mt-1 grid grid-cols-2 gap-1.5">
                {[
                  { t: "Salida", d: c.salida },
                  { t: "Regreso", d: c.regreso },
                ].map(({ t, d }) => (
                  <div key={t} className="flex flex-col items-center rounded border border-slate-300 py-1">
                    <div className="text-[7.5px] font-extrabold tracking-widest text-slate-600 uppercase">
                      {t} · Gasolina {d?.km || d?.gasolina ? fracGasolina(d.gasolina) : ""}
                    </div>
                    <FuelGauge value={d?.gasolina ?? 0} size={90} print />
                    <Odometer value={d?.km ?? ""} />
                  </div>
                ))}
              </div>
              {c.danos?.some((d) => d.nota) && (
                <ol className="mt-1 grid grid-cols-2 gap-x-2 text-[7.5px] leading-tight text-slate-700">
                  {c.danos.map((d, i) => d.nota && <li key={i}>{`${i + 1}. ${d.nota}`}</li>)}
                </ol>
              )}
            </div>
          </Box>
        </div>
      </div>

      {/* ---------- Cláusulas ---------- */}
      <div className="mt-2 rounded-[5px] border border-slate-400 px-2.5 py-1.5 text-justify text-[8px] leading-snug text-slate-800">
        {empresa.clausulas.split("\n").map((p, i) => (
          <p key={i} className="mb-0.5 last:mb-0">
            {p}
          </p>
        ))}
        {c.notas && (
          <p className="mt-1 font-semibold">
            OBSERVACIONES: <span className="font-normal">{c.notas}</span>
          </p>
        )}
      </div>

      {/* ---------- Pagaré y relevo ---------- */}
      <div className="mt-2 grid grid-cols-[1.35fr_1fr] gap-2">
        <div className="rounded-[5px] border border-slate-400 p-2.5 text-justify text-[8px] leading-snug">
          <div className="mb-1 text-[9px] font-black tracking-[0.3em]" style={{ color }}>
            PAGARÉ
          </div>
          Por este pagaré me(nos) obligo(amos) a pagar incondicionalmente a la vista y a la orden de{" "}
          <b>{empresa.arrendador}</b> o <b>{empresa.nombreComercial}</b>, en cualquier parte que se requiera la cantidad de{" "}
          <b className="underline">{money(c.total)}</b> (<b>{numeroALetras(c.total)}</b>),{" "}
          <span className="underline">{(c.rentadoEn || "MÉRIDA").split(" ")[0]}</span> A{" "}
          <span className="underline">{fecha.getDate()}</span> DE <span className="underline">{MESES[fecha.getMonth()]}</span> DE{" "}
          <span className="underline">{fecha.getFullYear()}</span>.
          <div className="mt-3 grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="flex h-10 items-end justify-center">
                {c.firmaCliente && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.firmaCliente} alt="Firma" className="max-h-10 object-contain" />
                )}
              </div>
              <div className="border-t border-slate-800 pt-0.5 text-[7.5px] font-bold">ACEPTO · {c.cliente.nombre}</div>
            </div>
            <div>
              <div className="h-10" />
              <div className="border-t border-slate-800 pt-0.5 text-[7.5px] font-bold">POR AVAL</div>
            </div>
          </div>
        </div>

        <div className="rounded-[5px] border border-slate-400 p-2.5 text-justify text-[8px] leading-snug">
          <div className="mb-1 text-[9px] font-black tracking-[0.15em]" style={{ color }}>
            RELEVO DE RESPONSABILIDAD POR COLISIÓN
          </div>
          Pagando el {c.deduciblePct}% del valor comercial en concepto de deducible. No cubre robo parcial, ni daños menores. No
          procede si el vehículo es manejado bajo la influencia de bebidas embriagantes y/o sustancias tóxicas.
          <div className="mt-2 space-y-2">
            {(["acepto", "declino"] as const).map((op) => (
              <div key={op} className="flex items-end gap-2">
                <span className="grid h-3.5 w-3.5 shrink-0 place-items-center rounded-sm border border-slate-800 text-[9px] font-black">
                  {c.relevo === op ? "✓" : ""}
                </span>
                <div className="flex-1">
                  <div className="flex h-6 items-end justify-center">
                    {c.relevo === op && c.firmaCliente && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={c.firmaCliente} alt="Firma" className="max-h-6 object-contain" />
                    )}
                  </div>
                  <div className="border-t border-slate-800 pt-0.5 text-center text-[7.5px] font-bold uppercase">{op}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-2 text-center text-[7px] text-slate-400">
        Documento generado por {empresa.nombreComercial} CRM · Folio {c.folio} · Este vehículo no está autorizado a salir de
        la República Mexicana.
      </div>
    </div>
  );
}
