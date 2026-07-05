// Catálogos de opciones para el formulario del enlace. Las cadenas deben
// coincidir EXACTAMENTE con los enums de supabase/schema.sql.

export const DIMENSIONES = [
  { key: "conectividad", num: "02", nombre: "Conectividad", seccion: "s2" },
  { key: "barreras", num: "03", nombre: "Barreras territoriales", seccion: "s3" },
  { key: "proyectos", num: "04", nombre: "Proyectos e inversión", seccion: "s4" },
  { key: "apropiacion", num: "05", nombre: "Apropiación digital", seccion: "s5" },
  { key: "capacidad", num: "06", nombre: "Capacidad institucional", seccion: "s6" },
] as const;

export type DimKey = (typeof DIMENSIONES)[number]["key"];

// Columna sem_* en `reportes` para cada dimensión.
export const SEM_COL: Record<DimKey, string> = {
  conectividad: "sem_conectividad",
  barreras: "sem_barreras",
  proyectos: "sem_proyectos",
  apropiacion: "sem_apropiacion",
  capacidad: "sem_capacidad",
};

export const SEMAFORO_OPCIONes = [
  { value: "critico", label: "Crítico", tono: "rojo" },
  { value: "riesgo", label: "En riesgo", tono: "ambar" },
  { value: "estable", label: "Estable", tono: "verde" },
] as const;

export const TRIBUTOS = [
  { value: "Impuesto de alumbrado público sobre redes", label: "Alumbrado público sobre redes" },
  { value: "Impuesto de teléfonos / telégrafos", label: "Teléfonos / telégrafos" },
  { value: "Estampillas u otras contribuciones", label: "Estampillas u otras contribuciones" },
  { value: "Tasas por uso de espacio público", label: "Tasas por uso de espacio público" },
  { value: "Otros", label: "Otros" },
] as const;

export const ESTADO_PROYECTO = [
  "En ejecución",
  "Suspendido",
  "En estructuración",
  "Finalizado",
  "En riesgo de pérdida",
];

export const DIMENSION_RIESGO = [
  "Conectividad",
  "Barreras territoriales",
  "Proyectos e inversión",
  "Apropiación digital",
  "Capacidad institucional",
  "Transversal",
];

export const NIVEL_PROB = ["Alta", "Media", "Baja"];
export const NIVEL_IMPACTO = ["Alto", "Medio", "Bajo"];
export const PLAZO_TEMA = ["Inmediato (30 días)", "Corto (100 días)", "Primer año"];

export const TIPO_SISTEMA = [
  "Sistema misional",
  "Sistema de apoyo",
  "Infraestructura / equipos",
  "Portal o sede electrónica",
  "Otro",
];
export const ESTADO_SISTEMA = [
  "En operación",
  "Operando con fallas",
  "Obsoleto",
  "Fuera de servicio",
];
export const LICENCIAMIENTO_SISTEMA = [
  "Vigente",
  "Vencido",
  "Software libre",
  "Desarrollo propio",
  "Sin información",
];

export const DEPENDENCIA_TIC = [
  "Secretaría TIC propia",
  "Oficina / dirección adscrita a otra secretaría",
  "Enlace o funcionario designado",
  "No existe dependencia formal",
];
export const PLAN_TD = [
  "Sí, adoptado y en ejecución",
  "Sí, adoptado pero sin ejecución",
  "En formulación",
  "No existe",
];
export const CAPACIDAD_CIBER = ["Sí, formalizada", "Parcial / en construcción", "No existe"];
export const INVENTARIO_ACTIVOS = [
  "Sí, actualizado",
  "Existe pero desactualizado",
  "No existe",
];
export const POLITICA_MSPI = ["Adoptada y en ejecución", "Adoptada sin ejecución", "No existe"];

// Columnas numéricas de `reportes`: enteras vs decimales.
export const CAMPOS_ENTEROS = [
  "total_municipios",
  "municipios_sin_cobertura",
  "programas_talento",
  "personas_formadas",
  "municipios_tramites_linea",
  "tramites_gobernacion",
  "mipymes_beneficiadas",
  "incidentes_ciber",
  "personal_tic",
  "contratos_vigentes",
] as const;

export const CAMPOS_DECIMALES = [
  "cobertura_4g",
  "cobertura_5g",
  "hogares_internet",
  "presupuesto_tic",
] as const;

// Campos de texto/valor que cuentan para el % diligenciado.
export const CAMPOS_PROGRESO = [
  "fecha_corte",
  "cobertura_4g",
  "cobertura_5g",
  "hogares_internet",
  "total_municipios",
  "municipios_sin_cobertura",
  "fuente_conectividad",
  "zonas_criticas",
  "infraestructura_critica",
  "detalle_tributos",
  "barreras_despliegue",
  "programas_talento",
  "personas_formadas",
  "municipios_tramites_linea",
  "tramites_gobernacion",
  "mipymes_beneficiadas",
  "incidentes_ciber",
  "plan_transformacion",
  "capacidad_respuesta_ciber",
  "fuente_apropiacion",
  "obs_apropiacion",
  "dependencia",
  "presupuesto_tic",
  "personal_tic",
  "contratos_vigentes",
  "inventario",
  "politica_seguridad",
  "fuente_capacidad",
  "obs_capacidad",
] as const;
