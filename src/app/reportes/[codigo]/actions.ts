"use server";

import { revalidatePath } from "next/cache";
import { requirePerfil } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

// Validar (enviado -> validado) o devolver a borrador. RLS exige central/admin.
// Los argumentos se enlazan con .bind en el servidor, no vienen del FormData.
export async function cambiarEstadoReporte(
  reporteId: string,
  codigo: string,
  accion: "validar" | "devolver",
) {
  await requirePerfil(["central", "admin"]);
  if (!reporteId || !["validar", "devolver"].includes(accion)) return;

  const supabase = await createClient();
  const patch =
    accion === "validar"
      ? { estado: "validado" as const }
      : { estado: "borrador" as const, enviado_en: null };

  await supabase.from("reportes").update(patch).eq("id", reporteId);
  revalidatePath(`/reportes/${codigo}`);
  revalidatePath("/consolidado");
}
