import { Text, View } from "@react-pdf/renderer";
import { s, colorSemaforo, ETIQ_SEM } from "./estilos";

export function Seccion({
  num,
  titulo,
  hint,
  children,
}: {
  num: string;
  titulo: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <View style={s.seccion} wrap={false}>
      <EncabezadoSeccion num={num} titulo={titulo} hint={hint} />
      <View style={s.seccionBody}>{children}</View>
    </View>
  );
}

// Barra de título de una sección (num + título + hint), reutilizable para
// combinarla atómicamente con el primer contenido de una sección "larga".
export function EncabezadoSeccion({ num, titulo, hint }: { num: string; titulo: string; hint?: string }) {
  return (
    <View style={s.seccionHead}>
      <Text style={s.seccionNum}>{num}</Text>
      <Text style={s.seccionTitulo}>{titulo}</Text>
      {hint && <Text style={s.seccionHint}>{hint}</Text>}
    </View>
  );
}

export function Campo({ label, valor, ancho }: { label: string; valor: React.ReactNode; ancho?: boolean }) {
  const vacio = valor === null || valor === undefined || valor === "";
  return (
    <View style={ancho ? s.campoAncho : s.campo} wrap={false}>
      <Text style={s.etiqueta}>{label}</Text>
      <Text style={vacio ? s.valorVacio : s.valor}>{vacio ? "s/i" : String(valor)}</Text>
    </View>
  );
}

export function Semaforo({ v }: { v: string | null | undefined }) {
  const c = colorSemaforo(v);
  return (
    <Text style={[s.semaforoPill, { backgroundColor: c.bg, color: c.fg }]}>
      {v ? ETIQ_SEM[v] : "s/i"}
    </Text>
  );
}

type Columna = { titulo: string; ancho: string };

function FilaTabla({ columnas, fila }: { columnas: Columna[]; fila: React.ReactNode[] }) {
  return (
    <View style={s.filaTabla} wrap={false}>
      {fila.map((celda, j) => (
        <View key={j} style={{ width: columnas[j].ancho }}>
          <Text style={s.celda}>{celda === null || celda === undefined || celda === "" ? "—" : celda}</Text>
        </View>
      ))}
    </View>
  );
}
function EncabezadoTabla({ columnas }: { columnas: Columna[] }) {
  return (
    <View style={s.filaTablaHead}>
      {columnas.map((c, i) => (
        <Text key={i} style={[s.celdaHead, { width: c.ancho }]}>
          {c.titulo}
        </Text>
      ))}
    </View>
  );
}

// Sección completa cuyo cuerpo es una tabla que puede ser larga. El título de
// la sección + el encabezado de la tabla + la PRIMERA fila viajan juntos en un
// único bloque no partible (wrap=false): si no caben enteros en lo que queda
// de la página, el bloque completo pasa a la siguiente hoja, en vez de dejar
// el título/encabezado solo al final con las filas cortadas a la otra hoja.
// Las filas siguientes sí pueden fluir libremente entre páginas.
export function SeccionTabla({
  num,
  titulo,
  hint,
  columnas,
  filas,
}: {
  num: string;
  titulo: string;
  hint?: string;
  columnas: Columna[];
  filas: React.ReactNode[][];
}) {
  const [primera, ...resto] = filas;
  return (
    <View style={s.seccion}>
      <View wrap={false}>
        <EncabezadoSeccion num={num} titulo={titulo} hint={hint} />
        <View style={s.seccionBody}>
          <View style={s.tabla}>
            <EncabezadoTabla columnas={columnas} />
            <FilaTabla columnas={columnas} fila={primera} />
          </View>
        </View>
      </View>
      {resto.length > 0 && (
        <View style={[s.seccionBody, { paddingTop: 0 }]}>
          <View style={s.tabla}>
            {resto.map((fila, i) => (
              <FilaTabla key={i} columnas={columnas} fila={fila} />
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

// Bloque de tabla SIN encabezado de sección propio ni caja con borde (para
// usarlo anidado dentro de otra sección, p. ej. la tabla de sistemas dentro
// de "Capacidad institucional"). Misma lógica de primera-fila-atómica.
export function BloqueTabla({ columnas, filas }: { columnas: Columna[]; filas: React.ReactNode[][] }) {
  if (!filas.length) return null;
  const [primera, ...resto] = filas;
  return (
    <>
      <View style={s.tabla} wrap={false}>
        <EncabezadoTabla columnas={columnas} />
        <FilaTabla columnas={columnas} fila={primera} />
      </View>
      {resto.map((fila, i) => (
        <FilaTabla key={i} columnas={columnas} fila={fila} />
      ))}
    </>
  );
}
