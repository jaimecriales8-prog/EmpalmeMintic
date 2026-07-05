import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex flex-1 items-center justify-center px-6 py-16">
      <div className="w-full max-w-md rounded-xl border border-line bg-card px-8 py-10 text-center">
        <p className="etiqueta">Error 404</p>
        <h1 className="mt-2 font-display text-2xl font-bold [font-variation-settings:'wdth'_106]">
          Página no encontrada
        </h1>
        <p className="mt-3 text-sm text-steel">
          La dirección que buscó no existe o ya no está disponible.
        </p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-md bg-navy px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110"
        >
          Ir al inicio
        </Link>
      </div>
    </main>
  );
}
