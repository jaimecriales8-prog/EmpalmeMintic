// Helpers compartidos del consolidado regional.

export const ORDEN_REGIONES = [
  "Caribe",
  "Andina",
  "Pacífica",
  "Orinoquía",
  "Amazonía",
  "Insular",
];

export const DIMS = ["conectividad", "barreras", "proyectos", "apropiacion", "capacidad"] as const;

export const SEM_ETIQUETA: Record<string, string> = {
  critico: "Crítico",
  riesgo: "En riesgo",
  estable: "Estable",
};

// Clases de pill por semáforo (usa las utilidades del tema Tailwind).
export function pillClase(v: string | null): string {
  if (v === "critico") return "bg-rojo-bg text-rojo";
  if (v === "riesgo") return "bg-ambar-bg text-ambar";
  if (v === "estable") return "bg-verde-bg text-verde";
  return "bg-[#EEF1F4] text-[#8595A4]";
}

const PESO: Record<string, number> = { Alta: 3, Media: 2, Baja: 1, Alto: 3, Medio: 2, Bajo: 1 };

export function severidadDe(probabilidad: string | null, impacto: string | null) {
  const s = (PESO[probabilidad ?? ""] ?? 0) * (PESO[impacto ?? ""] ?? 0);
  if (s >= 6) return { s, t: "Alta", clase: "text-rojo" };
  if (s >= 3) return { s, t: "Media", clase: "text-ambar" };
  return { s, t: s ? "Baja" : "—", clase: "text-verde" };
}

export const ORDEN_PLAZO: Record<string, number> = {
  "Inmediato (30 días)": 1,
  "Corto (100 días)": 2,
  "Primer año": 3,
};

// Ordena una lista de regiones según ORDEN_REGIONES y deja las demás al final.
export function ordenarRegiones(regiones: string[]): string[] {
  const enOrden = ORDEN_REGIONES.filter((r) => regiones.includes(r));
  const resto = regiones.filter((r) => !ORDEN_REGIONES.includes(r)).sort();
  return [...enOrden, ...resto];
}

// Construye el CSV consolidado (separador ';', con BOM) desde filas ya armadas.
export function construirCSV(encabezados: string[], filas: (string | number | null)[][]): string {
  const q = (v: string | number | null) => '"' + String(v ?? "").replace(/"/g, '""') + '"';
  const lineas = [encabezados.map(q).join(";"), ...filas.map((f) => f.map(q).join(";"))];
  return "﻿" + lineas.join("\n");
}

export const CSV_ENCABEZADOS = [
  "Región",
  "Departamento",
  "Enlace",
  "Fecha corte",
  "Cobertura 4G %",
  "Cobertura 5G %",
  "Hogares internet %",
  "Total municipios",
  "Mpios sin cobertura",
  "Programas talento digital",
  "Personas formadas",
  "Mpios con trámites en línea",
  "Trámites gobernación en línea",
  "Mipymes beneficiadas",
  "Incidentes ciberseguridad",
  "Plan transformación digital",
  "Capacidad respuesta ciber",
  "Dependencia TIC",
  "Presupuesto TIC (COP mill.)",
  "Personal TIC",
  "Sistemas/activos inventariados",
  "Sistemas con fallas u obsoletos",
  "Sistemas licenc. vencido",
  "Contratos TIC vigentes",
  "Inventario activos TIC",
  "Política seguridad (MSPI)",
  "Sem. conectividad",
  "Sem. barreras",
  "Sem. proyectos",
  "Sem. apropiación",
  "Sem. capacidad",
  "Nº proyectos",
  "Nº riesgos",
  "Nº riesgos alta severidad",
  "Nº temas críticos",
];

export const ESTADO_REPORTE_LABEL: Record<string, string> = {
  borrador: "Borrador",
  enviado: "Enviado",
  validado: "Validado",
};
