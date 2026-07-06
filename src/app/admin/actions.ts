"use server";

import { randomInt } from "crypto";
import { revalidatePath } from "next/cache";
import { requirePerfil } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import type { RolUsuario } from "@/lib/database.types";

export type ResultadoAccion = { ok: boolean; mensaje: string; credenciales?: { correo: string; password: string } };

const ROLES: RolUsuario[] = ["enlace", "central", "admin"];

// Contraseña legible y fuerte: 12 caracteres sin ambiguos (0/O, 1/l/I).
function generarPassword(): string {
  const abc = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  let p = "";
  for (let i = 0; i < 12; i++) p += abc[randomInt(abc.length)];
  return p;
}

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

// Crea (o reasigna) un usuario por correo con su rol, depto y contraseña.
// Si no se envía contraseña, se genera una y se devuelve para entregarla.
export async function crearUsuario(input: {
  correo: string;
  rol: RolUsuario;
  departamento: string | null;
  ciudad?: string | null;
  nombre: string;
  password?: string;
}): Promise<ResultadoAccion> {
  await requirePerfil(["admin"]);

  const correo = input.correo.trim().toLowerCase();
  const rol = ROLES.includes(input.rol) ? input.rol : "enlace";
  const departamento = rol === "enlace" ? (input.departamento || null) : null;
  const ciudad = rol === "enlace_ciudad" ? (input.ciudad || null) : null;
  const nombre = input.nombre.trim() || correo;
  const password = (input.password ?? "").trim() || generarPassword();

  if (!correo || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
    return { ok: false, mensaje: "Ingrese un correo válido." };
  }
  if (password.length < 8) {
    return { ok: false, mensaje: "La contraseña debe tener al menos 8 caracteres." };
  }
  if (rol === "enlace" && !departamento) {
    return { ok: false, mensaje: "Seleccione el departamento del enlace." };
  }
  if (rol === "enlace_ciudad" && !ciudad) {
    return { ok: false, mensaje: "Seleccione la ciudad del enlace." };
  }

  const admin = createAdminClient();

  // 1) Crear el usuario de auth con contraseña. Si ya existe, la actualizamos.
  let userId: string;
  const { data: creado } = await admin.auth.admin.createUser({
    email: correo,
    password,
    email_confirm: true,
  });
  if (creado?.user) {
    userId = creado.user.id;
  } else {
    const existente = await buscarUsuarioPorCorreo(admin, correo);
    if (!existente) {
      return { ok: false, mensaje: "No se pudo crear el usuario. ¿El correo ya está en uso con otro estado?" };
    }
    userId = existente.id;
    await admin.auth.admin.updateUserById(userId, { password });
  }

  // 2) Upsert del perfil (rol + departamento o ciudad).
  const { error: errPerfil } = await admin
    .from("perfiles")
    .upsert({ id: userId, correo, nombre, rol, departamento_codigo: departamento, ciudad_codigo: ciudad }, { onConflict: "id" });
  if (errPerfil) {
    return { ok: false, mensaje: "Usuario creado, pero falló el perfil: " + errPerfil.message };
  }

  revalidatePath("/admin");
  return {
    ok: true,
    mensaje: "Usuario creado. Entregue estas credenciales:",
    credenciales: { correo, password },
  };
}

// Genera y asigna una nueva contraseña a un usuario existente.
export async function restablecerPassword(userId: string): Promise<ResultadoAccion> {
  await requirePerfil(["admin"]);
  const admin = createAdminClient();
  const password = generarPassword();
  const { data, error } = await admin.auth.admin.updateUserById(userId, { password });
  if (error || !data?.user) {
    return { ok: false, mensaje: "No se pudo restablecer la contraseña." };
  }
  revalidatePath("/admin");
  return {
    ok: true,
    mensaje: "Nueva contraseña generada. Entréguela al usuario:",
    credenciales: { correo: data.user.email ?? "", password },
  };
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
