import React, { useRef, useState } from "react";
import {
  MAPA_W, MAPA_H, criarObjeto, acharObjetoProximo, moverObjeto,
  suavizarPontos, caminhoSvg, pontoParaSvg,
} from "@/lib/mapaFacial";

const COR_FUNDO = "#F6F3ED";

function FundoRosto() {
  return (
    <g opacity="0.55">
      <ellipse cx={MAPA_W / 2} cy={MAPA_H * 0.44} rx={MAPA_W * 0.27} ry={MAPA_H * 0.25} fill="none" stroke="#D8CDBB" strokeWidth={3} />
      <path d={`M ${MAPA_W * 0.36} ${MAPA_H * 0.58} Q ${MAPA_W / 2} ${MAPA_H * 0.72} ${MAPA_W * 0.64} ${MAPA_H * 0.58}`} fill="none" stroke="#D8CDBB" strokeWidth={2} />
      <line x1={MAPA_W / 2} y1={MAPA_H * 0.19} x2={MAPA_W / 2} y2={MAPA_H * 0.69} stroke="#E6DDCE" strokeWidth={1.5} strokeDasharray="8 8" />
      <line x1={MAPA_W * 0.23} y1={MAPA_H * 0.42} x2={MAPA_W * 0.77} y2={MAPA_H * 0.42} stroke="#E6DDCE" strokeWidth={1.5} strokeDasharray="8 8" />
      <circle cx={MAPA_W * 0.39} cy={MAPA_H * 0.40} r={7} fill="#D8CDBB" />
      <circle cx={MAPA_W * 0.61} cy={MAPA_H * 0.40} r={7} fill="#D8CDBB" />
    </g>
  );
}

function Objeto({ obj, selecionado, onPointerDown }) {
  const comum = { onPointerDown, style: { cursor: "pointer" } };
  const destaque = selecionado ? "#FFFFFF" : "transparent";
  if (obj.tipo === "ponto") {
    const p = pontoParaSvg(obj);
    return (
      <g {...comum}>
        <circle cx={p.x} cy={p.y} r={16} fill="transparent" />
        <circle cx={p.x} cy={p.y} r={10} fill={obj.cor} stroke={destaque} strokeWidth={selecionado ? 3 : 1.5} />
      </g>
    );
  }
  if (obj.tipo === "texto") {
    const p = pontoParaSvg(obj);
    return (
      <text {...comum} x={p.x} y={p.y} fill={obj.cor} fontSize={26} fontWeight={600} stroke={selecionado ? "#FFFFFF" : "none"} strokeWidth={selecionado ? 0.8 : 0}>
        {obj.texto || "Texto"}
      </text>
    );
  }
  if (obj.tipo === "linha" || obj.tipo === "seta") {
    const a = pontoParaSvg({ x: obj.x1, y: obj.y1 });
    const b = pontoParaSvg({ x: obj.x2, y: obj.y2 });
    const ang = Math.atan2(b.y - a.y, b.x - a.x);
    const tam = 22;
    const p1 = { x: b.x - tam * Math.cos(ang - Math.PI / 7), y: b.y - tam * Math.sin(ang - Math.PI / 7) };
    const p2 = { x: b.x - tam * Math.cos(ang + Math.PI / 7), y: b.y - tam * Math.sin(ang + Math.PI / 7) };
    return (
      <g {...comum}>
        <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={obj.cor} strokeWidth={selecionado ? 6 : 4} strokeDasharray={obj.tipo === "seta" ? "14 10" : undefined} strokeLinecap="round" />
        {obj.tipo === "seta" && <polygon points={`${b.x},${b.y} ${p1.x},${p1.y} ${p2.x},${p2.y}`} fill={obj.cor} />}
        <circle cx={a.x} cy={a.y} r={selecionado ? 7 : 0} fill={obj.cor} />
      </g>
    );
  }
  const fechado = obj.tipo === "area";
  return (
    <g {...comum}>
      <path
        d={caminhoSvg(obj.pontos, fechado)}
        fill={fechado ? obj.cor : "none"}
        fillOpacity={fechado ? 0.18 : 0}
        stroke={obj.cor}
        strokeWidth={selecionado ? 6 : 4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>
  );
}

export default function MapaFacialEditor({ objetos = [], onChange, ferramenta, cor, etapa, zoom, imagemUrl, readOnly, selecionadoId, onSelect }) {
  const svgRef = useRef(null);
  const [rascunho, setRascunho] = useState(null);
  const arraste = useRef(null);

  const pontoDoEvento = (e) => {
    const r = svgRef.current.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)),
      y: Math.max(0, Math.min(1, (e.clientY - r.top) / r.height)),
    };
  };

  const handleDown = (e) => {
    if (readOnly) return;
    e.preventDefault();
    const p = pontoDoEvento(e);
    if (ferramenta === "select") {
      const alvo = acharObjetoProximo(objetos, p);
      onSelect?.(alvo?.id || null);
      if (alvo) arraste.current = { id: alvo.id, ultimo: p };
      return;
    }
    if (ferramenta === "borracha") {
      const alvo = acharObjetoProximo(objetos, p, 0.05);
      if (alvo) onChange(objetos.filter((o) => o.id !== alvo.id));
      return;
    }
    if (ferramenta === "ponto") {
      onChange([...objetos, criarObjeto("ponto", { x: p.x, y: p.y, cor, etapa })]);
      return;
    }
    if (ferramenta === "texto") {
      const texto = window.prompt("Texto da observação:");
      if (texto && texto.trim()) {
        onChange([...objetos, criarObjeto("texto", { x: p.x, y: p.y, texto: texto.trim(), cor, etapa })]);
      }
      return;
    }
    if (ferramenta === "linha" || ferramenta === "seta") {
      setRascunho(criarObjeto(ferramenta, { x1: p.x, y1: p.y, x2: p.x, y2: p.y, cor, etapa }));
      return;
    }
    if (ferramenta === "desenho" || ferramenta === "area") {
      setRascunho(criarObjeto(ferramenta, { pontos: [p], cor, etapa }));
    }
  };

  const handleMove = (e) => {
    if (readOnly) return;
    if (arraste.current) {
      e.preventDefault();
      const p = pontoDoEvento(e);
      const dx = p.x - arraste.current.ultimo.x;
      const dy = p.y - arraste.current.ultimo.y;
      arraste.current.ultimo = p;
      onChange(objetos.map((o) => (o.id === arraste.current.id ? moverObjeto(o, dx, dy) : o)));
      return;
    }
    if (!rascunho) return;
    e.preventDefault();
    const p = pontoDoEvento(e);
    if (rascunho.tipo === "linha" || rascunho.tipo === "seta") {
      setRascunho({ ...rascunho, x2: p.x, y2: p.y });
    } else {
      setRascunho({ ...rascunho, pontos: [...rascunho.pontos, p] });
    }
  };

  const handleUp = () => {
    if (arraste.current) { arraste.current = null; return; }
    if (!rascunho) return;
    if ((rascunho.tipo === "linha" || rascunho.tipo === "seta") && Math.hypot(rascunho.x2 - rascunho.x1, rascunho.y2 - rascunho.y1) > 0.01) {
      onChange([...objetos, rascunho]);
    }
    if (rascunho.tipo === "desenho" && rascunho.pontos.length > 2) {
      onChange([...objetos, { ...rascunho, pontos: suavizarPontos(rascunho.pontos) }]);
    }
    if (rascunho.tipo === "area" && rascunho.pontos.length > 2) {
      onChange([...objetos, rascunho]);
    }
    setRascunho(null);
  };

  const todos = rascunho ? [...objetos, rascunho] : objetos;
  const desenhando = ferramenta !== "select";

  return (
    <div style={{ overflow: "auto", maxHeight: 460, border: "1px solid #2B2B2B", borderRadius: 8, backgroundColor: "#0F0F0F" }}>
      <div style={{ width: `${Math.max(100, zoom * 100)}%`, minHeight: 1 }}>
        <svg
          ref={svgRef}
          viewBox={`0 0 ${MAPA_W} ${MAPA_H}`}
          style={{ display: "block", width: "100%", height: "auto", touchAction: desenhando ? "none" : "auto", userSelect: "none" }}
          onPointerDown={handleDown}
          onPointerMove={handleMove}
          onPointerUp={handleUp}
          onPointerLeave={handleUp}
          onPointerCancel={handleUp}
        >
          <rect x={0} y={0} width={MAPA_W} height={MAPA_H} fill={COR_FUNDO} />
          {imagemUrl ? (
            <image href={imagemUrl} x={0} y={0} width={MAPA_W} height={MAPA_H} preserveAspectRatio="xMidYMid slice" />
          ) : (
            <FundoRosto />
          )}
          {todos.map((o) => (
            <Objeto key={o.id} obj={o} selecionado={o.id === selecionadoId} />
          ))}
        </svg>
      </div>
    </div>
  );
}

export { MapaFacialEditor };