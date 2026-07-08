import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePerfil } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Masthead } from "@/components/masthead";
import { BotonExportarPdf } from "@/components/analisis/boton-exportar-pdf";
import { DIMS, SEM_ETIQUETA, pillClase, severidadDe, ESTADO_REPORTE_LABEL } from "@/lib/consolidado";
import { cambiarEstadoReporte } from "./actions";
import type { Reporte, Proyecto, Riesgo, TemaCritico, SistemaActivo } from "@/lib/database.types";

export const dynamic = "force-dynamic";

export default async function ReporteDetallePage({ params }: { params: Promise<{ codigo: string }> }) {
  const { codigo } = await params;
  const { perfil } = await requirePerfil(["central", "admin"]);
  const supabase = await createClient();

  const { data: departamento } = await supabase.from("departamentos").select("*").eq("codigo", codigo).maybeSingle();
  if (!departamento) notFound();

  const { data: reporte } = await supabase.from("reportes").select("*").eq("departamento_codigo", codigo).maybeSingle();

  let proyectos: Proyecto[] = [];
  let riesgos: Riesgo[] = [];
  let temas: TemaCritico[] = [];
  let sistemas: SistemaActivo[] = [];
  if (reporte) {
    const [p, r, t, s] = await Promise.all([
      supabase.from("proyectos").select("*").eq("reporte_id", reporte.id).order("orden"),
      supabase.from("riesgos").select("*").eq("reporte_id", reporte.id).order("orden"),
      supabase.from("temas_criticos").select("*").eq("reporte_id", reporte.id).order("orden"),
      supabase.from("sistemas_activos").select("*").eq("reporte_id", reporte.id).order("orden"),
    ]);
    proyectos = (p.data ?? []) as Proyecto[];
    riesgos = (r.data ?? []) as Riesgo[];
    temas = (t.data ?? []) as TemaCritico[];
    sistemas = (s.data ?? []) as SistemaActivo[];
  }

  const rep = reporte as Reporte | null;

  return (
    <>
      <Masthead titulo={`${departamento.nombre} · Reporte TIC`} subtitulo={`Región ${departamento.region}`} perfil={perfil} />
      <main className="mx-auto content-start grid w-full max-w-[1160px] flex-1 gap-5 px-6 py-6">
        <div className="flex flex-wrap items-center gap-3 print:hidden">
          <Link href="/consolidado" className="text-sm font-semibold text-link hover:underline">
            ← Volver al consolidado
          </Link>
          {rep && (
            <span className="rounded-full bg-paper px-3 py-1 font-mono text-[11px] uppercase text-steel">
              Estado: {ESTADO_REPORTE_LABEL[rep.estado]}
              {rep.enviado_en ? ` · enviado ${new Date(rep.enviado_en).toLocaleDateString("es-CO")}` : ""}
            </span>
          )}
          {rep && (
            <div className="ml-auto flex items-center gap-2">
              {rep.estado !== "borrador" && (
                <>
                  {rep.estado === "enviado" && (
                    <form action={cambiarEstadoReporte.bind(null, rep.id, departamento.codigo, "validar")}>
                      <button className="rounded-md bg-verde px-3.5 py-2 text-[13px] font-semibold text-white transition hover:brightness-110">
                        Validar reporte
                      </button>
                    </form>
                  )}
                  <form action={cambiarEstadoReporte.bind(null, rep.id, departamento.codigo, "devolver")}>
                    <button className="rounded-md border border-line px-3.5 py-2 text-[13px] font-semibold text-navy transition hover:bg-paper">
                      Devolver a borrador
                    </button>
                  </form>
                </>
              )}
              <BotonExportarPdf nombreArchivo={`Ficha_TIC_${departamento.nombre}_${rep.fecha_corte ?? ""}`} />
            </div>
          )}
        </div>

        {!rep ? (
          <div className="rounded-xl border border-line bg-card p-10 text-center text-steel">
            Este departamento aún no tiene un reporte creado.
          </div>
        ) : (
          <>
            {/* Semáforos */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
              {DIMS.map((d) => {
                const val = (rep as Record<string, unknown>)[`sem_${d}`] as string | null;
                return (
                  <div key={d} className="rounded-[10px] border border-line bg-card px-4 py-3">
                    <div className="etiqueta mb-1.5 capitalize">{d}</div>
                    <span className={`inline-block rounded-full px-2.5 py-0.5 font-mono text-[11px] font-medium ${pillClase(val)}`}>
                      {val ? SEM_ETIQUETA[val] : "s/i"}
                    </span>
                  </div>
                );
              })}
            </div>

            <Bloque titulo="Identificación">
              <Datos items={[["Departamento", departamento.nombre], ["Región", departamento.region], ["Fecha de corte", rep.fecha_corte]]} />
            </Bloque>

            <Bloque titulo="Conectividad e infraestructura">
              <Datos items={[
                ["Cobertura 4G", pct(rep.cobertura_4g)],
                ["Cobertura 5G", pct(rep.cobertura_5g)],
                ["Hogares con internet", pct(rep.hogares_internet)],
                ["Total municipios", rep.total_municipios],
                ["Municipios sin cobertura", rep.municipios_sin_cobertura],
                ["Fuente", rep.fuente_conectividad],
              ]} />
              <Largo label="Zonas críticas sin servicio" v={rep.zonas_criticas} />
              <Largo label="Infraestructura crítica" v={rep.infraestructura_critica} />
            </Bloque>

            <Bloque titulo="Barreras territoriales">
              <Largo label="Tributos aplicados" v={(rep.tributos ?? []).join(" · ") || null} />
              <Largo label="Detalle de tributos" v={rep.detalle_tributos} />
              <Largo label="Barreras de despliegue" v={rep.barreras_despliegue} />
            </Bloque>

            <Bloque titulo="Proyectos e inversión">
              <Tabla headers={["Proyecto", "Fuente", "Estado", "Avance", "Riesgos"]} vacio="Sin proyectos registrados."
                rows={proyectos.map((p) => [p.nombre, p.fuente, p.estado, pct(p.avance), p.riesgos])} />
            </Bloque>

            <Bloque titulo="Apropiación y transformación digital">
              <Datos items={[
                ["Programas de talento", rep.programas_talento],
                ["Personas formadas", rep.personas_formadas],
                ["Mpios. con trámites en línea", rep.municipios_tramites_linea],
                ["Trámites gobernación", rep.tramites_gobernacion],
                ["Mipymes beneficiadas", rep.mipymes_beneficiadas],
                ["Incidentes ciberseguridad", rep.incidentes_ciber],
                ["Plan transformación digital", rep.plan_transformacion],
                ["Capacidad respuesta ciber", rep.capacidad_respuesta_ciber],
                ["Fuente", rep.fuente_apropiacion],
              ]} />
              <Largo label="Observaciones" v={rep.obs_apropiacion} />
            </Bloque>

            <Bloque titulo="Capacidad institucional">
              <Datos items={[
                ["Dependencia TIC", rep.dependencia],
                ["Presupuesto TIC (COP mill.)", rep.presupuesto_tic],
                ["Personal TIC", rep.personal_tic],
                ["Contratos vigentes", rep.contratos_vigentes],
                ["Inventario de activos", rep.inventario],
                ["Política de seguridad (MSPI)", rep.politica_seguridad],
                ["Fuente", rep.fuente_capacidad],
              ]} />
              <Tabla headers={["Sistema o activo", "Tipo", "Estado", "Licenciamiento", "Observación"]} vacio="Sin sistemas registrados."
                rows={sistemas.map((s) => [s.nombre, s.tipo, s.estado, s.licenciamiento, s.observacion])} />
              <Largo label="Observaciones" v={rep.obs_capacidad} />
            </Bloque>

            <Bloque titulo="Matriz de riesgos">
              <Tabla headers={["Severidad", "Descripción", "Dimensión", "Prob.", "Impacto", "Acción"]} vacio="Sin riesgos registrados."
                rows={riesgos.map((r) => [severidadDe(r.probabilidad, r.impacto).t, r.descripcion, r.dimension, r.probabilidad, r.impacto, r.accion])} />
            </Bloque>

            <Bloque titulo="Temas críticos">
              <Tabla headers={["Tema", "Plazo", "Responsable"]} vacio="Sin temas registrados."
                rows={temas.map((t) => [t.tema, t.plazo, t.responsable])} />
            </Bloque>

            {rep.observaciones_generales && (
              <Bloque titulo="Observaciones generales del enlace">
                <p className="text-sm">{rep.observaciones_generales}</p>
              </Bloque>
            )}
          </>
        )}
      </main>
    </>
  );
}

function pct(n: number | null) {
  return n === null || n === undefined ? null : `${Number(n).toFixed(1)}%`;
}
function Bloque({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="overflow-hidden rounded-[10px] border border-line bg-card">
      <div className="border-b border-line bg-gradient-to-b from-white to-[#FAFBFC] px-5 py-3.5">
        <h2 className="font-display text-[17px] font-bold [font-variation-settings:'wdth'_106]">{titulo}</h2>
      </div>
      <div className="px-5 py-4">{children}</div>
    </section>
  );
}
function Datos({ items }: { items: [string, string | number | null][] }) {
  return (
    <dl className="grid grid-cols-2 gap-x-5 gap-y-3 sm:grid-cols-3">
      {items.map(([k, v]) => (
        <div key={k}>
          <dt className="etiqueta">{k}</dt>
          <dd className="mt-0.5 text-[14.5px]">{v === null || v === undefined || v === "" ? <span className="text-steel">s/i</span> : v}</dd>
        </div>
      ))}
    </dl>
  );
}
function Largo({ label, v }: { label: string; v: string | null }) {
  return (
    <div className="mt-3">
      <div className="etiqueta">{label}</div>
      <p className="mt-0.5 whitespace-pre-wrap text-[14.5px]">{v ? v : <span className="text-steel">s/i</span>}</p>
    </div>
  );
}
function Tabla({ headers, rows, vacio }: { headers: string[]; rows: (string | number | null)[][]; vacio: string }) {
  if (!rows.length) return <p className="text-sm text-steel">{vacio}</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-[13.5px]">
        <thead>
          <tr>
            {headers.map((h) => (
              <th key={h} className="whitespace-nowrap border-b-2 border-line px-2 py-2 text-left font-mono text-[10.5px] uppercase tracking-wide text-steel">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {row.map((c, j) => (
                <td key={j} className="border-b border-line px-2 py-2 align-top">{c === null || c === undefined || c === "" ? <span className="text-steel">—</span> : c}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
