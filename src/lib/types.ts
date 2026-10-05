export type EstadoContrato = "reservacion" | "activo" | "finalizado" | "cancelado";
export type EstadoVehiculo = "disponible" | "rentado" | "mantenimiento";

export interface Empresa {
  arrendador: string;
  nombreComercial: string;
  rfc: string;
  direccion: string;
  telefonos: string;
  email: string;
  folioActual: number;
  avisoSeguro: string;
  clausulas: string;
  sucursales: string[];
  categorias: string[];
  deduciblePct: number;
  colorMarca: string;
}

export const EMPRESA_DEFAULT: Empresa = {
  arrendador: "OSCAR LEON RODRIGUEZ",
  nombreComercial: "CHIP RENT A CAR",
  rfc: "LERO780207191",
  direccion: "CALLE 28 POR 23 Y 25 SN COL. M. CRECENCIO REJON, MERIDA, YUCATAN",
  telefonos: "9995526896 · 9999588566",
  email: "OSCARCALLIN1978@ICLOUD.COM",
  folioActual: 1000132,
  avisoSeguro:
    "EL SEGURO SOLO CUBRE YUCATAN, CAMPECHE Y QUINTANA ROO. INSURANCE ONLY COVERS YUCATAN, CAMPECHE AND QUINTANA ROO.",
  clausulas:
    "Este vehículo no está autorizado a salir de la República Mexicana.\nSi pasadas las 24 horas de la fecha y hora de la promesa de regreso de este vehículo, el ARRENDADOR no ha sido notificado de la intención de prorrogar el contrato por parte del arrendatario, se procederá por los medios legales en contra del mismo y hasta recuperar la propiedad.\nEl ARRENDATARIO es responsable por el pago de infracciones y retiro o pérdida de placas o documentos de circulación.",
  sucursales: ["MERIDA APTO", "MERIDA CENTRO", "CANCUN APTO"],
  categorias: ["SEDAN STD", "SEDAN AUT", "COMPACTO STD", "SUV", "VAN", "PICK UP"],
  deduciblePct: 10,
  colorMarca: "#0b6bcb",
};

export interface Persona {
  nombre: string;
  direccion: string;
  colonia: string;
  ciudad: string;
  cp: string;
  telefono: string;
  email: string;
  licencia: string;
  licenciaVence: string;
  licenciaLugar: string;
}

export interface Cliente extends Persona {
  id: string;
  notas?: string;
  createdAt?: number;
}

export interface Vehiculo {
  id: string;
  marca: string;
  modelo: string;
  anio: string;
  categoria: string;
  color: string;
  placas: string;
  serie: string;
  pasajeros: number;
  tarifaDiaria: number;
  km: number;
  estado: EstadoVehiculo;
  createdAt?: number;
}

export interface VehiculoSnapshot {
  descripcion: string;
  categoria: string;
  color: string;
  placas: string;
  serie: string;
  pasajeros: number | string;
}

export interface Dano {
  x: number; // porcentaje 0-100
  y: number;
  nota: string;
}

export interface Inspeccion {
  gasolina: number; // 0 - 8 (octavos)
  km: string;
}

export interface Contrato {
  id: string;
  folio: number;
  estado: EstadoContrato;

  clienteId: string | null;
  cliente: Persona;

  hospedaje: string;
  fechaVuelo: string;
  aerolinea: string;

  segundoConductor: Persona;

  tarjetaTitular: string;
  tarjetaNumero: string;

  vehiculoId: string | null;
  vehiculo: VehiculoSnapshot;

  tarifaDiaria: number;
  dias: number;
  coberturaTotal: number;
  cargosAdicionales: number;
  deduciblePct: number;
  tipoSeguro: string;
  deposito: number;
  subtotal: number;
  total: number;

  fechaEntrega: string;
  horaEntrega: string;
  fechaDevolucion: string;
  horaDevolucion: string;
  rentadoEn: string;
  entregadoEn: string;

  hayCambio: boolean;
  cambio: VehiculoSnapshot;

  formaPago: string;

  salida: Inspeccion;
  regreso: Inspeccion;
  danos: Dano[];

  relevo: "acepto" | "declino" | "";
  firmaCliente: string;
  notas: string;

  createdBy?: string;
  createdAt?: number;
  updatedAt?: number;
}

export const PERSONA_VACIA: Persona = {
  nombre: "",
  direccion: "",
  colonia: "",
  ciudad: "",
  cp: "",
  telefono: "",
  email: "",
  licencia: "",
  licenciaVence: "",
  licenciaLugar: "",
};

export const VEHICULO_SNAPSHOT_VACIO: VehiculoSnapshot = {
  descripcion: "",
  categoria: "",
  color: "",
  placas: "",
  serie: "",
  pasajeros: "",
};

export const FORMAS_PAGO = ["EFECTIVO", "TARJETA DE CRÉDITO", "TARJETA DE DÉBITO", "TRANSFERENCIA", "MIXTO"];

export const ESTADOS_CONTRATO: Record<EstadoContrato, { label: string; color: string }> = {
  reservacion: { label: "Reservación", color: "bg-amber-50 text-amber-700 ring-amber-600/20" },
  activo: { label: "Activo", color: "bg-emerald-50 text-emerald-700 ring-emerald-600/20" },
  finalizado: { label: "Finalizado", color: "bg-slate-100 text-slate-700 ring-slate-500/20" },
  cancelado: { label: "Cancelado", color: "bg-rose-50 text-rose-700 ring-rose-600/20" },
};

export const ESTADOS_VEHICULO: Record<EstadoVehiculo, { label: string; color: string }> = {
  disponible: { label: "Disponible", color: "bg-emerald-50 text-emerald-700 ring-emerald-600/20" },
  rentado: { label: "Rentado", color: "bg-blue-50 text-blue-700 ring-blue-600/20" },
  mantenimiento: { label: "Mantenimiento", color: "bg-amber-50 text-amber-700 ring-amber-600/20" },
};
