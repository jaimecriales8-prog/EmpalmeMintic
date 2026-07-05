"use client";

import { useRouter } from "next/navigation";
import type { Departamento } from "@/lib/database.types";
import { ORDEN_REGIONES } from "@/lib/consolidado";

export function SelectorNivel({
  departamentos,
  regionSel,
  deptoSel,
}: {
  departamentos: Departamento[];
  regionSel: string;
  deptoSel: string;
}) {
  const router = useRouter();
  const regiones = ORDEN_REGIONES.filter((r) => departamentos.some((d) => d.region === r));
  const deptosRegion = regionSel ? departamentos.filter((d) => d.region === regionSel) : departamentos;

  const cls =
    "rounded-md border border-line bg-white px-3 py-2 text-[14px] outline-none focus:border-link focus:ring-2 focus:ring-link/30";

  return (
    <div className="flex flex-wrap items-center gap-2 print:hidden">
      <button
        onClick={() => router.push("/analisis")}
        className={`rounded-md px-3.5 py-2 text-[13.5px] font-semibold transition ${!regionSel && !deptoSel ? "bg-navy text-white" : "border border-line text-navy hover:bg-paper"}`}
      >
        Nacional
      </button>

      <select
        aria-label="Región"
        value={regionSel}
        onChange={(e) => router.push(e.target.value ? `/analisis?region=${encodeURIComponent(e.target.value)}` : "/analisis")}
        className={cls}
      >
        <option value="">— Región —</option>
        {regiones.map((r) => (
          <option key={r} value={r}>{r}</option>
        ))}
      </select>

      <select
        aria-label="Departamento"
        value={deptoSel}
        onChange={(e) => router.push(e.target.value ? `/analisis?depto=${e.target.value}` : (regionSel ? `/analisis?region=${encodeURIComponent(regionSel)}` : "/analisis"))}
        className={cls}
      >
        <option value="">— Departamento —</option>
        {deptosRegion
          .slice()
          .sort((a, b) => a.nombre.localeCompare(b.nombre))
          .map((d) => (
            <option key={d.codigo} value={d.codigo}>{d.nombre}</option>
          ))}
      </select>
    </div>
  );
}
