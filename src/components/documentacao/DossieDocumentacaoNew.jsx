import React, { useState, useMemo, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { T, S } from "@/lib/designTokens";
import {
  CATEGORIAS_PROCEDIMENTO,
  getDocsParaProcedimento,
  STATUS_DOC,
  calcularStatusGeral,
} from "./documentacaoConfig";
import DocResumoCards from "./DocResumoCards";
import DocCard from "./DocCard";
import DocPendencias from "./DocPendencias";
import DocRelatorioConformidade from "./DocRelatorioConformidade";
import KitDocumentalModal from "./KitDocumentalModal";
import AssinaturaEletronicaModal from "@/components/governanca/AssinaturaEletronicaModal";
import { Zap, Plus, RefreshCw, FileText, ClipboardList } from "lucide-react";

const VIEWS = [
  { id: "checklist", label: "Checklist" },
  { id: "historico", label: "Histórico" },
  { id: "conformidade", label: "Conformidade" },
];

export default function DossieDocumentacaoNew({ patient, currentUser }) {
  const queryClient = useQueryClient();
  const [categoria, setCategoria] = useState("");
  const [viewAtual, setViewAtual] = useState("checklist");
  const [showKit, setShowKit] = useState(false);
  const [assinaturaDoc, setAssinaturaDoc] = useState(null);
  const [showNovoDoc, setShowNovoDoc] = useState(false);
  const [novoDoc, setNovoDoc] = useState({ nome: "", tipo: "contrato_mestre" });
  const [salvandoDoc, setSalvandoDoc] = useState(false);

  // Auto-preencher nome do documento quando o tipo muda
  const gerarNomeDoc = (tipo) => {
    const proc = categoria ? (CATEGORIAS_PROCEDIMENTO[categoria]?.label || categoria) : "";
    const nomeMap = {
      contrato_mestre: `Contrato Mestre — ${patient.full_name}${proc ? " — " + proc : ""}`,
      anexo_financeiro: `Anexo Financeiro — ${patient.full_name}${proc ? " — " + proc : ""}`,
      termo_lgpd: `Termo LGPD — ${patient.full_name}`,
      uso_imagem: `Termo de Uso de Imagem — ${patient.full_name}`,
      consentimento: `Termo de Consentimento — ${patient.full_name}${proc ? " — " + proc : ""}`,
      documento_identificacao: `Documento de Identificação — ${patient.full_name}`,
      comprovante_pagamento: `Comprovante de Pagamento — ${patient.full_name}`,
      prontuario_facial: `Prontuário Facial — ${patient.full_name}`,
      outro: `Documento — ${patient.full_name}`,
    };
    return nomeMap[tipo] || `Documento — ${patient.full_name}`;
  };

  const { data: documentos = [] } = useQuery({
    queryKey: ["dossie-docs", patient.id],
    queryFn: () => base44.entities.DossieDocumento.filter({ patient_id: patient.id }, "-data_geracao", 200),
  });

  const { data: financeiros = [] } = useQuery({
    queryKey: ["dossie-financeiro", patient.id],
    queryFn: () => base44.entities.DossieFinanceiro.filter({ patient_id: patient.id }, "-created_date", 20),
  });

  // Buscar tratamentos do paciente para popular seletor de procedimentos
  const { data: tratamentos = [] } = useQuery({
    queryKey: ["patient-treatments", patient.id],
    queryFn: () => base44.entities.PatientTreatment.filter({ patient_id: patient.id }, "-created_date", 50),
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["dossie-docs", patient.id] });
    queryClient.invalidateQueries({ queryKey: ["assinaturas", patient.id] });
  };

  // Checklist: mescla docs esperados da categoria com docs existentes do banco
  const checklist = useMemo(() => {
    if (!categoria) {
      // Sem categoria: exibir apenas o que já existe no banco
      return documentos.map(d => ({
        ...d,
        status: d.status || "pendente",
        obrigatorio: d.obrigatorio ?? false,
      }));
    }

    const esperados = getDocsParaProcedimento(
      categoria,
      [] // tecnicas serão adicionadas depois via kit
    );

    return esperados.map(esp => {
      const existente = documentos.find(d =>
        d.tipo === esp.tipo &&
        (!d.procedimento_nome || d.procedimento_nome === categoria || true)
      );
      if (existente) {
        return { ...existente, nome: esp.nome, obrigatorio: esp.obrigatorio };
      }
      return { ...esp, status: "pendente", id: null };
    });
  }, [categoria, documentos]);

  // Docs do histórico (todos do banco)
  const historicoCompleto = useMemo(() =>
    [...documentos].sort((a, b) =>
      new Date(b.data_geracao || b.created_date || 0) -
      new Date(a.data_geracao || a.created_date || 0)
    ),
  [documentos]);

  const handleSalvarNovoDoc = async () => {
    const nomeDoc = novoDoc.nome || gerarNomeDoc(novoDoc.tipo);
    if (!nomeDoc) return;
    setSalvandoDoc(true);
    try {
      await base44.entities.DossieDocumento.create({
        patient_id: patient.id,
        patient_name: patient.full_name,
        nome: nomeDoc,
        tipo: novoDoc.tipo,
        status: "gerado",
        obrigatorio: false,
        versao: "1.0",
        data_geracao: new Date().toISOString(),
        criado_por: currentUser?.full_name || "Sistema",
      });
      refresh();
      setNovoDoc({ nome: "", tipo: "outro" });
      setShowNovoDoc(false);
    } finally {
      setSalvandoDoc(false);
    }
  };

  // Verificar se template de contrato mestre existe
  const { data: templates = [] } = useQuery({
    queryKey: ["doc-templates-contrato"],
    queryFn: () => base44.entities.DocumentoTemplate.filter({ tipo: "contrato_mestre", status: "ativo" }),
  });
  const temContrato = templates.length > 0;

  return (
    <div style={{ fontFamily: T.font }}>
      {/* Aviso template faltando */}
      {!temContrato && (
        <div style={{
          marginBottom: 16, padding: "10px 14px", borderRadius: 8,
          background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.25)",
          display: "flex", alignItems: "center", gap: 10,
        }}>
          <span style={{ fontSize: 13, color: "#F59E0B", fontFamily: T.font }}>
            ⚠ Nenhum template de Contrato Mestre ativo encontrado.
            Vá em <strong>Governança → Templates</strong> para criar ou ativar o Contrato Mestre Base.
          </span>
        </div>
      )}
      {/* Modais */}
      {showKit && (
        <KitDocumentalModal
          patient={patient}
          financeiros={financeiros}
          onClose={() => setShowKit(false)}
          onKitGerado={() => { refresh(); setShowKit(false); }}
        />
      )}
      {assinaturaDoc && (
        <AssinaturaEletronicaModal
          documento={assinaturaDoc}
          patient={patient}
          currentUser={currentUser}
          onClose={() => setAssinaturaDoc(null)}
          onSigned={() => { refresh(); setAssinaturaDoc(null); }}
        />
      )}

      {/* Cabeçalho */}
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: T.textPrimary, margin: 0 }}>
          Documentação da Paciente
        </h2>
        <p style={{ fontFamily: T.font, fontSize: 13, color: T.textMuted, margin: "4px 0 0" }}>
          Gere, assine, anexe e acompanhe todos os documentos obrigatórios por procedimento.
        </p>
      </div>

      {/* Bloco 1 — Resumo */}
      <DocResumoCards checklist={checklist} />

      {/* Bloco 2 — Selecionar Procedimento + Ações */}
      <div style={{
        background: T.card, border: `1px solid ${T.border}`, borderRadius: 8,
        padding: "14px 16px", marginBottom: 16,
        display: "flex", flexWrap: "wrap", gap: 12, alignItems: "flex-end",
      }}>
        <div style={{ flex: "1 1 200px", minWidth: 0 }}>
          <p style={{ ...S.label, marginBottom: 6 }}>Procedimento / Protocolo</p>
          <select
            value={categoria}
            onChange={e => setCategoria(e.target.value)}
            style={{ ...S.input, width: "100%" }}
          >
            <option value="">— Selecione o procedimento —</option>
            {tratamentos.length > 0 && (
              <optgroup label="Procedimentos da Paciente">
                {[...new Map(tratamentos.map(t => [t.protocolo_nome, t])).values()].map((t, i) => {
                  // Mapear para categoria
                  const catKey = t.categoria || "outro";
                  return (
                    <option key={`pt-${i}`} value={catKey}>
                      ★ {t.protocolo_nome}
                    </option>
                  );
                })}
              </optgroup>
            )}
            <optgroup label="Todos os Procedimentos">
              {Object.entries(CATEGORIAS_PROCEDIMENTO).map(([k, v]) => (
                <option key={k} value={k}>{v.icon} {v.label}</option>
              ))}
            </optgroup>
          </select>
        </div>
        <button
          onClick={() => setShowKit(true)}
          style={{ ...S.btnPrimary, display: "flex", alignItems: "center", gap: 6, height: 38 }}
        >
          <Zap style={{ width: 14, height: 14 }} /> Gerar Kit Documental
        </button>
        <button
          onClick={() => setShowNovoDoc(!showNovoDoc)}
          style={{ ...S.btnGhost, display: "flex", alignItems: "center", gap: 6, height: 38 }}
        >
          <Plus style={{ width: 14, height: 14 }} /> Adicionar Documento
        </button>
        <button
          onClick={refresh}
          style={{ ...S.btnGhost, height: 38, display: "flex", alignItems: "center", gap: 6 }}
        >
          <RefreshCw style={{ width: 13, height: 13 }} /> Atualizar
        </button>
      </div>

      {/* Form novo documento */}
      {showNovoDoc && (
        <div style={{
          background: T.card, border: `1px solid ${T.border}`, borderRadius: 8,
          padding: 16, marginBottom: 16, display: "flex", flexDirection: "column", gap: 12,
        }}>
          <p style={{ fontFamily: T.font, fontSize: 13, fontWeight: 600, color: T.textPrimary, margin: 0 }}>
            Novo Documento Avulso
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <p style={{ ...S.label, marginBottom: 4 }}>Tipo</p>
              <select
                value={novoDoc.tipo}
                onChange={e => {
                  const newTipo = e.target.value;
                  setNovoDoc(p => ({ ...p, tipo: newTipo, nome: gerarNomeDoc(newTipo) }));
                }}
                style={{ ...S.input, width: "100%" }}
              >
                <option value="contrato_mestre">Contrato Mestre</option>
                <option value="anexo_financeiro">Anexo Financeiro</option>
                <option value="termo_lgpd">Termo LGPD</option>
                <option value="uso_imagem">Uso de Imagem</option>
                <option value="consentimento">Consentimento</option>
                <option value="documento_identificacao">Doc. Identificação</option>
                <option value="comprovante_pagamento">Comprovante de Pagamento</option>
                <option value="prontuario_facial">Prontuário Facial</option>
                <option value="outro">Outro</option>
              </select>
            </div>
            <div>
              <p style={{ ...S.label, marginBottom: 4 }}>Nome do Documento *</p>
              <input
                value={novoDoc.nome || gerarNomeDoc(novoDoc.tipo)}
                onChange={e => setNovoDoc(p => ({ ...p, nome: e.target.value }))}
                placeholder="Nome do documento"
                style={{ ...S.input, width: "100%" }}
              />
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button onClick={() => setShowNovoDoc(false)} style={{ ...S.btnGhost, fontSize: 12 }}>
              Cancelar
            </button>
            <button
              onClick={handleSalvarNovoDoc}
              disabled={salvandoDoc}
              style={{ ...S.btnPrimary, fontSize: 12, opacity: !salvandoDoc ? 1 : 0.5 }}
            >
              {salvandoDoc ? "Salvando..." : "Salvar Documento"}
            </button>
          </div>
        </div>
      )}

      {/* Abas internas */}
      <div style={{
        display: "flex", gap: 0, borderBottom: `1px solid ${T.border}`, marginBottom: 16,
      }}>
        {VIEWS.map(v => (
          <button
            key={v.id}
            onClick={() => setViewAtual(v.id)}
            style={{
              fontFamily: T.font, fontSize: 13, fontWeight: viewAtual === v.id ? 600 : 400,
              color: viewAtual === v.id ? T.textPrimary : T.textMuted,
              padding: "8px 16px", border: "none", background: "transparent", cursor: "pointer",
              borderBottom: viewAtual === v.id ? `2px solid ${T.gold}` : "2px solid transparent",
              transition: "all 0.15s",
            }}
          >
            {v.label}
          </button>
        ))}
      </div>

      {/* VIEW: CHECKLIST */}
      {viewAtual === "checklist" && (
        <div>
          <DocPendencias checklist={checklist} />

          {checklist.length === 0 && (
            <div style={{ textAlign: "center", padding: "48px 0", color: T.textMuted }}>
              <ClipboardList style={{ width: 40, height: 40, color: T.textMuted, marginBottom: 12 }} />
              <p style={{ fontFamily: T.font, fontSize: 14, margin: 0 }}>
                {categoria
                  ? "Nenhum documento encontrado. Clique em \"Gerar Kit Documental\"."
                  : "Selecione um procedimento para ver o checklist documental."}
              </p>
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {checklist.map((doc, i) => (
              <DocCard
                key={doc.id || `pending-${i}`}
                doc={doc}
                patient={patient}
                currentUser={currentUser}
                onAssinar={d => setAssinaturaDoc({ ...d, versao: String(d.versao || "1.0") })}
                onRefresh={refresh}
              />
            ))}
          </div>
        </div>
      )}

      {/* VIEW: HISTÓRICO */}
      {viewAtual === "historico" && (
        <div>
          {historicoCompleto.length === 0 && (
            <div style={{ textAlign: "center", padding: "48px 0", color: T.textMuted }}>
              <FileText style={{ width: 40, height: 40, color: T.textMuted, marginBottom: 12 }} />
              <p style={{ fontFamily: T.font, fontSize: 14, margin: 0 }}>Nenhum documento registrado.</p>
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {historicoCompleto.map((doc, i) => (
              <DocCard
                key={doc.id || i}
                doc={doc}
                patient={patient}
                currentUser={currentUser}
                onAssinar={d => setAssinaturaDoc({ ...d, versao: String(d.versao || "1.0") })}
                onRefresh={refresh}
              />
            ))}
          </div>
        </div>
      )}

      {/* VIEW: CONFORMIDADE */}
      {viewAtual === "conformidade" && (
        <DocRelatorioConformidade
          patient={patient}
          checklist={checklist.length > 0 ? checklist : historicoCompleto}
          procedimento={categoria ? CATEGORIAS_PROCEDIMENTO[categoria]?.label : null}
        />
      )}
    </div>
  );
}