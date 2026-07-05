// Tipos derivados de supabase/schema.sql (formato compatible con `supabase gen types`).
// Si el schema cambia, actualizar este archivo en el mismo commit.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type RolUsuario = "enlace" | "central" | "admin";
export type EstadoSemaforo = "critico" | "riesgo" | "estable";
export type EstadoReporte = "borrador" | "enviado" | "validado";
export type EstadoProyecto =
  | "En ejecución"
  | "Suspendido"
  | "En estructuración"
  | "Finalizado"
  | "En riesgo de pérdida";
export type NivelProb = "Alta" | "Media" | "Baja";
export type NivelImpacto = "Alto" | "Medio" | "Bajo";
export type PlazoTema = "Inmediato (30 días)" | "Corto (100 días)" | "Primer año";
export type DimensionRiesgo =
  | "Conectividad"
  | "Barreras territoriales"
  | "Proyectos e inversión"
  | "Apropiación digital"
  | "Capacidad institucional"
  | "Transversal";
export type TipoSistema =
  | "Sistema misional"
  | "Sistema de apoyo"
  | "Infraestructura / equipos"
  | "Portal o sede electrónica"
  | "Otro";
export type EstadoSistema =
  | "En operación"
  | "Operando con fallas"
  | "Obsoleto"
  | "Fuera de servicio";
export type LicenciamientoSistema =
  | "Vigente"
  | "Vencido"
  | "Software libre"
  | "Desarrollo propio"
  | "Sin información";
export type DependenciaTic =
  | "Secretaría TIC propia"
  | "Oficina / dirección adscrita a otra secretaría"
  | "Enlace o funcionario designado"
  | "No existe dependencia formal";
export type PlanTd =
  | "Sí, adoptado y en ejecución"
  | "Sí, adoptado pero sin ejecución"
  | "En formulación"
  | "No existe";
export type CapacidadCiber =
  | "Sí, formalizada"
  | "Parcial / en construcción"
  | "No existe";
export type InventarioActivos =
  | "Sí, actualizado"
  | "Existe pero desactualizado"
  | "No existe";
export type PoliticaMspi =
  | "Adoptada y en ejecución"
  | "Adoptada sin ejecución"
  | "No existe";

export type Region =
  | "Caribe"
  | "Andina"
  | "Pacífica"
  | "Orinoquía"
  | "Amazonía"
  | "Insular";

export type Database = {
  public: {
    Tables: {
      departamentos: {
        Row: {
          codigo: string;
          nombre: string;
          region: string;
        };
        Insert: {
          codigo: string;
          nombre: string;
          region: string;
        };
        Update: {
          codigo?: string;
          nombre?: string;
          region?: string;
        };
        Relationships: [];
      };
      perfiles: {
        Row: {
          id: string;
          nombre: string;
          correo: string;
          rol: RolUsuario;
          departamento_codigo: string | null;
          cargo: string | null;
          entidad: string | null;
          telefono: string | null;
          creado_en: string;
        };
        Insert: {
          id: string;
          nombre: string;
          correo: string;
          rol?: RolUsuario;
          departamento_codigo?: string | null;
          cargo?: string | null;
          entidad?: string | null;
          telefono?: string | null;
          creado_en?: string;
        };
        Update: {
          id?: string;
          nombre?: string;
          correo?: string;
          rol?: RolUsuario;
          departamento_codigo?: string | null;
          cargo?: string | null;
          entidad?: string | null;
          telefono?: string | null;
          creado_en?: string;
        };
        Relationships: [
          {
            foreignKeyName: "perfiles_departamento_codigo_fkey";
            columns: ["departamento_codigo"];
            referencedRelation: "departamentos";
            referencedColumns: ["codigo"];
          },
        ];
      };
      reportes: {
        Row: {
          id: string;
          departamento_codigo: string;
          estado: EstadoReporte;
          fecha_corte: string | null;
          cobertura_4g: number | null;
          cobertura_5g: number | null;
          hogares_internet: number | null;
          total_municipios: number | null;
          municipios_sin_cobertura: number | null;
          fuente_conectividad: string | null;
          zonas_criticas: string | null;
          infraestructura_critica: string | null;
          tributos: string[] | null;
          detalle_tributos: string | null;
          barreras_despliegue: string | null;
          programas_talento: number | null;
          personas_formadas: number | null;
          municipios_tramites_linea: number | null;
          tramites_gobernacion: number | null;
          mipymes_beneficiadas: number | null;
          incidentes_ciber: number | null;
          plan_transformacion: PlanTd | null;
          capacidad_respuesta_ciber: CapacidadCiber | null;
          fuente_apropiacion: string | null;
          obs_apropiacion: string | null;
          dependencia: DependenciaTic | null;
          presupuesto_tic: number | null;
          personal_tic: number | null;
          contratos_vigentes: number | null;
          inventario: InventarioActivos | null;
          politica_seguridad: PoliticaMspi | null;
          fuente_capacidad: string | null;
          obs_capacidad: string | null;
          sem_conectividad: EstadoSemaforo | null;
          sem_barreras: EstadoSemaforo | null;
          sem_proyectos: EstadoSemaforo | null;
          sem_apropiacion: EstadoSemaforo | null;
          sem_capacidad: EstadoSemaforo | null;
          observaciones_generales: string | null;
          creado_por: string | null;
          creado_en: string;
          actualizado_en: string;
          enviado_en: string | null;
        };
        Insert: {
          id?: string;
          departamento_codigo: string;
          estado?: EstadoReporte;
          fecha_corte?: string | null;
          cobertura_4g?: number | null;
          cobertura_5g?: number | null;
          hogares_internet?: number | null;
          total_municipios?: number | null;
          municipios_sin_cobertura?: number | null;
          fuente_conectividad?: string | null;
          zonas_criticas?: string | null;
          infraestructura_critica?: string | null;
          tributos?: string[] | null;
          detalle_tributos?: string | null;
          barreras_despliegue?: string | null;
          programas_talento?: number | null;
          personas_formadas?: number | null;
          municipios_tramites_linea?: number | null;
          tramites_gobernacion?: number | null;
          mipymes_beneficiadas?: number | null;
          incidentes_ciber?: number | null;
          plan_transformacion?: PlanTd | null;
          capacidad_respuesta_ciber?: CapacidadCiber | null;
          fuente_apropiacion?: string | null;
          obs_apropiacion?: string | null;
          dependencia?: DependenciaTic | null;
          presupuesto_tic?: number | null;
          personal_tic?: number | null;
          contratos_vigentes?: number | null;
          inventario?: InventarioActivos | null;
          politica_seguridad?: PoliticaMspi | null;
          fuente_capacidad?: string | null;
          obs_capacidad?: string | null;
          sem_conectividad?: EstadoSemaforo | null;
          sem_barreras?: EstadoSemaforo | null;
          sem_proyectos?: EstadoSemaforo | null;
          sem_apropiacion?: EstadoSemaforo | null;
          sem_capacidad?: EstadoSemaforo | null;
          observaciones_generales?: string | null;
          creado_por?: string | null;
          creado_en?: string;
          actualizado_en?: string;
          enviado_en?: string | null;
        };
        Update: {
          id?: string;
          departamento_codigo?: string;
          estado?: EstadoReporte;
          fecha_corte?: string | null;
          cobertura_4g?: number | null;
          cobertura_5g?: number | null;
          hogares_internet?: number | null;
          total_municipios?: number | null;
          municipios_sin_cobertura?: number | null;
          fuente_conectividad?: string | null;
          zonas_criticas?: string | null;
          infraestructura_critica?: string | null;
          tributos?: string[] | null;
          detalle_tributos?: string | null;
          barreras_despliegue?: string | null;
          programas_talento?: number | null;
          personas_formadas?: number | null;
          municipios_tramites_linea?: number | null;
          tramites_gobernacion?: number | null;
          mipymes_beneficiadas?: number | null;
          incidentes_ciber?: number | null;
          plan_transformacion?: PlanTd | null;
          capacidad_respuesta_ciber?: CapacidadCiber | null;
          fuente_apropiacion?: string | null;
          obs_apropiacion?: string | null;
          dependencia?: DependenciaTic | null;
          presupuesto_tic?: number | null;
          personal_tic?: number | null;
          contratos_vigentes?: number | null;
          inventario?: InventarioActivos | null;
          politica_seguridad?: PoliticaMspi | null;
          fuente_capacidad?: string | null;
          obs_capacidad?: string | null;
          sem_conectividad?: EstadoSemaforo | null;
          sem_barreras?: EstadoSemaforo | null;
          sem_proyectos?: EstadoSemaforo | null;
          sem_apropiacion?: EstadoSemaforo | null;
          sem_capacidad?: EstadoSemaforo | null;
          observaciones_generales?: string | null;
          creado_por?: string | null;
          creado_en?: string;
          actualizado_en?: string;
          enviado_en?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "reportes_departamento_codigo_fkey";
            columns: ["departamento_codigo"];
            referencedRelation: "departamentos";
            referencedColumns: ["codigo"];
          },
          {
            foreignKeyName: "reportes_creado_por_fkey";
            columns: ["creado_por"];
            referencedRelation: "perfiles";
            referencedColumns: ["id"];
          },
        ];
      };
      proyectos: {
        Row: {
          id: string;
          reporte_id: string;
          nombre: string;
          fuente: string | null;
          estado: EstadoProyecto | null;
          avance: number | null;
          riesgos: string | null;
          orden: number | null;
        };
        Insert: {
          id?: string;
          reporte_id: string;
          nombre: string;
          fuente?: string | null;
          estado?: EstadoProyecto | null;
          avance?: number | null;
          riesgos?: string | null;
          orden?: number | null;
        };
        Update: {
          id?: string;
          reporte_id?: string;
          nombre?: string;
          fuente?: string | null;
          estado?: EstadoProyecto | null;
          avance?: number | null;
          riesgos?: string | null;
          orden?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "proyectos_reporte_id_fkey";
            columns: ["reporte_id"];
            referencedRelation: "reportes";
            referencedColumns: ["id"];
          },
        ];
      };
      riesgos: {
        Row: {
          id: string;
          reporte_id: string;
          descripcion: string;
          dimension: DimensionRiesgo | null;
          probabilidad: NivelProb | null;
          impacto: NivelImpacto | null;
          accion: string | null;
          orden: number | null;
        };
        Insert: {
          id?: string;
          reporte_id: string;
          descripcion: string;
          dimension?: DimensionRiesgo | null;
          probabilidad?: NivelProb | null;
          impacto?: NivelImpacto | null;
          accion?: string | null;
          orden?: number | null;
        };
        Update: {
          id?: string;
          reporte_id?: string;
          descripcion?: string;
          dimension?: DimensionRiesgo | null;
          probabilidad?: NivelProb | null;
          impacto?: NivelImpacto | null;
          accion?: string | null;
          orden?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "riesgos_reporte_id_fkey";
            columns: ["reporte_id"];
            referencedRelation: "reportes";
            referencedColumns: ["id"];
          },
        ];
      };
      temas_criticos: {
        Row: {
          id: string;
          reporte_id: string;
          tema: string;
          plazo: PlazoTema | null;
          responsable: string | null;
          orden: number | null;
        };
        Insert: {
          id?: string;
          reporte_id: string;
          tema: string;
          plazo?: PlazoTema | null;
          responsable?: string | null;
          orden?: number | null;
        };
        Update: {
          id?: string;
          reporte_id?: string;
          tema?: string;
          plazo?: PlazoTema | null;
          responsable?: string | null;
          orden?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "temas_criticos_reporte_id_fkey";
            columns: ["reporte_id"];
            referencedRelation: "reportes";
            referencedColumns: ["id"];
          },
        ];
      };
      sistemas_activos: {
        Row: {
          id: string;
          reporte_id: string;
          nombre: string;
          tipo: TipoSistema | null;
          estado: EstadoSistema | null;
          licenciamiento: LicenciamientoSistema | null;
          observacion: string | null;
          orden: number | null;
        };
        Insert: {
          id?: string;
          reporte_id: string;
          nombre: string;
          tipo?: TipoSistema | null;
          estado?: EstadoSistema | null;
          licenciamiento?: LicenciamientoSistema | null;
          observacion?: string | null;
          orden?: number | null;
        };
        Update: {
          id?: string;
          reporte_id?: string;
          nombre?: string;
          tipo?: TipoSistema | null;
          estado?: EstadoSistema | null;
          licenciamiento?: LicenciamientoSistema | null;
          observacion?: string | null;
          orden?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "sistemas_activos_reporte_id_fkey";
            columns: ["reporte_id"];
            referencedRelation: "reportes";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      v_severidad_riesgos: {
        Row: {
          id: string | null;
          reporte_id: string | null;
          descripcion: string | null;
          dimension: DimensionRiesgo | null;
          probabilidad: NivelProb | null;
          impacto: NivelImpacto | null;
          accion: string | null;
          orden: number | null;
          severidad: number | null;
          departamento: string | null;
          region: string | null;
        };
        Relationships: [];
      };
      v_consolidado_regional: {
        Row: {
          region: string | null;
          departamentos_reportados: number | null;
          prom_cobertura_4g: number | null;
          prom_cobertura_5g: number | null;
          prom_hogares_internet: number | null;
          mpios_sin_cobertura: number | null;
          personas_formadas: number | null;
          mpios_tramites_linea: number | null;
          semaforos_criticos: number | null;
          riesgos_alta_severidad: number | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      mi_rol: {
        Args: Record<string, never>;
        Returns: RolUsuario;
      };
      mi_departamento: {
        Args: Record<string, never>;
        Returns: string;
      };
      puede_ver_reporte: {
        Args: { rid: string };
        Returns: boolean;
      };
      puede_editar_reporte: {
        Args: { rid: string };
        Returns: boolean;
      };
    };
    Enums: {
      rol_usuario: RolUsuario;
      estado_semaforo: EstadoSemaforo;
      estado_reporte: EstadoReporte;
      estado_proyecto: EstadoProyecto;
      nivel_prob: NivelProb;
      nivel_impacto: NivelImpacto;
      plazo_tema: PlazoTema;
      dimension_riesgo: DimensionRiesgo;
      tipo_sistema: TipoSistema;
      estado_sistema: EstadoSistema;
      licenciamiento_sistema: LicenciamientoSistema;
      dependencia_tic: DependenciaTic;
      plan_td: PlanTd;
      capacidad_ciber: CapacidadCiber;
      inventario_activos: InventarioActivos;
      politica_mspi: PoliticaMspi;
    };
    CompositeTypes: Record<string, never>;
  };
};

// Alias de conveniencia
export type Departamento = Database["public"]["Tables"]["departamentos"]["Row"];
export type Perfil = Database["public"]["Tables"]["perfiles"]["Row"];
export type Reporte = Database["public"]["Tables"]["reportes"]["Row"];
export type Proyecto = Database["public"]["Tables"]["proyectos"]["Row"];
export type Riesgo = Database["public"]["Tables"]["riesgos"]["Row"];
export type TemaCritico = Database["public"]["Tables"]["temas_criticos"]["Row"];
export type SistemaActivo = Database["public"]["Tables"]["sistemas_activos"]["Row"];
export type ConsolidadoRegional =
  Database["public"]["Views"]["v_consolidado_regional"]["Row"];
export type SeveridadRiesgo =
  Database["public"]["Views"]["v_severidad_riesgos"]["Row"];
