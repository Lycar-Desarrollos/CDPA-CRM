"use client";

import { useEffect, useRef, useState } from "react";
import { Eraser, Trash2 } from "lucide-react";
import type { Dano } from "@/lib/types";
import { cn, fracGasolina } from "@/lib/utils";

/* ================= Medidor de gasolina ================= */
export function FuelGauge({
  value,
  onChange,
  size = 160,
  print = false,
}: {
  value: number;
  onChange?: (v: number) => void;
  size?: number;
  print?: boolean;
}) {
  const cx = 60;
  const cy = 58;
  const r = 46;
  const angle = (lvl: number) => Math.PI - (lvl / 8) * Math.PI;
  const pt = (lvl: number, rad: number) => ({
    x: cx + rad * Math.cos(angle(lvl)),
    y: cy - rad * Math.sin(angle(lvl)),
  });
  const needle = pt(value, r - 10);
  const stroke = print ? "#000" : "#0f172a";

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 120 72" width={size} height={(size * 72) / 120}>
        {!print && (
          <defs>
            <linearGradient id="fuelg" x1="0" x2="1">
              <stop offset="0%" stopColor="#ef4444" />
              <stop offset="35%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>
          </defs>
        )}
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none"
          stroke={print ? "#000" : "url(#fuelg)"}
          strokeWidth={print ? 2.5 : 6}
          strokeLinecap="round"
        />
        {Array.from({ length: 9 }).map((_, i) => {
          const a = pt(i, r - 6);
          const b = pt(i, r - (i % 4 === 0 ? 14 : 10));
          return (
            <line
              key={i}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke={stroke}
              strokeWidth={i % 4 === 0 ? 2 : 1.2}
              onClick={() => onChange?.(i)}
              className={onChange ? "cursor-pointer" : ""}
            />
          );
        })}
        <text x={cx - r - 2} y={cy + 11} fontSize="9" fontWeight="700" fill={stroke}>
          E
        </text>
        <text x={cx + r - 5} y={cy + 11} fontSize="9" fontWeight="700" fill={stroke}>
          F
        </text>
        <text x={cx} y={cy - 18} fontSize="9" fontWeight="700" textAnchor="middle" fill={stroke}>
          1/2
        </text>
        <line
          x1={cx}
          y1={cy}
          x2={needle.x}
          y2={needle.y}
          stroke={print ? "#000" : "#dc2626"}
          strokeWidth={2.5}
          strokeLinecap="round"
          style={{ transition: "all .35s cubic-bezier(.34,1.56,.64,1)" }}
        />
        <circle cx={cx} cy={cy} r={4.5} fill={stroke} />
      </svg>
      {onChange && (
        <div className="mt-2 flex flex-wrap justify-center gap-1">
          {Array.from({ length: 9 }).map((_, i) => (
            <button
              type="button"
              key={i}
              onClick={() => onChange(i)}
              className={cn(
                "h-7 min-w-8 rounded-md px-1 text-[10px] font-bold transition",
                value === i ? "bg-brand-600 text-white shadow" : "bg-slate-100 text-slate-500 hover:bg-slate-200",
              )}
            >
              {fracGasolina(i)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ================= Odómetro ================= */
export function Odometer({ value, digits = 6 }: { value: string | number; digits?: number }) {
  const s = String(value ?? "").replace(/\D/g, "");
  const padded = s ? s.padStart(digits, "0").slice(-digits) : "".padStart(digits, " ");
  return (
    <div className="inline-flex items-stretch overflow-hidden rounded-md border border-black">
      {padded.split("").map((c, i) => (
        <span
          key={i}
          className="grid w-[18px] place-items-center border-r border-black bg-white py-0.5 font-mono text-[12px] font-bold"
        >
          {c.trim() || "\u00a0"}
        </span>
      ))}
      <span className="grid place-items-center bg-black px-1.5 text-[10px] font-bold text-white">Km</span>
    </div>
  );
}

/* ================= Diagrama de daños ================= */
export function DamageMap({
  danos,
  onChange,
  print = false,
}: {
  danos: Dano[];
  onChange?: (d: Dano[]) => void;
  print?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const editable = !!onChange;

  function add(e: React.MouseEvent) {
    if (!onChange || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    onChange([...danos, { x, y, nota: "" }]);
  }

  return (
    <div className={cn(!print && "space-y-3")}>
      <div
        ref={ref}
        onClick={add}
        className={cn(
          "relative mx-auto w-full select-none",
          editable && "cursor-crosshair rounded-xl border border-dashed border-slate-300 bg-slate-50/50 p-2",
        )}
        style={{ aspectRatio: "565 / 352" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/img/car-diagram.png" alt="Diagrama del vehículo" className="h-full w-full object-contain" draggable={false} />
        {danos.map((d, i) => (
          <span
            key={i}
            onClick={(e) => e.stopPropagation()}
            className={cn(
              "absolute grid -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full font-bold text-white",
              print ? "h-4 w-4 bg-red-600 text-[8px]" : "h-6 w-6 bg-rose-600 text-[11px] shadow-lg ring-2 ring-white",
            )}
            style={{ left: `${d.x}%`, top: `${d.y}%` }}
          >
            {i + 1}
          </span>
        ))}
      </div>
      {editable && (
        <>
          <p className="text-center text-xs text-slate-500">
            Haz clic sobre el diagrama para marcar golpes, rayones o daños existentes.
          </p>
          {danos.length > 0 && (
            <div className="space-y-2">
              {danos.map((d, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-rose-600 text-[11px] font-bold text-white">
                    {i + 1}
                  </span>
                  <input
                    className="input py-1.5"
                    placeholder="Descripción del daño (ej. rayón puerta trasera)"
                    value={d.nota}
                    onChange={(e) => {
                      const copy = [...danos];
                      copy[i] = { ...d, nota: e.target.value };
                      onChange!(copy);
                    }}
                  />
                  <button
                    type="button"
                    className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                    onClick={() => onChange!(danos.filter((_, j) => j !== i))}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ================= Firma digital ================= */
export function SignaturePad({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [empty, setEmpty] = useState(!value);

  useEffect(() => {
    const c = canvas.current;
    if (!c) return;
    const ratio = window.devicePixelRatio || 1;
    c.width = c.offsetWidth * ratio;
    c.height = c.offsetHeight * ratio;
    const ctx = c.getContext("2d")!;
    ctx.scale(ratio, ratio);
    ctx.lineWidth = 2.2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#0f172a";
    if (value) {
      const img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0, c.offsetWidth, c.offsetHeight);
      img.src = value;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pos = (e: React.PointerEvent) => {
    const r = canvas.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  return (
    <div>
      <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white">
        <canvas
          ref={canvas}
          className="h-40 w-full touch-none"
          onPointerDown={(e) => {
            drawing.current = true;
            const ctx = canvas.current!.getContext("2d")!;
            const p = pos(e);
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            canvas.current!.setPointerCapture(e.pointerId);
          }}
          onPointerMove={(e) => {
            if (!drawing.current) return;
            const ctx = canvas.current!.getContext("2d")!;
            const p = pos(e);
            ctx.lineTo(p.x, p.y);
            ctx.stroke();
            setEmpty(false);
          }}
          onPointerUp={() => {
            drawing.current = false;
            onChange(canvas.current!.toDataURL("image/png"));
          }}
        />
        {empty && (
          <div className="pointer-events-none absolute inset-0 grid place-items-center text-sm text-slate-300">
            Firme aquí
          </div>
        )}
        <div className="pointer-events-none absolute inset-x-8 bottom-8 border-b border-dashed border-slate-300" />
      </div>
      <button
        type="button"
        className="btn-ghost mt-2 px-2 py-1 text-xs"
        onClick={() => {
          const c = canvas.current!;
          c.getContext("2d")!.clearRect(0, 0, c.width, c.height);
          setEmpty(true);
          onChange("");
        }}
      >
        <Eraser className="h-3.5 w-3.5" /> Limpiar firma
      </button>
    </div>
  );
}
