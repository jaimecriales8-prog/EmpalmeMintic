"use client";

import { useRouter } from "next/navigation";
import type { Ciudad } from "@/lib/database.types";
import { ORDEN_REGIONES } from "@/lib/consolidado";

export function SelectorNivelCiudad({
  ciudades,
  regionSel,
  ciudadSel,
}: {
  ciudades: Ciudad[];
  regionSel: string;
  ciudadSel: string;
}) {
  const router = useRouter();
  const regiones = ORDEN_REGIONES.filter((r) => ciudades.some((c) => c.region === r));
  const ciudadesRegion = regionSel ? ciudades.filter((c) => c.region === regionSel) : ciudades;
  const cls = "rounded-md border border-line bg-white px-3 py-2 text-[14px] outline-none focus:border-link focus:ring-2 focus:ring-link/30";

  return (
    <div className="flex flex-wrap items-center gap-2 print:hidden">
      <button
        onClick={() => router.push("/analisis-ciudad")}
        className={`rounded-md px-3.5 py-2 text-[13.5px] font-semibold transition ${!regionSel && !ciudadSel ? "bg-navy text-white" : "border border-line text-navy hover:bg-paper"}`}
      >
        Nacional
      </button>
      <select
        aria-label="Región"
        value={regionSel}
        onChange={(e) => router.push(e.target.value ? `/analisis-ciudad?region=${encodeURIComponent(e.target.value)}` : "/analisis-ciudad")}
        className={cls}
      >
        <option value="">— Región —</option>
        {regiones.map((r) => <option key={r} value={r}>{r}</option>)}
      </select>
      <select
        aria-label="Ciudad"
        value={ciudadSel}
        onChange={(e) => router.push(e.target.value ? `/analisis-ciudad?ciudad=${e.target.value}` : (regionSel ? `/analisis-ciudad?region=${encodeURIComponent(regionSel)}` : "/analisis-ciudad"))}
        className={cls}
      >
        <option value="">— Ciudad —</option>
        {ciudadesRegion.slice().sort((a, b) => a.nombre.localeCompare(b.nombre)).map((c) => <option key={c.codigo} value={c.codigo}>{c.nombre}</option>)}
      </select>
    </div>
  );
}
