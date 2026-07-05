"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Modo = "password" | "magico";

export default function LoginPage() {
  const [modo, setModo] = useState<Modo>("password");
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [enlaceEnviado, setEnlaceEnviado] = useState(false);
  const [avisoEnlace] = useState(() =>
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("error") === "enlace_invalido"
      ? "El enlace de acceso no es válido o ya expiró. Ingrese con su contraseña."
      : "",
  );

  async function ingresarConPassword(e: React.FormEvent) {
    e.preventDefault();
    setCargando(true);
    setError("");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: correo.trim(),
      password,
    });
    if (error) {
      setCargando(false);
      setError("Correo o contraseña incorrectos. Verifique e intente de nuevo.");
    } else {
      // Recarga completa para que el servidor lea la sesión y enrute por rol.
      window.location.assign("/");
    }
  }

  async function enviarEnlace(e: React.FormEvent) {
    e.preventDefault();
    setCargando(true);
    setError("");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: correo.trim(),
      options: { emailRedirectTo: `${window.location.origin}/auth/confirm` },
    });
    setCargando(false);
    if (error) {
      setError("No se pudo enviar el enlace. Verifique el correo e intente de nuevo.");
    } else {
      setEnlaceEnviado(true);
    }
  }

  const inputCls =
    "w-full rounded-md border border-line bg-white px-3 py-2.5 text-[14.5px] outline-none focus:border-link focus:ring-2 focus:ring-link/30";

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        <div className="rounded-t-xl bg-navy px-8 pb-7 pt-8 text-white">
          <p className="eyebrow mb-2">Empalme presidencial 2026 · Sector TIC</p>
          <h1 className="font-display text-2xl font-bold leading-tight [font-variation-settings:'wdth'_112]">
            Plataforma Empalme Territorial TIC
          </h1>
          <p className="mt-2 text-[13.5px] text-[#C6D5E2]">
            Acceso para enlaces departamentales y equipo central.
          </p>
        </div>

        <div className="rounded-b-xl border border-t-0 border-line bg-card px-8 py-8">
          {enlaceEnviado ? (
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-verde-bg text-2xl text-verde">
                ✓
              </div>
              <h2 className="font-display text-lg font-bold">Revise su correo</h2>
              <p className="mt-2 text-sm text-steel">
                Enviamos un enlace de acceso a{" "}
                <strong className="text-ink">{correo}</strong>. Ábralo desde este
                dispositivo para ingresar.
              </p>
              <button
                type="button"
                onClick={() => {
                  setEnlaceEnviado(false);
                  setModo("password");
                }}
                className="mt-5 text-sm font-semibold text-link hover:underline"
              >
                Volver
              </button>
            </div>
          ) : (
            <form
              onSubmit={modo === "password" ? ingresarConPassword : enviarEnlace}
              className="flex flex-col gap-4"
            >
              {avisoEnlace && (
                <p className="rounded-md bg-ambar-bg px-3 py-2 text-sm text-ambar">{avisoEnlace}</p>
              )}

              <div className="flex flex-col gap-1.5">
                <label htmlFor="correo" className="etiqueta">
                  Correo
                </label>
                <input
                  id="correo"
                  type="email"
                  required
                  autoComplete="email"
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                  placeholder="enlace@entidad.gov.co"
                  className={inputCls}
                />
              </div>

              {modo === "password" && (
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="password" className="etiqueta">
                    Contraseña
                  </label>
                  <input
                    id="password"
                    type="password"
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="La que le entregó el equipo central"
                    className={inputCls}
                  />
                </div>
              )}

              {error && (
                <p className="rounded-md bg-rojo-bg px-3 py-2 text-sm text-rojo">{error}</p>
              )}

              <button
                type="submit"
                disabled={cargando}
                className="rounded-md bg-navy px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
              >
                {cargando
                  ? "Ingresando…"
                  : modo === "password"
                    ? "Ingresar"
                    : "Enviar enlace de acceso"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setModo(modo === "password" ? "magico" : "password");
                  setError("");
                }}
                className="text-center text-xs font-semibold text-link hover:underline"
              >
                {modo === "password"
                  ? "¿Prefiere recibir un enlace mágico por correo?"
                  : "Ingresar con contraseña"}
              </button>

              {modo === "magico" && (
                <p className="text-xs text-steel">
                  Requiere que su correo reciba el mensaje. Si no le llega, use la
                  contraseña que le entregó el equipo central.
                </p>
              )}
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
