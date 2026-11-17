import React from "react";
import { pontoParaSvg, caminhoSvg, curvaParaSvg, bboxNormalizado } from "@/lib/mapaFacial";

/** Indicador discreto de que a marcação possui observação/procedimento. */
function Indicador({ obj, dim, escala }) {
  const bb = bboxNormalizado(obj);
  if (!bb) return null;
  const x = bb.x1 * dim.w;
  const y = bb.y0 * dim.h;
  const r = 8 * escala;
  return (
    <g>
      <circle cx={x} cy={y} r={r} fill="#0F0F0F" stroke="#C8A96A" strokeWidth={1.6 * escala} />
      <line x1={x - r * 0.5} y1={y - r * 0.32} x2={x + r * 0.5} y2={y - r * 0.32} stroke="#C8A96A" strokeWidth={1.3 * escala} strokeLinecap="round" />
      <line x1={x - r * 0.5} y1={y + r * 0.12} x2={x + r * 0.28} y2={y + r * 0.12} stroke="#C8A96A" strokeWidth={1.3 * escala} strokeLinecap="round" />
    </g>
  );
}

/** Desenha uma marcação. Não captura eventos: o toque é resolvido pelo editor. */
export default function MapaObjeto({ obj, selecionado, dim, escala = 1 }) {
  const cor = obj.cor || "#C8A96A";
  const largura = Math.max(1.2, (obj.espessura || 4) * escala);
  const contorno = selecionado ? { stroke: "#FFFFFF", strokeWidth: largura + 2.4 * escala, strokeOpacity: 0.55 } : null;
  const temObs = Boolean((obj.observacao || "").trim() || (obj.procedimento || "").trim());

  let corpo = null;

  if (obj.tipo === "ponto") {
    const p = pontoParaSvg(obj, dim);
    const raio = Math.max(3, ((obj.tamanho || 14) / 2) * escala);
    corpo = (
      <g>
        {selecionado && <circle cx={p.x} cy={p.y} r={raio + 5 * escala} fill="none" stroke="#FFFFFF" strokeWidth={1.6 * escala} />}
        <circle cx={p.x} cy={p.y} r={raio} fill={cor} stroke="rgba(0,0,0,0.4)" strokeWidth={1.2 * escala} />
      </g>
    );
  } else if (obj.tipo === "texto") {
    const p = pontoParaSvg(obj, dim);
    const fonte = Math.max(9, obj.tamanho || 14) * escala;
    corpo = (
      <text
        x={p.x}
        y={p.y}
        fill={cor}
        fontSize={fonte}
        fontWeight={600}
        textAnchor="middle"
        stroke={selecionado ? "#FFFFFF" : "none"}
        strokeWidth={selecionado ? 0.6 * escala : 0}
        paintOrder="stroke"
      >
        {obj.texto || "Texto"}
      </text>
    );
  } else if (obj.tipo === "linha" || obj.tipo === "seta") {
    const a = pontoParaSvg({ x: obj.x1, y: obj.y1 }, dim);
    const b = pontoParaSvg({ x: obj.x2, y: obj.y2 }, dim);
    const ang = Math.atan2(b.y - a.y, b.x - a.x);
    const tam = 14 * escala;
    const p1 = { x: b.x - tam * Math.cos(ang - Math.PI / 7), y: b.y - tam * Math.sin(ang - Math.PI / 7) };
    const p2 = { x: b.x - tam * Math.cos(ang + Math.PI / 7), y: b.y - tam * Math.sin(ang + Math.PI / 7) };
    corpo = (
      <g>
        {contorno && <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={contorno.stroke} strokeWidth={contorno.strokeWidth} strokeOpacity={contorno.strokeOpacity} strokeLinecap="round" />}
        <line
          x1={a.x} y1={a.y} x2={b.x} y2={b.y}
          stroke={cor}
          strokeWidth={largura}
          strokeDasharray={obj.tipo === "seta" ? `${5 * escala} ${3.4 * escala}` : undefined}
          strokeLinecap="round"
        />
        {obj.tipo === "seta" && <polygon points={`${b.x},${b.y} ${p1.x},${p1.y} ${p2.x},${p2.y}`} fill={cor} />}
      </g>
    );
  } else if (obj.tipo === "curva") {
    const d = curvaParaSvg(obj, dim);
    corpo = (
      <g>
        {contorno && <path d={d} fill="none" stroke={contorno.stroke} strokeWidth={contorno.strokeWidth} strokeOpacity={contorno.strokeOpacity} strokeLinecap="round" />}
        <path d={d} fill="none" stroke={cor} strokeWidth={largura} strokeLinecap="round" />
      </g>
    );
  } else {
    const fechado = obj.tipo === "area";
    const d = caminhoSvg(obj.pontos, fechado, dim);
    corpo = (
      <g>
        {contorno && <path d={d} fill="none" stroke={contorno.stroke} strokeWidth={contorno.strokeWidth} strokeOpacity={contorno.strokeOpacity} strokeLinejoin="round" />}
        <path
          d={d}
          fill={fechado ? cor : "none"}
          fillOpacity={fechado ? 0.16 : 0}
          stroke={cor}
          strokeWidth={largura}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    );
  }

  return (
    <g pointerEvents="none">
      {corpo}
      {temObs && <Indicador obj={obj} dim={dim} escala={escala} />}
    </g>
  );
}