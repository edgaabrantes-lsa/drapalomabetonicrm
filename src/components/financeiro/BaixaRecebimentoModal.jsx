import React, { useState } from "react";
import { format } from "date-fns";
import { formatBRL } from "@/lib/finCalc";

const T = { card: "#1A1A1A", border: "#2B2B2B", text: "#FFFFFF", muted: "#B0B0B0", dim: "#666", gold: "#C8A96A" };
const inputStyle = { background: "#121212", border: `1px solid ${T.border}`, borderRadius: 6, color: T.text, fontFamily: "Inter", fontSize: 13, padding: "8px 12px", width: "100%" };
const labelStyle = { fontFamily: "Inter", fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", color: T.dim, display: "block", marginBottom: 6 };

const FORMAS = [
  { id: "pix", label: "Pix" },
  { id: "cartao_credito", label: "Cartão de Crédito" },
  { id: "cartao_debito", label: "Cartão de Débito" },
  { id: "dinheiro", label: "Dinheiro" },
  { id: "transferencia", label: "Transferência" },
  { id: "boleto", label: "Boleto" },
];

export default function BaixaRecebimentoModal({ parcela, taxaParcelamento, onConfirm, onClose }) {
  const [forma, setForma] = useState(parcela?.forma_pagamento && parcela.forma_pagamento !== "installments" ? parcela.forma_pagamento : "pix");
  const [parcelado, setParcelado] = useState((parcela?.num_parcelas_total || 1) > 1);
  const [numParcelas, setNumParcelas] = useState(parcela?.num_parcelas_total || 1);
  const [absorverJuros, setAbsorverJuros] = useState(true);
  const [dataRecebimento, setDataRecebimento] = useState(format(new Date(), "yyyy-MM-dd"));

  if (!parcela) return null;

  const taxaPct = forma === "cartao_credito" && parcelado && absorverJuros ? (taxaParcelamento || 2.44) : 0;
  const taxaValor = (parcela.valor_bruto || 0) * taxaPct / 100;
  const valorLiquido = (parcela.valor_bruto || 0) - taxaValor;

  const confirmar = () => {
    onConfirm({
      forma_pagamento: forma,
      taxa: taxaValor,
      valor_liquido: valorLiquido,
      data_recebimento: dataRecebimento,
    });
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={onClose}>
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, maxWidth: 460, width: "100%", padding: 24, maxHeight: "90vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
        <p style={{ fontSize: 15, fontWeight: 600, color: T.text, margin: "0 0 4px" }}>Baixa de Recebimento</p>
        <p style={{ fontSize: 12, color: T.dim, margin: "0 0 20px" }}>{parcela.patient_name} — {parcela.protocolo_nome || "Parcela"}</p>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={labelStyle}>Forma de Pagamento</label>
            <select value={forma} onChange={e => setForma(e.target.value)} style={inputStyle}>
              {FORMAS.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}
            </select>
          </div>

          {forma === "cartao_credito" && (
            <div style={{ background: "#121212", border: `1px solid ${T.border}`, borderRadius: 6, padding: 14 }}>
              <label style={{ ...labelStyle, display: "flex", alignItems: "center", gap: 8, cursor: "pointer", marginBottom: 12, textTransform: "none", letterSpacing: 0, fontSize: 12, color: T.muted }}>
                <input type="checkbox" checked={parcelado} onChange={e => setParcelado(e.target.checked)} style={{ accentColor: T.gold }} />
                Pagamento parcelado no cartão
              </label>
              {parcelado && (
                <>
                  <div style={{ marginBottom: 12 }}>
                    <label style={labelStyle}>Nº de parcelas</label>
                    <input type="number" min="1" max="12" value={numParcelas} onChange={e => setNumParcelas(parseInt(e.target.value) || 1)} style={inputStyle} />
                  </div>
                  <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 12, color: T.muted }}>
                    <input type="checkbox" checked={absorverJuros} onChange={e => setAbsorverJuros(e.target.checked)} style={{ accentColor: T.gold }} />
                    Absorver os juros do cartão ({taxaParcelamento || 2.44}%)
                  </label>
                  <p style={{ fontSize: 11, color: T.dim, marginTop: 6, lineHeight: 1.5 }}>
                    {absorverJuros
                      ? "A clínica absorve a taxa do cartão — o valor líquido recebido será menor que o bruto."
                      : "Os juros são repassados à paciente — a clínica recebe o valor integral."}
                  </p>
                </>
              )}
            </div>
          )}

          <div>
            <label style={labelStyle}>Data do recebimento</label>
            <input type="date" value={dataRecebimento} onChange={e => setDataRecebimento(e.target.value)} style={inputStyle} />
          </div>

          <div style={{ background: "#121212", border: `1px solid ${T.border}`, borderRadius: 6, padding: 14, display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: 12, color: T.muted }}>Valor bruto</span>
              <span style={{ fontSize: 13, color: T.text }}>{formatBRL(parcela.valor_bruto || 0)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: 12, color: T.muted }}>Taxa cartão ({taxaPct.toFixed(2)}%)</span>
              <span style={{ fontSize: 13, color: taxaValor > 0 ? "#EF4444" : T.dim }}>{taxaValor > 0 ? "− " : ""}{formatBRL(taxaValor)}</span>
            </div>
            <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 8, display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: T.text }}>Valor líquido</span>
              <span style={{ fontSize: 15, fontWeight: 600, color: T.gold }}>{formatBRL(valorLiquido)}</span>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button onClick={onClose} style={{ background: "transparent", border: `1px solid ${T.border}`, color: T.muted, borderRadius: 6, padding: "9px 18px", fontFamily: "Inter", fontSize: 12, cursor: "pointer" }}>Cancelar</button>
            <button onClick={confirmar} style={{ background: T.gold, color: "#000", border: "none", borderRadius: 6, padding: "9px 22px", fontFamily: "Inter", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Confirmar Recebimento</button>
          </div>
        </div>
      </div>
    </div>
  );
}