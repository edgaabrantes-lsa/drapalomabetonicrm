import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { T, S } from "@/lib/designTokens";
import { Package, Plus, RotateCcw, AlertTriangle } from "lucide-react";
import ConsumoMateriaisModal from "./ConsumoMateriaisModal";

export default function ProdutosUtilizados({ treatment, patient, onRefresh, podeRegistrar, podeCorrigir }) {
  const [modalAberto, setModalAberto] = useState(false);
  const [erro, setErro] = useState(null);
  const [busy, setBusy] = useState(false);

  const materiais = Array.isArray(treatment.materiais_utilizados) ? treatment.materiais_utilizados : [];

  async function estornar(material) {
    const motivo = window.prompt(`Motivo da correção do consumo de ${material.supply_name}:`);
    if (!motivo || !motivo.trim()) return;
    const devolver = window.confirm(
      "Devolver as unidades ao estoque após conferência física?\n\nOK = devolver ao estoque\nCancelar = manter o estoque como está (apenas registra o estorno)",
    );
    setBusy(true);
    setErro(null);
    try {
      const res = await base44.functions.invoke("estornarConsumoProcedimento", {
        consumo_id: material.consumo_id,
        motivo: motivo.trim(),
        devolver_ao_estoque: devolver,
      });
      const data = res?.data;
      if (data?.error) throw new Error(data.error);
      onRefresh?.();
    } catch (e) {
      setErro(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 10, marginTop: 10 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 6 }}>
        <span style={{ ...S.label, display: "flex", alignItems: "center", gap: 5 }}>
          <Package size={11} /> Produtos utilizados
        </span>
        {podeRegistrar && !treatment.consumo_confirmado && (
          <button
            onClick={() => setModalAberto(true)}
            style={{ ...S.btnGhost, height: 28, fontSize: 11, display: "flex", alignItems: "center", gap: 4, borderColor: T.goldBorder, color: T.gold }}
          >
            <Plus size={11} /> Registrar consumo
          </button>
        )}
      </div>

      {materiais.length === 0 ? (
        <p style={{ fontFamily: T.font, fontSize: 11.5, color: treatment.consumo_confirmado ? T.textMuted : T.warning, margin: 0 }}>
          {treatment.consumo_confirmado ? "Nenhum material registrado." : "Consumo de materiais não registrado para este procedimento."}
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          {materiais.map((m, i) => (
            <div key={m.consumo_id || i} style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, fontFamily: T.font, fontSize: 11.5, color: m.status === "estornado" ? T.textMuted : T.textSecondary, textDecoration: m.status === "estornado" ? "line-through" : "none" }}>
              <span style={{ color: m.status === "estornado" ? T.textMuted : T.textPrimary, fontWeight: 500 }}>
                {m.supply_name}
              </span>
              {m.brand && <span>· {m.brand}</span>}
              {m.batch_number && <span>· lote {m.batch_number}</span>}
              <span style={{ color: T.gold }}>· {m.quantidade} {m.unidade}</span>
              {m.data && <span>· {new Date(m.data + "T12:00:00").toLocaleDateString("pt-BR")}</span>}
              {m.profissional && <span>· {m.profissional}</span>}
              {m.status === "estornado" && <span style={{ color: T.danger }}>· estornado</span>}
              {podeCorrigir && m.status !== "estornado" && m.consumo_id && (
                <button
                  onClick={() => estornar(m)}
                  disabled={busy}
                  style={{ background: "none", border: "none", cursor: "pointer", color: T.warning, display: "flex", alignItems: "center", gap: 3, fontSize: 10.5, padding: 0 }}
                >
                  <RotateCcw size={10} /> corrigir
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {erro && (
        <p style={{ fontFamily: T.font, fontSize: 11, color: "#FCA5A5", margin: "6px 0 0", display: "flex", alignItems: "center", gap: 4 }}>
          <AlertTriangle size={11} /> {erro}
        </p>
      )}

      {modalAberto && (
        <ConsumoMateriaisModal
          patient={patient}
          treatment={treatment}
          onClose={() => setModalAberto(false)}
          onSaved={() => onRefresh?.()}
        />
      )}
    </div>
  );
}