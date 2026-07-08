import Link from "next/link";
import { requirePerfil } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Masthead } from "@/components/masthead";
import { NavCentral } from "@/components/nav-central";
import { SubNavCiudades } from "@/components/ciudades/sub-nav-ciudades";
import { AccionesCiudades } from "@/components/ciudades/acciones-ciudades";
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
import { promedio } from "@/lib/analisis";
import type {
  Ciudad,
  Perfil,
  ReporteCiudad,
  RiesgoCiudad,
  TemaCiudad,
  ProyectoCiudad,
} from "@/lib/database.types";

export const dynamic = "force-dynamic";
const TOTAL_CIUDADES = 32;

export default async function CiudadesPage() {
  const { perfil } = await requirePerfil(["central", "admin"]);
  const supabase = await createClient();

  const [ciuRes, repRes, perfRes] = await Promise.all([
    supabase.from("ciudades").select("*, departamentos(nombre)"),
    supabase.from("reportes_ciudad").select("*").in("estado", ["enviado", "validado"]),
    supabase.from("perfiles").select("id, nombre, ciudad_codigo, rol"),
  ]);

  const ciudades = (ciuRes.data ?? []) as (Ciudad & { departamentos?: { nombre?: string } })[];
  const reportes = (repRes.data ?? []) as ReporteCiudad[];
  const perfiles = (perfRes.data ?? []) as Pick<Perfil, "id" | "nombre" | "ciudad_codigo" | "rol">[];

  const ids = reportes.map((r) => r.id);
  let riesgos: RiesgoCiudad[] = [];
  let temas: TemaCiudad[] = [];
  let proyectos: ProyectoCiudad[] = [];
  if (ids.length) {
    const [r, t, p] = await Promise.all([
      supabase.from("riesgos_ciudad").select("*").in("reporte_id", ids),
      supabase.from("temas_ciudad").select("*").in("reporte_id", ids),
      supabase.from("proyectos_ciudad").select("reporte_id").in("reporte_id", ids),
    ]);
    riesgos = (r.data ?? []) as RiesgoCiudad[];
    temas = (t.data ?? []) as TemaCiudad[];
    proyectos = (p.data ?? []) as ProyectoCiudad[];
  }

  const ciuByCodigo = new Map(ciudades.map((c) => [c.codigo, c]));
  const repById = new Map(reportes.map((r) => [r.id, r]));
  const enlaceByCodigo = new Map<string, string>();
  perfiles.forEach((p) => { if (p.rol === "enlace_ciudad" && p.ciudad_codigo) enlaceByCodigo.set(p.ciudad_codigo, p.nombre); });

  // Semáforo dist (nacional + por región) y conteos
  const distNacional = { critico: 0, riesgo: 0, estable: 0 };
  const distRegion = new Map<string, { critico: number; riesgo: number; estable: number }>();
  reportes.forEach((r) => {
    const reg = ciuByCodigo.get(r.ciudad_codigo)?.region ?? "—";
    if (!distRegion.has(reg)) distRegion.set(reg, { critico: 0, riesgo: 0, estable: 0 });
    DIMS.forEach((d) => {
      const v = (r as Record<string, unknown>)[`sem_${d}`];
      if (v === "critico" || v === "riesgo" || v === "estable") { distNacional[v]++; distRegion.get(reg)![v]++; }
    });
  });

  // Riesgos con severidad, depto/ciudad
  const riesgosSev = riesgos
    .map((x) => {
      const rep = repById.get(x.reporte_id);
      const ciu = rep ? ciuByCodigo.get(rep.ciudad_codigo) : undefined;
      return { ...x, ciudad: ciu?.nombre ?? "", region: ciu?.region ?? "", sev: severidadDe(x.probabilidad, x.impacto) };
    })
    .sort((a, b) => b.sev.s - a.sev.s);

  const nRiesgos = new Map<string, number>();
  const nRiesgosAlta = new Map<string, number>();
  riesgos.forEach((x) => {
    nRiesgos.set(x.reporte_id, (nRiesgos.get(x.reporte_id) ?? 0) + 1);
    if (severidadDe(x.probabilidad, x.impacto).s >= 6) nRiesgosAlta.set(x.reporte_id, (nRiesgosAlta.get(x.reporte_id) ?? 0) + 1);
  });
  const nTemas = new Map<string, number>();
  temas.forEach((t) => nTemas.set(t.reporte_id, (nTemas.get(t.reporte_id) ?? 0) + 1));
  const nProy = new Map<string, number>();
  proyectos.forEach((p) => nProy.set(p.reporte_id, (nProy.get(p.reporte_id) ?? 0) + 1));

  // Agrupar por región
  const porRegion = new Map<string, ReporteCiudad[]>();
  reportes.forEach((r) => {
    const reg = ciuByCodigo.get(r.ciudad_codigo)?.region ?? "—";
    if (!porRegion.has(reg)) porRegion.set(reg, []);
    porRegion.get(reg)!.push(r);
  });
  const regionesOrdenadas = ordenarRegiones([...porRegion.keys()]);
  porRegion.forEach((arr) => arr.sort((a, b) => (ciuByCodigo.get(a.ciudad_codigo)?.nombre ?? "").localeCompare(ciuByCodigo.get(b.ciudad_codigo)?.nombre ?? "")));

  // Cobertura por región (para gráficos)
  const coberturaGrafico = regionesOrdenadas.map((reg) => {
    const rs = porRegion.get(reg)!;
    return {
      region: reg,
      c4: promedio(rs.map((r) => r.cobertura_4g)),
      c5: promedio(rs.map((r) => r.cobertura_5g)),
      hogares: promedio(rs.map((r) => r.hogares_internet)),
    };
  });
  const semaforoRegionGrafico = regionesOrdenadas.map((reg) => ({ region: reg, dist: distRegion.get(reg)! }));

  // KPIs
  const riesgosAltos = riesgosSev.filter((x) => x.sev.s >= 6).length;
  const temasInmediatos = temas.filter((t) => (t.plazo ?? "").startsWith("Inmediato")).length;
  const kpis = [
    { v: `${reportes.length}/${TOTAL_CIUDADES}`, l: "Ciudades recibidas" },
    { v: new Set(reportes.map((r) => ciuByCodigo.get(r.ciudad_codigo)?.region)).size, l: "Regiones con información" },
    { v: distNacional.critico, l: "Semáforos en crítico", alerta: true },
    { v: riesgosAltos, l: "Riesgos de severidad alta" },
    { v: temasInmediatos, l: "Temas de activación inmediata" },
  ];

  // CSV
  const regRank = (r: string) => { const i = ORDEN_REGIONES.indexOf(r); return i < 0 ? 99 : i; };
  const filasCSV = [...reportes]
    .sort((a, b) => {
      const ca = ciuByCodigo.get(a.ciudad_codigo); const cb = ciuByCodigo.get(b.ciudad_codigo);
      return (regRank(ca?.region ?? "") - regRank(cb?.region ?? "")) || (ca?.nombre ?? "").localeCompare(cb?.nombre ?? "");
    })
    .map((r) => {
      const c = ciuByCodigo.get(r.ciudad_codigo);
      return [
        c?.region ?? "", c?.nombre ?? "", c?.departamentos?.nombre ?? "", enlaceByCodigo.get(r.ciudad_codigo) ?? "",
        r.fecha_corte, r.cobertura_4g, r.cobertura_5g, r.hogares_internet, r.comunas_sin_cobertura, r.zonas_wifi_publico,
        r.tramites_municipales_linea, r.porcentaje_tramites_digital, r.pago_impuestos_linea, r.datos_abiertos,
        r.camaras_videovigilancia, r.centro_monitoreo, r.personal_tic, r.presupuesto_tic,
        SEM_ETIQUETA[r.sem_conectividad ?? ""] ?? "", SEM_ETIQUETA[r.sem_barreras ?? ""] ?? "", SEM_ETIQUETA[r.sem_proyectos ?? ""] ?? "",
        SEM_ETIQUETA[r.sem_apropiacion ?? ""] ?? "", SEM_ETIQUETA[r.sem_capacidad ?? ""] ?? "",
        nRiesgos.get(r.id) ?? 0, nRiesgosAlta.get(r.id) ?? 0, nTemas.get(r.id) ?? 0,
      ];
    });

  const pctFmt = (n: number | null) => (n === null || n === undefined ? "s/i" : `${Number(n).toFixed(1)}%`);

  return (
    <>
      <Masthead
        titulo="Consolidado de Ciudades Capitales"
        subtitulo="Estado TIC de las 32 ciudades capitales, agregado por regiones."
        perfil={perfil}
      >
        <AccionesCiudades filasCSV={filasCSV} />
      </Masthead>
      <main className="mx-auto grid w-full max-w-[1240px] flex-1 gap-5 px-6 py-6">
        <NavCentral activo="ciudades" />
        <SubNavCiudades activo="consolidado" />
        {reportes.length === 0 ? (
          <div className="rounded-xl border border-line bg-card p-10 text-center text-steel">
            Aún no hay reportes de ciudades enviados. Cuando un enlace de ciudad envíe su reporte, aparecerá aquí.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-5">
              {kpis.map((k) => (
                <div key={k.l} className="rounded-[10px] border border-line bg-card px-4 py-4">
                  <div className={`font-display text-3xl font-bold leading-none [font-variation-settings:'wdth'_110] ${k.alerta && k.v !== 0 ? "text-rojo" : ""}`}>{k.v}</div>
                  <div className="etiqueta mt-2">{k.l}</div>
                </div>
              ))}
            </div>

            <GraficosConsolidado distNacional={distNacional} cobertura={coberturaGrafico} semaforoRegion={semaforoRegionGrafico} />

            <Bloque titulo="Mapa de calor · Semáforos por ciudad" hint="Agrupado por región">
              <table className="w-full border-collapse text-[13.5px]">
                <thead>
                  <tr>{["Ciudad", "Conectividad", "Barreras", "Proyectos", "Ciudad inteligente", "Capacidad", "Enlace", "Estado", "Corte"].map((h) => (
                    <Th key={h} centro={!["Ciudad", "Enlace"].includes(h)}>{h}</Th>
                  ))}</tr>
                </thead>
                <tbody>
                  {regionesOrdenadas.map((reg) => (
                    <RegionGroup key={reg} reg={reg} n={porRegion.get(reg)!.length}>
                      {porRegion.get(reg)!.map((r) => {
                        const c = ciuByCodigo.get(r.ciudad_codigo)!;
                        return (
                          <tr key={r.id} className="hover:bg-paper">
                            <Td><Link href={`/reportes-ciudad/${c.codigo}`} className="font-semibold text-link hover:underline">{c.nombre}</Link></Td>
                            {DIMS.map((d) => <Td key={d} centro><Pill v={(r as Record<string, unknown>)[`sem_${d}`] as string | null} /></Td>)}
                            <Td>{enlaceByCodigo.get(c.codigo) ?? "—"}</Td>
                            <Td centro><span className="font-mono text-[11px] uppercase text-steel">{ESTADO_REPORTE_LABEL[r.estado]}</span></Td>
                            <Td centro>{r.fecha_corte ?? "—"}</Td>
                          </tr>
                        );
                      })}
                    </RegionGroup>
                  ))}
                </tbody>
              </table>
            </Bloque>

            <Bloque titulo="Indicadores por región" hint="Promedios sobre las ciudades reportadas">
              <table className="w-full border-collapse text-[13.5px]">
                <thead>
                  <tr>{["Región", "Ciudades", "4G prom.", "5G prom.", "Hogares", "Zonas WiFi", "Cámaras"].map((h, i) => <Th key={h} centro={i > 0}>{h}</Th>)}</tr>
                </thead>
                <tbody>
                  {regionesOrdenadas.map((reg) => {
                    const rs = porRegion.get(reg)!;
                    const wifi = rs.reduce((s, r) => s + (Number(r.zonas_wifi_publico) || 0), 0);
                    const cam = rs.reduce((s, r) => s + (Number(r.camaras_videovigilancia) || 0), 0);
                    return (
                      <tr key={reg} className="hover:bg-paper">
                        <Td><strong>{reg}</strong></Td>
                        <Td centro>{rs.length}</Td>
                        <Td centro>{pctFmt(promedio(rs.map((r) => r.cobertura_4g)))}</Td>
                        <Td centro>{pctFmt(promedio(rs.map((r) => r.cobertura_5g)))}</Td>
                        <Td centro>{pctFmt(promedio(rs.map((r) => r.hogares_internet)))}</Td>
                        <Td centro>{wifi.toLocaleString("es-CO")}</Td>
                        <Td centro>{cam.toLocaleString("es-CO")}</Td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </Bloque>

            <Bloque titulo="Riesgos consolidados de las ciudades" hint="Ordenados por severidad">
              <table className="w-full border-collapse text-[13.5px]">
                <thead><tr>{["Severidad", "Región", "Ciudad", "Dimensión", "Riesgo", "Acción sugerida"].map((h) => <Th key={h}>{h}</Th>)}</tr></thead>
                <tbody>
                  {riesgosSev.length ? riesgosSev.map((x) => (
                    <tr key={x.id} className="hover:bg-paper">
                      <Td><span className={`font-mono text-[11px] font-medium ${x.sev.clase}`}>{x.sev.t}</span></Td>
                      <Td>{x.region}</Td><Td>{x.ciudad}</Td><Td>{x.dimension}</Td><Td>{x.descripcion}</Td><Td>{x.accion}</Td>
                    </tr>
                  )) : <tr><Td centro>Ninguna ciudad registra riesgos.</Td></tr>}
                </tbody>
              </table>
            </Bloque>

            <Bloque titulo="Agenda de temas críticos de las ciudades" hint="Ordenados por plazo">
              <table className="w-full border-collapse text-[13.5px]">
                <thead><tr>{["Plazo", "Región", "Ciudad", "Tema", "Responsable"].map((h) => <Th key={h}>{h}</Th>)}</tr></thead>
                <tbody>
                  {temas.length ? [...temas]
                    .map((t) => { const rep = repById.get(t.reporte_id); const c = rep ? ciuByCodigo.get(rep.ciudad_codigo) : undefined; return { ...t, ciudad: c?.nombre ?? "", region: c?.region ?? "" }; })
                    .sort((a, b) => (ORDEN_PLAZO[a.plazo ?? ""] ?? 9) - (ORDEN_PLAZO[b.plazo ?? ""] ?? 9))
                    .map((t) => (
                      <tr key={t.id} className="hover:bg-paper"><Td>{t.plazo}</Td><Td>{t.region}</Td><Td>{t.ciudad}</Td><Td>{t.tema}</Td><Td>{t.responsable}</Td></tr>
                    )) : <tr><Td centro>Ninguna ciudad registra temas críticos.</Td></tr>}
                </tbody>
              </table>
            </Bloque>
          </>
        )}
      </main>
    </>
  );
}

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
  return <th className={`whitespace-nowrap border-b-2 border-line px-2 py-2 font-mono text-[10.5px] uppercase tracking-wide text-steel ${centro ? "text-center" : "text-left"}`}>{children}</th>;
}
function Td({ children, centro }: { children: React.ReactNode; centro?: boolean }) {
  return <td className={`border-b border-line px-2 py-2 align-top ${centro ? "text-center" : ""}`}>{children}</td>;
}
function Pill({ v }: { v: string | null }) {
  return <span className={`inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 font-mono text-[11px] font-medium ${pillClase(v)}`}>{v ? SEM_ETIQUETA[v] : "s/i"}</span>;
}
function RegionGroup({ reg, n, children }: { reg: string; n: number; children: React.ReactNode }) {
  return (
    <>
      <tr><td colSpan={9} className="bg-[#EDF1F5] px-2 py-1.5 font-display text-[13px] font-bold tracking-wide">REGIÓN {reg.toUpperCase()} · {n} ciudad(es)</td></tr>
      {children}
    </>
  );
}
