import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { T, S } from "@/lib/designTokens";
import { X, AlertTriangle, Check } from "lucide-react";
import ConsumoMateriaisForm, { novaLinhaConsumo } from "./ConsumoMateriaisForm";

export default function ConsumoMateriaisModal({ patient, treatment, onClose, onSaved }) {
  const [rows, setRows] = useState([novaLinhaConsumo({ procedure_name: treatment?.protocolo_nome || "" })]);
  const [valido, setValido] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState(null);

  async function confirmar() {
    setSalvando(true);
    setErro(null);
    try {
      const items = rows
        .filter((r) => r.supply_id)
        .map((r) => ({ supply_id: r.supply_id, batch_id: r.batch_id || "", quantity: Number(r.quantity) }));

      const res = await base44.functions.invoke("registrarConsumoProcedimento", {
        patient_id: patient.id,
        patient_name: patient.full_name,
        treatment_id: treatment?.id || "",
        procedure_name: treatment?.protocolo_nome || "",
        items,
      });

      const data = res?.data;
      if (!data) throw new Error("Sem resposta do servidor.");
      if (data.error) throw new Error(data.error);
      if (data.alertas?.length > 0) {
        window.alert(
          "Consumo registrado. Atenção ao estoque mínimo:\n" +
          data.alertas.map((a) => `• ${a.supply_name}: ${a.restante} ${a.unidade} (mínimo ${a.minimo})`).join("\n"),
        );
      }
      onSaved?.();
      onClose();
    } catch (e) {
      setErro(e.message);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 60, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ width: "100%", maxWidth: 640, maxHeight: "90vh", overflowY: "auto", background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 18 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, marginBottom: 12 }}>
          <div>
            <p style={{ ...S.value, fontSize: 15, margin: 0 }}>Produtos utilizados</p>
            <p style={{ ...S.pageSubtitle, margin: 0 }}>
              {patient.full_name} · {treatment?.protocolo_nome || "Procedimento"}
            </p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: T.textMuted }}>
            <X size={18} />
          </button>
        </div>

        <p style={{ fontFamily: T.font, fontSize: 11.5, color: T.textMuted, margin: "0 0 12px" }}>
          A confirmação dá baixa no lote e no estoque consolidado. Não é possível registrar duas baixas para o mesmo procedimento.
        </p>

        <ConsumoMateriaisForm value={rows} onChange={setRows} onValidChange={setValido} disabled={salvando} />

        {erro && (
          <div style={{ display: "flex", gap: 8, background: T.dangerSubtle, border: "1px solid rgba(239,68,68,0.3)", borderRadius: 6, padding: "10px 12px", marginTop: 12 }}>
            <AlertTriangle size={14} style={{ color: T.danger, flexShrink: 0, marginTop: 1 }} />
            <p style={{ fontFamily: T.font, fontSize: 12, color: "#FCA5A5", margin: 0 }}>{erro}</p>
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
          <button onClick={onClose} style={{ ...S.btnGhost, height: 34, fontSize: 12 }}>Cancelar</button>
          <button
            onClick={confirmar}
            disabled={!valido || salvando}
            style={{ ...S.btnPrimary, height: 34, fontSize: 12, display: "flex", alignItems: "center", gap: 6, opacity: !valido || salvando ? 0.5 : 1 }}
          >
            <Check size={13} /> {salvando ? "Baixando..." : "Confirmar consumo"}
          </button>
        </div>
      </div>
    </div>
  );
}