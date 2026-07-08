// Determina si un campo cuenta como "con dato" para decidir si una sección
// del PDF se muestra. 0 sí cuenta (es un valor reportado); solo excluye
// null/undefined, cadenas vacías y arreglos vacíos.
export function tieneValor(v: unknown): boolean {
  if (v === null || v === undefined) return false;
  if (typeof v === "string") return v.trim() !== "";
  if (Array.isArray(v)) return v.length > 0;
  return true;
}

export function algunoTiene(valores: unknown[]): boolean {
  return valores.some(tieneValor);
}

// Asigna números de sección secuenciales (01, 02…) solo a las secciones
// visibles, sin dejar huecos cuando una sección se omite por estar vacía.
export function numerarSecciones<K extends string>(
  secciones: { key: K; visible: boolean }[],
): Record<K, string> {
  const numeros = {} as Record<K, string>;
  let contador = 0;
  for (const s of secciones) {
    if (s.visible) {
      contador++;
      numeros[s.key] = String(contador).padStart(2, "0");
    }
  }
  return numeros;
}
