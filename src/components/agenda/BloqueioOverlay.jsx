import React from "react";
import { T } from "@/lib/agendaTokens";
import { faixaBloqueio } from "@/lib/agendaBloqueios";

/* Faixa listrada sobre os horários indisponíveis da agenda */
export default function BloqueioOverlay({ bloqueio, horaInicioDia, horaFimDia, hourHeight }) {
  const faixa = faixaBloqueio(bloqueio);
  const inicio = Math.max(faixa.inicio, horaInicioDia * 60);
  const fim = Math.min(faixa.fim, horaFimDia * 60);
  if (fim <= inicio) return null;

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: (inicio / 60 - horaInicioDia) * hourHeight,
        height: ((fim - inicio) / 60) * hourHeight,
        background:
          "repeating-linear-gradient(135deg, rgba(138,149,170,0.14) 0 6px, rgba(138,149,170,0.05) 6px 12px)",
        borderTop: `1px dashed ${T.charcoal}`,
        borderBottom: `1px dashed ${T.charcoal}`,
        pointerEvents: "none",
        padding: "3px 6px",
        overflow: "hidden",
        zIndex: 5,
      }}
    >
      <span
        style={{
          fontFamily: "Inter",
          fontSize: 9,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          color: T.charcoal,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          display: "block",
        }}
      >
        Indisponível{bloqueio.motivo ? ` · ${bloqueio.motivo}` : ""}
      </span>
    </div>
  );
}