import React, { useState, useEffect } from "react";

const T = { card: "#1A1A1A", border: "#2B2B2B", text: "#FFFFFF", muted: "#B0B0B0", dim: "#666", gold: "#C8A96A" };
const inputStyle = { background: "#121212", border: `1px solid ${T.border}`, borderRadius: 6, color: T.text, fontFamily: "Inter", fontSize: 13, padding: "8px 12px", width: "100%" };
const labelStyle = { fontFamily: "Inter", fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", color: T.dim, display: "block", marginBottom: 6 };

const FORMAS = [
  { id: "pix", label: "Pix" },
  { id: "cartao_credito", label: "Cartão de Crédito" },
  { id: "cartao_debito", label: "Cartão de Débito" },
  { id: "transferencia", label: "Transferência" },
  { id: "boleto", label: "Boleto" },
  { id: "dinheiro", label: "Dinheiro" },
  { id: "outro", label: "Outro" },
];

const STATUS = [
  { id: "pendente", label: "Pendente" },
  { id: "pago", label: "Pago" },
  { id: "vencido", label: "Vencido" },
  { id: "cancelado", label: "Cancelado" },
];

export default function EditarDespesaModal({ lancamento, onConfirm, onClose }) {
  const [form, setForm] = useState(null);

  useEffect(() => {
    if (lancamento) setForm({ ...lancamento });
  }, [lancamento]);

  if (!form) return null;

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={onClose}>
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, maxWidth: 480, width: "100%", padding: 24, maxHeight: "90vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
        <p style={{ fontSize: 15, fontWeight: 600, color: T.text, margin: "0 0 20px" }}>Editar Conta a Pagar</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={labelStyle}>Descrição</label>
            <input value={form.descricao || ""} onChange={e => setForm(p => ({ ...p, descricao: e.target.value }))} style={inputStyle} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={labelStyle}>Valor (R$)</label>
              <input type="number" step="0.01" value={form.valor ?? 0} onChange={e => setForm(p => ({ ...p, valor: parseFloat(e.target.value) || 0 }))} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Vencimento</label>
              <input type="date" value={form.data_vencimento || ""} onChange={e => setForm(p => ({ ...p, data_vencimento: e.target.value }))} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Forma de Pagamento</label>
              <select value={form.forma_pagamento || "pix"} onChange={e => setForm(p => ({ ...p, forma_pagamento: e.target.value }))} style={inputStyle}>
                {FORMAS.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Status</label>
              <select value={form.status || "pendente"} onChange={e => setForm(p => ({ ...p, status: e.target.value }))} style={inputStyle}>
                {STATUS.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label style={labelStyle}>Observações</label>
            <textarea value={form.observacoes || ""} onChange={e => setForm(p => ({ ...p, observacoes: e.target.value }))} style={{ ...inputStyle, minHeight: 60, resize: "vertical" }} />
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 4 }}>
            <button onClick={onClose} style={{ background: "transparent", border: `1px solid ${T.border}`, color: T.muted, borderRadius: 6, padding: "9px 18px", fontFamily: "Inter", fontSize: 12, cursor: "pointer" }}>Cancelar</button>
            <button onClick={() => onConfirm(form)} style={{ background: T.gold, color: "#000", border: "none", borderRadius: 6, padding: "9px 22px", fontFamily: "Inter", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Salvar</button>
          </div>
        </div>
      </div>
    </div>
  );
}