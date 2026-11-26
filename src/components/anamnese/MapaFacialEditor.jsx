import React, { useEffect, useRef, useState } from "react";
import {
  MAPA_W, MAPA_H, ROSTO_REFERENCIA_PADRAO, acharRostoReferencia, criarObjeto, acharObjetoProximo,
  moverObjeto, escalarObjeto, suavizarPontos, bboxNormalizado,
} from "@/lib/mapaFacial";
import FundoRosto from "./FundoRosto";
import MapaObjeto from "./MapaObjeto";
import MapaAlcas from "./MapaAlcas";

const COR_FUNDO = "#F7F4EE";
const LIMIAR_MOUSE = 0.005;   // ~3px em tela
const LIMIAR_TOQUE = 0.013;
const ESPERA_PRESSIONAR = 140; // ms — distingue toque de arraste

/**
 * Editor do mapa facial.
 * A imagem é o plano de fundo fixo; as marcações vivem em uma camada própria,
 * em coordenadas normalizadas (0 a 1) relativas à imagem — nunca à tela.
 */
export default function MapaFacialEditor({
  objetos = [],
  onChange,
  ferramenta = "select",
  cor = "#C8A96A",
  espessura = 4,
  etapa = "planejado",
  zoom = 1,
  imagemUrl,
  rostoId = ROSTO_REFERENCIA_PADRAO,
  readOnly = false,
  selecionadoId = null,
  onSelect,
  onAbrirObservacao,
  popover = null,
}) {
  const wrapRef = useRef(null);
  const svgRef = useRef(null);
  const gesto = useRef(null);
  const timerPress = useRef(null);
  const rascunhoRef = useRef(null);

  const [rascunho, setRascunho] = useState(null);
  const [ratio, setRatio] = useState({ w: MAPA_W, h: MAPA_H });
  const [carregando, setCarregando] = useState(true);
  const [dims, setDims] = useState({ w: 0, h: 0 });
  const [viewport, setViewport] = useState(() => ({
    w: typeof window !== "undefined" ? window.innerWidth : 1024,
    h: typeof window !== "undefined" ? window.innerHeight : 800,
  }));

  const baseRosto = acharRostoReferencia(rostoId);
  const fonte = imagemUrl || baseRosto.url || "";
  const recorteReferencia = !imagemUrl && Boolean(baseRosto.crop);
  const compacto = viewport.w < 768;
  // Área de marcação: generosa no desktop/tablet e enquadrada (cabe na tela) no celular.
  const alturaLimite = compacto
    ? Math.max(280, Math.min(460, Math.round(viewport.h * 0.44)))
    : Math.max(440, Math.min(1200, Math.round(viewport.h - 150)));
  const recuoLateral = compacto ? 26 : 12;

  useEffect(() => {
    const aoRedimensionar = () => setViewport({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener("resize", aoRedimensionar);
    window.addEventListener("orientationchange", aoRedimensionar);
    return () => {
      window.removeEventListener("resize", aoRedimensionar);
      window.removeEventListener("orientationchange", aoRedimensionar);
    };
  }, []);

  // Proporção real da imagem — a moldura passa a ter exatamente a mesma proporção,
  // então nada é cortado nem distorcido.
  useEffect(() => {
    if (!fonte) {
      setRatio({ w: MAPA_W, h: MAPA_H });
      setCarregando(false);
      return;
    }
    let ativo = true;
    setCarregando(true);
    const img = new Image();
    img.onload = () => {
      if (!ativo) return;
      const nw = img.naturalWidth || MAPA_W;
      const nh = img.naturalHeight || MAPA_H;
      const c = recorteReferencia ? baseRosto.crop : { x: 0, y: 0, w: 1, h: 1 };
      const cw = Math.max(1, nw * c.w);
      const ch = Math.max(1, nh * c.h);
      const w = 1000;
      setRatio({ w, h: Math.max(200, Math.round((w * ch) / cw)) });
      setCarregando(false);
    };
    img.onerror = () => {
      if (!ativo) return;
      setRatio({ w: MAPA_W, h: MAPA_H });
      setCarregando(false);
    };
    img.src = fonte;
    return () => { ativo = false; };
  }, [fonte, baseRosto]);

  // Ajusta o desenho ao espaço disponível preservando 100% da proporção.
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const medir = () => {
      const disponivelW = Math.max(140, el.clientWidth - recuoLateral);
      const escala = Math.min(disponivelW / ratio.w, alturaLimite / ratio.h);
      setDims({
        w: Math.max(80, Math.round(ratio.w * escala)),
        h: Math.max(80, Math.round(ratio.h * escala)),
      });
    };
    medir();
    const ro = new ResizeObserver(medir);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ratio.w, ratio.h, alturaLimite, recuoLateral]);

  const conteudoW = Math.round(dims.w * zoom);
  const conteudoH = Math.round(dims.h * zoom);
  const escala = dims.w ? ratio.w / dims.w : 1;

  const limparTimer = () => {
    if (timerPress.current) {
      clearTimeout(timerPress.current);
      timerPress.current = null;
    }
  };

  useEffect(() => () => limparTimer(), []);

  const aplicarRascunho = (valor) => {
    const novo = typeof valor === "function" ? valor(rascunhoRef.current) : valor;
    rascunhoRef.current = novo;
    setRascunho(novo);
  };

  const normalizar = (clientX, clientY) => {
    const r = svgRef.current?.getBoundingClientRect();
    if (!r || !r.width || !r.height) return { x: 0.5, y: 0.5 };
    return {
      x: Math.max(0, Math.min(1, (clientX - r.left) / r.width)),
      y: Math.max(0, Math.min(1, (clientY - r.top) / r.height)),
    };
  };

  const capturar = (e) => {
    try { svgRef.current?.setPointerCapture?.(e.pointerId); } catch (_) { /* ignora */ }
  };

  const iniciar = (e) => {
    if (e.button !== undefined && e.button > 0) return;
    limparTimer();
    const p = normalizar(e.clientX, e.clientY);
    const alvo = acharObjetoProximo(objetos, p, compacto ? 0.032 : 0.024);

    if (!readOnly && ferramenta === "borracha") {
      if (alvo) {
        onChange(objetos.filter((o) => o.id !== alvo.id), { commit: true });
        onSelect?.(null);
      }
      return;
    }

    if (alvo) {
      onSelect?.(alvo.id);
      gesto.current = {
        tipo: "objeto", id: alvo.id, orig: alvo,
        inicio: p, arrastando: false, pointerType: e.pointerType,
      };
      capturar(e);
      if (e.pointerType === "touch") {
        timerPress.current = setTimeout(() => {
          if (gesto.current && gesto.current.tipo === "objeto" && !readOnly) {
            gesto.current.arrastando = true;
          }
        }, ESPERA_PRESSIONAR);
      }
      return;
    }

    onSelect?.(null);
    if (readOnly) return;

    if (ferramenta === "select") {
      gesto.current = {
        tipo: "pan",
        inicioCliente: { x: e.clientX, y: e.clientY },
        scroll: { l: wrapRef.current?.scrollLeft || 0, t: wrapRef.current?.scrollTop || 0 },
      };
      capturar(e);
      return;
    }

    if (ferramenta === "ponto") {
      onChange([...objetos, criarObjeto("ponto", { x: p.x, y: p.y, cor, espessura, tamanho: 14, etapa })], { commit: true });
      return;
    }

    if (ferramenta === "texto") {
      const novo = criarObjeto("texto", { x: p.x, y: p.y, texto: "Toque para editar", cor, espessura, tamanho: 15, etapa });
      onChange([...objetos, novo], { commit: true });
      onSelect?.(novo.id);
      onAbrirObservacao?.(novo.id);
      return;
    }

    if (ferramenta === "linha" || ferramenta === "seta" || ferramenta === "curva") {
      aplicarRascunho(criarObjeto(ferramenta, { x1: p.x, y1: p.y, x2: p.x, y2: p.y, cx: p.x, cy: p.y, cor, espessura, etapa }));
      gesto.current = { tipo: "rascunho" };
      capturar(e);
      return;
    }

    if (ferramenta === "desenho" || ferramenta === "area") {
      aplicarRascunho(criarObjeto(ferramenta, { pontos: [p], cor, espessura, etapa }));
      gesto.current = { tipo: "rascunho" };
      capturar(e);
    }
  };

  const mover = (e) => {
    const g = gesto.current;
    if (!g) return;

    if (g.tipo === "pan") {
      const el = wrapRef.current;
      if (!el) return;
      el.scrollLeft = g.scroll.l - (e.clientX - g.inicioCliente.x);
      el.scrollTop = g.scroll.t - (e.clientY - g.inicioCliente.y);
      return;
    }

    if (g.tipo === "objeto") {
      if (readOnly) return;
      const p = normalizar(e.clientX, e.clientY);
      if (!g.arrastando) {
        const limite = g.pointerType === "touch" ? LIMIAR_TOQUE : LIMIAR_MOUSE;
        if (Math.hypot(p.x - g.inicio.x, p.y - g.inicio.y) < limite) return;
        limparTimer();
        g.arrastando = true;
      }
      const movido = moverObjeto(g.orig, p.x - g.inicio.x, p.y - g.inicio.y);
      g.resultado = movido;
      onChange(objetos.map((o) => (o.id === g.id ? movido : o)));
      return;
    }

    if (g.tipo === "alca") {
      if (readOnly) return;
      const p = normalizar(e.clientX, e.clientY);
      const ajustado = escalarObjeto(g.orig, g.alca, p);
      g.resultado = ajustado;
      onChange(objetos.map((o) => (o.id === g.id ? ajustado : o)));
      return;
    }

    const p = normalizar(e.clientX, e.clientY);
    aplicarRascunho((r) => {
      if (!r) return r;
      if (r.tipo === "linha" || r.tipo === "seta") return { ...r, x2: p.x, y2: p.y };
      if (r.tipo === "curva") {
        const mx = (r.x1 + p.x) / 2;
        const my = (r.y1 + p.y) / 2;
        const dx = p.x - r.x1;
        const dy = p.y - r.y1;
        const comp = Math.hypot(dx, dy) || 0.001;
        const desvio = comp * 0.26;
        return { ...r, x2: p.x, y2: p.y, cx: clamp01(mx + (-dy / comp) * desvio), cy: clamp01(my + (dx / comp) * desvio) };
      }
      const ultimo = r.pontos[r.pontos.length - 1];
      if (ultimo && Math.hypot(p.x - ultimo.x, p.y - ultimo.y) < 0.004) return r;
      return { ...r, pontos: [...r.pontos, p] };
    });
  };

  const finalizar = () => {
    limparTimer();
    const g = gesto.current;
    gesto.current = null;
    if (!g) return;

    if (g.tipo === "objeto") {
      if (!g.arrastando) {
        onAbrirObservacao?.(g.id);
      } else {
        const final = g.resultado;
        onChange(objetos.map((o) => (o.id === g.id ? { ...(final || o), atualizado_em: new Date().toISOString() } : o)), { commit: true });
      }
      return;
    }

    if (g.tipo === "alca") {
      const final = g.resultado;
      onChange(objetos.map((o) => (o.id === g.id ? { ...(final || o), atualizado_em: new Date().toISOString() } : o)), { commit: true });
      return;
    }

    if (g.tipo === "rascunho") {
      const r = rascunhoRef.current;
      aplicarRascunho(null);
      if (!r) return;
      if (r.tipo === "linha" || r.tipo === "seta" || r.tipo === "curva") {
        if (Math.hypot(r.x2 - r.x1, r.y2 - r.y1) > 0.012) onChange([...objetos, { ...r, atualizado_em: new Date().toISOString() }], { commit: true });
        return;
      }
      if (r.tipo === "desenho") {
        if (r.pontos.length > 2) onChange([...objetos, { ...r, pontos: suavizarPontos(r.pontos), atualizado_em: new Date().toISOString() }], { commit: true });
        return;
      }
      if (r.tipo === "area" && r.pontos.length > 2) {
        onChange([...objetos, { ...r, atualizado_em: new Date().toISOString() }], { commit: true });
      }
    }
  };

  const iniciarAlca = (e, alca) => {
    if (readOnly) return;
    const obj = objetos.find((o) => o.id === selecionadoId);
    if (!obj) return;
    e.stopPropagation();
    e.preventDefault();
    limparTimer();
    capturar(e);
    gesto.current = { tipo: "alca", id: obj.id, orig: obj, alca };
  };

  const selecionado = objetos.find((o) => o.id === selecionadoId) || null;
  const todos = rascunho ? [...objetos, rascunho] : objetos;
  const caixa = selecionado ? bboxNormalizado(selecionado) : null;
  let ancora = null;
  if (caixa && svgRef.current) {
    const r = svgRef.current.getBoundingClientRect();
    if (r.width) ancora = { x: r.left + caixa.cx * r.width, y: r.top + caixa.y0 * r.height };
  }

  return (
    <div style={{ position: "relative" }}>
      <div
        ref={wrapRef}
        style={{
          border: "1px solid #2B2B2B",
          borderRadius: 8,
          backgroundColor: "#0F0F0F",
          padding: 6,
          maxHeight: alturaLimite + 12,
          overflow: zoom > 1 || conteudoH > alturaLimite ? "auto" : "hidden",
          WebkitOverflowScrolling: "touch",
        }}
        onContextMenu={(e) => e.preventDefault()}
      >
        <div style={{ width: conteudoW || 1, height: conteudoH || 1, margin: "0 auto", position: "relative" }}>
          <svg
            ref={svgRef}
            viewBox={`0 0 ${ratio.w} ${ratio.h}`}
            width="100%"
            height="100%"
            preserveAspectRatio="xMidYMid meet"
            style={{
              display: "block",
              touchAction: "none",
              userSelect: "none",
              WebkitUserSelect: "none",
              WebkitTouchCallout: "none",
              cursor: readOnly ? "default" : ferramenta === "select" ? "grab" : "crosshair",
            }}
            onPointerDown={iniciar}
            onPointerMove={mover}
            onPointerUp={finalizar}
            onPointerCancel={finalizar}
          >
            <rect x={0} y={0} width={ratio.w} height={ratio.h} fill={COR_FUNDO} />
            {fonte ? (
              !carregando && (
                <image
                  href={fonte}
                  x={0}
                  y={0}
                  width={ratio.w}
                  height={ratio.h}
                  preserveAspectRatio={recorteReferencia ? "xMidYMid slice" : "xMidYMid meet"}
                />
              )
            ) : (
              <FundoRosto dim={ratio} />
            )}

            {todos.map((o) => (
              <MapaObjeto
                key={o.id}
                obj={o}
                dim={ratio}
                escala={escala}
                selecionado={o.id === selecionadoId}
              />
            ))}

            {selecionado && !readOnly && (
              <MapaAlcas obj={selecionado} dim={ratio} escala={escala} onIniciar={iniciarAlca} />
            )}
          </svg>

          {carregando && (
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: 11, color: "#8A8A8A" }}>Carregando imagem…</span>
            </div>
          )}
        </div>
      </div>

      {popover && compacto && popover}

      {popover && !compacto && ancora && React.cloneElement(popover, { ancora })}
    </div>
  );
}

function clamp01(v) {
  return Math.max(0, Math.min(1, v));
}

export { MapaFacialEditor };