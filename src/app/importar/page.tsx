import { requirePerfil } from "@/lib/auth";
import { Masthead } from "@/components/masthead";

export default async function ImportarPage() {
  const { perfil } = await requirePerfil(["central", "admin"]);

  return (
    <>
      <Masthead
        titulo="Importar reportes del instrumento anterior"
        subtitulo="Cargue los archivos empalme_TIC_*.json generados con el instrumento HTML."
        perfil={perfil}
      />
      <main className="mx-auto w-full max-w-[1160px] flex-1 px-6 py-8">
        <div className="rounded-xl border border-line bg-card p-8">
          <p className="text-sm text-steel">
            El importador de JSON legado se implementa en la Fase 4.
          </p>
        </div>
      </main>
    </>
  );
}
