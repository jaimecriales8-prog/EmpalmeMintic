"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Estado = "inicial" | "enviando" | "enviado" | "error";

export default function LoginPage() {
  const [correo, setCorreo] = useState("");
  const [estado, setEstado] = useState<Estado>("inicial");
  const [error, setError] = useState("");

  async function enviarEnlace(e: React.FormEvent) {
    e.preventDefault();
    setEstado("enviando");
    setError("");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: correo.trim(),
      options: { emailRedirectTo: `${window.location.origin}/auth/confirm` },
    });
    if (error) {
      setEstado("error");
      setError(
        "No se pudo enviar el enlace. Verifique el correo e intente de nuevo.",
      );
    } else {
      setEstado("enviado");
    }
  }

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        <div className="rounded-t-xl bg-navy px-8 pb-7 pt-8 text-white">
          <p className="eyebrow mb-2">
            Empalme presidencial 2026 · Sector TIC
          </p>
          <h1 className="font-display text-2xl font-bold leading-tight [font-variation-settings:'wdth'_112]">
            Plataforma Empalme Territorial TIC
          </h1>
          <p className="mt-2 text-[13.5px] text-[#C6D5E2]">
            Acceso para enlaces departamentales y equipo central.
          </p>
        </div>

        <div className="rounded-b-xl border border-t-0 border-line bg-card px-8 py-8">
          {estado === "enviado" ? (
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-verde-bg text-2xl text-verde">
                ✓
              </div>
              <h2 className="font-display text-lg font-bold">
                Revise su correo
              </h2>
              <p className="mt-2 text-sm text-steel">
                Enviamos un enlace de acceso a{" "}
                <strong className="text-ink">{correo}</strong>. Ábralo desde
                este dispositivo para ingresar a la plataforma.
              </p>
              <button
                type="button"
                onClick={() => setEstado("inicial")}
                className="mt-5 text-sm font-semibold text-link hover:underline"
              >
                Usar otro correo
              </button>
            </div>
          ) : (
            <form onSubmit={enviarEnlace} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="correo" className="etiqueta">
                  Correo institucional
                </label>
                <input
                  id="correo"
                  type="email"
                  required
                  autoComplete="email"
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                  placeholder="nombre@entidad.gov.co"
                  className="w-full rounded-md border border-line bg-white px-3 py-2.5 text-[14.5px] outline-none focus:border-link focus:ring-2 focus:ring-link/30"
                />
              </div>
              {estado === "error" && (
                <p className="rounded-md bg-rojo-bg px-3 py-2 text-sm text-rojo">
                  {error}
                </p>
              )}
              <button
                type="submit"
                disabled={estado === "enviando"}
                className="rounded-md bg-navy px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
              >
                {estado === "enviando"
                  ? "Enviando enlace…"
                  : "Enviar enlace de acceso"}
              </button>
              <p className="text-xs text-steel">
                Recibirá un enlace mágico por correo: sin contraseñas. Si su
                cuenta no ha sido activada por el equipo central, verá un aviso
                al ingresar.
              </p>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
