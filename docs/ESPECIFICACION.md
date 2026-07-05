# ESPECIFICACIÓN FUNCIONAL · Plataforma Empalme Territorial TIC 2026

## 1. Contexto

Sistema para el empalme presidencial 2026, sector TIC, Colombia. Los **enlaces departamentales** (33: 32 departamentos + Bogotá D.C.) diligencian en línea el estado TIC de su territorio. El **equipo central** consolida y analiza por regiones (Caribe, Andina, Pacífica, Orinoquía, Amazonía, Insular).

Reemplaza un flujo previo basado en archivos HTML + JSON por correo (ver carpeta `referencia/`, que define la UX y los campos exactos esperados).

## 2. Stack

- **Frontend/backend:** Next.js 14+ (App Router) + TypeScript + Tailwind CSS
- **Base de datos y auth:** Supabase (Postgres + Auth con magic link + RLS)
- **Cliente Supabase:** `@supabase/supabase-js` + `@supabase/ssr`
- **Repositorio:** GitHub · **Despliegue:** Vercel
- **Esquema de BD:** ya definido en `supabase/schema.sql` — ejecutarlo tal cual, no reinventarlo.

## 3. Roles y permisos (ya implementados como RLS en el schema)

| Rol | Puede |
|---|---|
| `enlace` | Ver y editar el reporte de SU departamento mientras esté en `borrador`; enviarlo (pasa a `enviado`, queda de solo lectura para él) |
| `central` | Leer todos los reportes, dashboard consolidado, validar reportes (`enviado` → `validado`), devolver a borrador |
| `admin` | Todo lo anterior + gestionar usuarios/perfiles |

Auth: magic link por correo. Al primer login, si no existe fila en `perfiles`, mostrar pantalla "cuenta pendiente de activación" (el admin crea/asigna perfiles).

## 4. Rutas

| Ruta | Acceso | Descripción |
|---|---|---|
| `/login` | público | Magic link |
| `/formulario` | enlace | Formulario de su departamento (crea el reporte si no existe) |
| `/consolidado` | central, admin | Dashboard regional |
| `/reportes/[codigo]` | central, admin | Detalle de un reporte departamental |
| `/admin` | admin | Gestión de perfiles (crear usuario, asignar rol y departamento) |
| `/importar` | central, admin | Importar archivos JSON del instrumento HTML anterior (formato en §7) |

## 5. Formulario departamental (`/formulario`)

Replicar la estructura y UX del archivo `referencia/instrumento_departamental_TIC.html`:

- **Tablero de semáforos fijo (sticky)** arriba: departamento, región, % diligenciado y un punto de color por dimensión (conectividad, barreras, proyectos, apropiación, capacidad) que se enciende al calificar. Clic en cada celda hace scroll a la sección.
- **Autosave**: guardar en Supabase con debounce (~1,5 s) tras cada cambio; indicador "Guardado" / "Guardando…".
- **Secciones** (campos → columnas de `reportes`, ver schema):
  1. **Identificación**: departamento y región vienen del perfil (solo lectura); fecha de corte; datos de contacto del perfil editables.
  2. **Conectividad**: cobertura_4g, cobertura_5g, hogares_internet, total_municipios, municipios_sin_cobertura, fuente_conectividad, zonas_criticas (textarea), infraestructura_critica (textarea) + semáforo.
  3. **Barreras**: tributos (checkboxes: Alumbrado público sobre redes · Teléfonos/telégrafos · Estampillas u otras contribuciones · Tasas por uso de espacio público · Otros), detalle_tributos, barreras_despliegue + semáforo.
  4. **Proyectos** (tabla hija `proyectos`): nombre, fuente, estado (enum), avance %, riesgos. Filas dinámicas + semáforo.
  5. **Apropiación digital** (solo indicadores cerrados): programas_talento, personas_formadas, municipios_tramites_linea, tramites_gobernacion, mipymes_beneficiadas, incidentes_ciber, plan_transformacion (select enum), capacidad_respuesta_ciber (select enum), fuente_apropiacion, obs_apropiacion (máx 300) + semáforo.
  6. **Capacidad institucional**: dependencia (select enum), presupuesto_tic, personal_tic, contratos_vigentes, inventario (select enum), politica_seguridad (select enum), fuente_capacidad + **tabla hija `sistemas_activos`** (nombre, tipo, estado, licenciamiento, observación) + obs_capacidad (máx 300) + semáforo.
  7. **Matriz de riesgos** (tabla hija `riesgos`): descripcion, dimension, probabilidad, impacto, accion.
  8. **Temas críticos** (tabla hija `temas_criticos`): tema, plazo, responsable + observaciones_generales.
- **Botón "Enviar reporte"**: valida que haya departamento, fecha de corte y los 5 semáforos; cambia estado a `enviado` con confirmación. Después de enviado el enlace ve todo en solo lectura con aviso "Reporte enviado el {fecha}".

## 6. Dashboard consolidado (`/consolidado`)

Replicar `referencia/consolidador_regional_TIC.html` leyendo de Supabase (solo reportes `enviado` o `validado`):

- **KPIs**: reportes recibidos / 33, regiones con información, semáforos en crítico, riesgos de alta severidad (probabilidad×impacto ≥ 6), temas de plazo inmediato.
- **Mapa de calor**: departamentos agrupados por región × 5 semáforos (pills de color; "s/i" si nulo). Muestra también estado del reporte y fecha de corte. Clic → `/reportes/[codigo]`.
- **Tabla regional**: usar la vista `v_consolidado_regional`.
- **Riesgos consolidados**: usar `v_severidad_riesgos` ordenada por severidad desc.
- **Agenda de temas críticos** ordenada por plazo.
- **Exportar CSV** (mismas columnas que el consolidador HTML de referencia) y botón imprimir.
- Realtime opcional: suscripción a cambios de `reportes` para refrescar KPIs.

## 7. Importador de JSON legado (`/importar`)

Los enlaces pudieron generar archivos `empalme_TIC_<Depto>.json` con el instrumento HTML. Estructura:

```json
{
  "version": 1, "tipo": "departamental",
  "identificacion": {"departamento":"Atlántico","region":"Caribe","enlace":"…","fechaCorte":"2026-06-30", "...":"…"},
  "conectividad": {"cobertura4g":"85","cobertura5g":"40","hogaresInternet":"62","totalMunicipios":"23","municipiosSinCobertura":"3","fuente":"…","zonasCriticas":"…","infraestructura":"…"},
  "barreras": {"tributos":["…"],"detalleTributos":"…","barrerasDespliegue":"…"},
  "apropiacion": {"programasTalento":"4","personasFormadas":"1200","municipiosTramitesLinea":"10","tramitesGobernacion":"15","mipymesBeneficiadas":"300","incidentesCiber":"2","planTransformacion":"…","capacidadCiber":"…","fuente":"…","observaciones":"…"},
  "capacidad": {"dependencia":"…","presupuesto":"1500","personal":"8","contratosVigentes":"5","inventarioActivos":"…","politicaSeguridad":"…","fuente":"…","observaciones":"…","sistemas":[{"nombre":"…","tipo":"…","estado":"…","licenciamiento":"…","observacion":"…"}]},
  "semaforos": {"conectividad":"critico","barreras":"riesgo","proyectos":"estable","apropiacion":null,"capacidad":"riesgo"},
  "proyectos": [{"nombre":"…","fuente":"…","estado":"…","avance":"60","riesgos":"…"}],
  "riesgos": [{"descripcion":"…","dimension":"…","probabilidad":"Alta","impacto":"Alto","accion":"…"}],
  "temasCriticos": [{"tema":"…","plazo":"Inmediato (30 días)","responsable":"…"}]
}
```

El importador mapea camelCase → snake_case, hace upsert del reporte por departamento (con confirmación si ya existe) e inserta las filas hijas.

## 8. Diseño visual

Mantener la identidad de los HTML de referencia:
- Paleta: navy `#16324F`, steel `#3E5C76`, papel `#F2F4F7`, semáforo rojo `#B3261E` / ámbar `#B77400` / verde `#1E7A46` con fondos suaves.
- Tipografías Google Fonts: Archivo (display), IBM Plex Sans (cuerpo), IBM Plex Mono (etiquetas/datos).
- Todo el texto de la interfaz en **español**.

## 9. Criterios de aceptación

1. Un enlace autenticado solo puede ver/editar su departamento (verificado por RLS, no solo por UI).
2. Autosave funciona y no pierde datos al recargar.
3. Enviar reporte lo bloquea para el enlace; central lo ve al instante en el consolidado.
4. El CSV exportado desde `/consolidado` abre correctamente en Excel (separador `;`, BOM UTF-8).
5. Importar un JSON legado reproduce fielmente todos los campos y tablas hijas.
6. Responsive hasta 380 px de ancho; el formulario es usable desde celular.
7. Sin claves en el repositorio: solo `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` como variables de entorno (más `SUPABASE_SERVICE_ROLE_KEY` solo en server para `/admin`).

## 10. Fuera de alcance (por ahora)

- Instrumento para ciudades capitales (se hará después como segundo tipo de reporte; el schema deberá extenderse, no modificarse).
- Notificaciones por correo.
- Versionado histórico de reportes.
