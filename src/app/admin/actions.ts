"use server";

import { revalidatePath } from "next/cache";
import { requirePerfil } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import type { RolUsuario } from "@/lib/database.types";

export type ResultadoAccion = { ok: boolean; mensaje: string };

const ROLES: RolUsuario[] = ["enlace", "central", "admin"];

async function buscarUsuarioPorCorreo(admin: ReturnType<typeof createAdminClient>, correo: string) {
  // La Admin API pagina; recorremos hasta encontrar el correo.
  for (let page = 1; page <= 10; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) break;
    const found = data.users.find((u) => (u.email ?? "").toLowerCase() === correo.toLowerCase());
    if (found) return found;
    if (data.users.length < 200) break;
  }
  return null;
}

// Crea (o reasigna) un usuario por correo con su rol y, si es enlace, su depto.
export async function crearUsuario(input: {
  correo: string;
  rol: RolUsuario;
  departamento: string | null;
  nombre: string;
}): Promise<ResultadoAccion> {
  await requirePerfil(["admin"]);

  const correo = input.correo.trim().toLowerCase();
  const rol = ROLES.includes(input.rol) ? input.rol : "enlace";
  const departamento = rol === "enlace" ? (input.departamento || null) : null;
  const nombre = input.nombre.trim() || correo;

  if (!correo || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
    return { ok: false, mensaje: "Ingrese un correo válido." };
  }
  if (rol === "enlace" && !departamento) {
    return { ok: false, mensaje: "Seleccione el departamento del enlace." };
  }

  const admin = createAdminClient();

  // 1) Crear el usuario de auth (confirmado). Si ya existe, lo reutilizamos.
  let userId: string;
  const { data: creado, error: errCrear } = await admin.auth.admin.createUser({
    email: correo,
    email_confirm: true,
  });
  if (creado?.user) {
    userId = creado.user.id;
  } else {
    const existente = await buscarUsuarioPorCorreo(admin, correo);
    if (!existente) {
      return { ok: false, mensaje: errCrear?.message ?? "No se pudo crear el usuario." };
    }
    userId = existente.id;
  }

  // 2) Upsert del perfil (rol + departamento).
  const { error: errPerfil } = await admin
    .from("perfiles")
    .upsert({ id: userId, correo, nombre, rol, departamento_codigo: departamento }, { onConflict: "id" });
  if (errPerfil) {
    return { ok: false, mensaje: "Usuario creado, pero falló el perfil: " + errPerfil.message };
  }

  revalidatePath("/admin");
  return { ok: true, mensaje: `Listo. ${correo} ya puede ingresar con enlace mágico.` };
}

// Elimina un usuario (perfil + cuenta de auth).
export async function eliminarUsuario(userId: string): Promise<ResultadoAccion> {
  const { perfil } = await requirePerfil(["admin"]);
  if (userId === perfil.id) {
    return { ok: false, mensaje: "No puede eliminar su propia cuenta de administrador." };
  }
  const admin = createAdminClient();
  await admin.from("perfiles").delete().eq("id", userId);
  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) return { ok: false, mensaje: "No se pudo eliminar la cuenta: " + error.message };
  revalidatePath("/admin");
  return { ok: true, mensaje: "Usuario eliminado." };
}
