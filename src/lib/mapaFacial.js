// Utilitários do mapa facial — coordenadas normalizadas (0 a 1)

export const MAPA_W = 1000;
export const MAPA_H = 1400;

export const CORES = ["#C8A96A", "#4ADE80", "#38BDF8", "#A78BFA", "#F472B6", "#EF4444", "#FFFFFF"];

export const FERRAMENTAS = [
  { id: "select", label: "Selecionar" },
  { id: "ponto", label: "Ponto" },
  { id: "linha", label: "Linha" },
  { id: "seta", label: "Seta pontilhada" },
  { id: "desenho", label: "Desenho livre" },
  { id: "area", label: "Área" },
  { id: "texto", label: "Texto" },
  { id: "borracha", label: "Borracha" },
];

export const PROCEDIMENTOS_PADRAO = [
  "Toxina botulínica",
  "Preenchimento com ácido hialurônico",
  "Bioestimulador de colágeno",
  "Fios de sustentação",
  "Microagulhamento",
  "Laser",
  "Outros",
];

export const REGIOES_FACE = [
  "Testa", "Glabela", "Periocular", "Malar", "Nariz", "Sulco nasogeniano",
  "Lábios", "Mento", "Mandíbula", "Pescoço", "Full face",
];

let contador = 0;
const novoId = () => `obj_${Date.now()}_${contador++}`;

export function criarObjeto(tipo, dados = {}) {
  return {
    id: novoId(),
    tipo,
    cor: "#C8A96A",
    procedimento: "",
    regiao: "",
    observacao: "",
    etapa: "planejado",
    quantidade: "",
    unidade: "",
    ...dados,
  };
}

export function pontoParaSvg(p) {
  return { x: p.x * MAPA_W, y: p.y * MAPA_H };
}

function dist(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function distSegmento(p, a, b) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len2 = dx * dx + dy * dy;
  if (len2 === 0) return dist(p, a);
  let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  return dist(p, { x: a.x + t * dx, y: a.y + t * dy });
}

/** Encontra o objeto mais próximo de um ponto (coordenadas normalizadas). */
export function acharObjetoProximo(objetos = [], ponto, tolerancia = 0.035) {
  let melhor = null;
  let menorDist = tolerancia;
  [...objetos].reverse().forEach((obj) => {
    let d = Infinity;
    if (obj.tipo === "ponto" || obj.tipo === "texto") {
      d = dist(ponto, { x: obj.x, y: obj.y });
    } else if (obj.tipo === "linha" || obj.tipo === "seta") {
      d = distSegmento(ponto, { x: obj.x1, y: obj.y1 }, { x: obj.x2, y: obj.y2 });
    } else if (Array.isArray(obj.pontos) && obj.pontos.length) {
      d = Math.min(...obj.pontos.map((p) => dist(ponto, p)));
    }
    if (d < menorDist) {
      menorDist = d;
      melhor = obj;
    }
  });
  return melhor;
}

/** Move um objeto inteiro por um deslocamento normalizado. */
export function moverObjeto(obj, dx, dy) {
  if (obj.tipo === "ponto" || obj.tipo === "texto") {
    return { ...obj, x: clamp01(obj.x + dx), y: clamp01(obj.y + dy) };
  }
  if (obj.tipo === "linha" || obj.tipo === "seta") {
    return { ...obj, x1: clamp01(obj.x1 + dx), y1: clamp01(obj.y1 + dy), x2: clamp01(obj.x2 + dx), y2: clamp01(obj.y2 + dy) };
  }
  return { ...obj, pontos: (obj.pontos || []).map((p) => ({ x: clamp01(p.x + dx), y: clamp01(p.y + dy) })) };
}

export function clamp01(v) {
  return Math.max(0.005, Math.min(0.995, v));
}

/** Suaviza traço livre sem alterar o percurso (média dos vizinhos). */
export function suavizarPontos(pontos = []) {
  if (pontos.length < 3) return pontos;
  return pontos.map((p, i) => {
    if (i === 0 || i === pontos.length - 1) return p;
    const a = pontos[i - 1];
    const b = pontos[i + 1];
    return { x: (a.x + 2 * p.x + b.x) / 4, y: (a.y + 2 * p.y + b.y) / 4 };
  });
}

export function caminhoSvg(pontos = [], fechado = false) {
  if (!pontos.length) return "";
  const d = pontos.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x * MAPA_W} ${p.y * MAPA_H}`).join(" ");
  return fechado ? `${d} Z` : d;
}