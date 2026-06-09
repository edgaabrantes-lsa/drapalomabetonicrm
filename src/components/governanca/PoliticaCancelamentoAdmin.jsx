import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { T, S } from "@/lib/designTokens";
import { Plus, Edit2, Save, AlertTriangle, DollarSign, RotateCcw } from "lucide-react";

export default function PoliticaCancelamentoAdmin() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    nome: "", regras_cancelamento: "", regras_remarcacao: "",
    regras_reembolso: "", regras_creditos: "",
    prazo_cancelamento_horas: "", percentual_reembolso: "",
  });

  const { data: politicas = [] } = useQuery({
    queryKey: ["politicas-cancelamento"],
    queryFn: () => base44.entities.PoliticaCancelamento.list(),
  });

  const createMutation = useMutation({
    mutationFn: d => base44.entities.PoliticaCancelamento.create(d),
    onSuccess: () => { qc.invalidateQueries(["politicas-cancelamento"]); resetForm(); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.PoliticaCancelamento.update(id, data),
    onSuccess: () => { qc.invalidateQueries(["politicas-cancelamento"]); resetForm(); },
  });

  function resetForm() {
    setShowForm(false); setEditing(null);
    setForm({ nome: "", regras_cancelamento: "", regras_remarcacao: "", regras_reembolso: "", regras_creditos: "", prazo_cancelamento_horas: "", percentual_reembolso: "" });
  }

  function handleEdit(p) { setEditing(p.id); setForm({ ...p }); setShowForm(true); }
  function handleSave() {
    if (editing) updateMutation.mutate({ id: editing, data: form });
    else createMutation.mutate(form);
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <p style={{ ...S.pageTitle, fontSize: 18 }}>Política de Cancelamento e Reembolso</p>
          <p style={S.pageSubtitle}>Configure regras de cancelamento, remarcação e reembolso</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true); }} style={{ ...S.btnPrimary, display: "flex", alignItems: "center", gap: 6 }}>
          <Plus style={{ width: 14, height: 14 }} /> Nova Política
        </button>
      </div>

      {showForm && (
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20, marginBottom: 20 }}>
          <p style={{ fontFamily: T.font, fontSize: 14, fontWeight: 600, color: T.textPrimary, marginBottom: 14 }}>
            {editing ? "Editar Política" : "Nova Política de Cancelamento"}
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 10, marginBottom: 12 }}>
            <div>
              <p style={S.label}>Nome da Política *</p>
              <input value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} placeholder="Ex: Padrão Clínica, Premium..." style={{ ...S.input, marginTop: 4 }} />
            </div>
            <div>
              <p style={S.label}>Prazo Cancelamento (horas)</p>
              <input type="number" value={form.prazo_cancelamento_horas} onChange={e => setForm({ ...form, prazo_cancelamento_horas: Number(e.target.value) })} placeholder="24" style={{ ...S.input, marginTop: 4 }} />
            </div>
            <div>
              <p style={S.label}>% Reembolso</p>
              <input type="number" value={form.percentual_reembolso} onChange={e => setForm({ ...form, percentual_reembolso: Number(e.target.value) })} placeholder="80" style={{ ...S.input, marginTop: 4 }} />
            </div>
          </div>
          {[
            { field: "regras_cancelamento", label: "Regras de Cancelamento" },
            { field: "regras_remarcacao",  label: "Regras de Remarcação" },
            { field: "regras_reembolso",   label: "Regras de Reembolso" },
            { field: "regras_creditos",    label: "Regras de Créditos Futuros" },
          ].map(item => (
            <div key={item.field} style={{ marginBottom: 10 }}>
              <p style={S.label}>{item.label}</p>
              <textarea
                value={form[item.field]}
                onChange={e => setForm({ ...form, [item.field]: e.target.value })}
                rows={2}
                placeholder={`Descreva as ${item.label.toLowerCase()}...`}
                style={{ ...S.input, marginTop: 4, resize: "vertical" }}
              />
            </div>
          ))}
          <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
            <button onClick={resetForm} style={S.btnGhost}>Cancelar</button>
            <button onClick={handleSave} disabled={!form.nome} style={{ ...S.btnPrimary, display: "flex", alignItems: "center", gap: 6 }}>
              <Save style={{ width: 13, height: 13 }} /> Salvar
            </button>
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 12 }}>
        {politicas.map(p => (
          <div key={p.id} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <p style={{ fontFamily: T.font, fontSize: 14, fontWeight: 600, color: T.textPrimary }}>{p.nome}</p>
              <button onClick={() => handleEdit(p)} style={{ background: "none", border: "none", cursor: "pointer", color: T.textMuted }}>
                <Edit2 style={{ width: 14, height: 14 }} />
              </button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {p.prazo_cancelamento_horas && (
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <AlertTriangle style={{ width: 12, height: 12, color: "#f59e0b" }} />
                  <span style={{ fontFamily: T.font, fontSize: 12, color: T.textSecondary }}>Prazo: {p.prazo_cancelamento_horas}h antes</span>
                </div>
              )}
              {p.percentual_reembolso && (
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <DollarSign style={{ width: 12, height: 12, color: "#22c55e" }} />
                  <span style={{ fontFamily: T.font, fontSize: 12, color: T.textSecondary }}>Reembolso: {p.percentual_reembolso}%</span>
                </div>
              )}
              {p.regras_cancelamento && (
                <p style={{ fontFamily: T.font, fontSize: 11, color: T.textMuted, marginTop: 4, lineHeight: 1.5 }}>
                  {p.regras_cancelamento.substring(0, 120)}{p.regras_cancelamento.length > 120 ? "..." : ""}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}