import { requirePerfil } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Masthead } from "@/components/masthead";
import { FormularioEnlace } from "@/components/formulario/formulario-enlace";
import { BotonDescargarFichaDepartamento } from "@/components/reportes/boton-descargar-pdf";
import type { Reporte, Proyecto, Riesgo, TemaCritico, SistemaActivo } from "@/lib/database.types";

export const dynamic = "force-dynamic";

export default async function FormularioPage() {
  const { sesion, perfil } = await requirePerfil(["enlace"]);
  const supabase = await createClient();
  const codigo = perfil.departamento_codigo!;

  const { data: departamento } = await supabase
    .from("departamentos")
    .select("*")
    .eq("codigo", codigo)
    .single();

  // Buscar el reporte del departamento; crearlo si aún no existe.
  let { data: reporte } = await supabase
    .from("reportes")
    .select("*")
    .eq("departamento_codigo", codigo)
    .maybeSingle();

  if (!reporte) {
    const { data: creado } = await supabase
      .from("reportes")
      .insert({ departamento_codigo: codigo, estado: "borrador", creado_por: sesion.userId })
      .select("*")
      .single();
    reporte = creado ?? null;
  }

  let proyectos: Proyecto[] = [];
  let riesgos: Riesgo[] = [];
  let temas: TemaCritico[] = [];
  let sistemas: SistemaActivo[] = [];

  if (reporte) {
    const [p, r, t, s] = await Promise.all([
      supabase.from("proyectos").select("*").eq("reporte_id", reporte.id).order("orden"),
      supabase.from("riesgos").select("*").eq("reporte_id", reporte.id).order("orden"),
      supabase.from("temas_criticos").select("*").eq("reporte_id", reporte.id).order("orden"),
      supabase.from("sistemas_activos").select("*").eq("reporte_id", reporte.id).order("orden"),
    ]);
    proyectos = p.data ?? [];
    riesgos = r.data ?? [];
    temas = t.data ?? [];
    sistemas = s.data ?? [];
  }

  return (
    <>
      <Masthead
        titulo="Instrumento de Estado Departamental TIC"
        subtitulo="Diligencie cada sección y califique el semáforo de estado. Su avance se guarda automáticamente."
        perfil={perfil}
      >
        {reporte && departamento && (
          <BotonDescargarFichaDepartamento
            departamento={departamento}
            reporte={reporte as Reporte}
            proyectos={proyectos}
            riesgos={riesgos}
            temas={temas}
            sistemas={sistemas}
            oscuro
          />
        )}
      </Masthead>
      {reporte && departamento ? (
        <FormularioEnlace
          departamento={departamento}
          perfil={perfil}
          reporte={reporte as Reporte}
          proyectosIniciales={proyectos}
          riesgosIniciales={riesgos}
          temasIniciales={temas}
          sistemasIniciales={sistemas}
        />
      ) : (
        <main className="mx-auto w-full max-w-[1160px] flex-1 px-6 py-8">
          <div className="rounded-xl border border-line bg-card p-8">
            <p className="text-sm text-rojo">
              No se pudo cargar ni crear el reporte de su departamento. Recargue
              la página o comuníquese con el equipo central.
            </p>
          </div>
        </main>
      )}
    </>
  );
}
