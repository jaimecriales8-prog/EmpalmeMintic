"use client";

import { useState } from "react";
import type { Departamento, Reporte, Proyecto, Riesgo, TemaCritico, SistemaActivo } from "@/lib/database.types";
import type { Ciudad, ReporteCiudad, ProyectoCiudad, RiesgoCiudad, TemaCiudad, SistemaCiudad } from "@/lib/database.types";

function slugArchivo(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "_");
}

async function descargar(blob: Blob, nombreArchivo: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nombreArchivo;
  a.click();
  // Revocar tras un breve delay: algunos navegadores cancelan la descarga
  // si el object URL se libera de inmediato.
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

function BotonBase({ generar, oscuro }: { generar: () => Promise<void>; oscuro?: boolean }) {
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  async function onClick() {
    setCargando(true);
    setError("");
    try {
      await generar();
    } catch {
      setError("No se pudo generar el PDF. Intente de nuevo.");
    } finally {
      setCargando(false);
    }
  }

  // Variante clara: para toolbars sobre fondo blanco/gris (fichas de central).
  // Variante oscura: para el Masthead navy (formulario del propio enlace).
  const clases = oscuro
    ? "rounded-md border border-steel px-3 py-1.5 text-[13px] font-semibold text-[#C6D5E2] transition hover:bg-steel/40 disabled:opacity-60"
    : "rounded-md border border-line px-3 py-1.5 text-[13px] font-semibold text-navy transition hover:bg-paper disabled:opacity-60";

  return (
    <div className="flex items-center gap-2 print:hidden">
      <button type="button" onClick={onClick} disabled={cargando} className={clases}>
        {cargando ? "Generando PDF…" : "Descargar PDF"}
      </button>
      {error && <span className={`text-xs ${oscuro ? "text-[#F3B4B0]" : "text-rojo"}`}>{error}</span>}
    </div>
  );
}

export function BotonDescargarFichaDepartamento({
  departamento,
  reporte,
  proyectos,
  riesgos,
  temas,
  sistemas,
  oscuro,
}: {
  departamento: Departamento;
  reporte: Reporte;
  proyectos: Proyecto[];
  riesgos: Riesgo[];
  temas: TemaCritico[];
  sistemas: SistemaActivo[];
  oscuro?: boolean;
}) {
  return (
    <BotonBase
      oscuro={oscuro}
      generar={async () => {
        const [{ pdf }, { ReporteDepartamentoPDF }] = await Promise.all([
          import("@react-pdf/renderer"),
          import("@/lib/pdf/reporte-departamento-pdf"),
        ]);
        const blob = await pdf(
          <ReporteDepartamentoPDF
            departamento={departamento}
            reporte={reporte}
            proyectos={proyectos}
            riesgos={riesgos}
            temas={temas}
            sistemas={sistemas}
          />,
        ).toBlob();
        await descargar(blob, `Ficha_TIC_${slugArchivo(departamento.nombre)}_${reporte.fecha_corte ?? "sf"}.pdf`);
      }}
    />
  );
}

export function BotonDescargarFichaCiudad({
  ciudad,
  departamentoNombre,
  reporte,
  proyectos,
  riesgos,
  temas,
  sistemas,
  oscuro,
}: {
  ciudad: Ciudad;
  departamentoNombre: string;
  reporte: ReporteCiudad;
  proyectos: ProyectoCiudad[];
  riesgos: RiesgoCiudad[];
  temas: TemaCiudad[];
  sistemas: SistemaCiudad[];
  oscuro?: boolean;
}) {
  return (
    <BotonBase
      oscuro={oscuro}
      generar={async () => {
        const [{ pdf }, { ReporteCiudadPDF }] = await Promise.all([
          import("@react-pdf/renderer"),
          import("@/lib/pdf/reporte-ciudad-pdf"),
        ]);
        const blob = await pdf(
          <ReporteCiudadPDF
            ciudad={ciudad}
            departamentoNombre={departamentoNombre}
            reporte={reporte}
            proyectos={proyectos}
            riesgos={riesgos}
            temas={temas}
            sistemas={sistemas}
          />,
        ).toBlob();
        await descargar(blob, `Ficha_TIC_${slugArchivo(ciudad.nombre)}_${reporte.fecha_corte ?? "sf"}.pdf`);
      }}
    />
  );
}
