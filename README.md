# Plataforma Empalme Territorial TIC 2026

Aplicación web para el empalme presidencial 2026 (sector TIC). Los **33 enlaces
departamentales** reportan el estado TIC de su territorio y el **equipo central**
lo consolida por regiones (Caribe, Andina, Pacífica, Orinoquía, Amazonía, Insular).

## Stack

- **Next.js 16** (App Router) + TypeScript + Tailwind CSS v4
- **Supabase** (Postgres + Auth magic link + Row Level Security)
- Despliegue en **Vercel**

## Puesta en marcha local

1. Instalar dependencias:
   ```bash
   npm install
   ```
2. Crear el proyecto en [supabase.com](https://supabase.com) → **SQL Editor** →
   pegar y ejecutar [`supabase/schema.sql`](supabase/schema.sql) tal cual (crea
   tablas, enums, RLS, vistas y la semilla de los 33 departamentos).
3. En Supabase → **Authentication → Providers**, habilitar **Email** (magic link).
4. Copiar `.env.local.example` a `.env.local` y completar con los valores de
   Supabase (**Settings → API**):
   ```
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   SUPABASE_SERVICE_ROLE_KEY=...   # solo servidor, nunca al navegador
   ```
5. Levantar el entorno:
   ```bash
   npm run dev
   ```

## Acceso de usuarios (correo + contraseña)

El acceso principal es por **correo y contraseña**, para no depender del envío de
correos. Desde `/admin`, al crear cada usuario se genera una contraseña que se
muestra una vez para entregarla al enlace (por un canal seguro). El enlace
ingresa en `/login` con ese correo y contraseña. También existe la opción de
"enlace mágico" por correo, pero requiere configurar SMTP en Supabase
(Authentication → SMTP) porque el correo integrado está muy limitado.

## Primer usuario administrador

1. Supabase → **Authentication → Users** → crear tu usuario con tu correo.
2. Supabase → **Table Editor → `perfiles`** → insertar tu fila con ese `id`,
   `rol = admin` y `nombre`/`correo`. (Los `admin` no requieren departamento.)
3. Ingresar a `/login`, pedir el enlace mágico y entrar. Desde `/admin` podrás
   crear a los 33 enlaces.

## Configuración en Vercel

1. Importar el repositorio de GitHub.
2. Agregar las variables `NEXT_PUBLIC_SUPABASE_URL`,
   `NEXT_PUBLIC_SUPABASE_ANON_KEY` y `SUPABASE_SERVICE_ROLE_KEY`.
3. En Supabase → **Authentication → URL Configuration**, agregar la URL de
   Vercel como **Site URL** y como redirect permitido (necesario para el magic
   link).

## Roles y rutas

| Ruta | Acceso | Descripción |
|---|---|---|
| `/login` | público | Ingreso por correo + contraseña (o enlace mágico) |
| `/formulario` | enlace | Instrumento del departamento propio |
| `/consolidado` | central, admin | Dashboard regional |
| `/reportes/[codigo]` | central, admin | Detalle de un reporte |
| `/admin` | admin | Gestión de perfiles |

La autorización se aplica en dos capas: el `proxy.ts` exige sesión y las páginas
de servidor exigen rol vía `requirePerfil()`; la seguridad real de datos la
garantiza el **RLS** de Supabase, no la UI.

## Estado del desarrollo

- [x] **Fase 1 — Fundaciones:** proyecto Next.js, clientes Supabase
      (browser/server/admin), tipos derivados del schema, auth por magic link,
      protección de rutas por rol y pantalla "cuenta pendiente de activación".
- [x] **Fase 2 — Formulario del enlace** (`/formulario`): tablero de semáforos
      sticky, 8 secciones, tablas dinámicas (proyectos, riesgos, temas,
      sistemas), autosave con debounce, validación y envío que bloquea el
      reporte en solo lectura.
- [x] **Fase 3 — Consolidado** (`/consolidado`, `/reportes/[codigo]`): KPIs,
      panel gráfico (dona de semáforos nacional, barras de cobertura por región,
      barras apiladas de estado por región), mapa de calor por región, tabla
      regional (vista `v_consolidado_regional`), riesgos por severidad (vista
      `v_severidad_riesgos`), agenda de temas, exportación CSV (`;` + BOM) e
      impresión. Detalle de reporte con acciones de validar y devolver a
      borrador (central/admin).
- [x] **Fase 4 — Administración** (`/admin`): crear usuarios con correo +
      departamento (rol por defecto enlace; también central/admin), listar y
      eliminar usuarios. Usa el service role solo en server actions. (El
      importador de JSON legado se descartó: nunca se generaron archivos con el
      instrumento HTML anterior.)
- [x] **Fase 5 — Calidad y seguridad:** endurecimiento RLS (un usuario no puede
      cambiar su rol ni su departamento; un enlace no puede auto-validar su
      reporte), guarda contra inyección de fórmulas en el CSV, cabeceras de
      seguridad HTTP, páginas 404/error en español, aviso de enlace inválido en
      el login y repaso responsive (usable desde 375 px). Pruebas negativas de
      RLS incluidas.

## Documentación

- [`docs/ESPECIFICACION.md`](docs/ESPECIFICACION.md) — especificación funcional.
- [`docs/PROMPT_CLAUDE_CODE.md`](docs/PROMPT_CLAUDE_CODE.md) — plan de trabajo.
- [`referencia/`](referencia/) — instrumento y consolidador HTML originales
  (contrato visual/funcional y plan B sin conexión).
