import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { T, S } from "@/lib/designTokens";
import { GitBranch, Plus, Clock, ChevronDown, ChevronRight, Save } from "lucide-react";

const TIPO_LABELS = {
  contrato_mestre: "Contrato Mestre",
  termo_lgpd: "LGPD",
  uso_imagem: "Uso de Imagem",
  consentimento: "Consentimento",
  anexo_financeiro: "Anexo Financeiro",
  politica_retorno: "Política de Retorno",
  politica_cancelamento: "Política de Cancelamento",
  outro: "Outro",
};

export default function VersionamentoDocumentos({ currentUser }) {
  const qc = useQueryClient();
  const [expandedId, setExpandedId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showNovaVersao, setShowNovaVersao] = useState(null);
  const [form, setForm] = useState({ nome: "", tipo: "contrato_mestre", conteudo: "", versao_atual: "1.0" });
  const [novaVersaoForm, setNovaVersaoForm] = useState({ versao: "", motivo_alteracao: "", conteudo: "" });

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ["documento-templates"],
    queryFn: () => base44.entities.DocumentoTemplate.list("-created_date"),
  });

  const createMutation = useMutation({
    mutationFn: data => base44.entities.DocumentoTemplate.create(data),
    onSuccess: () => { qc.invalidateQueries(["documento-templates"]); setShowForm(false); setForm({ nome: "", tipo: "contrato_mestre", conteudo: "", versao_atual: "1.0" }); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.DocumentoTemplate.update(id, data),
    onSuccess: () => { qc.invalidateQueries(["documento-templates"]); setShowNovaVersao(null); },
  });

  function handleCriarTemplate() {
    createMutation.mutate({
      ...form,
      criado_por: currentUser?.full_name,
      publicado_em: new Date().toISOString(),
      versoes: [{
        versao: form.versao_atual,
        conteudo: form.conteudo,
        criado_por: currentUser?.full_name,
        publicado_em: new Date().toISOString(),
        motivo_alteracao: "Versão inicial",
      }],
    });
  }

  function handleNovaVersao(template) {
    const versoes = template.versoes || [];
    const novaEntry = {
      versao: novaVersaoForm.versao,
      conteudo: novaVersaoForm.conteudo || template.conteudo,
      criado_por: currentUser?.full_name,
      publicado_em: new Date().toISOString(),
      motivo_alteracao: novaVersaoForm.motivo_alteracao,
    };
    updateMutation.mutate({
      id: template.id,
      data: {
        versao_atual: novaVersaoForm.versao,
        conteudo: novaVersaoForm.conteudo || template.conteudo,
        versoes: [...versoes, novaEntry],
      },
    });
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <p style={{ ...S.pageTitle, fontSize: 18 }}>Versionamento de Documentos</p>
          <p style={S.pageSubtitle}>Gerencie templates e histórico completo de versões</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} style={{ ...S.btnPrimary, display: "flex", alignItems: "center", gap: 6 }}>
          <Plus style={{ width: 14, height: 14 }} /> Novo Template
        </button>
      </div>

      {/* Formulário novo template */}
      {showForm && (
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20, marginBottom: 20 }}>
          <p style={{ fontFamily: T.font, fontSize: 14, fontWeight: 600, color: T.textPrimary, marginBottom: 14 }}>
            Novo Template de Documento
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div>
              <p style={S.label}>Nome do Documento *</p>
              <input value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} placeholder="Ex: Contrato Mestre" style={{ ...S.input, marginTop: 4 }} />
            </div>
            <div>
              <p style={S.label}>Tipo *</p>
              <select value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value })} style={{ ...S.input, marginTop: 4 }}>
                {Object.entries(TIPO_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <p style={S.label}>Versão Inicial</p>
              <input value={form.versao_atual} onChange={e => setForm({ ...form, versao_atual: e.target.value })} placeholder="1.0" style={{ ...S.input, marginTop: 4 }} />
            </div>
          </div>
          <div style={{ marginBottom: 14 }}>
            <p style={S.label}>Conteúdo do Documento</p>
            <textarea
              value={form.conteudo}
              onChange={e => setForm({ ...form, conteudo: e.target.value })}
              placeholder="Escreva o conteúdo completo do documento aqui..."
              rows={8}
              style={{ ...S.input, marginTop: 4, resize: "vertical", lineHeight: 1.6 }}
            />
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => setShowForm(false)} style={S.btnGhost}>Cancelar</button>
            <button
              onClick={handleCriarTemplate}
              disabled={!form.nome || createMutation.isPending}
              style={{ ...S.btnPrimary, display: "flex", alignItems: "center", gap: 6 }}
            >
              <Save style={{ width: 13, height: 13 }} />
              {createMutation.isPending ? "Salvando..." : "Criar Template"}
            </button>
          </div>
        </div>
      )}

      {/* Lista de templates */}
      {isLoading ? (
        <p style={{ fontFamily: T.font, fontSize: 13, color: T.textMuted }}>Carregando...</p>
      ) : templates.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px 20px", background: T.card, border: `1px solid ${T.border}`, borderRadius: 10 }}>
          <GitBranch style={{ width: 32, height: 32, color: T.textMuted, margin: "0 auto 12px" }} />
          <p style={{ fontFamily: T.font, fontSize: 14, color: T.textMuted }}>Nenhum template criado ainda</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {templates.map(t => {
            const isExpanded = expandedId === t.id;
            const versoes = t.versoes || [];
            return (
              <div key={t.id} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, overflow: "hidden" }}>
                <button
                  onClick={() => setExpandedId(isExpanded ? null : t.id)}
                  style={{
                    width: "100%", display: "flex", alignItems: "center", gap: 12,
                    padding: "14px 16px", background: "none", border: "none", cursor: "pointer",
                  }}
                >
                  {isExpanded ? <ChevronDown style={{ width: 14, height: 14, color: T.textMuted }} /> : <ChevronRight style={{ width: 14, height: 14, color: T.textMuted }} />}
                  <GitBranch style={{ width: 14, height: 14, color: T.gold }} />
                  <span style={{ fontFamily: T.font, fontSize: 13, fontWeight: 600, color: T.textPrimary, flex: 1, textAlign: "left" }}>
                    {t.nome}
                  </span>
                  <span style={{ fontFamily: T.font, fontSize: 11, color: T.textMuted }}>
                    {TIPO_LABELS[t.tipo]}
                  </span>
                  <span style={{
                    fontFamily: T.font, fontSize: 12, fontWeight: 600,
                    color: T.gold, backgroundColor: "rgba(200,169,106,0.1)",
                    padding: "2px 8px", borderRadius: 20, marginLeft: 8,
                  }}>
                    v{t.versao_atual || "1.0"}
                  </span>
                  <span style={{
                    fontFamily: T.font, fontSize: 11,
                    color: t.status === "ativo" ? "#22c55e" : T.textMuted,
                    backgroundColor: t.status === "ativo" ? "rgba(34,197,94,0.1)" : T.bgSecondary,
                    padding: "2px 8px", borderRadius: 20,
                  }}>
                    {t.status === "ativo" ? "Ativo" : "Inativo"}
                  </span>
                </button>

                {isExpanded && (
                  <div style={{ borderTop: `1px solid ${T.border}`, padding: 16 }}>
                    {/* Histórico de versões */}
                    <div style={{ marginBottom: 16 }}>
                      <p style={{ ...S.label, marginBottom: 10 }}>Histórico de Versões</p>
                      {versoes.length === 0 ? (
                        <p style={{ fontFamily: T.font, fontSize: 12, color: T.textMuted }}>Nenhuma versão registrada</p>
                      ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                          {[...versoes].reverse().map((v, idx) => (
                            <div key={idx} style={{
                              background: T.bgSecondary, border: `1px solid ${T.border}`,
                              borderRadius: 6, padding: 10,
                            }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                                <span style={{
                                  fontFamily: T.font, fontSize: 12, fontWeight: 700,
                                  color: idx === 0 ? T.gold : T.textMuted,
                                  backgroundColor: idx === 0 ? "rgba(200,169,106,0.1)" : T.card,
                                  padding: "1px 8px", borderRadius: 20,
                                }}>
                                  v{v.versao}
                                </span>
                                {idx === 0 && (
                                  <span style={{ fontFamily: T.font, fontSize: 10, color: "#22c55e" }}>Versão atual</span>
                                )}
                                <span style={{ fontFamily: T.font, fontSize: 11, color: T.textMuted, marginLeft: "auto" }}>
                                  <Clock style={{ width: 11, height: 11, display: "inline", marginRight: 3 }} />
                                  {v.publicado_em ? new Date(v.publicado_em).toLocaleDateString("pt-BR") : "—"}
                                </span>
                              </div>
                              {v.motivo_alteracao && (
                                <p style={{ fontFamily: T.font, fontSize: 12, color: T.textSecondary }}>
                                  <strong>Motivo:</strong> {v.motivo_alteracao}
                                </p>
                              )}
                              {v.criado_por && (
                                <p style={{ fontFamily: T.font, fontSize: 11, color: T.textMuted }}>
                                  Por: {v.criado_por}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Criar nova versão */}
                    {showNovaVersao === t.id ? (
                      <div style={{ background: T.bgSecondary, border: `1px solid ${T.border}`, borderRadius: 8, padding: 14 }}>
                        <p style={{ fontFamily: T.font, fontSize: 13, fontWeight: 600, color: T.textPrimary, marginBottom: 12 }}>
                          Nova Versão
                        </p>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 10, marginBottom: 10 }}>
                          <div>
                            <p style={S.label}>Número da Versão *</p>
                            <input
                              value={novaVersaoForm.versao}
                              onChange={e => setNovaVersaoForm({ ...novaVersaoForm, versao: e.target.value })}
                              placeholder="Ex: 1.1 ou 2.0"
                              style={{ ...S.input, marginTop: 4 }}
                            />
                          </div>
                          <div>
                            <p style={S.label}>Motivo da Alteração *</p>
                            <input
                              value={novaVersaoForm.motivo_alteracao}
                              onChange={e => setNovaVersaoForm({ ...novaVersaoForm, motivo_alteracao: e.target.value })}
                              placeholder="Descreva o que mudou..."
                              style={{ ...S.input, marginTop: 4 }}
                            />
                          </div>
                        </div>
                        <div style={{ marginBottom: 12 }}>
                          <p style={S.label}>Conteúdo Atualizado (opcional)</p>
                          <textarea
                            value={novaVersaoForm.conteudo}
                            onChange={e => setNovaVersaoForm({ ...novaVersaoForm, conteudo: e.target.value })}
                            placeholder={t.conteudo || "Mantenha o conteúdo atual ou atualize..."}
                            rows={6}
                            style={{ ...S.input, marginTop: 4, resize: "vertical" }}
                          />
                        </div>
                        <div style={{ display: "flex", gap: 8 }}>
                          <button onClick={() => setShowNovaVersao(null)} style={S.btnGhost}>Cancelar</button>
                          <button
                            onClick={() => handleNovaVersao(t)}
                            disabled={!novaVersaoForm.versao || !novaVersaoForm.motivo_alteracao}
                            style={{ ...S.btnPrimary, display: "flex", alignItems: "center", gap: 6 }}
                          >
                            <Save style={{ width: 13, height: 13 }} /> Publicar Nova Versão
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => { setShowNovaVersao(t.id); setNovaVersaoForm({ versao: "", motivo_alteracao: "", conteudo: "" }); }}
                        style={{ ...S.btnGhost, display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}
                      >
                        <Plus style={{ width: 13, height: 13 }} /> Nova Versão
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}