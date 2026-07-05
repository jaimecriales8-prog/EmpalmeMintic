"use client";

import { useRouter } from "next/navigation";
import { construirCSV, CSV_ENCABEZADOS } from "@/lib/consolidado";

export function AccionesConsolidado({ filasCSV }: { filasCSV: (string | number | null)[][] }) {
  const router = useRouter();

  function exportarCSV() {
    if (!filasCSV.length) return;
    const csv = construirCSV(CSV_ENCABEZADOS, filasCSV);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "consolidado_regional_TIC.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <div className="flex flex-wrap gap-2.5 print:hidden">
      <button
        onClick={exportarCSV}
        disabled={!filasCSV.length}
        className="rounded-md border border-steel px-3.5 py-2 text-[13.5px] font-semibold text-[#C6D5E2] transition hover:bg-steel/40 disabled:opacity-50"
      >
        Exportar CSV
      </button>
      <button
        onClick={() => window.print()}
        className="rounded-md border border-steel px-3.5 py-2 text-[13.5px] font-semibold text-[#C6D5E2] transition hover:bg-steel/40"
      >
        Imprimir
      </button>
      <button
        onClick={() => router.refresh()}
        className="rounded-md border border-steel px-3.5 py-2 text-[13.5px] font-semibold text-[#C6D5E2] transition hover:bg-steel/40"
      >
        Actualizar
      </button>
    </div>
  );
}
