// Utilitários do mapa facial — TODAS as coordenadas são normalizadas (0 a 1) em relação à imagem.
// Nada é gravado em pixels de tela, portanto as marcações continuam alinhadas em qualquer aparelho.

export const MAPA_W = 1000;
export const MAPA_H = 1400;

/**
 * Imagem de referência fixa do mapa facial (rosto único, recortado e centralizado).
 * Quando vazia, o editor exibe o desenho anatômico neutro como base.
 */
export const ROSTO_REFERENCIA_URL =
  "https://base44.app/api/apps/699dbefdfbf6a591f90b6e3b/files/mp/public/699dbefdfbf6a591f90b6e3b/9c21add86_rosto-referencia-mapa-facial.jpg";

/**
 * Recorte central aplicado sobre a foto de referência (frações 0–1 da imagem original),
 * para que o rosto ocupe a maior parte da área de marcação. Não afeta a foto da paciente.
 */
export const ROSTO_REFERENCIA_CROP = { x: 0.15, y: 0, w: 0.7, h: 1 };

export const CORES = ["#C8A96A", "#4ADE80", "#38BDF8", "#A78BFA", "#F472B6", "#EF4444", "#FFFFFF"];

export const ESPESSURAS = [2, 3, 4, 6, 8];

export const FERRAMENTAS = [
  { id: "select", label: "Selecionar" },
  { id: "ponto", label: "Ponto" },
  { id: "linha", label: "Linha" },
  { id: "seta", label: "Seta pontilhada" },
  { id: "curva", label: "Linha curva" },
  { id: "desenho", label: "Desenho livre" },
  { id: "area", label: "Área" },
  { id: "texto", label: "Texto" },
  { id: "borracha", label: "Borracha" },
];

export const NOME_TIPO = {
  ponto: "Ponto",
  linha: "Linha",
  seta: "Seta pontilhada",
  curva: "Linha curva",
  desenho: "Desenho livre",
  area: "Área",
  texto: "Texto",
};

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
export const novoId = () => `obj_${Date.now().toString(36)}${(contador++).toString(36)}`;

export function criarObjeto(tipo, dados = {}) {
  const agora = new Date().toISOString();
  return {
    id: novoId(),
    tipo,
    cor: "#C8A96A",
    espessura: 4,
    procedimento: "",
    regiao: "",
    observacao: "",
    etapa: "planejado",
    quantidade: "",
    unidade: "",
    criado_em: agora,
    atualizado_em: agora,
    ...dados,
  };
}

/** Garante id/tipo/cor/timestamps em objetos antigos — sem perder nada do que já existia. */
export function migrarObjetos(lista = []) {
  if (!Array.isArray(lista)) return [];
  return lista.filter(Boolean).map((o, i) => ({
    tipo: "ponto",
    cor: "#C8A96A",
    espessura: 4,
    observacao: "",
    procedimento: "",
    ...o,
    id: o.id || `obj_legado_${i}`,
  }));
}

export function clamp01(v) {
  return Math.max(0.002, Math.min(0.998, v));
}

export function pontoParaSvg(p, dim = { w: MAPA_W, h: MAPA_H }) {
  return { x: (p?.x || 0) * dim.w, y: (p?.y || 0) * dim.h };
}

export function caminhoSvg(pontos = [], fechado = false, dim = { w: MAPA_W, h: MAPA_H }) {
  if (!pontos.length) return "";
  const d = pontos.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x * dim.w} ${p.y * dim.h}`).join(" ");
  return fechado ? `${d} Z` : d;
}

/** Caminho Bézier quadrática (ponto inicial, controle, ponto final). */
export function curvaParaSvg(obj, dim = { w: MAPA_W, h: MAPA_H }) {
  const a = pontoParaSvg({ x: obj.x1, y: obj.y1 }, dim);
  const c = pontoParaSvg({ x: obj.cx ?? obj.x1, y: obj.cy ?? obj.y1 }, dim);
  const b = pontoParaSvg({ x: obj.x2, y: obj.y2 }, dim);
  return `M ${a.x} ${a.y} Q ${c.x} ${c.y} ${b.x} ${b.y}`;
}

/** Amostra a curva em coordenadas normalizadas (usada para toque e caixa delimitadora). */
export function pontosDaCurva(obj, passos = 24) {
  const x1 = obj.x1, y1 = obj.y1, x2 = obj.x2, y2 = obj.y2;
  const cx = obj.cx ?? (x1 + x2) / 2;
  const cy = obj.cy ?? (y1 + y2) / 2;
  const pts = [];
  for (let i = 0; i <= passos; i++) {
    const t = i / passos;
    const u = 1 - t;
    pts.push({
      x: u * u * x1 + 2 * u * t * cx + t * t * x2,
      y: u * u * y1 + 2 * u * t * cy + t * t * y2,
    });
  }
  return pts;
}

export function boundsDosPontos(pontos = []) {
  if (!pontos.length) return { x0: 0, y0: 0, x1: 0, y1: 0, cx: 0, cy: 0 };
  const xs = pontos.map((p) => p.x);
  const ys = pontos.map((p) => p.y);
  const x0 = Math.min(...xs), x1 = Math.max(...xs);
  const y0 = Math.min(...ys), y1 = Math.max(...ys);
  return { x0, y0, x1, y1, cx: (x0 + x1) / 2, cy: (y0 + y1) / 2 };
}

export function bboxNormalizado(obj) {
  if (!obj) return null;
  if (obj.tipo === "ponto") {
    const r = 0.018;
    return { x0: obj.x - r, y0: obj.y - r, x1: obj.x + r, y1: obj.y + r, cx: obj.x, cy: obj.y };
  }
  if (obj.tipo === "texto") {
    const largura = Math.max(0.05, (obj.texto || "").length * 0.011);
    return { x0: obj.x - largura / 2, y0: obj.y - 0.022, x1: obj.x + largura / 2, y1: obj.y + 0.012, cx: obj.x, cy: obj.y };
  }
  if (obj.tipo === "linha" || obj.tipo === "seta") {
    return boundsDosPontos([{ x: obj.x1, y: obj.y1 }, { x: obj.x2, y: obj.y2 }]);
  }
  if (obj.tipo === "curva") {
    return boundsDosPontos(pontosDaCurva(obj, 16));
  }
  return boundsDosPontos(obj.pontos || []);
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

function distPolilinha(p, pontos = []) {
  if (!pontos.length) return Infinity;
  if (pontos.length === 1) return dist(p, pontos[0]);
  let menor = Infinity;
  for (let i = 1; i < pontos.length; i++) {
    menor = Math.min(menor, distSegmento(p, pontos[i - 1], pontos[i]));
  }
  return menor;
}

export function pontoDentroPoligono(p, pontos = []) {
  let dentro = false;
  for (let i = 0, j = pontos.length - 1; i < pontos.length; j = i++) {
    const a = pontos[i], b = pontos[j];
    if ((a.y > p.y) !== (b.y > p.y) && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y || 1e-9) + a.x) {
      dentro = !dentro;
    }
  }
  return dentro;
}

/** Objeto mais próximo do toque (funciona com mouse, dedo e caneta). */
export function acharObjetoProximo(objetos = [], ponto, tolerancia = 0.028) {
  let melhor = null;
  let menorDist = tolerancia;
  [...objetos].reverse().forEach((obj) => {
    let d = Infinity;
    if (obj.tipo === "ponto") {
      d = dist(ponto, { x: obj.x, y: obj.y });
    } else if (obj.tipo === "texto") {
      const bb = bboxNormalizado(obj);
      const dentro = ponto.x >= bb.x0 && ponto.x <= bb.x1 && ponto.y >= bb.y0 && ponto.y <= bb.y1;
      d = dentro ? 0 : dist(ponto, { x: obj.x, y: obj.y });
    } else if (obj.tipo === "linha" || obj.tipo === "seta") {
      d = distSegmento(ponto, { x: obj.x1, y: obj.y1 }, { x: obj.x2, y: obj.y2 });
    } else if (obj.tipo === "curva") {
      d = distPolilinha(ponto, pontosDaCurva(obj, 24));
    } else if (obj.tipo === "area") {
      d = pontoDentroPoligono(ponto, obj.pontos || []) ? 0 : distPolilinha(ponto, [...(obj.pontos || []), ...(obj.pontos || []).slice(0, 1)]);
    } else {
      d = distPolilinha(ponto, obj.pontos || []);
    }
    if (d < menorDist) {
      menorDist = d;
      melhor = obj;
    }
  });
  return melhor;
}

/** Move o objeto inteiro por um deslocamento normalizado (nunca altera a forma). */
export function moverObjeto(obj, dx, dy) {
  const mx = (v) => clamp01(v + dx);
  const my = (v) => clamp01(v + dy);
  if (obj.tipo === "ponto" || obj.tipo === "texto") {
    return { ...obj, x: mx(obj.x), y: my(obj.y) };
  }
  if (obj.tipo === "linha" || obj.tipo === "seta") {
    return { ...obj, x1: mx(obj.x1), y1: my(obj.y1), x2: mx(obj.x2), y2: my(obj.y2) };
  }
  if (obj.tipo === "curva") {
    return {
      ...obj,
      x1: mx(obj.x1), y1: my(obj.y1),
      cx: mx(obj.cx ?? obj.x1), cy: my(obj.cy ?? obj.y1),
      x2: mx(obj.x2), y2: my(obj.y2),
    };
  }
  return { ...obj, pontos: (obj.pontos || []).map((p) => ({ x: mx(p.x), y: my(p.y) })) };
}

/** Ajusta uma alça do objeto (extremidade, curvatura, canto da área ou tamanho do texto). */
export function escalarObjeto(obj, alca, destino) {
  const d = { x: clamp01(destino.x), y: clamp01(destino.y) };
  if (obj.tipo === "linha" || obj.tipo === "seta") {
    return alca === "p1" ? { ...obj, x1: d.x, y1: d.y } : { ...obj, x2: d.x, y2: d.y };
  }
  if (obj.tipo === "curva") {
    if (alca === "p1") return { ...obj, x1: d.x, y1: d.y };
    if (alca === "p2") return { ...obj, x2: d.x, y2: d.y };
    return { ...obj, cx: d.x, cy: d.y };
  }
  if (obj.tipo === "texto") {
    const avanco = Math.hypot(d.x - obj.x, d.y - obj.y);
    return { ...obj, tamanho: Math.max(9, Math.min(64, Math.round(avanco * 140))) };
  }
  if (obj.tipo === "area") {
    const bb = boundsDosPontos(obj.pontos || []);
    const canto = {
      no: { x: bb.x0, y: bb.y0 },
      ne: { x: bb.x1, y: bb.y0 },
      so: { x: bb.x0, y: bb.y1 },
      se: { x: bb.x1, y: bb.y1 },
    }[alca];
    const oposto = {
      no: { x: bb.x1, y: bb.y1 },
      ne: { x: bb.x0, y: bb.y1 },
      so: { x: bb.x1, y: bb.y0 },
      se: { x: bb.x0, y: bb.y0 },
    }[alca];
    if (!canto || !oposto) return obj;
    const sx = Math.abs(canto.x - oposto.x) > 0.001 ? (d.x - oposto.x) / (canto.x - oposto.x) : 1;
    const sy = Math.abs(canto.y - oposto.y) > 0.001 ? (d.y - oposto.y) / (canto.y - oposto.y) : 1;
    return {
      ...obj,
      pontos: (obj.pontos || []).map((p) => ({
        x: clamp01(oposto.x + (p.x - oposto.x) * sx),
        y: clamp01(oposto.y + (p.y - oposto.y) * sy),
      })),
    };
  }
  return obj;
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