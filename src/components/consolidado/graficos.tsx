import { SEM_ETIQUETA } from "@/lib/consolidado";

type Dist = { critico: number; riesgo: number; estable: number };

const SEM_COLOR: Record<keyof Dist, string> = {
  critico: "var(--color-rojo)",
  riesgo: "var(--color-ambar)",
  estable: "var(--color-verde)",
};
const SEM_BG: Record<keyof Dist, string> = {
  critico: "bg-rojo",
  riesgo: "bg-ambar",
  estable: "bg-verde",
};

function Bloque({ titulo, hint, children }: { titulo: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="overflow-hidden rounded-[10px] border border-line bg-card">
      <div className="flex items-baseline gap-3 border-b border-line bg-gradient-to-b from-white to-[#FAFBFC] px-5 py-3.5">
        <h2 className="font-display text-[17px] font-bold [font-variation-settings:'wdth'_106]">{titulo}</h2>
        {hint && <span className="ml-auto text-xs text-steel">{hint}</span>}
      </div>
      <div className="px-5 py-5">{children}</div>
    </section>
  );
}

// Dona de distribución de semáforos (nacional).
function Dona({ dist }: { dist: Dist }) {
  const total = dist.critico + dist.riesgo + dist.estable;
  const R = 54;
  const C = 2 * Math.PI * R;
  let acc = 0;
  const orden: (keyof Dist)[] = ["critico", "riesgo", "estable"];
  return (
    <div className="flex items-center gap-6">
      <svg viewBox="0 0 140 140" className="h-36 w-36 flex-none" role="img" aria-label="Distribución de semáforos">
        <circle cx="70" cy="70" r={R} fill="none" stroke="#EDF1F5" strokeWidth="18" />
        {total > 0 &&
          orden.map((k) => {
            const len = (dist[k] / total) * C;
            const el = (
              <circle
                key={k}
                cx="70"
                cy="70"
                r={R}
                fill="none"
                stroke={SEM_COLOR[k]}
                strokeWidth="18"
                strokeDasharray={`${len} ${C - len}`}
                strokeDashoffset={-acc}
                transform="rotate(-90 70 70)"
              />
            );
            acc += len;
            return el;
          })}
        <text x="70" y="66" textAnchor="middle" className="fill-ink font-display" style={{ fontSize: 26, fontWeight: 700 }}>
          {total}
        </text>
        <text x="70" y="84" textAnchor="middle" className="fill-[color:var(--color-steel)]" style={{ fontSize: 9, letterSpacing: 1 }}>
          SEMÁFOROS
        </text>
      </svg>
      <div className="flex flex-col gap-2">
        {(["critico", "riesgo", "estable"] as (keyof Dist)[]).map((k) => (
          <div key={k} className="flex items-center gap-2 text-sm">
            <span className={`h-3 w-3 rounded-full ${SEM_BG[k]}`} />
            <span className="font-semibold">{dist[k]}</span>
            <span className="text-steel">{SEM_ETIQUETA[k]}</span>
            <span className="font-mono text-xs text-steel">
              {total ? Math.round((dist[k] / total) * 100) : 0}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Barra horizontal 0-100 con etiqueta y valor.
function Barra({ label, valor, color }: { label: string; valor: number | null; color: string }) {
  const v = valor === null || valor === undefined ? null : Number(valor);
  return (
    <div className="flex items-center gap-2.5">
      <span className="w-16 font-mono text-[11px] uppercase text-steel">{label}</span>
      <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-[#EDF1F5]">
        {v !== null && <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(v, 100)}%` }} />}
      </div>
      <span className="w-12 text-right font-mono text-[12px]">{v === null ? "s/i" : `${v.toFixed(1)}%`}</span>
    </div>
  );
}

export function GraficosConsolidado({
  distNacional,
  cobertura,
  semaforoRegion,
}: {
  distNacional: Dist;
  cobertura: { region: string; c4: number | null; c5: number | null; hogares: number | null }[];
  semaforoRegion: { region: string; dist: Dist }[];
}) {
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Bloque titulo="Distribución nacional de semáforos" hint="Todas las dimensiones">
        <Dona dist={distNacional} />
      </Bloque>

      <Bloque titulo="Cobertura promedio por región" hint="4G · 5G · hogares con internet">
        <div className="grid gap-4">
          {cobertura.length === 0 ? (
            <p className="text-sm text-steel">Sin datos de cobertura aún.</p>
          ) : (
            cobertura.map((c) => (
              <div key={c.region}>
                <div className="mb-1.5 font-display text-[13px] font-bold">{c.region}</div>
                <div className="grid gap-1.5">
                  <Barra label="4G" valor={c.c4} color="bg-navy" />
                  <Barra label="5G" valor={c.c5} color="bg-steel" />
                  <Barra label="Hogares" valor={c.hogares} color="bg-link" />
                </div>
              </div>
            ))
          )}
        </div>
      </Bloque>

      <Bloque titulo="Estado de semáforos por región" hint="Proporción crítico · riesgo · estable">
        <div className="grid gap-3">
          {semaforoRegion.map(({ region, dist }) => {
            const total = dist.critico + dist.riesgo + dist.estable;
            return (
              <div key={region}>
                <div className="mb-1 flex items-baseline justify-between">
                  <span className="font-display text-[13px] font-bold">{region}</span>
                  <span className="font-mono text-[11px] text-steel">
                    {dist.critico} / {dist.riesgo} / {dist.estable}
                  </span>
                </div>
                <div className="flex h-4 overflow-hidden rounded-full bg-[#EDF1F5]">
                  {(["critico", "riesgo", "estable"] as (keyof Dist)[]).map((k) =>
                    dist[k] > 0 ? (
                      <div
                        key={k}
                        className={SEM_BG[k]}
                        style={{ width: `${total ? (dist[k] / total) * 100 : 0}%` }}
                        title={`${SEM_ETIQUETA[k]}: ${dist[k]}`}
                      />
                    ) : null,
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1.5">
          {(["critico", "riesgo", "estable"] as (keyof Dist)[]).map((k) => (
            <span key={k} className="flex items-center gap-1.5 text-xs text-steel">
              <span className={`h-2.5 w-2.5 rounded-full ${SEM_BG[k]}`} />
              {SEM_ETIQUETA[k]}
            </span>
          ))}
        </div>
      </Bloque>
    </div>
  );
}
