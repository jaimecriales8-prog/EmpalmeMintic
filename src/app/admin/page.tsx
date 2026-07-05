import { requirePerfil } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Masthead } from "@/components/masthead";
import { GestionUsuarios } from "@/components/admin/gestion-usuarios";
import type { Departamento, Perfil } from "@/lib/database.types";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const { perfil } = await requirePerfil(["admin"]);
  const supabase = await createClient();

  const [depRes, perfRes] = await Promise.all([
    supabase.from("departamentos").select("*").order("nombre"),
    supabase.from("perfiles").select("*").order("creado_en"),
  ]);

  const departamentos = (depRes.data ?? []) as Departamento[];
  const perfiles = (perfRes.data ?? []) as Perfil[];
  const depByCodigo = new Map(departamentos.map((d) => [d.codigo, d.nombre]));

  const filas = perfiles.map((p) => ({
    id: p.id,
    nombre: p.nombre,
    correo: p.correo,
    rol: p.rol,
    departamento_codigo: p.departamento_codigo,
    departamento_nombre: p.departamento_codigo ? (depByCodigo.get(p.departamento_codigo) ?? null) : null,
  }));

  const deptosConEnlace = perfiles
    .filter((p) => p.rol === "enlace" && p.departamento_codigo)
    .map((p) => p.departamento_codigo!) as string[];

  return (
    <>
      <Masthead
        titulo="Administración de usuarios"
        subtitulo="Cree los enlaces departamentales con su correo y departamento. Ingresan con enlace mágico."
        perfil={perfil}
      />
      <main className="mx-auto w-full max-w-[1160px] flex-1 px-6 py-6">
        <GestionUsuarios departamentos={departamentos} perfiles={filas} deptosConEnlace={deptosConEnlace} />
      </main>
    </>
  );
}
