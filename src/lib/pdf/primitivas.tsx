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
      <View style={s.seccionHead}>
        <Text style={s.seccionNum}>{num}</Text>
        <Text style={s.seccionTitulo}>{titulo}</Text>
        {hint && <Text style={s.seccionHint}>{hint}</Text>}
      </View>
      <View style={s.seccionBody}>{children}</View>
    </View>
  );
}

// Variante que SÍ puede partirse entre páginas (para secciones con tablas largas).
export function SeccionLarga({
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
    <View style={s.seccion}>
      <View style={s.seccionHead}>
        <Text style={s.seccionNum}>{num}</Text>
        <Text style={s.seccionTitulo}>{titulo}</Text>
        {hint && <Text style={s.seccionHint}>{hint}</Text>}
      </View>
      <View style={s.seccionBody}>{children}</View>
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

export function Tabla({
  columnas,
  filas,
  vacio,
}: {
  columnas: { titulo: string; ancho: string }[];
  filas: React.ReactNode[][];
  vacio: string;
}) {
  if (!filas.length) {
    return <Text style={s.valorVacio}>{vacio}</Text>;
  }
  return (
    <View style={s.tabla}>
      <View style={s.filaTablaHead} fixed>
        {columnas.map((c, i) => (
          <Text key={i} style={[s.celdaHead, { width: c.ancho }]}>
            {c.titulo}
          </Text>
        ))}
      </View>
      {filas.map((fila, i) => (
        <View key={i} style={s.filaTabla} wrap={false}>
          {fila.map((celda, j) => (
            <View key={j} style={{ width: columnas[j].ancho }}>
              <Text style={s.celda}>{celda === null || celda === undefined || celda === "" ? "—" : celda}</Text>
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}
