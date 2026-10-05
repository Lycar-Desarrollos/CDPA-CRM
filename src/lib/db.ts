"use client";

import { useEffect, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { auth, db } from "./firebase";
import { EMPRESA_DEFAULT, type Cliente, type Contrato, type Empresa, type Vehiculo } from "./types";

/* ---------- Hooks en tiempo real ---------- */
function useCollection<T>(name: string, orderField = "createdAt") {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, name), orderBy(orderField, "desc"));
    return onSnapshot(
      q,
      (snap) => {
        setData(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as T));
        setLoading(false);
      },
      (err) => {
        console.error(err);
        setError(err.message);
        setLoading(false);
      },
    );
  }, [name, orderField]);

  return { data, loading, error };
}

export const useClientes = () => useCollection<Cliente>("clientes");
export const useVehiculos = () => useCollection<Vehiculo>("vehiculos");
export const useContratos = () => useCollection<Contrato>("contratos");

export function useContrato(id: string | undefined) {
  const [data, setData] = useState<Contrato | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!id) return;
    return onSnapshot(
      doc(db, "contratos", id),
      (d) => {
        setData(d.exists() ? ({ id: d.id, ...d.data() } as Contrato) : null);
        setLoading(false);
      },
      () => setLoading(false),
    );
  }, [id]);
  return { data, loading };
}

export function useEmpresa() {
  const [data, setData] = useState<Empresa>(EMPRESA_DEFAULT);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    return onSnapshot(
      doc(db, "config", "empresa"),
      (d) => {
        setData({ ...EMPRESA_DEFAULT, ...(d.data() as Partial<Empresa> | undefined) });
        setLoading(false);
      },
      () => setLoading(false),
    );
  }, []);
  return { data, loading };
}

/* ---------- Mutaciones ---------- */
const meta = () => ({ updatedAt: Date.now() });

export async function guardarEmpresa(e: Partial<Empresa>) {
  await setDoc(doc(db, "config", "empresa"), { ...e, ...meta() }, { merge: true });
}

export async function guardarCliente(c: Partial<Cliente> & { id?: string }) {
  const { id, ...rest } = c;
  if (id) {
    await updateDoc(doc(db, "clientes", id), { ...rest, ...meta() });
    return id;
  }
  const ref = await addDoc(collection(db, "clientes"), { ...rest, createdAt: Date.now(), ...meta() });
  return ref.id;
}

export const eliminarCliente = (id: string) => deleteDoc(doc(db, "clientes", id));

export async function guardarVehiculo(v: Partial<Vehiculo> & { id?: string }) {
  const { id, ...rest } = v;
  if (id) {
    await updateDoc(doc(db, "vehiculos", id), { ...rest, ...meta() });
    return id;
  }
  const ref = await addDoc(collection(db, "vehiculos"), { ...rest, createdAt: Date.now(), ...meta() });
  return ref.id;
}

export const eliminarVehiculo = (id: string) => deleteDoc(doc(db, "vehiculos", id));

export async function actualizarEstadoVehiculo(id: string | null, estado: Vehiculo["estado"], km?: number) {
  if (!id) return;
  const data: Record<string, unknown> = { estado, ...meta() };
  if (km !== undefined && !isNaN(km) && km > 0) data.km = km;
  await updateDoc(doc(db, "vehiculos", id), data).catch(() => {});
}

/** Crea el contrato asignando el folio consecutivo de forma atómica */
export async function crearContrato(c: Omit<Contrato, "id" | "folio">) {
  const empresaRef = doc(db, "config", "empresa");
  const contratoRef = doc(collection(db, "contratos"));
  const folio = await runTransaction(db, async (tx) => {
    const snap = await tx.get(empresaRef);
    const actual = (snap.data()?.folioActual as number | undefined) ?? EMPRESA_DEFAULT.folioActual;
    const siguiente = actual + 1;
    tx.set(empresaRef, { folioActual: siguiente }, { merge: true });
    tx.set(contratoRef, {
      ...c,
      folio: siguiente,
      createdBy: auth.currentUser?.email ?? "",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    return siguiente;
  });
  return { id: contratoRef.id, folio };
}

export async function actualizarContrato(id: string, c: Partial<Contrato>) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id: _omit, ...rest } = c;
  await updateDoc(doc(db, "contratos", id), { ...rest, ...meta() });
}

export const eliminarContrato = (id: string) => deleteDoc(doc(db, "contratos", id));

export async function obtenerContrato(id: string) {
  const d = await getDoc(doc(db, "contratos", id));
  return d.exists() ? ({ id: d.id, ...d.data() } as Contrato) : null;
}
