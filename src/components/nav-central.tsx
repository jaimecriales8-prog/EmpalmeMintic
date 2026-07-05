import Link from "next/link";

const ITEMS = [
  { href: "/consolidado", label: "Consolidado", key: "consolidado" },
  { href: "/analisis", label: "Análisis", key: "analisis" },
] as const;

export function NavCentral({ activo }: { activo: "consolidado" | "analisis" }) {
  return (
    <nav className="flex gap-1 border-b border-line print:hidden">
      {ITEMS.map((it) => (
        <Link
          key={it.key}
          href={it.href}
          className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-semibold transition ${
            activo === it.key
              ? "border-navy text-navy"
              : "border-transparent text-steel hover:text-navy"
          }`}
        >
          {it.label}
        </Link>
      ))}
    </nav>
  );
}
