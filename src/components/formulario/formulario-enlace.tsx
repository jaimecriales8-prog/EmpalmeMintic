"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type {
  Database,
  Departamento,
  Perfil,
  Reporte,
  Proyecto,
  Riesgo,
  TemaCritico,
  SistemaActivo,
} from "@/lib/database.types";

// Los valores de los selects provienen de listas cerradas que coinciden con
// los enums del schema; casteamos a los tipos de tabla al persistir.
type Tabla = keyof Database["public"]["Tables"];
type Ins<T extends Tabla> = Database["public"]["Tables"][T]["Insert"];
type Upd<T extends Tabla> = Database["public"]["Tables"][T]["Update"];
import {
  DIMENSIONES,
  SEM_COL,
  SEMAFORO_OPCIONes,
  TRIBUTOS,
  ESTADO_PROYECTO,
  DIMENSION_RIESGO,
  NIVEL_PROB,
  NIVEL_IMPACTO,
  PLAZO_TEMA,
  TIPO_SISTEMA,
  ESTADO_SISTEMA,
  LICENCIAMIENTO_SISTEMA,
  DEPENDENCIA_TIC,
  PLAN_TD,
  CAPACIDAD_CIBER,
  INVENTARIO_ACTIVOS,
  POLITICA_MSPI,
  CAMPOS_ENTEROS,
  CAMPOS_DECIMALES,
  CAMPOS_PROGRESO,
  type DimKey,
} from "@/lib/formulario-opciones";

// --- Tipos de estado local (todos los campos como string para inputs) ---
type ProyectoRow = { nombre: string; fuente: string; estado: string; avance: string; riesgos: string };
type RiesgoRow = { descripcion: string; dimension: string; probabilidad: string; impacto: string; accion: string };
type TemaRow = { tema: string; plazo: string; responsable: string };
type SistemaRow = { nombre: string; tipo: string; estado: string; licenciamiento: string; observacion: string };

type Estado = "idle" | "saving" | "saved" | "error";
const TONO_BG: Record<string, string> = {
  critico: "bg-rojo",
  riesgo: "bg-ambar",
  estable: "bg-verde",
};
const SEM_ETIQUETA: Record<string, string> = {
  critico: "crítico",
  riesgo: "en riesgo",
  estable: "estable",
};

function s(v: unknown): string {
  return v === null || v === undefined ? "" : String(v);
}
function numOrNull(v: string, entero: boolean): number | null {
  if (v.trim() === "") return null;
  const x = entero ? parseInt(v, 10) : parseFloat(v);
  return Number.isNaN(x) ? null : x;
}

export function FormularioEnlace({
  departamento,
  perfil,
  reporte,
  proyectosIniciales,
  riesgosIniciales,
  temasIniciales,
  sistemasIniciales,
}: {
  departamento: Departamento;
  perfil: Perfil;
  reporte: Reporte;
  proyectosIniciales: Proyecto[];
  riesgosIniciales: Riesgo[];
  temasIniciales: TemaCritico[];
  sistemasIniciales: SistemaActivo[];
}) {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const reporteId = reporte.id;
  const soloLectura = reporte.estado !== "borrador";

  // Campos de la cabecera `reportes`
  const [form, setForm] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    CAMPOS_PROGRESO.forEach((k) => (init[k] = s((reporte as Record<string, unknown>)[k])));
    return init;
  });
  const [tributos, setTributos] = useState<string[]>(reporte.tributos ?? []);
  const [semaforos, setSemaforos] = useState<Record<DimKey, string>>(() => ({
    conectividad: s(reporte.sem_conectividad),
    barreras: s(reporte.sem_barreras),
    proyectos: s(reporte.sem_proyectos),
    apropiacion: s(reporte.sem_apropiacion),
    capacidad: s(reporte.sem_capacidad),
  }));
  const [obsGenerales, setObsGenerales] = useState(s(reporte.observaciones_generales));

  // Contacto (vive en `perfiles`)
  const [contacto, setContacto] = useState({
    nombre: s(perfil.nombre),
    cargo: s(perfil.cargo),
    entidad: s(perfil.entidad),
    telefono: s(perfil.telefono),
    correo: s(perfil.correo),
  });

  // Tablas hijas
  const [proyectos, setProyectos] = useState<ProyectoRow[]>(
    proyectosIniciales.length
      ? proyectosIniciales.map((p) => ({ nombre: s(p.nombre), fuente: s(p.fuente), estado: s(p.estado), avance: s(p.avance), riesgos: s(p.riesgos) }))
      : [{ nombre: "", fuente: "", estado: "", avance: "", riesgos: "" }],
  );
  const [riesgos, setRiesgos] = useState<RiesgoRow[]>(
    riesgosIniciales.length
      ? riesgosIniciales.map((r) => ({ descripcion: s(r.descripcion), dimension: s(r.dimension), probabilidad: s(r.probabilidad), impacto: s(r.impacto), accion: s(r.accion) }))
      : [{ descripcion: "", dimension: "", probabilidad: "", impacto: "", accion: "" }],
  );
  const [temas, setTemas] = useState<TemaRow[]>(
    temasIniciales.length
      ? temasIniciales.map((t) => ({ tema: s(t.tema), plazo: s(t.plazo), responsable: s(t.responsable) }))
      : [{ tema: "", plazo: "", responsable: "" }],
  );
  const [sistemas, setSistemas] = useState<SistemaRow[]>(
    sistemasIniciales.length
      ? sistemasIniciales.map((x) => ({ nombre: s(x.nombre), tipo: s(x.tipo), estado: s(x.estado), licenciamiento: s(x.licenciamiento), observacion: s(x.observacion) }))
      : [{ nombre: "", tipo: "", estado: "", licenciamiento: "", observacion: "" }],
  );

  const [estadoGuardado, setEstadoGuardado] = useState<Estado>("idle");
  const [enviando, setEnviando] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState("");

  // --- Autosave: refs con los valores más recientes ---
  const refs = useRef({ form, tributos, semaforos, obsGenerales, contacto, proyectos, riesgos, temas, sistemas });
  useEffect(() => {
    refs.current = { form, tributos, semaforos, obsGenerales, contacto, proyectos, riesgos, temas, sistemas };
  });

  const sucios = useRef<Set<string>>(new Set());
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const payloadReporte = useCallback(() => {
    const c = refs.current;
    const out: Record<string, unknown> = {};
    CAMPOS_PROGRESO.forEach((k) => {
      const raw = c.form[k] ?? "";
      if ((CAMPOS_ENTEROS as readonly string[]).includes(k)) out[k] = numOrNull(raw, true);
      else if ((CAMPOS_DECIMALES as readonly string[]).includes(k)) out[k] = numOrNull(raw, false);
      else out[k] = raw.trim() === "" ? null : raw;
    });
    out.tributos = c.tributos;
    out.observaciones_generales = c.obsGenerales.trim() === "" ? null : c.obsGenerales;
    (Object.keys(SEM_COL) as DimKey[]).forEach((dim) => {
      out[SEM_COL[dim]] = c.semaforos[dim] === "" ? null : c.semaforos[dim];
    });
    return out;
  }, []);

  const guardarGrupo = useCallback(
    async (grupo: string) => {
      const c = refs.current;
      if (grupo === "reporte") {
        return supabase.from("reportes").update(payloadReporte() as Upd<"reportes">).eq("id", reporteId);
      }
      if (grupo === "contacto") {
        return supabase
          .from("perfiles")
          .update({
            nombre: c.contacto.nombre || perfil.nombre,
            cargo: c.contacto.cargo || null,
            entidad: c.contacto.entidad || null,
            telefono: c.contacto.telefono || null,
          })
          .eq("id", perfil.id);
      }
      if (grupo === "proyectos") {
        await supabase.from("proyectos").delete().eq("reporte_id", reporteId);
        const filas = c.proyectos
          .filter((p) => p.nombre.trim())
          .map((p, i) => ({ reporte_id: reporteId, nombre: p.nombre, fuente: p.fuente || null, estado: p.estado || null, avance: numOrNull(p.avance, false), riesgos: p.riesgos || null, orden: i })) as Ins<"proyectos">[];
        return filas.length ? supabase.from("proyectos").insert(filas) : { error: null };
      }
      if (grupo === "riesgos") {
        await supabase.from("riesgos").delete().eq("reporte_id", reporteId);
        const filas = c.riesgos
          .filter((r) => r.descripcion.trim())
          .map((r, i) => ({ reporte_id: reporteId, descripcion: r.descripcion, dimension: r.dimension || null, probabilidad: r.probabilidad || null, impacto: r.impacto || null, accion: r.accion || null, orden: i })) as Ins<"riesgos">[];
        return filas.length ? supabase.from("riesgos").insert(filas) : { error: null };
      }
      if (grupo === "temas") {
        await supabase.from("temas_criticos").delete().eq("reporte_id", reporteId);
        const filas = c.temas
          .filter((t) => t.tema.trim())
          .map((t, i) => ({ reporte_id: reporteId, tema: t.tema, plazo: t.plazo || null, responsable: t.responsable || null, orden: i })) as Ins<"temas_criticos">[];
        return filas.length ? supabase.from("temas_criticos").insert(filas) : { error: null };
      }
      if (grupo === "sistemas") {
        await supabase.from("sistemas_activos").delete().eq("reporte_id", reporteId);
        const filas = c.sistemas
          .filter((x) => x.nombre.trim())
          .map((x, i) => ({ reporte_id: reporteId, nombre: x.nombre, tipo: x.tipo || null, estado: x.estado || null, licenciamiento: x.licenciamiento || null, observacion: x.observacion || null, orden: i })) as Ins<"sistemas_activos">[];
        return filas.length ? supabase.from("sistemas_activos").insert(filas) : { error: null };
      }
      return { error: null };
    },
    [supabase, payloadReporte, reporteId, perfil.id, perfil.nombre],
  );

  const correrGuardado = useCallback(async () => {
    const grupos = [...sucios.current];
    sucios.current.clear();
    if (!grupos.length) return;
    setEstadoGuardado("saving");
    try {
      for (const g of grupos) {
        const res = await guardarGrupo(g);
        if (res && "error" in res && res.error) throw res.error;
      }
      setEstadoGuardado("saved");
    } catch {
      setEstadoGuardado("error");
    }
  }, [guardarGrupo]);

  const marcar = useCallback(
    (grupo: string) => {
      if (soloLectura) return;
      sucios.current.add(grupo);
      setEstadoGuardado("saving");
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(correrGuardado, 1500);
    },
    [correrGuardado, soloLectura],
  );

  // Guardar lo pendiente al salir
  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  // --- % diligenciado ---
  const progreso = useMemo(() => {
    let llenos = 0;
    const total = CAMPOS_PROGRESO.length + DIMENSIONES.length;
    CAMPOS_PROGRESO.forEach((k) => {
      if ((form[k] ?? "").trim() !== "") llenos++;
    });
    DIMENSIONES.forEach((d) => {
      if (semaforos[d.key] !== "") llenos++;
    });
    return Math.round((llenos / total) * 100);
  }, [form, semaforos]);

  // --- Handlers ---
  const setCampo = (k: string, v: string) => {
    setForm((f) => ({ ...f, [k]: v }));
    marcar("reporte");
  };
  const setSem = (dim: DimKey, v: string) => {
    setSemaforos((x) => ({ ...x, [dim]: v }));
    marcar("reporte");
  };
  const toggleTributo = (v: string) => {
    setTributos((t) => (t.includes(v) ? t.filter((x) => x !== v) : [...t, v]));
    marcar("reporte");
  };
  const setContactoCampo = (k: keyof typeof contacto, v: string) => {
    setContacto((c) => ({ ...c, [k]: v }));
    marcar("contacto");
  };

  // --- Enviar reporte ---
  async function enviar() {
    setErrorEnvio("");
    const faltanSem = DIMENSIONES.filter((d) => semaforos[d.key] === "").map((d) => d.nombre);
    if ((form.fecha_corte ?? "").trim() === "") {
      setErrorEnvio("Indique la fecha de corte antes de enviar.");
      return;
    }
    if (faltanSem.length) {
      setErrorEnvio("Faltan semáforos por calificar: " + faltanSem.join(", ") + ".");
      return;
    }
    if (!confirm("Al enviar, el reporte quedará en solo lectura y visible para el equipo central. ¿Continuar?")) return;

    setEnviando(true);
    // Forzar guardado de todo lo pendiente primero.
    if (timer.current) clearTimeout(timer.current);
    ["reporte", "contacto", "proyectos", "riesgos", "temas", "sistemas"].forEach((g) => sucios.current.add(g));
    await correrGuardado();
    const { error } = await supabase
      .from("reportes")
      .update({ estado: "enviado", enviado_en: new Date().toISOString() })
      .eq("id", reporteId);
    setEnviando(false);
    if (error) {
      setErrorEnvio("No se pudo enviar el reporte. Intente de nuevo.");
      return;
    }
    router.refresh();
  }

  const msg =
    estadoGuardado === "saving"
      ? "Guardando…"
      : estadoGuardado === "saved"
        ? "Guardado"
        : estadoGuardado === "error"
          ? "Error al guardar"
          : "";

  return (
    <>
      {/* Tablero de semáforos sticky */}
      <div className="sticky top-0 z-40 border-b-2 border-navy bg-white shadow-[0_2px_8px_rgba(20,33,43,0.08)]">
        <div className="mx-auto flex max-w-[1160px] items-stretch overflow-x-auto">
          <div className="min-w-[190px] flex-[1.3] border-r border-line bg-[#F6F9FC] px-3.5 py-2.5">
            <div className="font-display text-[15px] font-bold leading-tight">{departamento.nombre}</div>
            <div className="font-mono text-[10.5px] uppercase tracking-wider text-steel">Región {departamento.region}</div>
            <div className="mt-0.5 font-mono text-[10.5px] text-steel">{progreso}% diligenciado</div>
          </div>
          {DIMENSIONES.map((d) => {
            const val = semaforos[d.key];
            return (
              <button
                key={d.key}
                type="button"
                onClick={() => document.getElementById(d.seccion)?.scrollIntoView({ behavior: "smooth", block: "start" })}
                className="min-w-[120px] flex-1 cursor-pointer border-r border-line px-3 py-2.5 text-left transition hover:bg-[#F6F9FC]"
              >
                <div className="font-mono text-[10px] tracking-wide text-steel">{d.num}</div>
                <div className="mt-0.5 mb-1.5 truncate text-xs font-semibold">{d.nombre}</div>
                <div className="flex items-center gap-1.5">
                  <span className={`h-[11px] w-[11px] rounded-full border ${val ? TONO_BG[val] + " border-transparent" : "border-[#C4CEDA] bg-[#E2E8EE]"}`} />
                  <span className="font-mono text-[10px] text-steel">{val ? SEM_ETIQUETA[val] : "sin calificar"}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {soloLectura && (
        <div className="border-b border-ambar/40 bg-ambar-bg px-6 py-2.5 text-center text-sm text-ambar">
          Reporte {reporte.estado === "validado" ? "validado" : "enviado"}
          {reporte.enviado_en ? ` el ${new Date(reporte.enviado_en).toLocaleDateString("es-CO")}` : ""}. Está en solo lectura.
        </div>
      )}

      <main className="mx-auto grid w-full max-w-[1160px] flex-1 gap-5 px-6 py-6 pb-28">
        <fieldset disabled={soloLectura} className="contents">
          {/* 01 Identificación */}
          <Seccion num="01" titulo="Identificación del reporte">
            <Grid cols={3}>
              <Campo label="Departamento">
                <input value={departamento.nombre} readOnly className={inputCls} />
              </Campo>
              <Campo label="Región">
                <input value={departamento.region} readOnly className={inputCls} />
              </Campo>
              <Campo label="Fecha de corte de la información">
                <input type="date" value={form.fecha_corte} onChange={(e) => setCampo("fecha_corte", e.target.value)} className={inputCls} />
              </Campo>
              <Campo label="Nombre del enlace">
                <input value={contacto.nombre} onChange={(e) => setContactoCampo("nombre", e.target.value)} className={inputCls} />
              </Campo>
              <Campo label="Cargo">
                <input value={contacto.cargo} onChange={(e) => setContactoCampo("cargo", e.target.value)} className={inputCls} />
              </Campo>
              <Campo label="Entidad">
                <input value={contacto.entidad} onChange={(e) => setContactoCampo("entidad", e.target.value)} placeholder="Gobernación, secretaría, etc." className={inputCls} />
              </Campo>
              <Campo label="Correo institucional">
                <input value={contacto.correo} readOnly className={inputCls} />
              </Campo>
              <Campo label="Teléfono de contacto">
                <input value={contacto.telefono} onChange={(e) => setContactoCampo("telefono", e.target.value)} className={inputCls} />
              </Campo>
            </Grid>
          </Seccion>

          {/* 02 Conectividad */}
          <Seccion id="s2" num="02" titulo="Conectividad e infraestructura" hint="Use cifras oficiales (MinTIC, DANE, CRC) e indique la fuente">
            <Grid cols={3}>
              <Campo label="Cobertura 4G (% municipios)"><NumInput v={form.cobertura_4g} on={(x) => setCampo("cobertura_4g", x)} max={100} /></Campo>
              <Campo label="Cobertura 5G (% municipios)"><NumInput v={form.cobertura_5g} on={(x) => setCampo("cobertura_5g", x)} max={100} /></Campo>
              <Campo label="Hogares con internet (%)"><NumInput v={form.hogares_internet} on={(x) => setCampo("hogares_internet", x)} max={100} /></Campo>
              <Campo label="Total municipios del departamento"><NumInput v={form.total_municipios} on={(x) => setCampo("total_municipios", x)} /></Campo>
              <Campo label="Municipios sin cobertura o parcial"><NumInput v={form.municipios_sin_cobertura} on={(x) => setCampo("municipios_sin_cobertura", x)} /></Campo>
              <Campo label="Fuente de las cifras"><input value={form.fuente_conectividad} onChange={(e) => setCampo("fuente_conectividad", e.target.value)} placeholder="Ej.: MinTIC Boletín Q1-2026" className={inputCls} /></Campo>
            </Grid>
            <Grid cols={2} mt>
              <Campo label="Zonas críticas sin servicio (veredas, corregimientos)"><textarea value={form.zonas_criticas} onChange={(e) => setCampo("zonas_criticas", e.target.value)} className={areaCls} /></Campo>
              <Campo label="Estado de infraestructura crítica (fibra, torres, puntos digitales)"><textarea value={form.infraestructura_critica} onChange={(e) => setCampo("infraestructura_critica", e.target.value)} className={areaCls} /></Campo>
            </Grid>
            <Semaforo dim="conectividad" value={semaforos.conectividad} onChange={setSem} />
          </Seccion>

          {/* 03 Barreras */}
          <Seccion id="s3" num="03" titulo="Cargas y barreras territoriales al despliegue">
            <Campo label="Tributos territoriales aplicados a infraestructura TIC" full>
              <div className="mt-1 flex flex-wrap gap-x-5 gap-y-2">
                {TRIBUTOS.map((t) => (
                  <label key={t.value} className="flex cursor-pointer items-center gap-2 text-[13.5px]">
                    <input type="checkbox" checked={tributos.includes(t.value)} onChange={() => toggleTributo(t.value)} className="h-[15px] w-[15px] accent-navy" />
                    {t.label}
                  </label>
                ))}
              </div>
            </Campo>
            <Grid cols={2} mt>
              <Campo label="Detalle de tributos (municipios, tarifas, conflictos)"><textarea value={form.detalle_tributos} onChange={(e) => setCampo("detalle_tributos", e.target.value)} className={areaCls} /></Campo>
              <Campo label="Barreras de despliegue (POT, permisos, trámites, oposición)"><textarea value={form.barreras_despliegue} onChange={(e) => setCampo("barreras_despliegue", e.target.value)} className={areaCls} /></Campo>
            </Grid>
            <Semaforo dim="barreras" value={semaforos.barreras} onChange={setSem} />
          </Seccion>

          {/* 04 Proyectos */}
          <Seccion id="s4" num="04" titulo="Proyectos e inversión TIC en ejecución" hint="FUTIC, obligaciones de hacer, APP, convenios, propios">
            <TablaDinamica
              headers={["Proyecto", "Fuente / financiador", "Estado", "Avance %", "Riesgos u observaciones"]}
              rows={proyectos}
              soloLectura={soloLectura}
              onAdd={() => { setProyectos((r) => [...r, { nombre: "", fuente: "", estado: "", avance: "", riesgos: "" }]); }}
              onRemove={(i) => { setProyectos((r) => r.filter((_, j) => j !== i)); marcar("proyectos"); }}
              addLabel="+ Agregar proyecto"
              render={(row, i) => (
                <>
                  <td className={tdCls}><input value={row.nombre} onChange={(e) => updRow(setProyectos, i, "nombre", e.target.value, () => marcar("proyectos"))} className={cellInput} /></td>
                  <td className={tdCls}><input value={row.fuente} onChange={(e) => updRow(setProyectos, i, "fuente", e.target.value, () => marcar("proyectos"))} placeholder="FUTIC, OdH, APP…" className={cellInput} /></td>
                  <td className={tdCls}><SelectCell v={row.estado} opts={ESTADO_PROYECTO} on={(x) => updRow(setProyectos, i, "estado", x, () => marcar("proyectos"))} /></td>
                  <td className={tdCls}><input type="number" min={0} max={100} value={row.avance} onChange={(e) => updRow(setProyectos, i, "avance", e.target.value, () => marcar("proyectos"))} className={cellInput} /></td>
                  <td className={tdCls}><textarea value={row.riesgos} onChange={(e) => updRow(setProyectos, i, "riesgos", e.target.value, () => marcar("proyectos"))} className={cellArea} /></td>
                </>
              )}
            />
            <Semaforo dim="proyectos" value={semaforos.proyectos} onChange={setSem} />
          </Seccion>

          {/* 05 Apropiación */}
          <Seccion id="s5" num="05" titulo="Apropiación y transformación digital" hint="Cifras de la vigencia actual · indique la fuente">
            <Grid cols={3}>
              <Campo label="Programas de talento digital activos"><NumInput v={form.programas_talento} on={(x) => setCampo("programas_talento", x)} /></Campo>
              <Campo label="Personas formadas en habilidades digitales"><NumInput v={form.personas_formadas} on={(x) => setCampo("personas_formadas", x)} /></Campo>
              <Campo label="Municipios con al menos un trámite en línea"><NumInput v={form.municipios_tramites_linea} on={(x) => setCampo("municipios_tramites_linea", x)} /></Campo>
              <Campo label="Trámites de la gobernación en línea"><NumInput v={form.tramites_gobernacion} on={(x) => setCampo("tramites_gobernacion", x)} /></Campo>
              <Campo label="Mipymes beneficiadas por programas TIC"><NumInput v={form.mipymes_beneficiadas} on={(x) => setCampo("mipymes_beneficiadas", x)} /></Campo>
              <Campo label="Incidentes de ciberseguridad reportados"><NumInput v={form.incidentes_ciber} on={(x) => setCampo("incidentes_ciber", x)} /></Campo>
              <Campo label="¿Plan o estrategia de transformación digital?"><SelectCampo v={form.plan_transformacion} opts={PLAN_TD} on={(x) => setCampo("plan_transformacion", x)} /></Campo>
              <Campo label="¿Capacidad de respuesta a incidentes?"><SelectCampo v={form.capacidad_respuesta_ciber} opts={CAPACIDAD_CIBER} on={(x) => setCampo("capacidad_respuesta_ciber", x)} /></Campo>
              <Campo label="Fuente de las cifras"><input value={form.fuente_apropiacion} onChange={(e) => setCampo("fuente_apropiacion", e.target.value)} placeholder="Ej.: Secretaría TIC, MinTIC" className={inputCls} /></Campo>
            </Grid>
            <Campo label="Observaciones (opcional, máx. 300)" full mt>
              <textarea maxLength={300} value={form.obs_apropiacion} onChange={(e) => setCampo("obs_apropiacion", e.target.value)} className={areaCls} style={{ minHeight: 56 }} />
            </Campo>
            <Semaforo dim="apropiacion" value={semaforos.apropiacion} onChange={setSem} />
          </Seccion>

          {/* 06 Capacidad institucional */}
          <Seccion id="s6" num="06" titulo="Capacidad institucional TIC del departamento" hint="Cifras de la vigencia actual · indique la fuente">
            <Grid cols={3}>
              <Campo label="Dependencia TIC en la gobernación"><SelectCampo v={form.dependencia} opts={DEPENDENCIA_TIC} on={(x) => setCampo("dependencia", x)} /></Campo>
              <Campo label="Presupuesto TIC vigencia actual (COP millones)"><NumInput v={form.presupuesto_tic} on={(x) => setCampo("presupuesto_tic", x)} /></Campo>
              <Campo label="Personal dedicado a TIC"><NumInput v={form.personal_tic} on={(x) => setCampo("personal_tic", x)} /></Campo>
              <Campo label="Contratos TIC que trascienden el periodo"><NumInput v={form.contratos_vigentes} on={(x) => setCampo("contratos_vigentes", x)} /></Campo>
              <Campo label="¿Inventario de activos TIC actualizado?"><SelectCampo v={form.inventario} opts={INVENTARIO_ACTIVOS} on={(x) => setCampo("inventario", x)} /></Campo>
              <Campo label="¿Política de seguridad (MSPI) adoptada?"><SelectCampo v={form.politica_seguridad} opts={POLITICA_MSPI} on={(x) => setCampo("politica_seguridad", x)} /></Campo>
              <Campo label="Fuente de las cifras"><input value={form.fuente_capacidad} onChange={(e) => setCampo("fuente_capacidad", e.target.value)} className={inputCls} /></Campo>
            </Grid>
            <span className="etiqueta mt-5 block">Sistemas de información y activos digitales</span>
            <TablaDinamica
              headers={["Sistema o activo", "Tipo", "Estado", "Licenciamiento", "Observación"]}
              rows={sistemas}
              soloLectura={soloLectura}
              onAdd={() => { setSistemas((r) => [...r, { nombre: "", tipo: "", estado: "", licenciamiento: "", observacion: "" }]); }}
              onRemove={(i) => { setSistemas((r) => r.filter((_, j) => j !== i)); marcar("sistemas"); }}
              addLabel="+ Agregar sistema o activo"
              render={(row, i) => (
                <>
                  <td className={tdCls}><input value={row.nombre} onChange={(e) => updRow(setSistemas, i, "nombre", e.target.value, () => marcar("sistemas"))} placeholder="Ej.: sistema financiero, web" className={cellInput} /></td>
                  <td className={tdCls}><SelectCell v={row.tipo} opts={TIPO_SISTEMA} on={(x) => updRow(setSistemas, i, "tipo", x, () => marcar("sistemas"))} /></td>
                  <td className={tdCls}><SelectCell v={row.estado} opts={ESTADO_SISTEMA} on={(x) => updRow(setSistemas, i, "estado", x, () => marcar("sistemas"))} /></td>
                  <td className={tdCls}><SelectCell v={row.licenciamiento} opts={LICENCIAMIENTO_SISTEMA} on={(x) => updRow(setSistemas, i, "licenciamiento", x, () => marcar("sistemas"))} /></td>
                  <td className={tdCls}><input value={row.observacion} onChange={(e) => updRow(setSistemas, i, "observacion", e.target.value, () => marcar("sistemas"))} className={cellInput} /></td>
                </>
              )}
            />
            <Campo label="Observaciones (opcional, máx. 300)" full mt>
              <textarea maxLength={300} value={form.obs_capacidad} onChange={(e) => setCampo("obs_capacidad", e.target.value)} className={areaCls} style={{ minHeight: 56 }} />
            </Campo>
            <Semaforo dim="capacidad" value={semaforos.capacidad} onChange={setSem} />
          </Seccion>

          {/* 07 Riesgos */}
          <Seccion id="s7" num="07" titulo="Matriz de riesgos del territorio" hint="Riesgos que el nuevo gobierno debe conocer desde el día uno">
            <TablaDinamica
              headers={["Descripción del riesgo", "Dimensión", "Probabilidad", "Impacto", "Acción de mitigación"]}
              rows={riesgos}
              soloLectura={soloLectura}
              onAdd={() => { setRiesgos((r) => [...r, { descripcion: "", dimension: "", probabilidad: "", impacto: "", accion: "" }]); }}
              onRemove={(i) => { setRiesgos((r) => r.filter((_, j) => j !== i)); marcar("riesgos"); }}
              addLabel="+ Agregar riesgo"
              render={(row, i) => (
                <>
                  <td className={tdCls}><textarea value={row.descripcion} onChange={(e) => updRow(setRiesgos, i, "descripcion", e.target.value, () => marcar("riesgos"))} className={cellArea} /></td>
                  <td className={tdCls}><SelectCell v={row.dimension} opts={DIMENSION_RIESGO} on={(x) => updRow(setRiesgos, i, "dimension", x, () => marcar("riesgos"))} /></td>
                  <td className={tdCls}><SelectCell v={row.probabilidad} opts={NIVEL_PROB} on={(x) => updRow(setRiesgos, i, "probabilidad", x, () => marcar("riesgos"))} /></td>
                  <td className={tdCls}><SelectCell v={row.impacto} opts={NIVEL_IMPACTO} on={(x) => updRow(setRiesgos, i, "impacto", x, () => marcar("riesgos"))} /></td>
                  <td className={tdCls}><textarea value={row.accion} onChange={(e) => updRow(setRiesgos, i, "accion", e.target.value, () => marcar("riesgos"))} className={cellArea} /></td>
                </>
              )}
            />
          </Seccion>

          {/* 08 Temas críticos */}
          <Seccion id="s8" num="08" titulo="Temas críticos de activación inmediata" hint="Agenda de los primeros 100 días en el territorio">
            <TablaDinamica
              headers={["Tema", "Plazo sugerido", "Responsable sugerido / entidad"]}
              rows={temas}
              soloLectura={soloLectura}
              onAdd={() => { setTemas((r) => [...r, { tema: "", plazo: "", responsable: "" }]); }}
              onRemove={(i) => { setTemas((r) => r.filter((_, j) => j !== i)); marcar("temas"); }}
              addLabel="+ Agregar tema"
              render={(row, i) => (
                <>
                  <td className={tdCls}><textarea value={row.tema} onChange={(e) => updRow(setTemas, i, "tema", e.target.value, () => marcar("temas"))} className={cellArea} /></td>
                  <td className={tdCls}><SelectCell v={row.plazo} opts={PLAZO_TEMA} on={(x) => updRow(setTemas, i, "plazo", x, () => marcar("temas"))} /></td>
                  <td className={tdCls}><input value={row.responsable} onChange={(e) => updRow(setTemas, i, "responsable", e.target.value, () => marcar("temas"))} className={cellInput} /></td>
                </>
              )}
            />
            <Campo label="Observaciones generales del enlace" full mt>
              <textarea value={obsGenerales} onChange={(e) => { setObsGenerales(e.target.value); marcar("reporte"); }} className={areaCls} />
            </Campo>
          </Seccion>
        </fieldset>
      </main>

      {/* Barra de acciones fija */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-navy px-6 py-3">
        <div className="mx-auto flex max-w-[1160px] flex-wrap items-center gap-3">
          {!soloLectura ? (
            <button onClick={enviar} disabled={enviando} className="rounded-md bg-white px-4 py-2 text-sm font-semibold text-navy transition hover:brightness-95 disabled:opacity-60">
              {enviando ? "Enviando…" : "Enviar reporte"}
            </button>
          ) : (
            <span className="text-sm font-semibold text-white">Reporte enviado · solo lectura</span>
          )}
          {errorEnvio && <span className="text-sm text-[#F3B4B0]">{errorEnvio}</span>}
          <span className="ml-auto font-mono text-xs text-[#9FC2DE]">{msg}</span>
        </div>
      </div>
    </>
  );
}

// --- Subcomponentes de presentación ---
const inputCls = "w-full rounded-md border border-line bg-white px-2.5 py-2 text-[14.5px] outline-none focus:border-link focus:ring-2 focus:ring-link/30 read-only:bg-paper read-only:text-steel";
const areaCls = "w-full min-h-[84px] resize-y rounded-md border border-line bg-white px-2.5 py-2 text-[14.5px] outline-none focus:border-link focus:ring-2 focus:ring-link/30";
const tdCls = "border-b border-line p-1.5 align-top";
const cellInput = "w-full rounded border border-line px-2 py-1.5 text-[13px] outline-none focus:border-link";
const cellArea = "w-full min-h-[38px] resize-y rounded border border-line px-2 py-1.5 text-[13px] outline-none focus:border-link";

function Seccion({ id, num, titulo, hint, children }: { id?: string; num: string; titulo: string; hint?: string; children: React.ReactNode }) {
  return (
    <section id={id} className="overflow-hidden rounded-[10px] border border-line bg-card scroll-mt-24">
      <div className="flex items-baseline gap-3 border-b border-line bg-gradient-to-b from-white to-[#FAFBFC] px-5 py-4">
        <span className="rounded border border-line px-1.5 py-0.5 font-mono text-xs text-steel">{num}</span>
        <h2 className="font-display text-[18px] font-bold [font-variation-settings:'wdth'_106]">{titulo}</h2>
        {hint && <span className="ml-auto text-xs text-steel">{hint}</span>}
      </div>
      <div className="px-5 py-5">{children}</div>
    </section>
  );
}
function Grid({ cols, mt, children }: { cols: 2 | 3; mt?: boolean; children: React.ReactNode }) {
  return <div className={`grid gap-x-4 gap-y-3.5 ${cols === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2"} ${mt ? "mt-3.5" : ""}`}>{children}</div>;
}
function Campo({ label, full, mt, children }: { label: string; full?: boolean; mt?: boolean; children: React.ReactNode }) {
  return (
    <div className={`flex flex-col gap-1.5 ${full ? "sm:col-span-full" : ""} ${mt ? "mt-3.5" : ""}`}>
      <label className="etiqueta">{label}</label>
      {children}
    </div>
  );
}
function NumInput({ v, on, max }: { v: string; on: (x: string) => void; max?: number }) {
  return <input type="number" min={0} max={max} value={v} onChange={(e) => on(e.target.value)} className={inputCls} />;
}
function SelectCampo({ v, opts, on }: { v: string; opts: string[]; on: (x: string) => void }) {
  return (
    <select value={v} onChange={(e) => on(e.target.value)} className={inputCls}>
      <option value="">Seleccione…</option>
      {opts.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}
function SelectCell({ v, opts, on }: { v: string; opts: string[]; on: (x: string) => void }) {
  return (
    <select value={v} onChange={(e) => on(e.target.value)} className={cellInput}>
      <option value="">—</option>
      {opts.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}
function Semaforo({ dim, value, onChange }: { dim: DimKey; value: string; onChange: (d: DimKey, v: string) => void }) {
  return (
    <div className="mt-4">
      <span className="etiqueta mb-1.5 block">Semáforo de estado</span>
      <div className="flex flex-wrap gap-2.5">
        {SEMAFORO_OPCIONes.map((o) => {
          const activo = value === o.value;
          const cls = activo
            ? o.tono === "rojo"
              ? "border-rojo bg-rojo-bg text-rojo"
              : o.tono === "ambar"
                ? "border-ambar bg-ambar-bg text-ambar"
                : "border-verde bg-verde-bg text-verde"
            : "border-line text-ink";
          return (
            <button key={o.value} type="button" onClick={() => onChange(dim, activo ? "" : o.value)} className={`flex min-w-[130px] flex-1 items-center gap-2 rounded-[7px] border-[1.5px] px-3 py-2 text-[13px] font-semibold transition ${cls}`}>
              <span className={`h-3 w-3 flex-none rounded-full ${activo ? TONO_BG[o.value] : "bg-[#E2E8EE]"}`} />
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
function TablaDinamica<T>({ headers, rows, render, onAdd, onRemove, addLabel, soloLectura }: {
  headers: string[];
  rows: T[];
  render: (row: T, i: number) => React.ReactNode;
  onAdd: () => void;
  onRemove: (i: number) => void;
  addLabel: string;
  soloLectura: boolean;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="mt-1.5 w-full border-collapse text-[13.5px]">
        <thead>
          <tr>
            {headers.map((h) => (
              <th key={h} className="border-b-2 border-line px-2 py-1.5 text-left font-mono text-[10.5px] uppercase tracking-wide text-steel">{h}</th>
            ))}
            {!soloLectura && <th className="w-8 border-b-2 border-line" />}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {render(row, i)}
              {!soloLectura && (
                <td className={tdCls}>
                  <button type="button" onClick={() => onRemove(i)} className="px-1.5 text-lg leading-none text-rojo" title="Eliminar fila">×</button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      {!soloLectura && (
        <div className="mt-2.5">
          <button type="button" onClick={onAdd} className="rounded-[7px] bg-[#E8EDF3] px-4 py-2 text-[13.5px] font-semibold text-navy transition hover:brightness-95">{addLabel}</button>
        </div>
      )}
    </div>
  );
}

// Helper para actualizar una celda de una tabla y marcar el grupo sucio.
function updRow<T>(setter: React.Dispatch<React.SetStateAction<T[]>>, i: number, key: keyof T, value: string, mark: () => void) {
  setter((rows) => rows.map((r, j) => (j === i ? { ...r, [key]: value } : r)));
  mark();
}
