import React from "react";
import { ROSTOS_REFERENCIA, ROSTO_REFERENCIA_PADRAO } from "@/lib/mapaFacial";

/**
 * Escolha do rosto de referência usado como base dos desenhos da anamnese.
 */
export default function RostoReferenciaSelector({ valorId, onEscolher }) {
  const atual = valorId || ROSTO_REFERENCIA_PADRAO;

  return (
    <div>
      <p style={{ fontSize: 10, color: "#666666", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 }}>
        Rosto de referência
      </p>
      <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 2 }}>
        {ROSTOS_REFERENCIA.map((rosto) => {
          const ativo = atual === rosto.id;
          return (
            <button
              key={rosto.id}
              type="button"
              onClick={() => onEscolher(rosto.id)}
              style={{
                flexShrink: 0,
                width: 96,
                background: "#0F0F0F",
                border: `1px solid ${ativo ? "#C8A96A" : "#2B2B2B"}`,
                borderRadius: 6,
                padding: 4,
                cursor: "pointer",
              }}
            >
              <img
                src={rosto.url}
                alt={rosto.label}
                style={{ width: "100%", height: 66, objectFit: "cover", borderRadius: 4, display: "block" }}
              />
              <span style={{ display: "block", marginTop: 4, fontSize: 10, color: ativo ? "#C8A96A" : "#8A8A8A" }}>
                {rosto.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}