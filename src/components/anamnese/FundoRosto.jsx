import React from "react";
import { MAPA_W, MAPA_H } from "@/lib/mapaFacial";

/**
 * Base anatômica neutra (vista frontal) usada apenas quando não há foto de referência.
 * Não é um rosto gerado por IA: é um esquema clínico de linhas.
 */
export default function FundoRosto({ dim = { w: MAPA_W, h: MAPA_H } }) {
  const W = dim.w;
  const H = dim.h;
  const cx = W * 0.5;
  const cy = H * 0.44;
  const rx = W * 0.185;
  const ry = H * 0.215;
  const traco = W * 0.0035;
  const tenue = W * 0.002;

  const olhoY = cy - H * 0.012;
  const olhoDx = W * 0.072;
  const bocaY = cy + H * 0.112;
  const narizY = cy + H * 0.058;

  return (
    <g>
      {/* pescoço e ombros */}
      <path
        d={`M ${cx - rx * 0.42} ${cy + ry * 0.88} L ${cx - rx * 0.46} ${cy + ry * 1.34}
            Q ${cx} ${cy + ry * 1.52} ${cx + rx * 0.46} ${cy + ry * 1.34}
            L ${cx + rx * 0.42} ${cy + ry * 0.88}`}
        fill="none" stroke="#DCD1BE" strokeWidth={traco} strokeLinecap="round"
      />
      {/* cabelo (silhueta) */}
      <path
        d={`M ${cx - rx * 1.14} ${cy + ry * 0.72}
            C ${cx - rx * 1.28} ${cy - ry * 0.62} ${cx - rx * 0.66} ${cy - ry * 1.2} ${cx} ${cy - ry * 1.2}
            C ${cx + rx * 0.66} ${cy - ry * 1.2} ${cx + rx * 1.28} ${cy - ry * 0.62} ${cx + rx * 1.14} ${cy + ry * 0.72}
            C ${cx + rx * 1.02} ${cy - ry * 0.25} ${cx + rx * 0.72} ${cy - ry * 0.78} ${cx} ${cy - ry * 0.82}
            C ${cx - rx * 0.72} ${cy - ry * 0.78} ${cx - rx * 1.02} ${cy - ry * 0.25} ${cx - rx * 1.14} ${cy + ry * 0.72} Z`}
        fill="#EFE7D8" stroke="#DCD1BE" strokeWidth={tenue}
      />
      {/* rosto */}
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="none" stroke="#CFC2AC" strokeWidth={traco} />
      {/* orelhas */}
      <path d={`M ${cx - rx} ${cy - ry * 0.06} q ${-W * 0.024} ${H * 0.026} 0 ${H * 0.062}`} fill="none" stroke="#DCD1BE" strokeWidth={tenue} />
      <path d={`M ${cx + rx} ${cy - ry * 0.06} q ${W * 0.024} ${H * 0.026} 0 ${H * 0.062}`} fill="none" stroke="#DCD1BE" strokeWidth={tenue} />
      {/* sobrancelhas */}
      <path d={`M ${cx - olhoDx - W * 0.045} ${olhoY - H * 0.038} q ${W * 0.045} ${-H * 0.011} ${W * 0.078} 0`} fill="none" stroke="#D6C9B5" strokeWidth={traco} strokeLinecap="round" />
      <path d={`M ${cx + olhoDx - W * 0.033} ${olhoY - H * 0.038} q ${W * 0.045} ${-H * 0.011} ${W * 0.078} 0`} fill="none" stroke="#D6C9B5" strokeWidth={traco} strokeLinecap="round" />
      {/* olhos */}
      <path d={`M ${cx - olhoDx - W * 0.042} ${olhoY} q ${W * 0.042} ${-H * 0.021} ${W * 0.084} 0 q ${-W * 0.042} ${H * 0.021} ${-W * 0.084} 0 Z`} fill="none" stroke="#C9BBA4" strokeWidth={tenue} />
      <path d={`M ${cx + olhoDx - W * 0.042} ${olhoY} q ${W * 0.042} ${-H * 0.021} ${W * 0.084} 0 q ${-W * 0.042} ${H * 0.021} ${-W * 0.084} 0 Z`} fill="none" stroke="#C9BBA4" strokeWidth={tenue} />
      <circle cx={cx - olhoDx} cy={olhoY} r={W * 0.011} fill="#C9BBA4" />
      <circle cx={cx + olhoDx} cy={olhoY} r={W * 0.011} fill="#C9BBA4" />
      {/* nariz */}
      <path d={`M ${cx} ${olhoY + H * 0.008} L ${cx - W * 0.012} ${narizY} q ${W * 0.012} ${H * 0.008} ${W * 0.026} 0`} fill="none" stroke="#D6C9B5" strokeWidth={tenue} strokeLinecap="round" />
      {/* boca */}
      <path d={`M ${cx - W * 0.05} ${bocaY} q ${W * 0.05} ${H * 0.016} ${W * 0.1} 0`} fill="none" stroke="#CDBFA8" strokeWidth={tenue} strokeLinecap="round" />
      {/* contorno mandibular */}
      <path d={`M ${cx - rx * 0.92} ${cy + ry * 0.42} Q ${cx} ${cy + ry * 1.08} ${cx + rx * 0.92} ${cy + ry * 0.42}`} fill="none" stroke="#E3D9C8" strokeWidth={tenue} />
      {/* eixos de referência */}
      <line x1={cx} y1={cy - ry * 1.08} x2={cx} y2={cy + ry * 1.12} stroke="#EDE4D4" strokeWidth={tenue} strokeDasharray={`${W * 0.014} ${W * 0.014}`} />
      <line x1={cx - rx * 1.05} y1={olhoY} x2={cx + rx * 1.05} y2={olhoY} stroke="#EDE4D4" strokeWidth={tenue} strokeDasharray={`${W * 0.014} ${W * 0.014}`} />
    </g>
  );
}