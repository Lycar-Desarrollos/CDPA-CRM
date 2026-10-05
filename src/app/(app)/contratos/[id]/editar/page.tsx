"use client";

import { useParams } from "next/navigation";
import { ContractForm } from "@/components/ContractForm";
import { LoadingBlock, PageHeader } from "@/components/ui";
import { useContrato } from "@/lib/db";

export default function EditarContratoPage() {
  const { id } = useParams<{ id: string }>();
  const { data, loading } = useContrato(id);

  if (loading) return <LoadingBlock />;
  if (!data) return <p className="text-slate-500">Contrato no encontrado.</p>;

  return (
    <div>
      <PageHeader title={`Editar contrato #${data.folio}`} subtitle={data.cliente.nombre} />
      <ContractForm initial={data} />
    </div>
  );
}
