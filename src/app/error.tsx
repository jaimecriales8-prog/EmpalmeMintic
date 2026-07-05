"use client";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="flex flex-1 items-center justify-center px-6 py-16">
      <div className="w-full max-w-md rounded-xl border border-line bg-card px-8 py-10 text-center">
        <p className="etiqueta">Algo salió mal</p>
        <h1 className="mt-2 font-display text-2xl font-bold [font-variation-settings:'wdth'_106]">
          Ocurrió un error inesperado
        </h1>
        <p className="mt-3 text-sm text-steel">
          Puede reintentar. Si el problema persiste, comuníquese con el equipo
          central del empalme.
        </p>
        <button
          onClick={reset}
          className="mt-6 rounded-md bg-navy px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110"
        >
          Reintentar
        </button>
      </div>
    </main>
  );
}
