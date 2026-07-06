import type { Perfil } from "@/lib/database.types";

const ROL_LABEL: Record<Perfil["rol"], string> = {
  enlace: "Enlace departamental",
  enlace_ciudad: "Enlace de ciudad",
  central: "Equipo central",
  admin: "Administración",
};

export function Masthead({
  titulo,
  subtitulo,
  perfil,
  children,
}: {
  titulo: string;
  subtitulo?: string;
  perfil?: Perfil;
  children?: React.ReactNode;
}) {
  return (
    <header className="bg-navy px-6 pb-5 pt-7 text-white">
      <div className="mx-auto flex max-w-[1160px] flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow mb-2">
            Empalme presidencial 2026 · Sector TIC · Nivel territorial
          </p>
          <h1 className="font-display text-[clamp(22px,3.2vw,34px)] font-bold leading-[1.12] [font-variation-settings:'wdth'_112]">
            {titulo}
          </h1>
          {subtitulo && (
            <p className="mt-2 max-w-[760px] text-[13.5px] text-[#C6D5E2]">
              {subtitulo}
            </p>
          )}
        </div>
        <div className="flex items-center gap-4">
          {children}
          {perfil && (
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-semibold leading-tight">
                  {perfil.nombre}
                </p>
                <p className="font-mono text-[10.5px] uppercase tracking-wider text-[#9FC2DE]">
                  {ROL_LABEL[perfil.rol]}
                </p>
              </div>
              <form action="/auth/signout" method="post">
                <button
                  type="submit"
                  className="rounded-md border border-steel px-3 py-1.5 text-[13px] font-semibold text-[#C6D5E2] transition hover:bg-steel/40"
                >
                  Salir
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
