# PROMPT INICIAL PARA CLAUDE CODE

Copia y pega esto como primer mensaje en Claude Code, parado en la carpeta del proyecto (que debe contener `docs/`, `supabase/` y `referencia/` de este paquete):

---

Vas a construir la **Plataforma Empalme Territorial TIC 2026**: una aplicación web donde 33 enlaces departamentales de Colombia reportan el estado TIC de su territorio y un equipo central lo consolida por regiones.

Lee primero, en este orden:
1. `docs/ESPECIFICACION.md` — especificación funcional completa (rutas, roles, campos, criterios de aceptación).
2. `supabase/schema.sql` — esquema de base de datos ya definido con RLS. Úsalo tal cual; si necesitas cambios, propónmelos antes de aplicarlos.
3. `referencia/instrumento_departamental_TIC.html` y `referencia/consolidador_regional_TIC.html` — versión anterior standalone que define la UX, el diseño visual (colores, tipografías, tablero de semáforos) y la lógica de negocio exacta (severidad de riesgos, agrupación regional, CSV).

Stack obligatorio: Next.js 14+ App Router, TypeScript, Tailwind CSS, Supabase (`@supabase/supabase-js` + `@supabase/ssr`), despliegue en Vercel.

Plan de trabajo (ve fase por fase y muéstrame el resultado de cada una antes de seguir):

**Fase 1 — Fundaciones**
- Inicializa el proyecto Next.js con TypeScript y Tailwind en este repositorio.
- Configura el cliente de Supabase (browser + server) con variables de entorno; crea `.env.local.example`.
- Genera los tipos TypeScript desde el schema (puedes derivarlos manualmente de `schema.sql`).
- Implementa auth con magic link, middleware de protección de rutas por rol y la pantalla "cuenta pendiente de activación".

**Fase 2 — Formulario del enlace (`/formulario`)**
- Réplica funcional del HTML de referencia: tablero sticky de semáforos, 8 secciones, tablas dinámicas (proyectos, riesgos, temas críticos, sistemas/activos).
- Autosave con debounce a Supabase + indicador de guardado.
- Botón "Enviar reporte" con validaciones y bloqueo posterior.

**Fase 3 — Consolidado (`/consolidado` y `/reportes/[codigo]`)**
- KPIs, mapa de calor por región, tabla regional (vista `v_consolidado_regional`), riesgos por severidad (vista `v_severidad_riesgos`), agenda de temas críticos, exportación CSV.

**Fase 4 — Administración e importación**
- `/admin`: gestión de perfiles (crear usuario por correo, asignar rol y departamento) usando service role solo en el servidor.
- `/importar`: carga de archivos JSON del instrumento anterior con el mapeo descrito en la especificación §7.

**Fase 5 — Calidad y despliegue**
- Revisión responsive (mín. 380 px), estados de error y vacíos en español, verificación de RLS probando con usuarios de distinto rol.
- README con instrucciones de: ejecución del schema en Supabase, configuración de variables en Vercel, y creación del primer usuario admin.
- Prepara el repositorio para GitHub (gitignore correcto, sin secretos) y déjalo listo para `vercel deploy`.

Toda la interfaz en español. Ante cualquier ambigüedad, la fuente de verdad es la especificación y luego los HTML de referencia.

---

## Pasos manuales que te tocan a ti (Jaime), fuera de Claude Code

1. **Supabase**: crea un proyecto en supabase.com → SQL Editor → pega y ejecuta `supabase/schema.sql`. En Authentication → Providers, habilita Email (magic link). Copia `Project URL` y `anon key`.
2. **GitHub**: crea el repositorio vacío (p. ej. `empalme-tic-2026`) y conéctalo cuando Claude Code te lo indique.
3. **Vercel**: importa el repo de GitHub → agrega las variables `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` y `SUPABASE_SERVICE_ROLE_KEY` → deploy.
4. **Primer admin**: en Supabase → Authentication → Users, crea tu usuario; luego en Table Editor → `perfiles`, inserta tu fila con rol `admin`. Desde `/admin` de la app ya podrás crear a los 33 enlaces.
5. En Supabase → Authentication → URL Configuration, agrega la URL de Vercel como Site URL y redirect permitido (necesario para el magic link).
