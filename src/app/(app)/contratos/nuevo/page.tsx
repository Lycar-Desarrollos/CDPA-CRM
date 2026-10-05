"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ContractForm } from "@/components/ContractForm";
import { LoadingBlock, PageHeader } from "@/components/ui";

function Inner() {
  const params = useSearchParams();
  return <ContractForm clientePreseleccionado={params.get("cliente")} />;
}

export default function NuevoContratoPage() {
  return (
    <div>
      <PageHeader title="Nuevo contrato" subtitle="Completa los pasos para generar el contrato de renta con folio automático." />
      <Suspense fallback={<LoadingBlock />}>
        <Inner />
      </Suspense>
    </div>
  );
}
