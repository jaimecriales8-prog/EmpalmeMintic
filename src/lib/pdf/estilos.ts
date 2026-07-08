import { StyleSheet } from "@react-pdf/renderer";

// Paleta institucional (igual a globals.css) reutilizada en los PDF generados.
export const COLOR = {
  ink: "#14212B",
  paper: "#F2F4F7",
  card: "#FFFFFF",
  line: "#D7DEE6",
  navy: "#16324F",
  steel: "#3E5C76",
  rojo: "#B3261E",
  rojoBg: "#FBEAE9",
  ambar: "#B77400",
  ambarBg: "#FBF1DE",
  verde: "#1E7A46",
  verdeBg: "#E6F3EB",
};

export const s = StyleSheet.create({
  pagina: {
    paddingTop: 28,
    paddingBottom: 36,
    paddingHorizontal: 32,
    fontSize: 9.5,
    fontFamily: "Helvetica",
    color: COLOR.ink,
  },
  // Encabezado navy: se repite en cada página, texto blanco explícito
  // (react-pdf dibuja el fondo siempre, no depende de ajustes del navegador).
  encabezado: {
    backgroundColor: COLOR.navy,
    marginHorizontal: -32,
    marginTop: -28,
    paddingHorizontal: 32,
    paddingTop: 20,
    paddingBottom: 16,
    marginBottom: 16,
  },
  eyebrow: {
    fontFamily: "Courier-Bold",
    fontSize: 7.5,
    letterSpacing: 0.4,
    color: "#9FC2DE",
    marginBottom: 6,
  },
  titulo: {
    fontFamily: "Helvetica-Bold",
    fontSize: 17,
    color: "#FFFFFF",
  },
  subtitulo: {
    fontFamily: "Helvetica",
    fontSize: 9,
    color: "#C6D5E2",
    marginTop: 3,
  },

  semaforosFila: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 14,
  },
  semaforoBox: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLOR.line,
    borderRadius: 4,
    padding: 7,
  },
  semaforoLabel: {
    fontFamily: "Courier",
    fontSize: 6.5,
    letterSpacing: 0.6,
    color: COLOR.steel,
    marginBottom: 3,
  },
  semaforoPill: {
    alignSelf: "flex-start",
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2.5,
    fontFamily: "Courier-Bold",
    fontSize: 7.5,
  },

  seccion: {
    borderWidth: 1,
    borderColor: COLOR.line,
    borderRadius: 4,
    marginBottom: 10,
  },
  seccionHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderBottomWidth: 1,
    borderBottomColor: COLOR.line,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "#FAFBFC",
  },
  seccionNum: {
    fontFamily: "Courier",
    fontSize: 7,
    color: COLOR.steel,
    borderWidth: 1,
    borderColor: COLOR.line,
    borderRadius: 2,
    paddingHorizontal: 3,
    paddingVertical: 1,
  },
  seccionTitulo: {
    fontFamily: "Helvetica-Bold",
    fontSize: 10.5,
  },
  seccionHint: {
    fontFamily: "Helvetica",
    fontSize: 7.5,
    color: COLOR.steel,
    marginLeft: "auto",
  },
  seccionBody: {
    padding: 10,
  },

  grid3: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  campo: {
    width: "31%",
    marginBottom: 7,
  },
  campoAncho: {
    width: "100%",
    marginBottom: 7,
  },
  etiqueta: {
    fontFamily: "Courier",
    fontSize: 6.8,
    letterSpacing: 0.5,
    color: COLOR.steel,
    marginBottom: 2,
  },
  valor: {
    fontFamily: "Helvetica",
    fontSize: 9,
    lineHeight: 1.35,
  },
  valorVacio: {
    fontFamily: "Helvetica",
    fontSize: 9,
    color: COLOR.steel,
  },

  tabla: {
    marginTop: 4,
  },
  filaTabla: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: COLOR.line,
  },
  filaTablaHead: {
    flexDirection: "row",
    borderBottomWidth: 1.5,
    borderBottomColor: COLOR.line,
  },
  celda: {
    padding: 5,
    fontSize: 8.3,
    lineHeight: 1.3,
  },
  celdaHead: {
    padding: 5,
    fontFamily: "Courier-Bold",
    fontSize: 6.8,
    letterSpacing: 0.4,
    color: COLOR.steel,
  },

  piePagina: {
    position: "absolute",
    bottom: 14,
    left: 32,
    right: 32,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 6.5,
    color: COLOR.steel,
    fontFamily: "Helvetica",
  },
});

export function colorSemaforo(v: string | null | undefined): { bg: string; fg: string } {
  if (v === "critico") return { bg: COLOR.rojoBg, fg: COLOR.rojo };
  if (v === "riesgo") return { bg: COLOR.ambarBg, fg: COLOR.ambar };
  if (v === "estable") return { bg: COLOR.verdeBg, fg: COLOR.verde };
  return { bg: "#EEF1F4", fg: "#8595A4" };
}
export const ETIQ_SEM: Record<string, string> = { critico: "Crítico", riesgo: "En riesgo", estable: "Estable" };
