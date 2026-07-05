-- ============================================================
-- EMPALME TERRITORIAL TIC 2026 · Esquema Supabase
-- Ejecutar en: Supabase Dashboard > SQL Editor (o supabase db push)
-- ============================================================

-- ---------- Tipos enumerados ----------
create type rol_usuario as enum ('enlace', 'central', 'admin');
create type estado_semaforo as enum ('critico', 'riesgo', 'estable');
create type estado_reporte as enum ('borrador', 'enviado', 'validado');
create type estado_proyecto as enum ('En ejecución', 'Suspendido', 'En estructuración', 'Finalizado', 'En riesgo de pérdida');
create type nivel_prob as enum ('Alta', 'Media', 'Baja');
create type nivel_impacto as enum ('Alto', 'Medio', 'Bajo');
create type plazo_tema as enum ('Inmediato (30 días)', 'Corto (100 días)', 'Primer año');
create type dimension_riesgo as enum ('Conectividad', 'Barreras territoriales', 'Proyectos e inversión', 'Apropiación digital', 'Capacidad institucional', 'Transversal');
create type tipo_sistema as enum ('Sistema misional', 'Sistema de apoyo', 'Infraestructura / equipos', 'Portal o sede electrónica', 'Otro');
create type estado_sistema as enum ('En operación', 'Operando con fallas', 'Obsoleto', 'Fuera de servicio');
create type licenciamiento_sistema as enum ('Vigente', 'Vencido', 'Software libre', 'Desarrollo propio', 'Sin información');
create type dependencia_tic as enum ('Secretaría TIC propia', 'Oficina / dirección adscrita a otra secretaría', 'Enlace o funcionario designado', 'No existe dependencia formal');
create type plan_td as enum ('Sí, adoptado y en ejecución', 'Sí, adoptado pero sin ejecución', 'En formulación', 'No existe');
create type capacidad_ciber as enum ('Sí, formalizada', 'Parcial / en construcción', 'No existe');
create type inventario_activos as enum ('Sí, actualizado', 'Existe pero desactualizado', 'No existe');
create type politica_mspi as enum ('Adoptada y en ejecución', 'Adoptada sin ejecución', 'No existe');

-- ---------- Catálogo de departamentos ----------
create table departamentos (
  codigo   text primary key,            -- código DIVIPOLA
  nombre   text not null unique,
  region   text not null check (region in ('Caribe','Andina','Pacífica','Orinoquía','Amazonía','Insular'))
);

insert into departamentos (codigo, nombre, region) values
 ('91','Amazonas','Amazonía'),('05','Antioquia','Andina'),('81','Arauca','Orinoquía'),
 ('08','Atlántico','Caribe'),('11','Bogotá D.C.','Andina'),('13','Bolívar','Caribe'),
 ('15','Boyacá','Andina'),('17','Caldas','Andina'),('18','Caquetá','Amazonía'),
 ('85','Casanare','Orinoquía'),('19','Cauca','Pacífica'),('20','Cesar','Caribe'),
 ('27','Chocó','Pacífica'),('23','Córdoba','Caribe'),('25','Cundinamarca','Andina'),
 ('94','Guainía','Amazonía'),('95','Guaviare','Amazonía'),('41','Huila','Andina'),
 ('44','La Guajira','Caribe'),('47','Magdalena','Caribe'),('50','Meta','Orinoquía'),
 ('52','Nariño','Pacífica'),('54','Norte de Santander','Andina'),('86','Putumayo','Amazonía'),
 ('63','Quindío','Andina'),('66','Risaralda','Andina'),('88','San Andrés y Providencia','Insular'),
 ('68','Santander','Andina'),('70','Sucre','Caribe'),('73','Tolima','Andina'),
 ('76','Valle del Cauca','Pacífica'),('97','Vaupés','Amazonía'),('99','Vichada','Orinoquía');

-- ---------- Perfiles de usuario ----------
create table perfiles (
  id                  uuid primary key references auth.users(id) on delete cascade,
  nombre              text not null,
  correo              text not null,
  rol                 rol_usuario not null default 'enlace',
  departamento_codigo text references departamentos(codigo),  -- obligatorio para rol 'enlace'
  cargo               text,
  entidad             text,
  telefono            text,
  creado_en           timestamptz not null default now(),
  constraint enlace_requiere_depto check (rol <> 'enlace' or departamento_codigo is not null)
);

-- ---------- Reporte departamental (cabecera) ----------
create table reportes (
  id                  uuid primary key default gen_random_uuid(),
  departamento_codigo text not null references departamentos(codigo),
  estado              estado_reporte not null default 'borrador',
  fecha_corte         date,

  -- 02 Conectividad e infraestructura
  cobertura_4g            numeric(5,2) check (cobertura_4g between 0 and 100),
  cobertura_5g            numeric(5,2) check (cobertura_5g between 0 and 100),
  hogares_internet        numeric(5,2) check (hogares_internet between 0 and 100),
  total_municipios        int check (total_municipios >= 0),
  municipios_sin_cobertura int check (municipios_sin_cobertura >= 0),
  fuente_conectividad     text,
  zonas_criticas          text,
  infraestructura_critica text,

  -- 03 Barreras territoriales
  tributos            text[] default '{}',   -- lista de tributos aplicados
  detalle_tributos    text,
  barreras_despliegue text,

  -- 05 Apropiación y transformación digital
  programas_talento          int check (programas_talento >= 0),
  personas_formadas          int check (personas_formadas >= 0),
  municipios_tramites_linea  int check (municipios_tramites_linea >= 0),
  tramites_gobernacion       int check (tramites_gobernacion >= 0),
  mipymes_beneficiadas       int check (mipymes_beneficiadas >= 0),
  incidentes_ciber           int check (incidentes_ciber >= 0),
  plan_transformacion        plan_td,
  capacidad_respuesta_ciber  capacidad_ciber,
  fuente_apropiacion         text,
  obs_apropiacion            varchar(300),

  -- 06 Capacidad institucional
  dependencia          dependencia_tic,
  presupuesto_tic      numeric(14,2) check (presupuesto_tic >= 0),  -- COP millones
  personal_tic         int check (personal_tic >= 0),
  contratos_vigentes   int check (contratos_vigentes >= 0),
  inventario           inventario_activos,
  politica_seguridad   politica_mspi,
  fuente_capacidad     text,
  obs_capacidad        varchar(300),

  -- Semáforos por dimensión
  sem_conectividad estado_semaforo,
  sem_barreras     estado_semaforo,
  sem_proyectos    estado_semaforo,
  sem_apropiacion  estado_semaforo,
  sem_capacidad    estado_semaforo,

  observaciones_generales text,

  creado_por    uuid references perfiles(id),
  creado_en     timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  enviado_en    timestamptz,

  -- Un reporte activo por departamento
  constraint un_reporte_por_depto unique (departamento_codigo)
);

-- ---------- Tablas hijas ----------
create table proyectos (
  id         uuid primary key default gen_random_uuid(),
  reporte_id uuid not null references reportes(id) on delete cascade,
  nombre     text not null,
  fuente     text,               -- FUTIC, OdH, APP, recursos propios…
  estado     estado_proyecto,
  avance     numeric(5,2) check (avance between 0 and 100),
  riesgos    text,
  orden      int default 0
);

create table riesgos (
  id           uuid primary key default gen_random_uuid(),
  reporte_id   uuid not null references reportes(id) on delete cascade,
  descripcion  text not null,
  dimension    dimension_riesgo,
  probabilidad nivel_prob,
  impacto      nivel_impacto,
  accion       text,
  orden        int default 0
);

create table temas_criticos (
  id          uuid primary key default gen_random_uuid(),
  reporte_id  uuid not null references reportes(id) on delete cascade,
  tema        text not null,
  plazo       plazo_tema,
  responsable text,
  orden       int default 0
);

create table sistemas_activos (
  id             uuid primary key default gen_random_uuid(),
  reporte_id     uuid not null references reportes(id) on delete cascade,
  nombre         text not null,
  tipo           tipo_sistema,
  estado         estado_sistema,
  licenciamiento licenciamiento_sistema,
  observacion    text,
  orden          int default 0
);

-- ---------- Trigger de actualización ----------
create or replace function touch_actualizado() returns trigger language plpgsql as $$
begin new.actualizado_en = now(); return new; end $$;
create trigger trg_reportes_touch before update on reportes
  for each row execute function touch_actualizado();

-- ---------- Funciones auxiliares para RLS ----------
create or replace function mi_rol() returns rol_usuario
language sql stable security definer set search_path = public as
$$ select rol from perfiles where id = auth.uid() $$;

create or replace function mi_departamento() returns text
language sql stable security definer set search_path = public as
$$ select departamento_codigo from perfiles where id = auth.uid() $$;

-- ---------- Row Level Security ----------
alter table perfiles         enable row level security;
alter table departamentos    enable row level security;
alter table reportes         enable row level security;
alter table proyectos        enable row level security;
alter table riesgos          enable row level security;
alter table temas_criticos   enable row level security;
alter table sistemas_activos enable row level security;

-- Departamentos: lectura para todo usuario autenticado
create policy dep_select on departamentos for select to authenticated using (true);

-- Perfiles: cada quien ve el suyo; central/admin ven todos; admin administra
create policy perfil_propio on perfiles for select to authenticated
  using (id = auth.uid() or mi_rol() in ('central','admin'));
create policy perfil_update_propio on perfiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid() and rol = (select rol from perfiles p where p.id = auth.uid()));
create policy perfil_admin on perfiles for all to authenticated
  using (mi_rol() = 'admin') with check (mi_rol() = 'admin');

-- Reportes: enlace CRUD sobre su departamento mientras esté en borrador;
-- central lee todo y puede validar; admin todo.
create policy rep_select on reportes for select to authenticated
  using (mi_rol() in ('central','admin') or departamento_codigo = mi_departamento());
create policy rep_insert on reportes for insert to authenticated
  with check (
    (mi_rol() = 'enlace' and departamento_codigo = mi_departamento())
    or mi_rol() = 'admin');
create policy rep_update on reportes for update to authenticated
  using (
    (mi_rol() = 'enlace' and departamento_codigo = mi_departamento() and estado = 'borrador')
    or mi_rol() in ('central','admin'))
  with check (
    (mi_rol() = 'enlace' and departamento_codigo = mi_departamento())
    or mi_rol() in ('central','admin'));
create policy rep_delete on reportes for delete to authenticated
  using (mi_rol() = 'admin');

-- Plantilla de políticas para tablas hijas (mismo criterio vía reporte padre)
create or replace function puede_ver_reporte(rid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from reportes r where r.id = rid
    and (mi_rol() in ('central','admin') or r.departamento_codigo = mi_departamento()))
$$;
create or replace function puede_editar_reporte(rid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from reportes r where r.id = rid
    and ((mi_rol() = 'enlace' and r.departamento_codigo = mi_departamento() and r.estado = 'borrador')
         or mi_rol() in ('central','admin')))
$$;

do $$
declare t text;
begin
  foreach t in array array['proyectos','riesgos','temas_criticos','sistemas_activos'] loop
    execute format('create policy %I on %I for select to authenticated using (puede_ver_reporte(reporte_id))', t || '_select', t);
    execute format('create policy %I on %I for insert to authenticated with check (puede_editar_reporte(reporte_id))', t || '_insert', t);
    execute format('create policy %I on %I for update to authenticated using (puede_editar_reporte(reporte_id)) with check (puede_editar_reporte(reporte_id))', t || '_update', t);
    execute format('create policy %I on %I for delete to authenticated using (puede_editar_reporte(reporte_id))', t || '_delete', t);
  end loop;
end $$;

-- ---------- Vistas de consolidación ----------
create or replace view v_severidad_riesgos as
select r.*,
  (case r.probabilidad when 'Alta' then 3 when 'Media' then 2 when 'Baja' then 1 else 0 end) *
  (case r.impacto     when 'Alto' then 3 when 'Medio' then 2 when 'Bajo' then 1 else 0 end) as severidad,
  d.nombre as departamento, d.region
from riesgos r
join reportes rep on rep.id = r.reporte_id
join departamentos d on d.codigo = rep.departamento_codigo;

create or replace view v_consolidado_regional as
select
  d.region,
  count(rep.id)                                        as departamentos_reportados,
  round(avg(rep.cobertura_4g), 1)                      as prom_cobertura_4g,
  round(avg(rep.cobertura_5g), 1)                      as prom_cobertura_5g,
  round(avg(rep.hogares_internet), 1)                  as prom_hogares_internet,
  sum(rep.municipios_sin_cobertura)                    as mpios_sin_cobertura,
  sum(rep.personas_formadas)                           as personas_formadas,
  sum(rep.municipios_tramites_linea)                   as mpios_tramites_linea,
  sum((rep.sem_conectividad = 'critico')::int + (rep.sem_barreras = 'critico')::int
    + (rep.sem_proyectos = 'critico')::int + (rep.sem_apropiacion = 'critico')::int
    + (rep.sem_capacidad = 'critico')::int)            as semaforos_criticos,
  (select count(*) from v_severidad_riesgos v
     where v.region = d.region and v.severidad >= 6)   as riesgos_alta_severidad
from departamentos d
left join reportes rep on rep.departamento_codigo = d.codigo and rep.estado in ('enviado','validado')
group by d.region;

-- Las vistas heredan RLS de las tablas base (security_invoker por defecto en PG15+).
alter view v_severidad_riesgos set (security_invoker = true);
alter view v_consolidado_regional set (security_invoker = true);
