import React from "react";
import { NOME_TIPO } from "@/lib/mapaFacial";

/**
 * Lista das marcações — espelha o mapa: selecionar aqui destaca o objeto no rosto
 * e vice-versa. Permite editar e excluir pelas duas interfaces.
 */
export default function MapaMarcacoesLista({ objetos = [], selecionadoId, onSelecionar, onEditar, onExcluir, somenteLeitura }) {
  if (!objetos.length) return null;

  return (
    <div style={{ border: "1px solid #2B2B2B", borderRadius: 8, overflow: "hidden" }}>
      <div style={{ padding: "8px 12px", borderBottom: "1px solid #2B2B2B", background: "#151515" }}>
        <p style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", color: "#666666", fontWeight: 600 }}>
          Marcações do mapa ({objetos.length})
        </p>
      </div>
      <div style={{ maxHeight: 220, overflowY: "auto" }}>
        {objetos.map((o, i) => {
          const ativo = o.id === selecionadoId;
          const detalhe = o.procedimento || o.observacao || (o.tipo === "texto" ? o.texto : "");
          return (
            <div
              key={o.id}
              onClick={() => onSelecionar(o.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 12px",
                borderBottom: "1px solid #1E1E1E",
                background: ativo ? "rgba(200,169,106,0.10)" : "transparent",
                cursor: "pointer",
              }}
            >
              <span style={{ width: 8, height: 8, borderRadius: 4, background: o.cor || "#C8A96A", flex: "0 0 auto" }} />
              <div style={{ minWidth: 0, flex: 1 }}>
                <p style={{ fontSize: 12, color: ativo ? "#FFFFFF" : "#CFCFCF", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  Marcação {String(i + 1).padStart(2, "0")} · {o.regiao || NOME_TIPO[o.tipo] || "Marcação"}
                  {detalhe ? ` — ${detalhe}` : ""}
                </p>
                {o.observacao && (
                  <p style={{ fontSize: 10, color: "#7A7A7A", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {o.observacao}
                  </p>
                )}
              </div>
              {!somenteLeitura && (
                <div style={{ display: "flex", gap: 6, flex: "0 0 auto" }}>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onEditar(o.id); }}
                    style={{ background: "transparent", border: "none", color: "#C8A96A", fontSize: 10, cursor: "pointer", padding: 0 }}
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onExcluir(o.id); }}
                    style={{ background: "transparent", border: "none", color: "#EF4444", fontSize: 10, cursor: "pointer", padding: 0 }}
                  >
                    Excluir
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}