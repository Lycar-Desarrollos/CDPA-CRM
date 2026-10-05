export function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

export function money(n: number | string | undefined | null) {
  const v = Number(n ?? 0);
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", minimumFractionDigits: 2 }).format(
    isNaN(v) ? 0 : v,
  );
}

export function fechaCorta(iso?: string) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return `${d}-${m}-${y}`;
}

export function hora12(hhmm?: string) {
  if (!hhmm) return "";
  const [hS, m] = hhmm.split(":");
  let h = Number(hS);
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${String(h).padStart(2, "0")}:${m} ${ampm}`;
}

export function diasEntre(a?: string, b?: string) {
  if (!a || !b) return 0;
  const d1 = new Date(a + "T00:00:00");
  const d2 = new Date(b + "T00:00:00");
  const diff = Math.round((d2.getTime() - d1.getTime()) / 86400000);
  return Math.max(diff, 1);
}

export function hoyISO() {
  const d = new Date();
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 10);
}

export function sumarDias(iso: string, n: number) {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + n);
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 10);
}

export function enmascararTarjeta(num: string) {
  const digits = (num || "").replace(/\D/g, "");
  if (digits.length < 4) return num;
  return "**** **** **** " + digits.slice(-4);
}

export function fracGasolina(n: number) {
  const map: Record<number, string> = {
    0: "E",
    1: "1/8",
    2: "1/4",
    3: "3/8",
    4: "1/2",
    5: "5/8",
    6: "3/4",
    7: "7/8",
    8: "F",
  };
  return map[n] ?? "";
}

/* ---------- Número a letras (español, MXN) ---------- */
const UNIDADES = ["", "UN", "DOS", "TRES", "CUATRO", "CINCO", "SEIS", "SIETE", "OCHO", "NUEVE"];
const ESPECIALES = [
  "DIEZ", "ONCE", "DOCE", "TRECE", "CATORCE", "QUINCE", "DIECISEIS", "DIECISIETE", "DIECIOCHO", "DIECINUEVE",
];
const DECENAS = ["", "", "VEINTE", "TREINTA", "CUARENTA", "CINCUENTA", "SESENTA", "SETENTA", "OCHENTA", "NOVENTA"];
const CENTENAS = [
  "", "CIENTO", "DOSCIENTOS", "TRESCIENTOS", "CUATROCIENTOS", "QUINIENTOS", "SEISCIENTOS", "SETECIENTOS",
  "OCHOCIENTOS", "NOVECIENTOS",
];

function decenas(n: number): string {
  if (n < 10) return UNIDADES[n];
  if (n < 20) return ESPECIALES[n - 10];
  if (n < 30) return n === 20 ? "VEINTE" : "VEINTI" + UNIDADES[n - 20];
  const d = Math.floor(n / 10);
  const u = n % 10;
  return DECENAS[d] + (u ? " Y " + UNIDADES[u] : "");
}

function centenas(n: number): string {
  if (n === 100) return "CIEN";
  const c = Math.floor(n / 100);
  const r = n % 100;
  return (CENTENAS[c] + (r ? " " + decenas(r) : "")).trim();
}

function miles(n: number): string {
  const m = Math.floor(n / 1000);
  const r = n % 1000;
  let s = "";
  if (m === 1) s = "MIL";
  else if (m > 1) s = centenas(m) + " MIL";
  return (s + (r ? " " + centenas(r) : "")).trim();
}

function millones(n: number): string {
  const m = Math.floor(n / 1000000);
  const r = n % 1000000;
  let s = "";
  if (m === 1) s = "UN MILLON";
  else if (m > 1) s = miles(m) + " MILLONES";
  return (s + (r ? " " + miles(r) : "")).trim();
}

export function numeroALetras(valor: number) {
  const v = Math.abs(Number(valor) || 0);
  const entero = Math.floor(v);
  const cent = Math.round((v - entero) * 100);
  const letras = entero === 0 ? "CERO" : millones(entero);
  return `${letras} PESOS ${String(cent).padStart(2, "0")}/100 M.N.`;
}

export const MESES = [
  "ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO", "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE",
  "DICIEMBRE",
];
