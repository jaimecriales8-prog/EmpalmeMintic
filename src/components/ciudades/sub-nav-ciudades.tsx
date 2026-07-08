import Link from "next/link";

const ITEMS = [
  { href: "/ciudades", label: "Consolidado", key: "consolidado" },
  { href: "/analisis-ciudad", label: "Análisis", key: "analisis" },
] as const;

export function SubNavCiudades({ activo }: { activo: "consolidado" | "analisis" }) {
  return (
    <div className="flex flex-wrap gap-2 print:hidden">
      {ITEMS.map((it) => (
        <Link
          key={it.key}
          href={it.href}
          className={`rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition ${
            activo === it.key ? "bg-navy text-white" : "border border-line text-navy hover:bg-paper"
          }`}
        >
          {it.label}
        </Link>
      ))}
    </div>
  );
}
