// Catálogos y campos del instrumento de ciudad. Reutiliza enums del departamental
// y agrega los específicos de ciudad. Cadenas = enums de supabase/schema.sql.

export {
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
  type DimKey,
} from "@/lib/formulario-opciones";

// Dimensiones del tablero de semáforos, con anclas de sección propias de ciudad
// (capacidad va en s7 porque s6 es la sección de seguridad, sin semáforo).
export const DIMENSIONES_CIUDAD = [
  { key: "conectividad", num: "02", nombre: "Conectividad", seccion: "s2" },
  { key: "barreras", num: "03", nombre: "Barreras", seccion: "s3" },
  { key: "proyectos", num: "04", nombre: "Proyectos e inversión", seccion: "s4" },
  { key: "apropiacion", num: "05", nombre: "Ciudad inteligente", seccion: "s5" },
  { key: "capacidad", num: "07", nombre: "Capacidad institucional", seccion: "s7" },
] as const;

export const PAGO_LINEA = ["Sí, en línea", "Parcial", "No"];
export const DATOS_ABIERTOS = ["Portal activo", "En construcción", "No existe"];
export const CENTRO_MONITOREO = ["C4/C5 operativo", "Parcial / en formación", "No existe"];

// Columnas numéricas de reportes_ciudad
export const CAMPOS_ENTEROS_CIUDAD = [
  "comunas_total",
  "comunas_sin_cobertura",
  "zonas_wifi_publico",
  "programas_talento",
  "personas_formadas",
  "tramites_municipales_linea",
  "mipymes_beneficiadas",
  "incidentes_ciber",
  "camaras_videovigilancia",
  "personal_tic",
  "contratos_vigentes",
] as const;

export const CAMPOS_DECIMALES_CIUDAD = [
  "cobertura_4g",
  "cobertura_5g",
  "hogares_internet",
  "porcentaje_tramites_digital",
  "presupuesto_tic",
] as const;

// Campos que cuentan para el % diligenciado
export const CAMPOS_PROGRESO_CIUDAD = [
  "fecha_corte",
  "cobertura_4g",
  "cobertura_5g",
  "hogares_internet",
  "comunas_total",
  "comunas_sin_cobertura",
  "zonas_wifi_publico",
  "fuente_conectividad",
  "zonas_criticas",
  "infraestructura_critica",
  "detalle_tributos",
  "barreras_despliegue",
  "programas_talento",
  "personas_formadas",
  "tramites_municipales_linea",
  "porcentaje_tramites_digital",
  "mipymes_beneficiadas",
  "pago_impuestos_linea",
  "datos_abiertos",
  "plan_transformacion",
  "fuente_apropiacion",
  "obs_apropiacion",
  "incidentes_ciber",
  "camaras_videovigilancia",
  "centro_monitoreo",
  "capacidad_respuesta_ciber",
  "dependencia",
  "presupuesto_tic",
  "personal_tic",
  "contratos_vigentes",
  "inventario",
  "politica_seguridad",
  "fuente_capacidad",
  "obs_capacidad",
] as const;
