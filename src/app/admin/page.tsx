import { requirePerfil } from "@/lib/auth";
import { Masthead } from "@/components/masthead";

export default async function AdminPage() {
  const { perfil } = await requirePerfil(["admin"]);

  return (
    <>
      <Masthead
        titulo="Administración de usuarios"
        subtitulo="Cree usuarios por correo y asigne rol y departamento a cada enlace."
        perfil={perfil}
      />
      <main className="mx-auto w-full max-w-[1160px] flex-1 px-6 py-8">
        <div className="rounded-xl border border-line bg-card p-8">
          <p className="text-sm text-steel">
            La gestión de perfiles se implementa en la Fase 4.
          </p>
        </div>
      </main>
    </>
  );
}
