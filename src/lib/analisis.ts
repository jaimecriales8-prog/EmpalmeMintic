import { DIMS, severidadDe } from "@/lib/consolidado";
import type {
  Reporte,
  SeveridadRiesgo,
  TemaCritico,
  Departamento,
  ReporteCiudad,
  RiesgoCiudad,
  TemaCiudad,
  Ciudad,
} from "@/lib/database.types";

export type Dist = { critico: number; riesgo: number; estable: number };

export type Metricas = {
  reportes: number;
  prom4g: number | null;
  prom5g: number | null;
  promHogares: number | null;
  mpiosSinCobertura: number;
  personasFormadas: number;
  mpiosTramites: number;
  dist: Dist;
  totalSemaforos: number;
  riesgosAltos: number;
  temasInmediatos: number;
};

export function promedio(nums: (number | null)[]): number | null {
  const v = nums.filter((x): x is number => x !== null && x !== undefined);
  return v.length ? v.reduce((a, b) => a + Number(b), 0) / v.length : null;
}
function suma(nums: (number | null)[]): number {
  let t = 0;
  for (const n of nums) t += Number(n) || 0;
  return t;
}

export function distDe(reportes: Reporte[]): Dist {
  const d: Dist = { critico: 0, riesgo: 0, estable: 0 };
  reportes.forEach((r) => {
    DIMS.forEach((dim) => {
      const v = (r as Record<string, unknown>)[`sem_${dim}`];
      if (v === "critico" || v === "riesgo" || v === "estable") d[v]++;
    });
  });
  return d;
}

export function criticosDe(r: Reporte): number {
  return DIMS.filter((d) => (r as Record<string, unknown>)[`sem_${d}`] === "critico").length;
}

export function metricasDe(
  reportes: Reporte[],
  severidad: SeveridadRiesgo[],
  temas: TemaCritico[],
): Metricas {
  const dist = distDe(reportes);
  return {
    reportes: reportes.length,
    prom4g: promedio(reportes.map((r) => r.cobertura_4g)),
    prom5g: promedio(reportes.map((r) => r.cobertura_5g)),
    promHogares: promedio(reportes.map((r) => r.hogares_internet)),
    mpiosSinCobertura: suma(reportes.map((r) => r.municipios_sin_cobertura)),
    personasFormadas: suma(reportes.map((r) => r.personas_formadas)),
    mpiosTramites: suma(reportes.map((r) => r.municipios_tramites_linea)),
    dist,
    totalSemaforos: dist.critico + dist.riesgo + dist.estable,
    riesgosAltos: severidad.filter((v) => (v.severidad ?? 0) >= 6).length,
    temasInmediatos: temas.filter((t) => (t.plazo ?? "").startsWith("Inmediato")).length,
  };
}

// Comparación de un valor departamental contra un promedio de referencia.
export function comparar(valor: number | null, referencia: number | null) {
  if (valor === null || referencia === null) return { delta: null, signo: "", tono: "text-steel" };
  const delta = valor - referencia;
  const signo = delta > 0 ? "+" : "";
  const tono = delta > 0.05 ? "text-verde" : delta < -0.05 ? "text-rojo" : "text-steel";
  return { delta, signo, tono };
}

// Ordena departamentos de una región por criticidad (más críticos primero).
export function ordenarPorCriticidad(
  reportes: Reporte[],
  depByCodigo: Map<string, Departamento>,
): { reporte: Reporte; departamento: Departamento; criticos: number }[] {
  return reportes
    .map((r) => ({ reporte: r, departamento: depByCodigo.get(r.departamento_codigo)!, criticos: criticosDe(r) }))
    .filter((x) => x.departamento)
    .sort((a, b) => b.criticos - a.criticos || (a.departamento.nombre).localeCompare(b.departamento.nombre));
}

// ---- Variantes para ciudades (mismo modelo, campos propios) ----
export function distCiudad(reportes: ReporteCiudad[]): Dist {
  const d: Dist = { critico: 0, riesgo: 0, estable: 0 };
  reportes.forEach((r) => {
    DIMS.forEach((dim) => {
      const v = (r as Record<string, unknown>)[`sem_${dim}`];
      if (v === "critico" || v === "riesgo" || v === "estable") d[v]++;
    });
  });
  return d;
}
export function criticosCiudad(r: ReporteCiudad): number {
  return DIMS.filter((d) => (r as Record<string, unknown>)[`sem_${d}`] === "critico").length;
}
export function metricasCiudad(reportes: ReporteCiudad[], riesgos: RiesgoCiudad[], temas: TemaCiudad[]): Metricas {
  const dist = distCiudad(reportes);
  const riesgosAltos = riesgos.filter((x) => severidadDe(x.probabilidad, x.impacto).s >= 6).length;
  let comunasSin = 0;
  reportes.forEach((r) => (comunasSin += Number(r.comunas_sin_cobertura) || 0));
  return {
    reportes: reportes.length,
    prom4g: promedio(reportes.map((r) => r.cobertura_4g)),
    prom5g: promedio(reportes.map((r) => r.cobertura_5g)),
    promHogares: promedio(reportes.map((r) => r.hogares_internet)),
    mpiosSinCobertura: comunasSin,
    personasFormadas: reportes.reduce((s, r) => s + (Number(r.personas_formadas) || 0), 0),
    mpiosTramites: reportes.reduce((s, r) => s + (Number(r.tramites_municipales_linea) || 0), 0),
    dist,
    totalSemaforos: dist.critico + dist.riesgo + dist.estable,
    riesgosAltos,
    temasInmediatos: temas.filter((t) => (t.plazo ?? "").startsWith("Inmediato")).length,
  };
}
export function ordenarCiudadesPorCriticidad(
  reportes: ReporteCiudad[],
  ciuByCodigo: Map<string, Ciudad>,
): { reporte: ReporteCiudad; ciudad: Ciudad; criticos: number }[] {
  return reportes
    .map((r) => ({ reporte: r, ciudad: ciuByCodigo.get(r.ciudad_codigo)!, criticos: criticosCiudad(r) }))
    .filter((x) => x.ciudad)
    .sort((a, b) => b.criticos - a.criticos || a.ciudad.nombre.localeCompare(b.ciudad.nombre));
}
