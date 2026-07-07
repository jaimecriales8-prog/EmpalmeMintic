"use client";

import { useRouter } from "next/navigation";
import { construirCSV } from "@/lib/consolidado";

const ENCABEZADOS = [
  "Región",
  "Ciudad",
  "Departamento",
  "Enlace",
  "Fecha corte",
  "Cobertura 4G %",
  "Cobertura 5G %",
  "Hogares internet %",
  "Comunas sin cobertura",
  "Zonas WiFi público",
  "Trámites municipales en línea",
  "Trámites digitalizados %",
  "Pago en línea",
  "Datos abiertos",
  "Cámaras videovigilancia",
  "Centro de monitoreo",
  "Personal TIC",
  "Presupuesto TIC (COP mill.)",
  "Sem. conectividad",
  "Sem. barreras",
  "Sem. proyectos",
  "Sem. ciudad inteligente",
  "Sem. capacidad",
  "Nº riesgos",
  "Nº riesgos alta severidad",
  "Nº temas críticos",
];

export function AccionesCiudades({ filasCSV }: { filasCSV: (string | number | null)[][] }) {
  const router = useRouter();
  function exportarCSV() {
    if (!filasCSV.length) return;
    const csv = construirCSV(ENCABEZADOS, filasCSV);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "consolidado_ciudades_TIC.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  }
  return (
    <div className="flex flex-wrap gap-2.5 print:hidden">
      <button onClick={exportarCSV} disabled={!filasCSV.length} className="rounded-md border border-steel px-3.5 py-2 text-[13.5px] font-semibold text-[#C6D5E2] transition hover:bg-steel/40 disabled:opacity-50">Exportar CSV</button>
      <button onClick={() => window.print()} className="rounded-md border border-steel px-3.5 py-2 text-[13.5px] font-semibold text-[#C6D5E2] transition hover:bg-steel/40">Imprimir</button>
      <button onClick={() => router.refresh()} className="rounded-md border border-steel px-3.5 py-2 text-[13.5px] font-semibold text-[#C6D5E2] transition hover:bg-steel/40">Actualizar</button>
    </div>
  );
}
