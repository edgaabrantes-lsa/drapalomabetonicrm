import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { T, S } from "@/lib/designTokens";
import { CheckCircle2, XCircle, AlertCircle, FileText } from "lucide-react";

const ITENS_CHECKLIST = [
  { key: "contrato_mestre",   label: "Contrato Mestre" },
  { key: "termo_lgpd",        label: "LGPD" },
  { key: "uso_imagem",        label: "Uso de Imagem" },
  { key: "consentimento",     label: "Consentimento" },
  { key: "anexo_financeiro",  label: "Anexo Financeiro" },
  { key: "assinatura",        label: "Assinatura Eletrônica" },
  { key: "comprovante",       label: "Comprovante de Pagamento" },
  { key: "identificacao",     label: "Documento de Identificação" },
  { key: "prontuario",        label: "Prontuário Inicial" },
];

export default function StatusDocumental({ patient }) {
  const { data: documentos = [] } = useQuery({
    queryKey: ["dossie-documentos", patient?.id],
    queryFn: () => base44.entities.DossieDocumento.filter({ patient_id: patient.id }),
    enabled: !!patient?.id,
  });

  const { data: assinaturas = [] } = useQuery({
    queryKey: ["assinaturas", patient?.id],
    queryFn: () => base44.entities.AssinaturaEletronica.filter({ patient_id: patient.id }),
    enabled: !!patient?.id,
  });

  const { data: financeiros = [] } = useQuery({
    queryKey: ["dossie-financeiro", patient?.id],
    queryFn: () => base44.entities.DossieFinanceiro.filter({ patient_id: patient.id }),
    enabled: !!patient?.id,
  });

  const { data: evolucoes = [] } = useQuery({
    queryKey: ["evolucoes", patient?.id],
    queryFn: () => base44.entities.DossieEvolucao.filter({ patient_id: patient.id }),
    enabled: !!patient?.id,
  });

  function checkItem(key) {
    switch (key) {
      case "contrato_mestre":
        return documentos.some(d => d.tipo === "contrato_mestre" && d.status === "assinado");
      case "termo_lgpd":
        return documentos.some(d => d.tipo === "termo_lgpd" && d.status === "assinado") || patient?.consent_terms_signed;
      case "uso_imagem":
        return documentos.some(d => d.tipo === "uso_imagem" && d.status === "assinado") || patient?.consent_images;
      case "consentimento":
        return documentos.some(d => d.tipo === "consentimento" && d.status === "assinado");
      case "anexo_financeiro":
        return documentos.some(d => d.tipo === "anexo_financeiro");
      case "assinatura":
        return assinaturas.some(a => a.status === "assinado");
      case "comprovante":
        return financeiros.some(f =>
          f.comprovantes && f.comprovantes.length > 0
        );
      case "identificacao":
        return !!(patient?.document_number || patient?.rg);
      case "prontuario":
        return evolucoes.some(e => e.tipo === "anamnese");
      default:
        return false;
    }
  }

  const itensStatus = ITENS_CHECKLIST.map(item => ({
    ...item,
    ok: checkItem(item.key),
  }));

  const totalOk = itensStatus.filter(i => i.ok).length;
  const total = itensStatus.length;
  const percentual = Math.round((totalOk / total) * 100);

  let statusGeral, statusColor, statusBg;
  if (percentual === 100) {
    statusGeral = "Documentação Completa";
    statusColor = "#22c55e";
    statusBg = "rgba(34,197,94,0.1)";
  } else if (percentual >= 50) {
    statusGeral = "Documentação Parcial";
    statusColor = "#f59e0b";
    statusBg = "rgba(245,158,11,0.1)";
  } else {
    statusGeral = "Documentação Incompleta";
    statusColor = "#ef4444";
    statusBg = "rgba(239,68,68,0.1)";
  }

  return (
    <div style={{
      background: T.card, border: `1px solid ${T.border}`,
      borderRadius: 10, padding: 20,
    }}>
      {/* Header com status */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <FileText style={{ width: 16, height: 16, color: T.gold }} />
          <span style={{ fontFamily: T.font, fontSize: 13, fontWeight: 600, color: T.textPrimary }}>
            Status Documental
          </span>
        </div>
        <span style={{
          fontFamily: T.font, fontSize: 12, fontWeight: 600,
          color: statusColor, backgroundColor: statusBg,
          padding: "3px 10px", borderRadius: 20,
          border: `1px solid ${statusColor}30`,
        }}>
          {statusGeral}
        </span>
      </div>

      {/* Barra de progresso */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
          <span style={{ fontFamily: T.font, fontSize: 11, color: T.textMuted }}>
            {totalOk} de {total} itens concluídos
          </span>
          <span style={{ fontFamily: T.font, fontSize: 11, fontWeight: 600, color: statusColor }}>
            {percentual}%
          </span>
        </div>
        <div style={{ background: T.bgSecondary, borderRadius: 4, height: 6, overflow: "hidden" }}>
          <div style={{
            width: `${percentual}%`, height: "100%",
            backgroundColor: statusColor,
            borderRadius: 4, transition: "width 0.5s ease",
          }} />
        </div>
      </div>

      {/* Checklist */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
        {itensStatus.map(item => (
          <div
            key={item.key}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "7px 10px", borderRadius: 6,
              backgroundColor: item.ok ? "rgba(34,197,94,0.05)" : "rgba(239,68,68,0.05)",
              border: `1px solid ${item.ok ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)"}`,
            }}
          >
            {item.ok
              ? <CheckCircle2 style={{ width: 14, height: 14, color: "#22c55e", flexShrink: 0 }} />
              : <XCircle style={{ width: 14, height: 14, color: "#ef4444", flexShrink: 0 }} />
            }
            <span style={{ fontFamily: T.font, fontSize: 12, color: item.ok ? "#22c55e" : "#ef4444" }}>
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}