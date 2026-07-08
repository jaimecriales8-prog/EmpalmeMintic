import { Document, Page, Text, View } from "@react-pdf/renderer";
import { s } from "./estilos";
import { Seccion, SeccionTabla, EncabezadoSeccion, BloqueTabla, Campo, Semaforo } from "./primitivas";
import { algunoTiene, numerarSecciones } from "./contenido";
import { severidadDe } from "@/lib/consolidado";
import type { Departamento, Reporte, Proyecto, Riesgo, TemaCritico, SistemaActivo } from "@/lib/database.types";

const DIMS = ["conectividad", "barreras", "proyectos", "apropiacion", "capacidad"] as const;
const DIM_LABEL: Record<string, string> = {
  conectividad: "Conectividad",
  barreras: "Barreras",
  proyectos: "Proyectos",
  apropiacion: "Apropiación",
  capacidad: "Capacidad",
};

function pct(n: number | null | undefined) {
  return n === null || n === undefined ? null : `${Number(n).toFixed(1)}%`;
}

export function ReporteDepartamentoPDF({
  departamento,
  reporte,
  proyectos,
  riesgos,
  temas,
  sistemas,
}: {
  departamento: Departamento;
  reporte: Reporte;
  proyectos: Proyecto[];
  riesgos: Riesgo[];
  temas: TemaCritico[];
  sistemas: SistemaActivo[];
}) {
  const r = reporte;

  const tieneConectividad = algunoTiene([
    r.cobertura_4g, r.cobertura_5g, r.hogares_internet, r.total_municipios,
    r.municipios_sin_cobertura, r.fuente_conectividad, r.zonas_criticas, r.infraestructura_critica,
  ]);
  const tieneBarreras = algunoTiene([r.tributos, r.detalle_tributos, r.barreras_despliegue]);
  const tieneProyectos = proyectos.length > 0;
  const tieneApropiacion = algunoTiene([
    r.programas_talento, r.personas_formadas, r.municipios_tramites_linea, r.tramites_gobernacion,
    r.mipymes_beneficiadas, r.incidentes_ciber, r.plan_transformacion, r.capacidad_respuesta_ciber,
    r.fuente_apropiacion, r.obs_apropiacion,
  ]);
  const tieneCapacidadEscalares = algunoTiene([
    r.dependencia, r.presupuesto_tic, r.personal_tic, r.contratos_vigentes,
    r.inventario, r.politica_seguridad, r.fuente_capacidad,
  ]);
  const tieneSistemas = sistemas.length > 0;
  const tieneCapacidad = tieneCapacidadEscalares || tieneSistemas || algunoTiene([r.obs_capacidad]);
  const tieneRiesgos = riesgos.length > 0;
  const tieneTemas = temas.length > 0;
  const tieneObservaciones = algunoTiene([r.observaciones_generales]);

  const N = numerarSecciones([
    { key: "identificacion", visible: true },
    { key: "conectividad", visible: tieneConectividad },
    { key: "barreras", visible: tieneBarreras },
    { key: "proyectos", visible: tieneProyectos },
    { key: "apropiacion", visible: tieneApropiacion },
    { key: "capacidad", visible: tieneCapacidad },
    { key: "riesgos", visible: tieneRiesgos },
    { key: "temas", visible: tieneTemas },
    { key: "observaciones", visible: tieneObservaciones },
  ] as const);

  return (
    <Document title={`Ficha TIC · ${departamento.nombre}`}>
      <Page size="A4" style={s.pagina} wrap>
        <View style={s.encabezado} fixed>
          <Text style={s.eyebrow}>EMPALME PRESIDENCIAL 2026 · SECTOR TIC · NIVEL TERRITORIAL</Text>
          <Text style={s.titulo}>{departamento.nombre} · Reporte TIC</Text>
          <Text style={s.subtitulo}>
            Región {departamento.region}
            {r.fecha_corte ? `  ·  Fecha de corte ${r.fecha_corte}` : ""}
            {"  ·  Estado: " + r.estado.toUpperCase()}
          </Text>
        </View>

        <View style={s.semaforosFila}>
          {DIMS.map((d) => (
            <View key={d} style={s.semaforoBox}>
              <Text style={s.semaforoLabel}>{DIM_LABEL[d].toUpperCase()}</Text>
              <Semaforo v={(r as Record<string, unknown>)[`sem_${d}`] as string | null} />
            </View>
          ))}
        </View>

        <Seccion num={N.identificacion} titulo="Identificación">
          <View style={s.grid3}>
            <Campo label="Departamento" valor={departamento.nombre} />
            <Campo label="Región" valor={departamento.region} />
            <Campo label="Fecha de corte" valor={r.fecha_corte} />
          </View>
        </Seccion>

        {tieneConectividad && (
          <Seccion num={N.conectividad} titulo="Conectividad e infraestructura">
            <View style={s.grid3}>
              <Campo label="Cobertura 4G" valor={pct(r.cobertura_4g)} />
              <Campo label="Cobertura 5G" valor={pct(r.cobertura_5g)} />
              <Campo label="Hogares con internet" valor={pct(r.hogares_internet)} />
              <Campo label="Total municipios" valor={r.total_municipios} />
              <Campo label="Municipios sin cobertura" valor={r.municipios_sin_cobertura} />
              <Campo label="Fuente" valor={r.fuente_conectividad} />
              <Campo label="Zonas críticas sin servicio" valor={r.zonas_criticas} ancho />
              <Campo label="Infraestructura crítica" valor={r.infraestructura_critica} ancho />
            </View>
          </Seccion>
        )}

        {tieneBarreras && (
          <Seccion num={N.barreras} titulo="Barreras territoriales">
            <View style={s.grid3}>
              <Campo label="Tributos aplicados" valor={(r.tributos ?? []).join(" · ") || null} ancho />
              <Campo label="Detalle de tributos" valor={r.detalle_tributos} ancho />
              <Campo label="Barreras de despliegue" valor={r.barreras_despliegue} ancho />
            </View>
          </Seccion>
        )}

        {tieneProyectos && (
          <SeccionTabla
            num={N.proyectos}
            titulo="Proyectos e inversión"
            columnas={[
              { titulo: "Proyecto", ancho: "28%" },
              { titulo: "Fuente", ancho: "14%" },
              { titulo: "Estado", ancho: "13%" },
              { titulo: "Avance", ancho: "9%" },
              { titulo: "Riesgos", ancho: "36%" },
            ]}
            filas={proyectos.map((p) => [p.nombre, p.fuente, p.estado, pct(p.avance), p.riesgos])}
          />
        )}

        {tieneApropiacion && (
          <Seccion num={N.apropiacion} titulo="Apropiación y transformación digital">
            <View style={s.grid3}>
              <Campo label="Programas de talento" valor={r.programas_talento} />
              <Campo label="Personas formadas" valor={r.personas_formadas} />
              <Campo label="Mpios. con trámites en línea" valor={r.municipios_tramites_linea} />
              <Campo label="Trámites gobernación" valor={r.tramites_gobernacion} />
              <Campo label="Mipymes beneficiadas" valor={r.mipymes_beneficiadas} />
              <Campo label="Incidentes ciberseguridad" valor={r.incidentes_ciber} />
              <Campo label="Plan transformación digital" valor={r.plan_transformacion} />
              <Campo label="Capacidad respuesta ciber" valor={r.capacidad_respuesta_ciber} />
              <Campo label="Fuente" valor={r.fuente_apropiacion} />
              {algunoTiene([r.obs_apropiacion]) && <Campo label="Observaciones" valor={r.obs_apropiacion} ancho />}
            </View>
          </Seccion>
        )}

        {tieneCapacidad && (
          <View style={s.seccion}>
            <View wrap={false}>
              <EncabezadoSeccion num={N.capacidad} titulo="Capacidad institucional" />
              {tieneCapacidadEscalares && (
                <View style={s.seccionBody}>
                  <View style={s.grid3}>
                    <Campo label="Dependencia TIC" valor={r.dependencia} />
                    <Campo label="Presupuesto TIC (COP mill.)" valor={r.presupuesto_tic} />
                    <Campo label="Personal TIC" valor={r.personal_tic} />
                    <Campo label="Contratos vigentes" valor={r.contratos_vigentes} />
                    <Campo label="Inventario de activos" valor={r.inventario} />
                    <Campo label="Política de seguridad (MSPI)" valor={r.politica_seguridad} />
                    <Campo label="Fuente" valor={r.fuente_capacidad} />
                  </View>
                </View>
              )}
            </View>
            {tieneSistemas && (
              <View style={[s.seccionBody, tieneCapacidadEscalares ? { paddingTop: 0 } : {}]}>
                <BloqueTabla
                  columnas={[
                    { titulo: "Sistema o activo", ancho: "26%" },
                    { titulo: "Tipo", ancho: "22%" },
                    { titulo: "Estado", ancho: "17%" },
                    { titulo: "Licenciamiento", ancho: "17%" },
                    { titulo: "Observación", ancho: "18%" },
                  ]}
                  filas={sistemas.map((x) => [x.nombre, x.tipo, x.estado, x.licenciamiento, x.observacion])}
                />
              </View>
            )}
            {algunoTiene([r.obs_capacidad]) && (
              <View style={[s.seccionBody, { paddingTop: 0 }]}>
                <Campo label="Observaciones" valor={r.obs_capacidad} ancho />
              </View>
            )}
          </View>
        )}

        {tieneRiesgos && (
          <SeccionTabla
            num={N.riesgos}
            titulo="Matriz de riesgos"
            columnas={[
              { titulo: "Sev.", ancho: "8%" },
              { titulo: "Descripción", ancho: "32%" },
              { titulo: "Dimensión", ancho: "16%" },
              { titulo: "Prob.", ancho: "10%" },
              { titulo: "Impacto", ancho: "10%" },
              { titulo: "Acción", ancho: "24%" },
            ]}
            filas={riesgos.map((rg) => [
              severidadDe(rg.probabilidad, rg.impacto).t,
              rg.descripcion,
              rg.dimension,
              rg.probabilidad,
              rg.impacto,
              rg.accion,
            ])}
          />
        )}

        {tieneTemas && (
          <SeccionTabla
            num={N.temas}
            titulo="Temas críticos"
            columnas={[
              { titulo: "Tema", ancho: "44%" },
              { titulo: "Plazo", ancho: "20%" },
              { titulo: "Responsable", ancho: "36%" },
            ]}
            filas={temas.map((t) => [t.tema, t.plazo, t.responsable])}
          />
        )}

        {tieneObservaciones && (
          <Seccion num={N.observaciones} titulo="Observaciones generales del enlace">
            <Text style={s.valor}>{r.observaciones_generales}</Text>
          </Seccion>
        )}

        <View style={s.piePagina} fixed>
          <Text>Empalme presidencial 2026 · Sector TIC · Nivel territorial</Text>
          <Text render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}
