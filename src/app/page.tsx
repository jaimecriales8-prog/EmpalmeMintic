import { redirect } from "next/navigation";
import { getSesion, rutaInicio } from "@/lib/auth";

export default async function Home() {
  const sesion = await getSesion();
  if (!sesion) redirect("/login");
  if (!sesion.perfil) redirect("/pendiente");
  redirect(rutaInicio(sesion.perfil.rol));
}
