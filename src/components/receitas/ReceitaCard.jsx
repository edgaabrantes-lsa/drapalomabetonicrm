import React from "react";
import { T, S } from "@/lib/designTokens";
import { FileText, Download, Printer, Edit, Send, XCircle, Copy, MessageCircle } from "lucide-react";

const STATUS = {
  rascunho:   { label: "Rascunho",   color: "#B0B0B0", bg: "rgba(176,176,176,0.10)" },
  emitida:    { label: "Emitida",    color: "#4ADE80", bg: "rgba(74,222,128,0.10)" },
  cancelada:  { label: "Cancelada",  color: "#EF4444", bg: "rgba(239,68,68,0.10)" },
  substituida:{ label: "Substituída",color: "#FBBF24", bg: "rgba(251,191,36,0.10)" },
};

export default function ReceitaCard({
  receita, podeEmitir, podeCorrigir, busy,
  onEditar, onEmitir, onBaixar, onImprimir, onWhatsapp, onCancelar, onNovaVersao,
}) {
  const st = STATUS[receita.status] || STATUS.rascunho;
  const meds = Array.isArray(receita.medicamentos) ? receita.medicamentos : [];
  const isRascunho = receita.status === "rascunho";
  const isEmitida = receita.status === "emitida";

  const botao = (label, Icon, onClick, cor) => (
    <button
      key={label}
      onClick={onClick}
      disabled={busy}
      style={{
        ...S.btnGhost, height: 30, fontSize: 11.5, padding: "0 10px",
        display: "flex", alignItems: "center", gap: 5,
        opacity: busy ? 0.5 : 1,
        ...(cor ? { borderColor: cor, color: cor } : {}),
      }}
    >
      <Icon size={12} /> {label}
    </button>
  );

  return (
    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 14 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, marginBottom: 8 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
            <FileText size={14} style={{ color: T.gold, flexShrink: 0 }} />
            <span style={{ fontFamily: T.font, fontSize: 13, fontWeight: 600, color: T.textPrimary }}>
              Receita {receita.versao > 1 ? `v${receita.versao}` : ""}
            </span>
            <span style={S.badge(st.color, st.bg)}>{st.label}</span>
            {receita.tipo_receita === "controle_especial" && (
              <span style={S.badge("#EF4444", "rgba(239,68,68,0.10)")}>Controle especial</span>
            )}
          </div>
          <p style={{ fontFamily: T.font, fontSize: 11.5, color: T.textMuted, margin: 0 }}>
            {receita.data_emissao ? new Date(receita.data_emissao + "T12:00:00").toLocaleDateString("pt-BR") : "—"}
            {receita.emitida_em && ` · emitida em ${new Date(receita.emitida_em).toLocaleString("pt-BR")}`}
            {receita.profissional_nome && ` · ${receita.profissional_nome}`}
          </p>
        </div>
      </div>

      <div style={{ marginBottom: 10 }}>
        {meds.slice(0, 4).map((m, i) => (
          <p key={i} style={{ fontFamily: T.font, fontSize: 12, color: T.textSecondary, margin: "0 0 3px" }}>
            {i + 1}. {m.nome}{m.apresentacao ? ` — ${m.apresentacao}` : ""}{m.dose ? ` · ${m.dose}` : ""}
          </p>
        ))}
        {meds.length > 4 && (
          <p style={{ fontFamily: T.font, fontSize: 11, color: T.textMuted, margin: 0 }}>+ {meds.length - 4} medicamento(s)</p>
        )}
      </div>

      {receita.status === "cancelada" && receita.motivo_cancelamento && (
        <p style={{ fontFamily: T.font, fontSize: 11, color: "#FCA5A5", margin: "0 0 8px" }}>
          Motivo do cancelamento: {receita.motivo_cancelamento}
        </p>
      )}

      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {isRascunho && podeEmitir && botao("Editar", Edit, onEditar)}
        {isRascunho && podeEmitir && botao("Emitir", Send, onEmitir, T.gold)}
        {isEmitida && podeCorrigir && botao("Corrigir (nova versão)", Copy, onNovaVersao, "#FBBF24")}
        {botao("Baixar PDF", Download, onBaixar)}
        {isEmitida && botao("Imprimir", Printer, onImprimir, "#3B82F6")}
        {isEmitida && receita.pdf_url && botao("WhatsApp", MessageCircle, onWhatsapp, "#25D366")}
        {isEmitida && podeEmitir && botao("Cancelar", XCircle, onCancelar, "#EF4444")}
      </div>
    </div>
  );
}