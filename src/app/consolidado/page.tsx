import Link from "next/link";
import { requirePerfil } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Masthead } from "@/components/masthead";
import { AccionesConsolidado } from "@/components/consolidado/acciones-consolidado";
import { GraficosConsolidado } from "@/components/consolidado/graficos";
import {
  DIMS,
  SEM_ETIQUETA,
  pillClase,
  severidadDe,
  ordenarRegiones,
  ORDEN_REGIONES,
  ORDEN_PLAZO,
  ESTADO_REPORTE_LABEL,
} from "@/lib/consolidado";
import type {
  Departamento,
  Perfil,
  Reporte,
  Proyecto,
  SistemaActivo,
  TemaCritico,
  ConsolidadoRegional,
  SeveridadRiesgo,
} from "@/lib/database.types";

export const dynamic = "force-dynamic";

const TOTAL_DEPTOS = 33;

export default async function ConsolidadoPage() {
  const { perfil } = await requirePerfil(["central", "admin"]);
  const supabase = await createClient();

  const [depRes, repRes, perfRes, regRes, sevRes] = await Promise.all([
    supabase.from("departamentos").select("*"),
    supabase.from("reportes").select("*").in("estado", ["enviado", "validado"]),
    supabase.from("perfiles").select("id, nombre, departamento_codigo, rol"),
    supabase.from("v_consolidado_regional").select("*"),
    supabase.from("v_severidad_riesgos").select("*").order("severidad", { ascending: false }),
  ]);

  const departamentos = (depRes.data ?? []) as Departamento[];
  const reportes = (repRes.data ?? []) as Reporte[];
  const perfiles = (perfRes.data ?? []) as Pick<Perfil, "id" | "nombre" | "departamento_codigo" | "rol">[];
  const regional = (regRes.data ?? []) as ConsolidadoRegional[];

  const submittedIds = reportes.map((r) => r.id);
  const idSet = new Set(submittedIds);
  const severidad = ((sevRes.data ?? []) as SeveridadRiesgo[]).filter((v) => v.reporte_id && idSet.has(v.reporte_id));

  // Hijas para CSV / conteos (solo reportes enviados/validados)
  let proyectos: Proyecto[] = [];
  let sistemas: SistemaActivo[] = [];
  let temas: TemaCritico[] = [];
  if (submittedIds.length) {
    const [p, s, t] = await Promise.all([
      supabase.from("proyectos").select("reporte_id").in("reporte_id", submittedIds),
      supabase.from("sistemas_activos").select("reporte_id, estado, licenciamiento").in("reporte_id", submittedIds),
      supabase.from("temas_criticos").select("*").in("reporte_id", submittedIds),
    ]);
    proyectos = (p.data ?? []) as Proyecto[];
    sistemas = (s.data ?? []) as SistemaActivo[];
    temas = (t.data ?? []) as TemaCritico[];
  }

  // Lookups
  const depByCodigo = new Map(departamentos.map((d) => [d.codigo, d]));
  const enlaceByCodigo = new Map<string, string>();
  perfiles.forEach((p) => {
    if (p.rol === "enlace" && p.departamento_codigo) enlaceByCodigo.set(p.departamento_codigo, p.nombre);
  });
  const repById = new Map(reportes.map((r) => [r.id, r]));

  // Conteos por reporte
  const nProy = new Map<string, number>();
  proyectos.forEach((p) => nProy.set(p.reporte_id, (nProy.get(p.reporte_id) ?? 0) + 1));
  const nSisInv = new Map<string, number>();
  const nSisFalla = new Map<string, number>();
  const nSisVenc = new Map<string, number>();
  sistemas.forEach((s) => {
    nSisInv.set(s.reporte_id, (nSisInv.get(s.reporte_id) ?? 0) + 1);
    if (s.estado && ["Operando con fallas", "Obsoleto", "Fuera de servicio"].includes(s.estado))
      nSisFalla.set(s.reporte_id, (nSisFalla.get(s.reporte_id) ?? 0) + 1);
    if (s.licenciamiento === "Vencido") nSisVenc.set(s.reporte_id, (nSisVenc.get(s.reporte_id) ?? 0) + 1);
  });
  const nTemas = new Map<string, number>();
  temas.forEach((t) => nTemas.set(t.reporte_id, (nTemas.get(t.reporte_id) ?? 0) + 1));
  const nRiesgos = new Map<string, number>();
  const nRiesgosAlta = new Map<string, number>();
  severidad.forEach((v) => {
    const id = v.reporte_id!;
    nRiesgos.set(id, (nRiesgos.get(id) ?? 0) + 1);
    if ((v.severidad ?? 0) >= 6) nRiesgosAlta.set(id, (nRiesgosAlta.get(id) ?? 0) + 1);
  });

  // ---- KPIs ----
  const regionesConInfo = new Set(reportes.map((r) => depByCodigo.get(r.departamento_codigo)?.region).filter(Boolean));
  let semCriticos = 0;
  reportes.forEach((r) => {
    DIMS.forEach((d) => {
      if ((r as Record<string, unknown>)[`sem_${d}`] === "critico") semCriticos++;
    });
  });
  const riesgosAltos = severidad.filter((v) => (v.severidad ?? 0) >= 6).length;
  const temasInmediatos = temas.filter((t) => (t.plazo ?? "").startsWith("Inmediato")).length;

  // ---- Mapa de calor: reportes agrupados por región ----
  const porRegion = new Map<string, Reporte[]>();
  reportes.forEach((r) => {
    const reg = depByCodigo.get(r.departamento_codigo)?.region ?? "Sin región";
    if (!porRegion.has(reg)) porRegion.set(reg, []);
    porRegion.get(reg)!.push(r);
  });
  const regionesOrdenadas = ordenarRegiones([...porRegion.keys()]);
  porRegion.forEach((arr) =>
    arr.sort((a, b) =>
      (depByCodigo.get(a.departamento_codigo)?.nombre ?? "").localeCompare(depByCodigo.get(b.departamento_codigo)?.nombre ?? ""),
    ),
  );

  // ---- Riesgos consolidados (ya ordenados por severidad desc) ----
  // ---- Temas ordenados por plazo ----
  const temasOrdenados = [...temas]
    .map((t) => {
      const dep = depByCodigo.get(repById.get(t.reporte_id)?.departamento_codigo ?? "");
      return { ...t, departamento: dep?.nombre ?? "", region: dep?.region ?? "" };
    })
    .sort((a, b) => (ORDEN_PLAZO[a.plazo ?? ""] ?? 9) - (ORDEN_PLAZO[b.plazo ?? ""] ?? 9));

  // ---- Distribución de semáforos (nacional y por región) para gráficos ----
  const distNacional = { critico: 0, riesgo: 0, estable: 0 };
  const distRegionMap = new Map<string, { critico: number; riesgo: number; estable: number }>();
  reportes.forEach((r) => {
    const reg = depByCodigo.get(r.departamento_codigo)?.region ?? "Sin región";
    if (!distRegionMap.has(reg)) distRegionMap.set(reg, { critico: 0, riesgo: 0, estable: 0 });
    DIMS.forEach((d) => {
      const v = (r as Record<string, unknown>)[`sem_${d}`];
      if (v === "critico" || v === "riesgo" || v === "estable") {
        distNacional[v]++;
        distRegionMap.get(reg)![v]++;
      }
    });
  });
  const coberturaGrafico = ordenarRegiones(
    regional.filter((x) => (x.departamentos_reportados ?? 0) > 0).map((x) => x.region ?? ""),
  ).map((reg) => {
    const row = regional.find((x) => x.region === reg)!;
    return { region: reg, c4: row.prom_cobertura_4g, c5: row.prom_cobertura_5g, hogares: row.prom_hogares_internet };
  });
  const semaforoRegionGrafico = ordenarRegiones([...distRegionMap.keys()]).map((reg) => ({
    region: reg,
    dist: distRegionMap.get(reg)!,
  }));

  // ---- Filas CSV ----
  const regionRank = (reg: string) => {
    const i = ORDEN_REGIONES.indexOf(reg);
    return i < 0 ? 99 : i;
  };
  const filasCSV = [...reportes]
    .sort((a, b) => {
      const da = depByCodigo.get(a.departamento_codigo);
      const db = depByCodigo.get(b.departamento_codigo);
      return (regionRank(da?.region ?? "") - regionRank(db?.region ?? "")) || (da?.nombre ?? "").localeCompare(db?.nombre ?? "");
    })
    .map((r) => {
      const dep = depByCodigo.get(r.departamento_codigo);
      return [
        dep?.region ?? "",
        dep?.nombre ?? "",
        enlaceByCodigo.get(r.departamento_codigo) ?? "",
        r.fecha_corte,
        r.cobertura_4g,
        r.cobertura_5g,
        r.hogares_internet,
        r.total_municipios,
        r.municipios_sin_cobertura,
        r.programas_talento,
        r.personas_formadas,
        r.municipios_tramites_linea,
        r.tramites_gobernacion,
        r.mipymes_beneficiadas,
        r.incidentes_ciber,
        r.plan_transformacion,
        r.capacidad_respuesta_ciber,
        r.dependencia,
        r.presupuesto_tic,
        r.personal_tic,
        nSisInv.get(r.id) ?? 0,
        nSisFalla.get(r.id) ?? 0,
        nSisVenc.get(r.id) ?? 0,
        r.contratos_vigentes,
        r.inventario,
        r.politica_seguridad,
        SEM_ETIQUETA[r.sem_conectividad ?? ""] ?? "",
        SEM_ETIQUETA[r.sem_barreras ?? ""] ?? "",
        SEM_ETIQUETA[r.sem_proyectos ?? ""] ?? "",
        SEM_ETIQUETA[r.sem_apropiacion ?? ""] ?? "",
        SEM_ETIQUETA[r.sem_capacidad ?? ""] ?? "",
        nProy.get(r.id) ?? 0,
        nRiesgos.get(r.id) ?? 0,
        nRiesgosAlta.get(r.id) ?? 0,
        nTemas.get(r.id) ?? 0,
      ];
    });

  const kpis = [
    { v: `${reportes.length}/${TOTAL_DEPTOS}`, l: "Reportes recibidos" },
    { v: regionesConInfo.size, l: "Regiones con información" },
    { v: semCriticos, l: "Semáforos en crítico", alerta: true },
    { v: riesgosAltos, l: "Riesgos de severidad alta" },
    { v: temasInmediatos, l: "Temas de activación inmediata" },
  ];

  const numFmt = (n: number | null) => (n === null || n === undefined ? "s/i" : Number(n).toLocaleString("es-CO"));
  const pctFmt = (n: number | null) => (n === null || n === undefined ? "s/i" : `${Number(n).toFixed(1)}%`);

  return (
    <>
      <Masthead
        titulo="Consolidador Regional de Estado Territorial"
        subtitulo="Tablero agregado por regiones de Colombia con los reportes enviados por los enlaces departamentales."
        perfil={perfil}
      >
        <AccionesConsolidado filasCSV={filasCSV} />
      </Masthead>

      <main className="mx-auto grid w-full max-w-[1240px] flex-1 gap-5 px-6 py-6">
        {reportes.length === 0 ? (
          <div className="rounded-xl border border-line bg-card p-10 text-center text-steel">
            Aún no hay reportes enviados. Cuando un enlace envíe su reporte, aparecerá aquí al instante.
          </div>
        ) : (
          <>
            {/* KPIs */}
            <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-5">
              {kpis.map((k) => (
                <div key={k.l} className="rounded-[10px] border border-line bg-card px-4 py-4">
                  <div className={`font-display text-3xl font-bold leading-none [font-variation-settings:'wdth'_110] ${k.alerta ? "text-rojo" : ""}`}>
                    {k.v}
                  </div>
                  <div className="etiqueta mt-2">{k.l}</div>
                </div>
              ))}
            </div>

            {/* Panel gráfico */}
            <GraficosConsolidado
              distNacional={distNacional}
              cobertura={coberturaGrafico}
              semaforoRegion={semaforoRegionGrafico}
            />

            {/* Mapa de calor */}
            <Bloque titulo="Mapa de calor · Semáforos por departamento" hint="Agrupado por región">
              <table className="w-full border-collapse text-[13.5px]">
                <thead>
                  <tr>
                    {["Departamento", "Conectividad", "Barreras", "Proyectos", "Apropiación", "Capacidad", "Enlace", "Estado", "Corte"].map((h) => (
                      <Th key={h} centro={!["Departamento", "Enlace"].includes(h)}>{h}</Th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {regionesOrdenadas.map((reg) => (
                    <RegionGroup key={reg} reg={reg} n={porRegion.get(reg)!.length} cols={9}>
                      {porRegion.get(reg)!.map((r) => {
                        const dep = depByCodigo.get(r.departamento_codigo)!;
                        return (
                          <tr key={r.id} className="hover:bg-paper">
                            <Td>
                              <Link href={`/reportes/${dep.codigo}`} className="font-semibold text-link hover:underline">
                                {dep.nombre}
                              </Link>
                            </Td>
                            {DIMS.map((d) => {
                              const val = (r as Record<string, unknown>)[`sem_${d}`] as string | null;
                              return (
                                <Td key={d} centro>
                                  <Pill v={val} />
                                </Td>
                              );
                            })}
                            <Td>{enlaceByCodigo.get(dep.codigo) ?? "—"}</Td>
                            <Td centro>
                              <span className="font-mono text-[11px] uppercase text-steel">{ESTADO_REPORTE_LABEL[r.estado]}</span>
                            </Td>
                            <Td centro>{r.fecha_corte ?? "—"}</Td>
                          </tr>
                        );
                      })}
                    </RegionGroup>
                  ))}
                </tbody>
              </table>
            </Bloque>

            {/* Tabla regional */}
            <Bloque titulo="Indicadores agregados por región" hint="Promedios sobre los departamentos reportados">
              <table className="w-full border-collapse text-[13.5px]">
                <thead>
                  <tr>
                    <Th>Región</Th>
                    <Th centro>Deptos.</Th>
                    <Th centro>4G prom.</Th>
                    <Th centro>5G prom.</Th>
                    <Th centro>Hogares internet</Th>
                    <Th centro>Mpios. sin cobertura</Th>
                    <Th centro>Personas formadas</Th>
                    <Th centro>Mpios. trámites en línea</Th>
                    <Th centro>Riesgos alta sev.</Th>
                    <Th centro>Semáforos críticos</Th>
                  </tr>
                </thead>
                <tbody>
                  {ordenarRegiones(regional.filter((x) => (x.departamentos_reportados ?? 0) > 0).map((x) => x.region ?? "")).map((reg) => {
                    const row = regional.find((x) => x.region === reg);
                    if (!row) return null;
                    return (
                      <tr key={reg} className="hover:bg-paper">
                        <Td><strong>{reg}</strong></Td>
                        <Td centro>{row.departamentos_reportados ?? 0}</Td>
                        <Td centro>{pctFmt(row.prom_cobertura_4g)}</Td>
                        <Td centro>{pctFmt(row.prom_cobertura_5g)}</Td>
                        <Td centro>{pctFmt(row.prom_hogares_internet)}</Td>
                        <Td centro>{numFmt(row.mpios_sin_cobertura)}</Td>
                        <Td centro>{numFmt(row.personas_formadas)}</Td>
                        <Td centro>{numFmt(row.mpios_tramites_linea)}</Td>
                        <Td centro><Alerta n={row.riesgos_alta_severidad} /></Td>
                        <Td centro><Alerta n={row.semaforos_criticos} /></Td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </Bloque>

            {/* Riesgos consolidados */}
            <Bloque titulo="Riesgos consolidados" hint="Ordenados por severidad (probabilidad × impacto)">
              <table className="w-full border-collapse text-[13.5px]">
                <thead>
                  <tr>{["Severidad", "Región", "Departamento", "Dimensión", "Riesgo", "Acción sugerida"].map((h) => <Th key={h}>{h}</Th>)}</tr>
                </thead>
                <tbody>
                  {severidad.length ? (
                    severidad.map((v) => {
                      const sev = severidadDe(v.probabilidad, v.impacto);
                      return (
                        <tr key={v.id} className="hover:bg-paper">
                          <Td><span className={`font-mono text-[11px] font-medium ${sev.clase}`}>{sev.t}</span></Td>
                          <Td>{v.region}</Td>
                          <Td>{v.departamento}</Td>
                          <Td>{v.dimension}</Td>
                          <Td>{v.descripcion}</Td>
                          <Td>{v.accion}</Td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr><Td centro>Ningún reporte registra riesgos.</Td></tr>
                  )}
                </tbody>
              </table>
            </Bloque>

            {/* Agenda de temas críticos */}
            <Bloque titulo="Agenda de temas críticos" hint="Insumo para los primeros 100 días">
              <table className="w-full border-collapse text-[13.5px]">
                <thead>
                  <tr>{["Plazo", "Región", "Departamento", "Tema", "Responsable sugerido"].map((h) => <Th key={h}>{h}</Th>)}</tr>
                </thead>
                <tbody>
                  {temasOrdenados.length ? (
                    temasOrdenados.map((t) => (
                      <tr key={t.id} className="hover:bg-paper">
                        <Td>{t.plazo}</Td>
                        <Td>{t.region}</Td>
                        <Td>{t.departamento}</Td>
                        <Td>{t.tema}</Td>
                        <Td>{t.responsable}</Td>
                      </tr>
                    ))
                  ) : (
                    <tr><Td centro>Ningún reporte registra temas críticos.</Td></tr>
                  )}
                </tbody>
              </table>
            </Bloque>
          </>
        )}
      </main>
    </>
  );
}

// --- Subcomponentes ---
function Bloque({ titulo, hint, children }: { titulo: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="overflow-hidden rounded-[10px] border border-line bg-card">
      <div className="flex items-baseline gap-3 border-b border-line bg-gradient-to-b from-white to-[#FAFBFC] px-5 py-3.5">
        <h2 className="font-display text-[17px] font-bold [font-variation-settings:'wdth'_106]">{titulo}</h2>
        {hint && <span className="ml-auto text-xs text-steel print:hidden">{hint}</span>}
      </div>
      <div className="overflow-x-auto px-5 py-4">{children}</div>
    </section>
  );
}
function Th({ children, centro }: { children: React.ReactNode; centro?: boolean }) {
  return (
    <th className={`whitespace-nowrap border-b-2 border-line px-2 py-2 font-mono text-[10.5px] uppercase tracking-wide text-steel ${centro ? "text-center" : "text-left"}`}>
      {children}
    </th>
  );
}
function Td({ children, centro }: { children: React.ReactNode; centro?: boolean }) {
  return <td className={`border-b border-line px-2 py-2 align-top ${centro ? "text-center" : ""}`}>{children}</td>;
}
function Pill({ v }: { v: string | null }) {
  return (
    <span className={`inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 font-mono text-[11px] font-medium ${pillClase(v)}`}>
      {v ? SEM_ETIQUETA[v] : "s/i"}
    </span>
  );
}
function Alerta({ n }: { n: number | null }) {
  const val = n ?? 0;
  return val ? <span className="font-mono text-[11px] font-medium text-rojo">{val}</span> : <span>0</span>;
}
function RegionGroup({ reg, n, cols, children }: { reg: string; n: number; cols: number; children: React.ReactNode }) {
  return (
    <>
      <tr>
        <td colSpan={cols} className="bg-[#EDF1F5] px-2 py-1.5 font-display text-[13px] font-bold tracking-wide">
          REGIÓN {reg.toUpperCase()} · {n} departamento(s)
        </td>
      </tr>
      {children}
    </>
  );
}
