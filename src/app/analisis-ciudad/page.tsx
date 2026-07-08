import Link from "next/link";
import { requirePerfil } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Masthead } from "@/components/masthead";
import { NavCentral } from "@/components/nav-central";
import { SubNavCiudades } from "@/components/ciudades/sub-nav-ciudades";
import { SelectorNivelCiudad } from "@/components/analisis/selector-nivel-ciudad";
import { BotonExportarPdf } from "@/components/analisis/boton-exportar-pdf";
import { GraficosConsolidado, Dona, Barra } from "@/components/consolidado/graficos";
import { DIMS, SEM_ETIQUETA, pillClase, severidadDe, ordenarRegiones, ORDEN_PLAZO } from "@/lib/consolidado";
import { metricasCiudad, distCiudad, comparar, ordenarCiudadesPorCriticidad, promedio, criticosCiudad } from "@/lib/analisis";
import type { Ciudad, ReporteCiudad, RiesgoCiudad, TemaCiudad } from "@/lib/database.types";

export const dynamic = "force-dynamic";
const TOTAL_CIUDADES = 32;

export default async function AnalisisCiudadPage({ searchParams }: { searchParams: Promise<{ region?: string; ciudad?: string }> }) {
  const { perfil } = await requirePerfil(["central", "admin"]);
  const sp = await searchParams;
  const supabase = await createClient();

  const [ciuRes, repRes] = await Promise.all([
    supabase.from("ciudades").select("*"),
    supabase.from("reportes_ciudad").select("*").in("estado", ["enviado", "validado"]),
  ]);
  const ciudades = (ciuRes.data ?? []) as Ciudad[];
  const reportes = (repRes.data ?? []) as ReporteCiudad[];
  const ids = reportes.map((r) => r.id);
  let riesgos: RiesgoCiudad[] = [];
  let temas: TemaCiudad[] = [];
  if (ids.length) {
    const [r, t] = await Promise.all([
      supabase.from("riesgos_ciudad").select("*").in("reporte_id", ids),
      supabase.from("temas_ciudad").select("*").in("reporte_id", ids),
    ]);
    riesgos = (r.data ?? []) as RiesgoCiudad[];
    temas = (t.data ?? []) as TemaCiudad[];
  }

  const ciuByCodigo = new Map(ciudades.map((c) => [c.codigo, c]));
  const repByCodigo = new Map(reportes.map((r) => [r.ciudad_codigo, r]));
  const repById = new Map(reportes.map((r) => [r.id, r]));
  const ciudadSel = sp.ciudad && ciuByCodigo.has(sp.ciudad) ? sp.ciudad : "";
  const regionSel = ciudadSel ? ciuByCodigo.get(ciudadSel)!.region : sp.region ?? "";

  const riesgoRegionCiudad = (r: RiesgoCiudad) => ciuByCodigo.get(repById.get(r.reporte_id)?.ciudad_codigo ?? "");
  const nac = metricasCiudad(reportes, riesgos, temas);

  return (
    <>
      <Masthead titulo="Análisis de Ciudades Capitales" subtitulo="Lectura de la situación TIC en tres niveles: nacional, regional y por ciudad." perfil={perfil} />
      <main className="mx-auto grid w-full max-w-[1240px] flex-1 gap-5 px-6 py-6">
        <NavCentral activo="ciudades" />
        <SubNavCiudades activo="analisis" />
        <SelectorNivelCiudad ciudades={ciudades} regionSel={regionSel} ciudadSel={ciudadSel} />

        {reportes.length === 0 ? (
          <div className="rounded-xl border border-line bg-card p-10 text-center text-steel">Aún no hay reportes de ciudades. El análisis se generará cuando los enlaces de ciudad envíen su información.</div>
        ) : ciudadSel ? (
          <NivelCiudad codigo={ciudadSel} ciuByCodigo={ciuByCodigo} reporte={repByCodigo.get(ciudadSel) ?? null} reportes={reportes} riesgos={riesgos} temas={temas} nac={nac} riesgoRegionCiudad={riesgoRegionCiudad} />
        ) : regionSel ? (
          <NivelRegion region={regionSel} ciudades={ciudades} ciuByCodigo={ciuByCodigo} reportes={reportes} riesgos={riesgos} temas={temas} repById={repById} nac={nac} />
        ) : (
          <NivelNacional ciuByCodigo={ciuByCodigo} reportes={reportes} riesgos={riesgos} temas={temas} riesgoRegionCiudad={riesgoRegionCiudad} nac={nac} />
        )}
      </main>
    </>
  );
}

function NivelNacional(p: { ciuByCodigo: Map<string, Ciudad>; reportes: ReporteCiudad[]; riesgos: RiesgoCiudad[]; temas: TemaCiudad[]; riesgoRegionCiudad: (r: RiesgoCiudad) => Ciudad | undefined; nac: ReturnType<typeof metricasCiudad> }) {
  const { ciuByCodigo, reportes, riesgos, nac, riesgoRegionCiudad } = p;
  const porRegion = new Map<string, ReporteCiudad[]>();
  reportes.forEach((r) => {
    const reg = ciuByCodigo.get(r.ciudad_codigo)?.region ?? "—";
    if (!porRegion.has(reg)) porRegion.set(reg, []);
    porRegion.get(reg)!.push(r);
  });
  const regiones = ordenarRegiones([...porRegion.keys()]);
  const filaReg = regiones.map((reg) => {
    const rs = porRegion.get(reg)!;
    return { reg, n: rs.length, c4: promedio(rs.map((r) => r.cobertura_4g)), criticos: distCiudad(rs).critico };
  });
  const porMejor = [...filaReg].sort((a, b) => (b.c4 ?? -1) - (a.c4 ?? -1));
  const mejor = porMejor[0], peor = porMejor[porMejor.length - 1];
  const masCriticos = [...filaReg].sort((a, b) => b.criticos - a.criticos)[0];
  const ciudadCritica = ordenarCiudadesPorCriticidad(reportes, ciuByCodigo)[0];
  const brecha = mejor && peor && mejor.c4 !== null && peor.c4 !== null ? mejor.c4 - peor.c4 : null;

  const cobertura = regiones.map((reg) => { const rs = porRegion.get(reg)!; return { region: reg, c4: promedio(rs.map((r) => r.cobertura_4g)), c5: promedio(rs.map((r) => r.cobertura_5g)), hogares: promedio(rs.map((r) => r.hogares_internet)) }; });
  const semaforoRegion = regiones.map((reg) => ({ region: reg, dist: distCiudad(porRegion.get(reg)!) }));
  const riesgosSev = [...riesgos].map((x) => ({ ...x, ciudad: riesgoRegionCiudad(x)?.nombre ?? "", region: riesgoRegionCiudad(x)?.region ?? "", sev: severidadDe(x.probabilidad, x.impacto) })).sort((a, b) => b.sev.s - a.sev.s);

  return (
    <>
      <StatRow items={[
        { v: `${nac.reportes}/${TOTAL_CIUDADES}`, l: "Ciudades reportadas" },
        { v: pct(nac.prom4g), l: "Cobertura 4G promedio" },
        { v: pct(nac.prom5g), l: "Cobertura 5G promedio" },
        { v: pct(nac.promHogares), l: "Hogares con internet" },
        { v: nac.mpiosSinCobertura, l: "Comunas sin cobertura" },
        { v: nac.dist.critico, l: "Semáforos críticos", alerta: true },
      ]} />
      <GraficosConsolidado distNacional={nac.dist} cobertura={cobertura} semaforoRegion={semaforoRegion} />
      <Hallazgos titulo="Hallazgos nacionales · Ciudades" items={[
        `${nac.reportes} de ${TOTAL_CIUDADES} ciudades capitales han enviado su reporte (${Math.round((nac.reportes / TOTAL_CIUDADES) * 100)}%).`,
        mejor ? `Mejor cobertura 4G: región ${mejor.reg} (${pct(mejor.c4)}). Menor: ${peor?.reg} (${pct(peor?.c4)}).` : "",
        brecha !== null ? `Brecha de cobertura 4G entre regiones: ${brecha.toFixed(1)} puntos.` : "",
        masCriticos && masCriticos.criticos ? `Región con más semáforos críticos: ${masCriticos.reg} (${masCriticos.criticos}).` : "",
        ciudadCritica ? `Ciudad en estado más crítico: ${ciudadCritica.ciudad.nombre} (${ciudadCritica.criticos} de 5 dimensiones en rojo).` : "",
        `Riesgos de alta severidad: ${nac.riesgosAltos}. Temas de activación inmediata: ${nac.temasInmediatos}.`,
      ].filter(Boolean)} />
      <Bloque titulo="Ranking por región" hint="Cobertura 4G">
        <Tabla headers={["Región", "Ciudades", "4G prom.", "Sem. críticos"]} rows={porMejor.map((x) => [
          <Link key="r" href={`/analisis-ciudad?region=${encodeURIComponent(x.reg)}`} className="font-semibold text-link hover:underline">{x.reg}</Link>,
          x.n, pct(x.c4), x.criticos ? <span key="c" className="font-mono text-rojo">{x.criticos}</span> : 0,
        ])} />
      </Bloque>
      <Bloque titulo="Riesgos más severos de las ciudades" hint="Top 8">
        <Tabla headers={["Severidad", "Región", "Ciudad", "Dimensión", "Riesgo"]} vacio="Sin riesgos." rows={riesgosSev.slice(0, 8).map((x) => [<span key="s" className={`font-mono text-[11px] ${x.sev.clase}`}>{x.sev.t}</span>, x.region, x.ciudad, x.dimension, x.descripcion])} />
      </Bloque>
    </>
  );
}

function NivelRegion(p: { region: string; ciudades: Ciudad[]; ciuByCodigo: Map<string, Ciudad>; reportes: ReporteCiudad[]; riesgos: RiesgoCiudad[]; temas: TemaCiudad[]; repById: Map<string, ReporteCiudad>; nac: ReturnType<typeof metricasCiudad> }) {
  const { region, ciudades, ciuByCodigo, reportes, riesgos, temas, repById, nac } = p;
  const ciudadesRegion = ciudades.filter((c) => c.region === region);
  const reps = reportes.filter((r) => ciuByCodigo.get(r.ciudad_codigo)?.region === region);
  const idsReg = new Set(reps.map((r) => r.id));
  const riesgosReg = riesgos.filter((x) => idsReg.has(x.reporte_id));
  const temasReg = temas.filter((t) => idsReg.has(t.reporte_id));
  const m = metricasCiudad(reps, riesgosReg, temasReg);
  const ranking = ordenarCiudadesPorCriticidad(reps, ciuByCodigo);
  const c4 = comparar(m.prom4g, nac.prom4g);

  return (
    <>
      <Breadcrumb region={region} />
      <StatRow items={[
        { v: `${reps.length}/${ciudadesRegion.length}`, l: "Ciudades reportadas" },
        { v: pct(m.prom4g), l: "Cobertura 4G" },
        { v: pct(m.prom5g), l: "Cobertura 5G" },
        { v: pct(m.promHogares), l: "Hogares internet" },
        { v: m.dist.critico, l: "Semáforos críticos", alerta: true },
        { v: m.riesgosAltos, l: "Riesgos altos", alerta: true },
      ]} />
      <div className="grid gap-5 lg:grid-cols-2">
        <Bloque titulo="Distribución de semáforos" hint={`Región ${region}`}><Dona dist={m.dist} /></Bloque>
        <Bloque titulo="Cobertura de la región vs. nacional" hint="promedios">
          <div className="grid gap-3">
            <ComparaBarra label="4G" region={m.prom4g} nacional={nac.prom4g} c={comparar(m.prom4g, nac.prom4g)} />
            <ComparaBarra label="5G" region={m.prom5g} nacional={nac.prom5g} c={comparar(m.prom5g, nac.prom5g)} />
            <ComparaBarra label="Hogares" region={m.promHogares} nacional={nac.promHogares} c={comparar(m.promHogares, nac.promHogares)} />
          </div>
        </Bloque>
      </div>
      <Hallazgos titulo={`Hallazgos · Región ${region}`} items={[
        `Reportaron ${reps.length} de ${ciudadesRegion.length} ciudades de la región.`,
        ranking[0] ? `Ciudad más crítica: ${ranking[0].ciudad.nombre} (${ranking[0].criticos} de 5 dimensiones en rojo).` : "",
        c4.delta !== null ? `Cobertura 4G ${c4.delta >= 0 ? "por encima" : "por debajo"} del promedio nacional (${c4.signo}${c4.delta.toFixed(1)} pts).` : "",
        `Semáforos en crítico: ${m.dist.critico}. Riesgos altos: ${m.riesgosAltos}. Temas inmediatos: ${m.temasInmediatos}.`,
      ].filter(Boolean)} />
      <Bloque titulo="Ciudades de la región" hint="Ordenadas por criticidad">
        <Tabla headers={["Ciudad", ...DIMS.map((d) => d === "apropiacion" ? "C. inteligente" : d[0].toUpperCase() + d.slice(1)), "4G", "Estado"]}
          rows={ranking.map(({ reporte, ciudad }) => [
            <Link key="c" href={`/analisis-ciudad?ciudad=${ciudad.codigo}`} className="font-semibold text-link hover:underline">{ciudad.nombre}</Link>,
            ...DIMS.map((d) => <Pill key={d} v={(reporte as Record<string, unknown>)[`sem_${d}`] as string | null} />),
            pct(reporte.cobertura_4g),
            <span key="e" className="font-mono text-[11px] uppercase text-steel">{reporte.estado}</span>,
          ])} />
      </Bloque>
      <div className="grid gap-5 lg:grid-cols-2">
        <Bloque titulo="Riesgos de la región" hint="por severidad">
          <Tabla headers={["Sev.", "Ciudad", "Riesgo"]} vacio="Sin riesgos." rows={[...riesgosReg].map((x) => ({ ...x, ciudad: ciuByCodigo.get(repById.get(x.reporte_id)?.ciudad_codigo ?? "")?.nombre ?? "", sev: severidadDe(x.probabilidad, x.impacto) })).sort((a, b) => b.sev.s - a.sev.s).slice(0, 10).map((x) => [<span key="s" className={`font-mono text-[11px] ${x.sev.clase}`}>{x.sev.t}</span>, x.ciudad, x.descripcion])} />
        </Bloque>
        <Bloque titulo="Temas críticos de la región" hint="por plazo">
          <Tabla headers={["Plazo", "Ciudad", "Tema"]} vacio="Sin temas." rows={[...temasReg].sort((a, b) => (ORDEN_PLAZO[a.plazo ?? ""] ?? 9) - (ORDEN_PLAZO[b.plazo ?? ""] ?? 9)).map((t) => [t.plazo, ciuByCodigo.get(repById.get(t.reporte_id)?.ciudad_codigo ?? "")?.nombre ?? "", t.tema])} />
        </Bloque>
      </div>
    </>
  );
}

function NivelCiudad(p: { codigo: string; ciuByCodigo: Map<string, Ciudad>; reporte: ReporteCiudad | null; reportes: ReporteCiudad[]; riesgos: RiesgoCiudad[]; temas: TemaCiudad[]; nac: ReturnType<typeof metricasCiudad>; riesgoRegionCiudad: (r: RiesgoCiudad) => Ciudad | undefined }) {
  const { codigo, ciuByCodigo, reporte, reportes, riesgos, temas, nac } = p;
  const ciu = ciuByCodigo.get(codigo)!;
  const repsRegion = reportes.filter((r) => ciuByCodigo.get(r.ciudad_codigo)?.region === ciu.region);
  const promRegion = { c4: promedio(repsRegion.map((r) => r.cobertura_4g)), c5: promedio(repsRegion.map((r) => r.cobertura_5g)), h: promedio(repsRegion.map((r) => r.hogares_internet)) };

  if (!reporte) {
    return (
      <>
        <FilaBreadcrumb>
          <Breadcrumb region={ciu.region} ciudad={ciu.nombre} />
          <BotonExportarPdf nombreArchivo={`Analisis_TIC_${ciu.nombre}`} />
        </FilaBreadcrumb>
        <Bloque titulo={`${ciu.nombre} · ${ciu.region}`}><p className="text-sm text-steel">Esta ciudad aún no ha enviado su reporte.</p></Bloque>
      </>
    );
  }
  const r = reporte;
  const riesgosDep = riesgos.filter((x) => x.reporte_id === r.id);
  const temasDep = temas.filter((t) => t.reporte_id === r.id);
  const criticos = criticosCiudad(r);
  const filas: [string, number | null, number | null, number | null][] = [
    ["Cobertura 4G (%)", r.cobertura_4g, promRegion.c4, nac.prom4g],
    ["Cobertura 5G (%)", r.cobertura_5g, promRegion.c5, nac.prom5g],
    ["Hogares con internet (%)", r.hogares_internet, promRegion.h, nac.promHogares],
  ];

  return (
    <>
      <FilaBreadcrumb>
        <Breadcrumb region={ciu.region} ciudad={ciu.nombre} />
        <BotonExportarPdf nombreArchivo={`Analisis_TIC_${ciu.nombre}_${r.fecha_corte ?? ""}`} />
      </FilaBreadcrumb>
      <Bloque titulo={`${ciu.nombre} · Región ${ciu.region}`} hint={`Reporte ${r.estado}${r.fecha_corte ? ` · corte ${r.fecha_corte}` : ""}`}>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {DIMS.map((d) => {
            const v = (r as Record<string, unknown>)[`sem_${d}`] as string | null;
            return (<div key={d} className="rounded-[10px] border border-line px-3 py-3"><div className="etiqueta mb-1.5 capitalize">{d === "apropiacion" ? "ciudad inteligente" : d}</div><Pill v={v} /></div>);
          })}
        </div>
      </Bloque>
      <Bloque titulo="Indicadores vs. su región y el país" hint="comparación de cobertura">
        <Tabla headers={["Indicador", "Ciudad", "Prom. región", "Prom. nacional", "Vs. región"]} rows={filas.map(([label, val, reg, nacv]) => {
          const c = comparar(val, reg);
          return [label, pct(val), pct(reg), pct(nacv), c.delta === null ? <span key="x" className="text-steel">—</span> : <span key="x" className={`font-mono text-[12px] ${c.tono}`}>{c.signo}{c.delta.toFixed(1)} pts</span>];
        })} />
      </Bloque>
      <Hallazgos titulo={`Hallazgos · ${ciu.nombre}`} items={[
        criticos > 0 ? `${criticos} de 5 dimensiones están en estado crítico.` : "Ninguna dimensión está en estado crítico.",
        comparar(r.cobertura_4g, nac.prom4g).delta !== null ? `Su cobertura 4G está ${Number(r.cobertura_4g) >= (nac.prom4g ?? 0) ? "por encima" : "por debajo"} del promedio nacional.` : "",
        `Registra ${riesgosDep.length} riesgo(s) (${riesgosDep.filter((x) => severidadDe(x.probabilidad, x.impacto).s >= 6).length} de alta severidad) y ${temasDep.length} tema(s) crítico(s).`,
        r.zonas_wifi_publico !== null ? `Zonas WiFi público: ${r.zonas_wifi_publico}. Cámaras de videovigilancia: ${r.camaras_videovigilancia ?? "s/i"}.` : "",
      ].filter(Boolean)} />
      <div className="grid gap-5 lg:grid-cols-2">
        <Bloque titulo="Riesgos de la ciudad" hint="por severidad">
          <Tabla headers={["Sev.", "Dimensión", "Riesgo", "Acción"]} vacio="Sin riesgos." rows={[...riesgosDep].map((x) => ({ ...x, sev: severidadDe(x.probabilidad, x.impacto) })).sort((a, b) => b.sev.s - a.sev.s).map((x) => [<span key="s" className={`font-mono text-[11px] ${x.sev.clase}`}>{x.sev.t}</span>, x.dimension, x.descripcion, x.accion])} />
        </Bloque>
        <Bloque titulo="Temas críticos" hint="agenda">
          <Tabla headers={["Plazo", "Tema", "Responsable"]} vacio="Sin temas." rows={[...temasDep].sort((a, b) => (ORDEN_PLAZO[a.plazo ?? ""] ?? 9) - (ORDEN_PLAZO[b.plazo ?? ""] ?? 9)).map((t) => [t.plazo, t.tema, t.responsable])} />
        </Bloque>
      </div>
      <div className="print:hidden"><Link href={`/reportes-ciudad/${ciu.codigo}`} className="text-sm font-semibold text-link hover:underline">Ver el reporte completo de {ciu.nombre} →</Link></div>
    </>
  );
}

// Presentación (compartida con /analisis)
function FilaBreadcrumb({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-wrap items-center justify-between gap-2">{children}</div>;
}
function Breadcrumb({ region, ciudad }: { region: string; ciudad?: string }) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-sm text-steel print:hidden">
      <Link href="/analisis-ciudad" className="font-semibold text-link hover:underline">Nacional</Link>
      <span>›</span>
      <Link href={`/analisis-ciudad?region=${encodeURIComponent(region)}`} className={ciudad ? "font-semibold text-link hover:underline" : "font-semibold text-ink"}>{region}</Link>
      {ciudad && (<><span>›</span><span className="font-semibold text-ink">{ciudad}</span></>)}
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
      <div className="border-b border-line bg-gradient-to-b from-white to-[#FAFBFC] px-5 py-3.5"><h2 className="font-display text-[17px] font-bold [font-variation-settings:'wdth'_106]">{titulo}</h2></div>
      <ul className="grid gap-2 px-5 py-4">{items.map((t, i) => (<li key={i} className="flex gap-2.5 text-[14px]"><span className="mt-1.5 h-1.5 w-1.5 flex-none rounded-full bg-steel" /><span>{t}</span></li>))}</ul>
    </section>
  );
}
function Bloque({ titulo, hint, children }: { titulo: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="overflow-hidden rounded-[10px] border border-line bg-card">
      <div className="flex items-baseline gap-3 border-b border-line bg-gradient-to-b from-white to-[#FAFBFC] px-5 py-3.5"><h2 className="font-display text-[17px] font-bold [font-variation-settings:'wdth'_106]">{titulo}</h2>{hint && <span className="ml-auto text-xs text-steel">{hint}</span>}</div>
      <div className="overflow-x-auto px-5 py-4">{children}</div>
    </section>
  );
}
function Tabla({ headers, rows, vacio }: { headers: React.ReactNode[]; rows: React.ReactNode[][]; vacio?: string }) {
  if (!rows.length) return <p className="text-sm text-steel">{vacio ?? "Sin datos."}</p>;
  return (
    <table className="w-full border-collapse text-[13.5px]">
      <thead><tr>{headers.map((h, i) => <th key={i} className="whitespace-nowrap border-b-2 border-line px-2 py-2 text-left font-mono text-[10.5px] uppercase tracking-wide text-steel">{h}</th>)}</tr></thead>
      <tbody>{rows.map((row, i) => (<tr key={i} className="hover:bg-paper">{row.map((c, j) => <td key={j} className="border-b border-line px-2 py-2 align-top">{c === null || c === undefined || c === "" ? <span className="text-steel">—</span> : c}</td>)}</tr>))}</tbody>
    </table>
  );
}
function ComparaBarra({ label, region, nacional, c }: { label: string; region: number | null; nacional: number | null; c: { signo: string; delta: number | null; tono: string } }) {
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between"><span className="font-mono text-[11px] uppercase text-steel">{label}</span>{c.delta !== null && <span className={`font-mono text-[11px] ${c.tono}`}>{c.signo}{c.delta.toFixed(1)} pts vs. país</span>}</div>
      <Barra label="Región" valor={region} color="bg-navy" />
      <div className="mt-1"><Barra label="País" valor={nacional} color="bg-steel" /></div>
    </div>
  );
}
function Pill({ v }: { v: string | null }) {
  return <span className={`inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 font-mono text-[11px] font-medium ${pillClase(v)}`}>{v ? SEM_ETIQUETA[v] : "s/i"}</span>;
}
function pct(n: number | null | undefined) { return n === null || n === undefined ? "s/i" : `${Number(n).toFixed(1)}%`; }
