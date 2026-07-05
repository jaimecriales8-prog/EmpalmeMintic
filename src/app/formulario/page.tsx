import { requirePerfil } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Masthead } from "@/components/masthead";

export default async function FormularioPage() {
  const { perfil } = await requirePerfil(["enlace"]);
  const supabase = await createClient();
  const { data: departamento } = await supabase
    .from("departamentos")
    .select("*")
    .eq("codigo", perfil.departamento_codigo!)
    .single();

  return (
    <>
      <Masthead
        titulo="Instrumento de Estado Departamental TIC"
        subtitulo="Diligencie cada sección y califique el semáforo de estado. Su avance se guarda automáticamente."
        perfil={perfil}
      />
      <main className="mx-auto w-full max-w-[1160px] flex-1 px-6 py-8">
        <div className="rounded-xl border border-line bg-card p-8">
          <p className="etiqueta">Departamento asignado</p>
          <p className="mt-1 font-display text-lg font-bold">
            {departamento?.nombre} · Región {departamento?.region}
          </p>
          <p className="mt-4 text-sm text-steel">
            El formulario departamental se implementa en la Fase 2.
          </p>
        </div>
      </main>
    </>
  );
}
