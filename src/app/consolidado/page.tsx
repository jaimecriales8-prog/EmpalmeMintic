import { requirePerfil } from "@/lib/auth";
import { Masthead } from "@/components/masthead";

export default async function ConsolidadoPage() {
  const { perfil } = await requirePerfil(["central", "admin"]);

  return (
    <>
      <Masthead
        titulo="Consolidador Regional de Estado Territorial"
        subtitulo="Tablero agregado por regiones de Colombia: Caribe, Andina, Pacífica, Orinoquía, Amazonía e Insular."
        perfil={perfil}
      />
      <main className="mx-auto w-full max-w-[1240px] flex-1 px-6 py-8">
        <div className="rounded-xl border border-line bg-card p-8">
          <p className="text-sm text-steel">
            El dashboard consolidado se implementa en la Fase 3.
          </p>
        </div>
      </main>
    </>
  );
}
