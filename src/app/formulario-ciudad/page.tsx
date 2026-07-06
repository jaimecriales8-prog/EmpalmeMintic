import { requirePerfil } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Masthead } from "@/components/masthead";
import { FormularioCiudad } from "@/components/formulario/formulario-ciudad";
import type { ReporteCiudad, ProyectoCiudad, RiesgoCiudad, TemaCiudad, SistemaCiudad } from "@/lib/database.types";

export const dynamic = "force-dynamic";

export default async function FormularioCiudadPage() {
  const { sesion, perfil } = await requirePerfil(["enlace_ciudad"]);
  const supabase = await createClient();
  const codigo = perfil.ciudad_codigo!;

  const { data: ciudad } = await supabase
    .from("ciudades")
    .select("*, departamentos(nombre)")
    .eq("codigo", codigo)
    .single();

  let { data: reporte } = await supabase
    .from("reportes_ciudad")
    .select("*")
    .eq("ciudad_codigo", codigo)
    .maybeSingle();

  if (!reporte) {
    const { data: creado } = await supabase
      .from("reportes_ciudad")
      .insert({ ciudad_codigo: codigo, estado: "borrador", creado_por: sesion.userId })
      .select("*")
      .single();
    reporte = creado ?? null;
  }

  let proyectos: ProyectoCiudad[] = [];
  let riesgos: RiesgoCiudad[] = [];
  let temas: TemaCiudad[] = [];
  let sistemas: SistemaCiudad[] = [];
  if (reporte) {
    const [p, r, t, s] = await Promise.all([
      supabase.from("proyectos_ciudad").select("*").eq("reporte_id", reporte.id).order("orden"),
      supabase.from("riesgos_ciudad").select("*").eq("reporte_id", reporte.id).order("orden"),
      supabase.from("temas_ciudad").select("*").eq("reporte_id", reporte.id).order("orden"),
      supabase.from("sistemas_ciudad").select("*").eq("reporte_id", reporte.id).order("orden"),
    ]);
    proyectos = (p.data ?? []) as ProyectoCiudad[];
    riesgos = (r.data ?? []) as RiesgoCiudad[];
    temas = (t.data ?? []) as TemaCiudad[];
    sistemas = (s.data ?? []) as SistemaCiudad[];
  }

  const depNombre = (ciudad as { departamentos?: { nombre?: string } } | null)?.departamentos?.nombre ?? "";

  return (
    <>
      <Masthead
        titulo="Instrumento de Estado TIC · Ciudad Capital"
        subtitulo="Diligencie el estado TIC de su ciudad. Su avance se guarda automáticamente."
        perfil={perfil}
      />
      {reporte && ciudad ? (
        <FormularioCiudad
          ciudadNombre={ciudad.nombre}
          departamentoNombre={depNombre}
          region={ciudad.region}
          perfil={perfil}
          reporte={reporte as ReporteCiudad}
          proyectosIniciales={proyectos}
          riesgosIniciales={riesgos}
          temasIniciales={temas}
          sistemasIniciales={sistemas}
        />
      ) : (
        <main className="mx-auto w-full max-w-[1160px] flex-1 px-6 py-8">
          <div className="rounded-xl border border-line bg-card p-8">
            <p className="text-sm text-rojo">No se pudo cargar ni crear el reporte de su ciudad. Recargue o contacte al equipo central.</p>
          </div>
        </main>
      )}
    </>
  );
}
