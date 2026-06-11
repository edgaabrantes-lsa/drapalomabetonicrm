import React from "react";
import { T } from "@/lib/designTokens";

export const KIT_STATUS = {
  nao_gerado:            { label: "Não Gerado",           color: T.textMuted,   bg: "rgba(100,100,100,0.1)" },
  gerado:                { label: "Gerado",               color: "#3B82F6",     bg: "rgba(59,130,246,0.1)" },
  em_revisao:            { label: "Em Revisão",           color: "#8B5CF6",     bg: "rgba(139,92,246,0.1)" },
  aguardando_assinatura: { label: "Aguardando Assinatura",color: "#F59E0B",     bg: "rgba(245,158,11,0.1)" },
  assinado:              { label: "Assinado",             color: "#22C55E",     bg: "rgba(34,197,94,0.1)" },
  pdf_externo_anexado:   { label: "PDF Externo Anexado",  color: "#10B981",     bg: "rgba(16,185,129,0.1)" },
  substituido:           { label: "Substituído",          color: "#F97316",     bg: "rgba(249,115,22,0.1)" },
  cancelado:             { label: "Cancelado",            color: "#EF4444",     bg: "rgba(239,68,68,0.1)" },
};

export default function KitStatusBadge({ status, size = "normal" }) {
  const cfg = KIT_STATUS[status] || KIT_STATUS.nao_gerado;
  return (
    <span style={{
      display: "inline-flex",
      alignItems: "center",
      padding: size === "small" ? "2px 6px" : "3px 10px",
      borderRadius: 4,
      fontSize: size === "small" ? 10 : 11,
      fontWeight: 600,
      color: cfg.color,
      backgroundColor: cfg.bg,
      border: `1px solid ${cfg.color}30`,
      letterSpacing: "0.03em",
      fontFamily: T.font,
    }}>
      {cfg.label}
    </span>
  );
}