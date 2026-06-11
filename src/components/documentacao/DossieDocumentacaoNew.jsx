import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { T, S } from "@/lib/designTokens";
import {
  CATEGORIAS_PROCEDIMENTO,
  getDocsParaProcedimento,
} from "./documentacaoConfig";
import KitDocumentalModal from "./KitDocumentalModal";
import KitDocumentalCard from "./KitDocumentalCard";
import DocRelatorioConformidade from "./DocRelatorioConformidade";
import DocCard from "./DocCard";
import AssinaturaEletronicaModal from "@/components/governanca/AssinaturaEletronicaModal";
import {
  Zap, Plus, RefreshCw, FileText, ClipboardList, Package, History, ShieldCheck
} from "lucide-react";

const VIEWS = [
  { id: "kits",        label: "Kit Documental",  icon: Package },
  { id: "historico",   label: "Documentos",       icon: FileText },
  { id: "conformidade",label: "Conformidade",     icon: ShieldCheck },
];

export default function DossieDocumentacaoNew({ patient, currentUser }) {
  const queryClient = useQueryClient();
  const [viewAtual, setViewAtual] = useState("kits");
  const [showKit, setShowKit] = useState(false);
  const [kitParaEditar, setKitParaEditar] = useState(null);
  const [assinaturaDoc, setAssinaturaDoc] = useState(null);
  const [showNovoDoc, setShowNovoDoc] = useState(false);
  const [novoDoc, setNovoDoc] = useState({ nome: "", tipo: "outro" });
  const [salvandoDoc, setSalvandoDoc] = useState(false);

  // Buscar kits documentais
  const { data: kits = [] } = useQuery({
    queryKey: ["kits-documentais", patient.id],
    queryFn: () => base44.entities.DossieKitDocumental.filter({ patient_id: patient.id }, "-data_geracao", 50),
  });

  const { data: documentos = [] } = useQuery({
    queryKey: ["dossie-docs", patient.id],
    queryFn: () => base44.entities.DossieDocumento.filter({ patient_id: patient.id }, "-data_geracao", 200),
  });

  const { data: financeiros = [] } = useQuery({
    queryKey: ["dossie-financeiro", patient.id],
    queryFn: () => base44.entities.DossieFinanceiro.filter({ patient_id: patient.id }, "-created_date", 20),
  });

  const { data: tratamentos = [] } = useQuery({
    queryKey: ["patient-treatments", patient.id],
    queryFn: () => base44.entities.PatientTreatment.filter({ patient_id: patient.id }, "-created_date", 50),
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["kits-documentais", patient.id] });
    queryClient.invalidateQueries({ queryKey: ["dossie-docs", patient.id] });
    queryClient.invalidateQueries({ queryKey: ["assinaturas", patient.id] });
  };

  // Ordenar kits: ativos primeiro, cancelados/substituídos por último
  const kitsOrdenados = useMemo(() => {
    const ativos = kits.filter(k => !["substituido","cancelado"].includes(k.status));
    const inativos = kits.filter(k => ["substituido","cancelado"].includes(k.status));
    return [...ativos, ...inativos];
  }, [kits]);

  // Conformidade geral
  const conformidadeGeral = useMemo(() => {
    if (kits.length === 0) return { pct: 0, label: "Sem Kit", color: T.textMuted };
    const kitAtivo = kits.find(k => !["substituido","cancelado"].includes(k.status));
    if (!kitAtivo) return { pct: 0, label: "Sem Kit Ativo", color: T.textMuted };
    if (["assinado","pdf_externo_anexado"].includes(kitAtivo.status)) return { pct: 100, label: "Conforme", color: "#22C55E" };
    if (kitAtivo.status === "aguardando_assinatura") return { pct: 75, label: "Aguardando Assinatura", color: "#F59E0B" };
    if (kitAtivo.status === "gerado") return { pct: 50, label: "Kit Gerado", color: "#3B82F6" };
    return { pct: 0, label: "Pendente", color: "#EF4444" };
  }, [kits]);

  // Docs histórico (excluindo os "incluido_no_kit" que são apenas internos)
  const historicoCompleto = useMemo(() =>
    [...documentos]
      .sort((a, b) => new Date(b.data_geracao || b.created_date || 0) - new Date(a.data_geracao || a.created_date || 0)),
    [documentos]
  );

  const handleSalvarNovoDoc = async () => {
    const nome = novoDoc.nome || `Documento — ${patient.full_name}`;
    setSalvandoDoc(true);
    try {
      await base44.entities.DossieDocumento.create({
        patient_id: patient.id,
        patient_name: patient.full_name,
        nome,
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

  return (
    <div style={{ fontFamily: T.font }}>
      {/* Modais */}
      {showKit && (
        <KitDocumentalModal
          patient={patient}
          financeiros={financeiros}
          kitParaEditar={kitParaEditar}
          onClose={() => { setShowKit(false); setKitParaEditar(null); }}
          onKitGerado={() => { refresh(); setShowKit(false); setKitParaEditar(null); }}
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
      <div style={{ marginBottom: 20, display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: T.textPrimary, margin: 0 }}>
            Documentação da Paciente
          </h2>
          <p style={{ fontFamily: T.font, fontSize: 13, color: T.textMuted, margin: "4px 0 0" }}>
            Gere, revise, assine e arquive o kit documental completo de cada procedimento.
          </p>
        </div>

        {/* Conformidade */}
        <div style={{
          background: T.card, border: `1px solid ${T.border}`, borderRadius: 8,
          padding: "10px 16px", textAlign: "right",
        }}>
          <p style={{ fontFamily: T.font, fontSize: 10, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 2 }}>
            Conformidade Documental
          </p>
          <span style={{ fontFamily: T.font, fontSize: 22, fontWeight: 700, color: conformidadeGeral.color }}>
            {conformidadeGeral.pct}%
          </span>
          <p style={{ fontFamily: T.font, fontSize: 10, color: conformidadeGeral.color }}>{conformidadeGeral.label}</p>
        </div>
      </div>

      {/* Ação principal */}
      <div style={{
        background: T.bgSecondary, border: `1px solid ${T.goldBorder}`,
        borderRadius: 8, padding: "14px 16px", marginBottom: 20,
        display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12,
      }}>
        <div>
          <p style={{ fontFamily: T.font, fontSize: 14, fontWeight: 600, color: T.textPrimary, marginBottom: 2 }}>
            Kit Documental Único
          </p>
          <p style={{ fontFamily: T.font, fontSize: 12, color: T.textMuted }}>
            Selecione o procedimento, gere o kit, assine uma única vez. Simples assim.
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button
            onClick={() => { setKitParaEditar(null); setShowKit(true); }}
            style={{ ...S.btnPrimary, display: "flex", alignItems: "center", gap: 6 }}
          >
            <Zap size={14} /> Gerar Kit Documental
          </button>
          <button onClick={refresh} style={{ ...S.btnGhost, display: "flex", alignItems: "center", gap: 6 }}>
            <RefreshCw size={13} /> Atualizar
          </button>
        </div>
      </div>

      {/* Abas */}
      <div style={{ display: "flex", gap: 0, borderBottom: `1px solid ${T.border}`, marginBottom: 20 }}>
        {VIEWS.map(v => (
          <button
            key={v.id}
            onClick={() => setViewAtual(v.id)}
            style={{
              fontFamily: T.font, fontSize: 13, fontWeight: viewAtual === v.id ? 600 : 400,
              color: viewAtual === v.id ? T.textPrimary : T.textMuted,
              padding: "8px 16px", border: "none", background: "transparent", cursor: "pointer",
              borderBottom: viewAtual === v.id ? `2px solid ${T.gold}` : "2px solid transparent",
              transition: "all 0.15s", display: "flex", alignItems: "center", gap: 6,
            }}
          >
            <v.icon size={13} />
            {v.label}
          </button>
        ))}
      </div>

      {/* VIEW: KITS */}
      {viewAtual === "kits" && (
        <div>
          {kitsOrdenados.length === 0 ? (
            <div style={{ textAlign: "center", padding: "56px 0" }}>
              <Package size={48} style={{ color: T.textMuted, marginBottom: 16 }} />
              <p style={{ fontFamily: T.font, fontSize: 15, fontWeight: 600, color: T.textPrimary, marginBottom: 8 }}>
                Nenhum Kit Documental gerado ainda
              </p>
              <p style={{ fontFamily: T.font, fontSize: 13, color: T.textMuted, marginBottom: 24 }}>
                Clique em "Gerar Kit Documental" para iniciar o fluxo de assinatura única.
              </p>
              <button
                onClick={() => { setKitParaEditar(null); setShowKit(true); }}
                style={{ ...S.btnPrimary, display: "inline-flex", alignItems: "center", gap: 6 }}
              >
                <Zap size={14} /> Gerar Primeiro Kit
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {kitsOrdenados.map(kit => (
                <div key={kit.id} style={{ opacity: ["substituido","cancelado"].includes(kit.status) ? 0.5 : 1 }}>
                  {["substituido","cancelado"].includes(kit.status) && (
                    <p style={{ fontFamily: T.font, fontSize: 10, color: T.textMuted, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                      Kit inativo
                    </p>
                  )}
                  <KitDocumentalCard
                    kit={kit}
                    patient={patient}
                    currentUser={currentUser}
                    onRefresh={refresh}
                    onRegerar={(k) => { setKitParaEditar(k); setShowKit(true); }}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* VIEW: DOCUMENTOS INDIVIDUAIS (HISTÓRICO) */}
      {viewAtual === "historico" && (
        <div>
          <div style={{ marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
            <p style={{ fontFamily: T.font, fontSize: 13, color: T.textMuted }}>
              Documentos individuais (gerados automaticamente pelo kit ou adicionados manualmente)
            </p>
            <button
              onClick={() => setShowNovoDoc(!showNovoDoc)}
              style={{ ...S.btnGhost, fontSize: 12, height: 32, display: "flex", alignItems: "center", gap: 6 }}
            >
              <Plus size={12} /> Adicionar Avulso
            </button>
          </div>

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
                  <select value={novoDoc.tipo} onChange={e => setNovoDoc(p => ({ ...p, tipo: e.target.value }))} style={{ ...S.input, width: "100%" }}>
                    <option value="contrato_mestre">Contrato Mestre</option>
                    <option value="anexo_financeiro">Anexo Financeiro</option>
                    <option value="termo_lgpd">Termo LGPD</option>
                    <option value="uso_imagem">Uso de Imagem</option>
                    <option value="consentimento">Consentimento</option>
                    <option value="documento_identificacao">Doc. Identificação</option>
                    <option value="comprovante_pagamento">Comprovante de Pagamento</option>
                    <option value="outro">Outro</option>
                  </select>
                </div>
                <div>
                  <p style={{ ...S.label, marginBottom: 4 }}>Nome *</p>
                  <input
                    value={novoDoc.nome}
                    onChange={e => setNovoDoc(p => ({ ...p, nome: e.target.value }))}
                    placeholder={`Documento — ${patient.full_name}`}
                    style={{ ...S.input, width: "100%" }}
                  />
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <button onClick={() => setShowNovoDoc(false)} style={{ ...S.btnGhost, fontSize: 12 }}>Cancelar</button>
                <button
                  onClick={handleSalvarNovoDoc}
                  disabled={salvandoDoc}
                  style={{ ...S.btnPrimary, fontSize: 12, opacity: !salvandoDoc ? 1 : 0.5 }}
                >
                  {salvandoDoc ? "Salvando..." : "Salvar"}
                </button>
              </div>
            </div>
          )}

          {historicoCompleto.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 0", color: T.textMuted }}>
              <FileText size={36} style={{ color: T.textMuted, marginBottom: 12 }} />
              <p style={{ fontFamily: T.font, fontSize: 13 }}>
                Nenhum documento registrado. Os documentos aparecem aqui após a geração do Kit.
              </p>
            </div>
          ) : (
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
          )}
        </div>
      )}

      {/* VIEW: CONFORMIDADE */}
      {viewAtual === "conformidade" && (
        <DocRelatorioConformidade
          patient={patient}
          kits={kits}
          checklist={historicoCompleto}
          procedimento={null}
          conformidadeGeral={conformidadeGeral}
        />
      )}
    </div>
  );
}