import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { T, S } from "@/lib/designTokens";
import { Plus, Edit2, Save, X, Clock, RefreshCw } from "lucide-react";

export default function PoliticaRetornoAdmin() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    procedimento_nome: "", prazo_retorno_dias: "", prazo_revisao_dias: "",
    quantidade_retornos_incluidos: 1, quantidade_revisoes_incluidas: 1,
    periodo_avaliacao_dias: "", criterios_retoque: "", observacoes: "",
  });

  const { data: politicas = [], isLoading } = useQuery({
    queryKey: ["politicas-retorno"],
    queryFn: () => base44.entities.PoliticaRetorno.list(),
  });

  const createMutation = useMutation({
    mutationFn: d => base44.entities.PoliticaRetorno.create(d),
    onSuccess: () => { qc.invalidateQueries(["politicas-retorno"]); resetForm(); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.PoliticaRetorno.update(id, data),
    onSuccess: () => { qc.invalidateQueries(["politicas-retorno"]); resetForm(); },
  });

  function resetForm() {
    setShowForm(false); setEditing(null);
    setForm({ procedimento_nome: "", prazo_retorno_dias: "", prazo_revisao_dias: "", quantidade_retornos_incluidos: 1, quantidade_revisoes_incluidas: 1, periodo_avaliacao_dias: "", criterios_retoque: "", observacoes: "" });
  }

  function handleEdit(p) {
    setEditing(p.id);
    setForm({ ...p });
    setShowForm(true);
  }

  function handleSave() {
    if (editing) updateMutation.mutate({ id: editing, data: form });
    else createMutation.mutate(form);
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <p style={{ ...S.pageTitle, fontSize: 18 }}>Política de Retorno e Ajustes</p>
          <p style={S.pageSubtitle}>Configure prazos e critérios por procedimento</p>
        </div>
        <button onClick={() => { setEditing(null); setForm({ procedimento_nome: "", prazo_retorno_dias: "", prazo_revisao_dias: "", quantidade_retornos_incluidos: 1, quantidade_revisoes_incluidas: 1, periodo_avaliacao_dias: "", criterios_retoque: "", observacoes: "" }); setShowForm(true); }}
          style={{ ...S.btnPrimary, display: "flex", alignItems: "center", gap: 6 }}>
          <Plus style={{ width: 14, height: 14 }} /> Nova Política
        </button>
      </div>

      {showForm && (
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20, marginBottom: 20 }}>
          <p style={{ fontFamily: T.font, fontSize: 14, fontWeight: 600, color: T.textPrimary, marginBottom: 14 }}>
            {editing ? "Editar Política" : "Nova Política de Retorno"}
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr", gap: 10, marginBottom: 12 }}>
            <div>
              <p style={S.label}>Procedimento *</p>
              <input value={form.procedimento_nome} onChange={e => setForm({ ...form, procedimento_nome: e.target.value })} placeholder="Ex: Botox, Full Face..." style={{ ...S.input, marginTop: 4 }} />
            </div>
            <div>
              <p style={S.label}>Prazo Retorno (dias)</p>
              <input type="number" value={form.prazo_retorno_dias} onChange={e => setForm({ ...form, prazo_retorno_dias: Number(e.target.value) })} placeholder="15" style={{ ...S.input, marginTop: 4 }} />
            </div>
            <div>
              <p style={S.label}>Prazo Revisão (dias)</p>
              <input type="number" value={form.prazo_revisao_dias} onChange={e => setForm({ ...form, prazo_revisao_dias: Number(e.target.value) })} placeholder="30" style={{ ...S.input, marginTop: 4 }} />
            </div>
            <div>
              <p style={S.label}>Qtd Retornos</p>
              <input type="number" value={form.quantidade_retornos_incluidos} onChange={e => setForm({ ...form, quantidade_retornos_incluidos: Number(e.target.value) })} style={{ ...S.input, marginTop: 4 }} />
            </div>
            <div>
              <p style={S.label}>Qtd Revisões</p>
              <input type="number" value={form.quantidade_revisoes_incluidas} onChange={e => setForm({ ...form, quantidade_revisoes_incluidas: Number(e.target.value) })} style={{ ...S.input, marginTop: 4 }} />
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 10, marginBottom: 12 }}>
            <div>
              <p style={S.label}>Período Avaliação (dias)</p>
              <input type="number" value={form.periodo_avaliacao_dias} onChange={e => setForm({ ...form, periodo_avaliacao_dias: Number(e.target.value) })} style={{ ...S.input, marginTop: 4 }} />
            </div>
            <div>
              <p style={S.label}>Critérios para Retoques</p>
              <input value={form.criterios_retoque} onChange={e => setForm({ ...form, criterios_retoque: e.target.value })} placeholder="Ex: Assimetria leve, desfase rápido..." style={{ ...S.input, marginTop: 4 }} />
            </div>
          </div>
          <div style={{ marginBottom: 14 }}>
            <p style={S.label}>Observações</p>
            <textarea value={form.observacoes} onChange={e => setForm({ ...form, observacoes: e.target.value })} rows={2} style={{ ...S.input, marginTop: 4, resize: "vertical" }} />
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={resetForm} style={S.btnGhost}>Cancelar</button>
            <button onClick={handleSave} disabled={!form.procedimento_nome} style={{ ...S.btnPrimary, display: "flex", alignItems: "center", gap: 6 }}>
              <Save style={{ width: 13, height: 13 }} /> Salvar
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <p style={{ fontFamily: T.font, fontSize: 13, color: T.textMuted }}>Carregando...</p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
          {politicas.map(p => (
            <div key={p.id} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <p style={{ fontFamily: T.font, fontSize: 14, fontWeight: 600, color: T.textPrimary }}>{p.procedimento_nome}</p>
                <button onClick={() => handleEdit(p)} style={{ background: "none", border: "none", cursor: "pointer", color: T.textMuted }}>
                  <Edit2 style={{ width: 14, height: 14 }} />
                </button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {p.prazo_retorno_dias && (
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Clock style={{ width: 12, height: 12, color: T.gold }} />
                    <span style={{ fontFamily: T.font, fontSize: 12, color: T.textSecondary }}>
                      Retorno: <strong>{p.prazo_retorno_dias} dias</strong> ({p.quantidade_retornos_incluidos}x incluído)
                    </span>
                  </div>
                )}
                {p.prazo_revisao_dias && (
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <RefreshCw style={{ width: 12, height: 12, color: "#60a5fa" }} />
                    <span style={{ fontFamily: T.font, fontSize: 12, color: T.textSecondary }}>
                      Revisão: <strong>{p.prazo_revisao_dias} dias</strong> ({p.quantidade_revisoes_incluidas}x incluída)
                    </span>
                  </div>
                )}
                {p.criterios_retoque && (
                  <p style={{ fontFamily: T.font, fontSize: 11, color: T.textMuted, marginTop: 4 }}>
                    Critérios: {p.criterios_retoque}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}