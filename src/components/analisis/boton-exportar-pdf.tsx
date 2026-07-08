"use client";

// Exporta la vista actual a PDF usando el diálogo de impresión del navegador
// (el usuario elige "Guardar como PDF" como destino). Ajusta el título de la
// pestaña para que el archivo se sugiera con un nombre útil.
export function BotonExportarPdf({ nombreArchivo }: { nombreArchivo: string }) {
  function exportar() {
    const original = document.title;
    document.title = nombreArchivo;
    const restaurar = () => {
      document.title = original;
      window.removeEventListener("afterprint", restaurar);
    };
    window.addEventListener("afterprint", restaurar);
    window.print();
  }

  return (
    <button
      type="button"
      onClick={exportar}
      className="rounded-md border border-line px-3 py-1.5 text-[13px] font-semibold text-navy transition hover:bg-paper print:hidden"
    >
      Exportar PDF
    </button>
  );
}
