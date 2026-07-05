"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  crearUsuario,
  eliminarUsuario,
  restablecerPassword,
  type ResultadoAccion,
} from "@/app/admin/actions";
import type { Departamento, RolUsuario } from "@/lib/database.types";

type PerfilFila = {
  id: string;
  nombre: string;
  correo: string;
  rol: RolUsuario;
  departamento_codigo: string | null;
  departamento_nombre: string | null;
};

const ROL_LABEL: Record<RolUsuario, string> = {
  enlace: "Enlace",
  central: "Central",
  admin: "Admin",
};

// slug sin acentos para sugerir el correo genérico por departamento.
function slug(nombre: string): string {
  return nombre
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "");
}

export function GestionUsuarios({
  departamentos,
  perfiles,
  deptosConEnlace,
}: {
  departamentos: Departamento[];
  perfiles: PerfilFila[];
  deptosConEnlace: string[];
}) {
  const router = useRouter();
  const [correo, setCorreo] = useState("");
  const [correoEditado, setCorreoEditado] = useState(false);
  const [rol, setRol] = useState<RolUsuario>("enlace");
  const [departamento, setDepartamento] = useState("");
  const [nombre, setNombre] = useState("");
  const [res, setRes] = useState<ResultadoAccion | null>(null);
  const [pending, startTransition] = useTransition();

  const conEnlace = new Set(deptosConEnlace);

  function onDepartamentoChange(codigo: string) {
    setDepartamento(codigo);
    // Si el admin no escribió el correo a mano, lo sugerimos por departamento.
    if (rol === "enlace" && !correoEditado) {
      const dep = departamentos.find((d) => d.codigo === codigo);
      setCorreo(dep ? `enlace.${slug(dep.nombre)}@empalme-tic.gov.co` : "");
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setRes(null);
    startTransition(async () => {
      const r = await crearUsuario({ correo, rol, departamento: departamento || null, nombre });
      setRes(r);
      if (r.ok) {
        setCorreo("");
        setCorreoEditado(false);
        setNombre("");
        setDepartamento("");
        router.refresh();
      }
    });
  }

  function onEliminar(id: string, correo: string) {
    if (!confirm(`¿Eliminar a ${correo}? Perderá el acceso a la plataforma.`)) return;
    startTransition(async () => {
      const r = await eliminarUsuario(id);
      setRes(r);
      if (r.ok) router.refresh();
    });
  }

  function onRestablecer(id: string, correo: string) {
    if (!confirm(`¿Generar una nueva contraseña para ${correo}? La anterior dejará de servir.`)) return;
    startTransition(async () => {
      const r = await restablecerPassword(id);
      setRes(r);
    });
  }

  const inputCls =
    "w-full rounded-md border border-line bg-white px-3 py-2.5 text-[14.5px] outline-none focus:border-link focus:ring-2 focus:ring-link/30";

  return (
    <div className="grid gap-5">
      {/* Credenciales generadas (aviso destacado) */}
      {res?.credenciales && (
        <div className="rounded-[10px] border-2 border-verde bg-verde-bg px-5 py-4">
          <p className="text-sm font-semibold text-verde">{res.mensaje}</p>
          <div className="mt-2 flex flex-col gap-1 font-mono text-[13.5px] text-ink sm:flex-row sm:gap-8">
            <span>
              <span className="text-steel">Correo:</span> {res.credenciales.correo}
            </span>
            <span>
              <span className="text-steel">Contraseña:</span>{" "}
              <strong>{res.credenciales.password}</strong>
            </span>
          </div>
          <div className="mt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={() =>
                navigator.clipboard?.writeText(
                  `Correo: ${res.credenciales!.correo}\nContraseña: ${res.credenciales!.password}\nIngrese en: https://empalme-mintic.vercel.app`,
                )
              }
              className="rounded-md bg-navy px-3 py-1.5 text-[13px] font-semibold text-white transition hover:brightness-110"
            >
              Copiar credenciales
            </button>
            <span className="text-xs text-steel">
              Entréguelas de forma segura. No se volverán a mostrar.
            </span>
          </div>
        </div>
      )}

      {/* Formulario de alta */}
      <section className="overflow-hidden rounded-[10px] border border-line bg-card">
        <div className="border-b border-line bg-gradient-to-b from-white to-[#FAFBFC] px-5 py-3.5">
          <h2 className="font-display text-[17px] font-bold [font-variation-settings:'wdth'_106]">
            Crear usuario
          </h2>
        </div>
        <form onSubmit={onSubmit} className="grid gap-4 px-5 py-5 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label className="etiqueta">Departamento {rol === "enlace" && <span className="text-rojo">*</span>}</label>
            <select
              value={departamento}
              onChange={(e) => onDepartamentoChange(e.target.value)}
              disabled={rol !== "enlace"}
              className={`${inputCls} disabled:bg-paper disabled:text-steel`}
            >
              <option value="">{rol === "enlace" ? "Seleccione…" : "No aplica"}</option>
              {departamentos.map((d) => (
                <option key={d.codigo} value={d.codigo}>
                  {d.nombre} · {d.region}
                  {conEnlace.has(d.codigo) ? " (ya tiene enlace)" : ""}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="etiqueta">Correo (usuario de acceso)</label>
            <input
              type="email"
              required
              value={correo}
              onChange={(e) => {
                setCorreo(e.target.value);
                setCorreoEditado(true);
              }}
              placeholder="enlace.departamento@empalme-tic.gov.co"
              className={inputCls}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="etiqueta">Rol</label>
            <select value={rol} onChange={(e) => setRol(e.target.value as RolUsuario)} className={inputCls}>
              <option value="enlace">Enlace departamental</option>
              <option value="central">Equipo central</option>
              <option value="admin">Administrador</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="etiqueta">Nombre (opcional)</label>
            <input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Se puede completar después"
              className={inputCls}
            />
          </div>
          <div className="flex items-center gap-3 sm:col-span-2">
            <button
              type="submit"
              disabled={pending}
              className="rounded-md bg-navy px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
            >
              {pending ? "Creando…" : "Crear usuario y generar contraseña"}
            </button>
            {res && !res.credenciales && (
              <span className={`text-sm ${res.ok ? "text-verde" : "text-rojo"}`}>{res.mensaje}</span>
            )}
          </div>
          <p className="text-xs text-steel sm:col-span-2">
            Se genera una contraseña automáticamente y se muestra arriba para que
            la entregue. La persona ingresa con ese correo y contraseña; no
            necesita recibir ningún mensaje.
          </p>
        </form>
      </section>

      {/* Listado */}
      <section className="overflow-hidden rounded-[10px] border border-line bg-card">
        <div className="flex items-baseline gap-3 border-b border-line bg-gradient-to-b from-white to-[#FAFBFC] px-5 py-3.5">
          <h2 className="font-display text-[17px] font-bold [font-variation-settings:'wdth'_106]">
            Usuarios registrados
          </h2>
          <span className="ml-auto text-xs text-steel">{perfiles.length} usuario(s)</span>
        </div>
        <div className="overflow-x-auto px-5 py-4">
          <table className="w-full border-collapse text-[13.5px]">
            <thead>
              <tr>
                {["Correo", "Nombre", "Rol", "Departamento", ""].map((h) => (
                  <th key={h} className="whitespace-nowrap border-b-2 border-line px-2 py-2 text-left font-mono text-[10.5px] uppercase tracking-wide text-steel">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {perfiles.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-2 py-6 text-center text-steel">
                    Aún no hay usuarios. Cree el primero arriba.
                  </td>
                </tr>
              ) : (
                perfiles.map((p) => (
                  <tr key={p.id} className="hover:bg-paper">
                    <td className="border-b border-line px-2 py-2">{p.correo}</td>
                    <td className="border-b border-line px-2 py-2">{p.nombre}</td>
                    <td className="border-b border-line px-2 py-2">
                      <span className="rounded-full bg-paper px-2.5 py-0.5 font-mono text-[11px] uppercase text-steel">
                        {ROL_LABEL[p.rol]}
                      </span>
                    </td>
                    <td className="border-b border-line px-2 py-2">
                      {p.departamento_nombre ?? <span className="text-steel">—</span>}
                    </td>
                    <td className="border-b border-line px-2 py-2 text-right">
                      <div className="flex justify-end gap-3">
                        <button
                          onClick={() => onRestablecer(p.id, p.correo)}
                          disabled={pending}
                          className="whitespace-nowrap text-[13px] font-semibold text-link hover:underline disabled:opacity-50"
                        >
                          Restablecer clave
                        </button>
                        <button
                          onClick={() => onEliminar(p.id, p.correo)}
                          disabled={pending}
                          className="text-[13px] font-semibold text-rojo hover:underline disabled:opacity-50"
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
