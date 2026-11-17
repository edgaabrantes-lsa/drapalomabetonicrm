import React from "react";
import { bboxNormalizado } from "@/lib/mapaFacial";

/** Alças de ajuste de cada tipo de marcação (extremidades, curvatura, cantos, tamanho). */
export function alcasDoObjeto(obj, dim) {
  if (!obj || !dim?.w) return [];
  if (obj.tipo === "linha" || obj.tipo === "seta") {
    return [
      { id: "p1", x: obj.x1 * dim.w, y: obj.y1 * dim.h },
      { id: "p2", x: obj.x2 * dim.w, y: obj.y2 * dim.h },
    ];
  }
  if (obj.tipo === "curva") {
    return [
      { id: "p1", x: obj.x1 * dim.w, y: obj.y1 * dim.h },
      { id: "c", x: (obj.cx ?? obj.x1) * dim.w, y: (obj.cy ?? obj.y1) * dim.h, controle: true },
      { id: "p2", x: obj.x2 * dim.w, y: obj.y2 * dim.h },
    ];
  }
  if (obj.tipo === "area") {
    const bb = bboxNormalizado(obj);
    return ["no", "ne", "so", "se"].map((id) => ({
      id,
      x: (id === "no" || id === "so" ? bb.x0 : bb.x1) * dim.w,
      y: (id === "no" || id === "ne" ? bb.y0 : bb.y1) * dim.h,
    }));
  }
  if (obj.tipo === "texto") {
    const bb = bboxNormalizado(obj);
    return [{ id: "se", x: bb.x1 * dim.w, y: bb.y1 * dim.h }];
  }
  return [];
}

export default function MapaAlcas({ obj, dim, escala = 1, onIniciar }) {
  const alcas = alcasDoObjeto(obj, dim);
  if (!alcas.length) return null;
  const r = 9 * escala;
  return (
    <g pointerEvents="auto">
      {alcas.map((a) => (
        <g key={a.id}>
          <circle cx={a.x} cy={a.y} r={r * 2} fill="transparent" style={{ cursor: "grab" }} onPointerDown={(e) => onIniciar(e, a.id)} />
          <circle
            cx={a.x}
            cy={a.y}
            r={a.controle ? r * 0.85 : r}
            fill={a.controle ? "#C8A96A" : "#FFFFFF"}
            stroke="#0F0F0F"
            strokeWidth={1.4 * escala}
            style={{ cursor: "grab" }}
            onPointerDown={(e) => onIniciar(e, a.id)}
          />
        </g>
      ))}
    </g>
  );
}