import { redirect } from "next/navigation";
import { getSesion, rutaInicio } from "@/lib/auth";

export default async function PendientePage() {
  const sesion = await getSesion();
  if (!sesion) redirect("/login");
  if (sesion.perfil) redirect(rutaInicio(sesion.perfil.rol));

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-12">
      <div className="w-full max-w-md rounded-xl border border-line bg-card px-8 py-10 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-ambar-bg text-2xl text-ambar">
          ⏳
        </div>
        <h1 className="font-display text-xl font-bold [font-variation-settings:'wdth'_106]">
          Cuenta pendiente de activación
        </h1>
        <p className="mt-3 text-sm text-steel">
          Su correo <strong className="text-ink">{sesion.correo}</strong> está
          autenticado, pero el equipo central aún no ha activado su cuenta ni le
          ha asignado un departamento. Comuníquese con el equipo central del
          empalme para completar la activación.
        </p>
        <form action="/auth/signout" method="post" className="mt-6">
          <button
            type="submit"
            className="rounded-md border border-line px-4 py-2 text-sm font-semibold text-navy transition hover:bg-paper"
          >
            Cerrar sesión
          </button>
        </form>
      </div>
    </main>
  );
}
