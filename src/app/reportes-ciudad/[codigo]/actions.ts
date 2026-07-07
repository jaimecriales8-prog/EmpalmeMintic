"use server";

import { revalidatePath } from "next/cache";
import { requirePerfil } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function cambiarEstadoReporteCiudad(
  reporteId: string,
  codigo: string,
  accion: "validar" | "devolver",
) {
  await requirePerfil(["central", "admin"]);
  if (!reporteId || !["validar", "devolver"].includes(accion)) return;
  const supabase = await createClient();
  const patch = accion === "validar" ? { estado: "validado" as const } : { estado: "borrador" as const, enviado_en: null };
  await supabase.from("reportes_ciudad").update(patch).eq("id", reporteId);
  revalidatePath(`/reportes-ciudad/${codigo}`);
  revalidatePath("/ciudades");
}
