import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Perfil, RolUsuario } from "@/lib/database.types";

export type Sesion = {
  userId: string;
  correo: string;
  perfil: Perfil | null;
};

/** Usuario autenticado + su perfil (null si el admin aún no lo crea). */
export async function getSesion(): Promise<Sesion | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: perfil } = await supabase
    .from("perfiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  return { userId: user.id, correo: user.email ?? "", perfil };
}

/** Ruta según el rol del perfil. */
export function rutaInicio(rol: RolUsuario): string {
  return rol === "enlace" ? "/formulario" : "/consolidado";
}

/**
 * Exige sesión con perfil y uno de los roles dados.
 * Sin sesión → /login · sin perfil → /pendiente · rol distinto → su inicio.
 */
export async function requirePerfil(roles: RolUsuario[]): Promise<{
  sesion: Sesion;
  perfil: Perfil;
}> {
  const sesion = await getSesion();
  if (!sesion) redirect("/login");
  if (!sesion.perfil) redirect("/pendiente");
  if (!roles.includes(sesion.perfil.rol)) redirect(rutaInicio(sesion.perfil.rol));
  return { sesion, perfil: sesion.perfil };
}
