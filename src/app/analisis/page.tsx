import Link from "next/link";
import { requirePerfil } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Masthead } from "@/components/masthead";
import { NavCentral } from "@/components/nav-central";
import { SelectorNivel } from "@/components/analisis/selector-nivel";
import { BotonExportarPdf } from "@/components/analisis/boton-exportar-pdf";
import { GraficosConsolidado, Dona, Barra } from "@/components/consolidado/graficos";
import { DIMS, SEM_ETIQUETA, pillClase, ordenarRegiones, ORDEN_PLAZO } from "@/lib/consolidado";
import { metricasDe, distDe, comparar, ordenarPorCriticidad, promedio, criticosDe } from "@/lib/analisis";
import type {
  Departamento,
  Reporte,
  ConsolidadoRegional,
  SeveridadRiesgo,
  TemaCritico,
} from "@/lib/database.types";

export const dynamic = "force-dynamic";
const TOTAL_DEPTOS = 33;

export default async function AnalisisPage({
  searchParams,
}: {
  searchParams: Promise<{ region?: string; depto?: string }>;
}) {
  const { perfil } = await requirePerfil(["central", "admin"]);
  const sp = await searchParams;
  const supabase = await createClient();

  const [depRes, repRes, regRes, sevRes] = await Promise.all([
    supabase.from("departamentos").select("*"),
    supabase.from("reportes").select("*").in("estado", ["enviado", "validado"]),
    supabase.from("v_consolidado_regional").select("*"),
    supabase.from("v_severidad_riesgos").select("*").order("severidad", { ascending: false }),
  ]);
  const departamentos = (depRes.data ?? []) as Departamento[];
  const reportes = (repRes.data ?? []) as Reporte[];
  const regional = (regRes.data ?? []) as ConsolidadoRegional[];
  const idSet = new Set(reportes.map((r) => r.id));
  const severidad = ((sevRes.data ?? []) as SeveridadRiesgo[]).filter((v) => v.reporte_id && idSet.has(v.reporte_id));

  let temas: TemaCritico[] = [];
  if (reportes.length) {
    const t = await supabase.from("temas_criticos").select("*").in("reporte_id", reportes.map((r) => r.id));
    temas = (t.data ?? []) as TemaCritico[];
  }

  const depByCodigo = new Map(departamentos.map((d) => [d.codigo, d]));
  const repByCodigo = new Map(reportes.map((r) => [r.departamento_codigo, r]));
  const repById = new Map(reportes.map((r) => [r.id, r]));

  const deptoSel = sp.depto && depByCodigo.has(sp.depto) ? sp.depto : "";
  const regionSel = deptoSel ? depByCodigo.get(deptoSel)!.region : sp.region ?? "";

  // Métricas nacionales (siempre, sirven de referencia)
  const nac = metricasDe(reportes, severidad, temas);

  return (
    <>
      <Masthead
        titulo="Análisis de la situación territorial TIC"
        subtitulo="Lectura de la situación en tres niveles: nacional, regional y departamental."
        perfil={perfil}
      />
      <main className="mx-auto grid w-full max-w-[1240px] flex-1 gap-5 px-6 py-6">
        <NavCentral activo="analisis" />
        <SelectorNivel departamentos={departamentos} regionSel={regionSel} deptoSel={deptoSel} />

        {reportes.length === 0 ? (
          <Vacio />
        ) : deptoSel ? (
          <AnalisisDepartamento
            codigo={deptoSel}
            depByCodigo={depByCodigo}
            reporte={repByCodigo.get(deptoSel) ?? null}
            reportes={reportes}
            regional={regional}
            severidad={severidad}
            temas={temas}
            nac={nac}
          />
        ) : regionSel ? (
          <AnalisisRegion
            region={regionSel}
            departamentos={departamentos}
            depByCodigo={depByCodigo}
            reportes={reportes}
            regional={regional}
            severidad={severidad}
            temas={temas}
            repById={repById}
            nac={nac}
          />
        ) : (
          <AnalisisNacional
            departamentos={departamentos}
            depByCodigo={depByCodigo}
            reportes={reportes}
            regional={regional}
            severidad={severidad}
            temas={temas}
            repById={repById}
            nac={nac}
          />
        )}
      </main>
    </>
  );
}

// ==================== NACIONAL ====================
function AnalisisNacional(p: {
  departamentos: Departamento[];
  depByCodigo: Map<string, Departamento>;
  reportes: Reporte[];
  regional: ConsolidadoRegional[];
  severidad: SeveridadRiesgo[];
  temas: TemaCritico[];
  repById: Map<string, Reporte>;
  nac: ReturnType<typeof metricasDe>;
}) {
  const { nac, reportes, regional, depByCodigo, severidad } = p;
  const conDatos = regional.filter((x) => (x.departamentos_reportados ?? 0) > 0);
  const porMejor4g = [...conDatos].sort((a, b) => (b.prom_cobertura_4g ?? -1) - (a.prom_cobertura_4g ?? -1));
  const mejor = porMejor4g[0];
  const peor = porMejor4g[porMejor4g.length - 1];
  const masCriticos = [...conDatos].sort((a, b) => (b.semaforos_criticos ?? 0) - (a.semaforos_criticos ?? 0))[0];
  const deptoCritico = ordenarPorCriticidad(reportes, depByCodigo)[0];
  const brecha = mejor && peor && mejor.prom_cobertura_4g !== null && peor.prom_cobertura_4g !== null
    ? Number(mejor.prom_cobertura_4g) - Number(peor.prom_cobertura_4g) : null;

  const coberturaGrafico = ordenarRegiones(conDatos.map((x) => x.region ?? "")).map((reg) => {
    const row = regional.find((x) => x.region === reg)!;
    return { region: reg, c4: row.prom_cobertura_4g, c5: row.prom_cobertura_5g, hogares: row.prom_hogares_internet };
  });
  const distRegion = new Map<string, ReturnType<typeof distDe>>();
  reportes.forEach((r) => {
    const reg = depByCodigo.get(r.departamento_codigo)?.region ?? "—";
    distRegion.set(reg, distDe(reportes.filter((x) => depByCodigo.get(x.departamento_codigo)?.region === reg)));
  });
  const semaforoRegion = ordenarRegiones([...distRegion.keys()]).map((reg) => ({ region: reg, dist: distRegion.get(reg)! }));

  return (
    <>
      <StatRow items={[
        { v: `${nac.reportes}/${TOTAL_DEPTOS}`, l: "Reportes recibidos" },
        { v: pct(nac.prom4g), l: "Cobertura 4G promedio" },
        { v: pct(nac.prom5g), l: "Cobertura 5G promedio" },
        { v: pct(nac.promHogares), l: "Hogares con internet" },
        { v: nac.mpiosSinCobertura, l: "Mpios. sin cobertura" },
        { v: nac.dist.critico, l: "Semáforos críticos", alerta: true },
      ]} />

      <GraficosConsolidado distNacional={nac.dist} cobertura={coberturaGrafico} semaforoRegion={semaforoRegion} />

      <Hallazgos titulo="Hallazgos nacionales" items={[
        `${nac.reportes} de ${TOTAL_DEPTOS} departamentos han enviado su reporte (${Math.round((nac.reportes / TOTAL_DEPTOS) * 100)}% del país).`,
        mejor ? `Mejor cobertura 4G: región ${mejor.region} (${pct(mejor.prom_cobertura_4g)}). Menor: ${peor?.region} (${pct(peor?.prom_cobertura_4g)}).` : "",
        brecha !== null ? `Brecha de cobertura 4G entre regiones: ${brecha.toFixed(1)} puntos porcentuales.` : "",
        masCriticos ? `Región con más semáforos en crítico: ${masCriticos.region} (${masCriticos.semaforos_criticos}).` : "",
        deptoCritico ? `Departamento en estado más crítico: ${deptoCritico.departamento.nombre} (${deptoCritico.criticos} de 5 dimensiones en rojo).` : "",
        `Riesgos de alta severidad en el país: ${nac.riesgosAltos}. Temas de activación inmediata: ${nac.temasInmediatos}.`,
      ].filter(Boolean)} />

      <Bloque titulo="Ranking por región" hint="Ordenado por cobertura 4G">
        <Tabla headers={["Región", "Deptos.", "4G prom.", "5G prom.", "Hogares", "Sem. críticos", "Riesgos altos"]}
          rows={porMejor4g.map((x) => [
            <Link key="r" href={`/analisis?region=${encodeURIComponent(x.region ?? "")}`} className="font-semibold text-link hover:underline">{x.region}</Link>,
            x.departamentos_reportados ?? 0, pct(x.prom_cobertura_4g), pct(x.prom_cobertura_5g), pct(x.prom_hogares_internet),
            alerta(x.semaforos_criticos), alerta(x.riesgos_alta_severidad),
          ])} />
      </Bloque>

      <Bloque titulo="Riesgos más severos del país" hint="Top 8">
        <Tabla headers={["Severidad", "Región", "Departamento", "Dimensión", "Riesgo"]}
          vacio="Sin riesgos registrados."
          rows={severidad.slice(0, 8).map((v) => [sevPill(v.severidad), v.region, v.departamento, v.dimension, v.descripcion])} />
      </Bloque>
    </>
  );
}

// ==================== REGIONAL ====================
function AnalisisRegion(p: {
  region: string;
  departamentos: Departamento[];
  depByCodigo: Map<string, Departamento>;
  reportes: Reporte[];
  regional: ConsolidadoRegional[];
  severidad: SeveridadRiesgo[];
  temas: TemaCritico[];
  repById: Map<string, Reporte>;
  nac: ReturnType<typeof metricasDe>;
}) {
  const { region, departamentos, depByCodigo, reportes, severidad, temas, repById, nac } = p;
  const deptosRegion = departamentos.filter((d) => d.region === region);
  const repsRegion = reportes.filter((r) => depByCodigo.get(r.departamento_codigo)?.region === region);
  const idsRegion = new Set(repsRegion.map((r) => r.id));
  const sevRegion = severidad.filter((v) => v.reporte_id && idsRegion.has(v.reporte_id));
  const temasRegion = temas.filter((t) => idsRegion.has(t.reporte_id));
  const m = metricasDe(repsRegion, sevRegion, temasRegion);
  const ranking = ordenarPorCriticidad(repsRegion, depByCodigo);
  const deptoCritico = ranking[0];

  const c4 = comparar(m.prom4g, nac.prom4g);
  const c5 = comparar(m.prom5g, nac.prom5g);
  const cH = comparar(m.promHogares, nac.promHogares);

  return (
    <>
      <Breadcrumb region={region} />
      <StatRow items={[
        { v: `${repsRegion.length}/${deptosRegion.length}`, l: "Deptos. reportados" },
        { v: pct(m.prom4g), l: "Cobertura 4G" },
        { v: pct(m.prom5g), l: "Cobertura 5G" },
        { v: pct(m.promHogares), l: "Hogares internet" },
        { v: m.dist.critico, l: "Semáforos críticos", alerta: true },
        { v: m.riesgosAltos, l: "Riesgos altos", alerta: true },
      ]} />

      <div className="grid gap-5 lg:grid-cols-2">
        <Bloque titulo="Distribución de semáforos" hint={`Región ${region}`}>
          <Dona dist={m.dist} />
        </Bloque>
        <Bloque titulo="Cobertura de la región vs. nacional" hint="promedios">
          <div className="grid gap-3">
            <ComparaBarra label="4G" region={m.prom4g} nacional={nac.prom4g} c={c4} />
            <ComparaBarra label="5G" region={m.prom5g} nacional={nac.prom5g} c={c5} />
            <ComparaBarra label="Hogares" region={m.promHogares} nacional={nac.promHogares} c={cH} />
          </div>
        </Bloque>
      </div>

      <Hallazgos titulo={`Hallazgos · Región ${region}`} items={[
        `Reportaron ${repsRegion.length} de ${deptosRegion.length} departamentos de la región.`,
        deptoCritico ? `Departamento más crítico: ${deptoCritico.departamento.nombre} (${deptoCritico.criticos} de 5 dimensiones en rojo).` : "",
        c4.delta !== null ? `Cobertura 4G ${c4.delta >= 0 ? "por encima" : "por debajo"} del promedio nacional (${c4.signo}${c4.delta.toFixed(1)} pts).` : "",
        `Semáforos en crítico: ${m.dist.critico}. Riesgos de alta severidad: ${m.riesgosAltos}. Temas inmediatos: ${m.temasInmediatos}.`,
      ].filter(Boolean)} />

      <Bloque titulo="Departamentos de la región" hint="Ordenados por criticidad">
        <Tabla headers={["Departamento", ...DIMS.map((d) => d[0].toUpperCase() + d.slice(1)), "4G", "Estado"]}
          rows={ranking.map(({ reporte, departamento }) => [
            <Link key="d" href={`/analisis?depto=${departamento.codigo}`} className="font-semibold text-link hover:underline">{departamento.nombre}</Link>,
            ...DIMS.map((d) => <Pill key={d} v={(reporte as Record<string, unknown>)[`sem_${d}`] as string | null} />),
            pct(reporte.cobertura_4g),
            <span key="e" className="font-mono text-[11px] uppercase text-steel">{reporte.estado}</span>,
          ])} />
      </Bloque>

      <div className="grid gap-5 lg:grid-cols-2">
        <Bloque titulo="Riesgos de la región" hint="por severidad">
          <Tabla headers={["Sev.", "Departamento", "Riesgo"]} vacio="Sin riesgos."
            rows={sevRegion.slice(0, 10).map((v) => [sevPill(v.severidad), v.departamento, v.descripcion])} />
        </Bloque>
        <Bloque titulo="Temas críticos de la región" hint="por plazo">
          <Tabla headers={["Plazo", "Departamento", "Tema"]} vacio="Sin temas."
            rows={[...temasRegion].sort((a, b) => (ORDEN_PLAZO[a.plazo ?? ""] ?? 9) - (ORDEN_PLAZO[b.plazo ?? ""] ?? 9))
              .map((t) => [t.plazo, depByCodigo.get(repById.get(t.reporte_id)?.departamento_codigo ?? "")?.nombre ?? "", t.tema])} />
        </Bloque>
      </div>
    </>
  );
}

// ==================== DEPARTAMENTO ====================
function AnalisisDepartamento(p: {
  codigo: string;
  depByCodigo: Map<string, Departamento>;
  reporte: Reporte | null;
  reportes: Reporte[];
  regional: ConsolidadoRegional[];
  severidad: SeveridadRiesgo[];
  temas: TemaCritico[];
  nac: ReturnType<typeof metricasDe>;
}) {
  const { codigo, depByCodigo, reporte, reportes, severidad, temas, nac } = p;
  const dep = depByCodigo.get(codigo)!;
  const region = dep.region;
  const repsRegion = reportes.filter((r) => depByCodigo.get(r.departamento_codigo)?.region === region);
  const promRegion = {
    c4: promedio(repsRegion.map((r) => r.cobertura_4g)),
    c5: promedio(repsRegion.map((r) => r.cobertura_5g)),
    h: promedio(repsRegion.map((r) => r.hogares_internet)),
  };

  if (!reporte) {
    return (
      <>
        <FilaBreadcrumb>
          <Breadcrumb region={region} depto={dep.nombre} />
          <BotonExportarPdf nombreArchivo={`Analisis_TIC_${dep.nombre}`} />
        </FilaBreadcrumb>
        <Bloque titulo={`${dep.nombre} · ${region}`}>
          <p className="text-sm text-steel">Este departamento aún no ha enviado su reporte, por lo que no hay análisis disponible.</p>
        </Bloque>
      </>
    );
  }

  const r = reporte;
  const sevDep = severidad.filter((v) => v.reporte_id === r.id);
  const temasDep = temas.filter((t) => t.reporte_id === r.id);
  const criticos = criticosDe(r);

  const filasComp: [string, number | null, number | null, number | null][] = [
    ["Cobertura 4G (%)", r.cobertura_4g, promRegion.c4, nac.prom4g],
    ["Cobertura 5G (%)", r.cobertura_5g, promRegion.c5, nac.prom5g],
    ["Hogares con internet (%)", r.hogares_internet, promRegion.h, nac.promHogares],
  ];

  return (
    <>
      <FilaBreadcrumb>
        <Breadcrumb region={region} depto={dep.nombre} />
        <BotonExportarPdf nombreArchivo={`Analisis_TIC_${dep.nombre}_${r.fecha_corte ?? ""}`} />
      </FilaBreadcrumb>

      <Bloque titulo={`${dep.nombre} · Región ${region}`} hint={`Reporte ${r.estado}${r.fecha_corte ? ` · corte ${r.fecha_corte}` : ""}`}>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {DIMS.map((d) => {
            const v = (r as Record<string, unknown>)[`sem_${d}`] as string | null;
            return (
              <div key={d} className="rounded-[10px] border border-line px-3 py-3">
                <div className="etiqueta mb-1.5 capitalize">{d}</div>
                <Pill v={v} />
              </div>
            );
          })}
        </div>
      </Bloque>

      <Bloque titulo="Indicadores vs. su región y el país" hint="comparación de cobertura">
        <Tabla headers={["Indicador", "Departamento", "Prom. región", "Prom. nacional", "Vs. región"]}
          rows={filasComp.map(([label, val, reg, nacv]) => {
            const c = comparar(val, reg);
            return [label, pct(val), pct(reg), pct(nacv),
              c.delta === null ? <span key="x" className="text-steel">—</span> : <span key="x" className={`font-mono text-[12px] ${c.tono}`}>{c.signo}{c.delta.toFixed(1)} pts</span>];
          })} />
      </Bloque>

      <Hallazgos titulo={`Hallazgos · ${dep.nombre}`} items={[
        criticos > 0 ? `${criticos} de 5 dimensiones están en estado crítico.` : "Ninguna dimensión está en estado crítico.",
        comparar(r.cobertura_4g, nac.prom4g).delta !== null
          ? `Su cobertura 4G está ${Number(r.cobertura_4g) >= (nac.prom4g ?? 0) ? "por encima" : "por debajo"} del promedio nacional.` : "",
        `Registra ${sevDep.length} riesgo(s) (${sevDep.filter((v) => (v.severidad ?? 0) >= 6).length} de alta severidad) y ${temasDep.length} tema(s) crítico(s).`,
        r.municipios_sin_cobertura !== null ? `Municipios sin cobertura o con cobertura parcial: ${r.municipios_sin_cobertura}.` : "",
      ].filter(Boolean)} />

      <div className="grid gap-5 lg:grid-cols-2">
        <Bloque titulo="Riesgos del departamento" hint="por severidad">
          <Tabla headers={["Sev.", "Dimensión", "Riesgo", "Acción"]} vacio="Sin riesgos registrados."
            rows={[...sevDep].sort((a, b) => (b.severidad ?? 0) - (a.severidad ?? 0)).map((v) => [sevPill(v.severidad), v.dimension, v.descripcion, v.accion])} />
        </Bloque>
        <Bloque titulo="Temas críticos" hint="agenda">
          <Tabla headers={["Plazo", "Tema", "Responsable"]} vacio="Sin temas registrados."
            rows={[...temasDep].sort((a, b) => (ORDEN_PLAZO[a.plazo ?? ""] ?? 9) - (ORDEN_PLAZO[b.plazo ?? ""] ?? 9)).map((t) => [t.plazo, t.tema, t.responsable])} />
        </Bloque>
      </div>

      <div className="print:hidden">
        <Link href={`/reportes/${dep.codigo}`} className="text-sm font-semibold text-link hover:underline">
          Ver el reporte completo de {dep.nombre} →
        </Link>
      </div>
    </>
  );
}

// ==================== Presentación ====================
function Vacio() {
  return (
    <div className="rounded-xl border border-line bg-card p-10 text-center text-steel">
      Aún no hay reportes enviados. El análisis se generará automáticamente cuando los enlaces envíen su información.
    </div>
  );
}
function FilaBreadcrumb({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-wrap items-center justify-between gap-2">{children}</div>;
}
function Breadcrumb({ region, depto }: { region: string; depto?: string }) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-sm text-steel print:hidden">
      <Link href="/analisis" className="font-semibold text-link hover:underline">Nacional</Link>
      <span>›</span>
      <Link href={`/analisis?region=${encodeURIComponent(region)}`} className={depto ? "font-semibold text-link hover:underline" : "font-semibold text-ink"}>{region}</Link>
      {depto && (<><span>›</span><span className="font-semibold text-ink">{depto}</span></>)}
    </div>
  );
}
function StatRow({ items }: { items: { v: React.ReactNode; l: string; alerta?: boolean }[] }) {
  return (
    <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-6">
      {items.map((k, i) => (
        <div key={i} className="rounded-[10px] border border-line bg-card px-4 py-4">
          <div className={`font-display text-2xl font-bold leading-none [font-variation-settings:'wdth'_110] ${k.alerta && k.v !== 0 ? "text-rojo" : ""}`}>{k.v}</div>
          <div className="etiqueta mt-2">{k.l}</div>
        </div>
      ))}
    </div>
  );
}
function Hallazgos({ titulo, items }: { titulo: string; items: string[] }) {
  return (
    <section className="rounded-[10px] border border-line bg-card">
      <div className="border-b border-line bg-gradient-to-b from-white to-[#FAFBFC] px-5 py-3.5">
        <h2 className="font-display text-[17px] font-bold [font-variation-settings:'wdth'_106]">{titulo}</h2>
      </div>
      <ul className="grid gap-2 px-5 py-4">
        {items.map((t, i) => (
          <li key={i} className="flex gap-2.5 text-[14px]">
            <span className="mt-1.5 h-1.5 w-1.5 flex-none rounded-full bg-steel" />
            <span>{t}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
function Bloque({ titulo, hint, children }: { titulo: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="overflow-hidden rounded-[10px] border border-line bg-card">
      <div className="flex items-baseline gap-3 border-b border-line bg-gradient-to-b from-white to-[#FAFBFC] px-5 py-3.5">
        <h2 className="font-display text-[17px] font-bold [font-variation-settings:'wdth'_106]">{titulo}</h2>
        {hint && <span className="ml-auto text-xs text-steel">{hint}</span>}
      </div>
      <div className="overflow-x-auto px-5 py-4">{children}</div>
    </section>
  );
}
function Tabla({ headers, rows, vacio }: { headers: React.ReactNode[]; rows: React.ReactNode[][]; vacio?: string }) {
  if (!rows.length) return <p className="text-sm text-steel">{vacio ?? "Sin datos."}</p>;
  return (
    <table className="w-full border-collapse text-[13.5px]">
      <thead>
        <tr>{headers.map((h, i) => <th key={i} className="whitespace-nowrap border-b-2 border-line px-2 py-2 text-left font-mono text-[10.5px] uppercase tracking-wide text-steel">{h}</th>)}</tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i} className="hover:bg-paper">
            {row.map((c, j) => <td key={j} className="border-b border-line px-2 py-2 align-top">{c === null || c === undefined || c === "" ? <span className="text-steel">—</span> : c}</td>)}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
function ComparaBarra({ label, region, nacional, c }: { label: string; region: number | null; nacional: number | null; c: { signo: string; delta: number | null; tono: string } }) {
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between">
        <span className="font-mono text-[11px] uppercase text-steel">{label}</span>
        {c.delta !== null && <span className={`font-mono text-[11px] ${c.tono}`}>{c.signo}{c.delta.toFixed(1)} pts vs. país</span>}
      </div>
      <Barra label="Región" valor={region} color="bg-navy" />
      <div className="mt-1"><Barra label="País" valor={nacional} color="bg-steel" /></div>
    </div>
  );
}
function Pill({ v }: { v: string | null }) {
  return <span className={`inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 font-mono text-[11px] font-medium ${pillClase(v)}`}>{v ? SEM_ETIQUETA[v] : "s/i"}</span>;
}
function pct(n: number | null | undefined) {
  return n === null || n === undefined ? "s/i" : `${Number(n).toFixed(1)}%`;
}
function alerta(n: number | null | undefined) {
  const v = n ?? 0;
  return v ? <span className="font-mono font-medium text-rojo">{v}</span> : <span>0</span>;
}
function sevPill(sev: number | null | undefined) {
  const s = sev ?? 0;
  const t = s >= 6 ? "Alta" : s >= 3 ? "Media" : s ? "Baja" : "—";
  const tono = s >= 6 ? "text-rojo" : s >= 3 ? "text-ambar" : "text-verde";
  return <span className={`font-mono text-[11px] font-medium ${tono}`}>{t}</span>;
}
