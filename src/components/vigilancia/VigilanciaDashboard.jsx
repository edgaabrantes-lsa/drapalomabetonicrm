import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { SECTIONS, STATUS_CONFIG, calcScore } from "./vigilanciaData";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle, CheckCircle2, ChevronRight
} from "lucide-react";

const ScoreRing = ({ score }) => {
  const color = score >= 90 ? "#10b981" : score >= 70 ? "#f59e0b" : "#ef4444";
  const label = score >= 90 ? "Excelente" : score >= 70 ? "Regular" : "Crítico";
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-36 h-36">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="42" fill="none" stroke="#1e293b" strokeWidth="10" />
          <circle cx="50" cy="50" r="42" fill="none" stroke={color} strokeWidth="10"
            strokeDasharray={`${2.64 * score} 264`} strokeLinecap="round" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-white">{score}%</span>
          <span className="text-xs font-medium" style={{ color }}>{label}</span>
        </div>
      </div>
      <p className="text-sm text-slate-400">Score Geral de Conformidade</p>
    </div>
  );
};

export default function VigilanciaDashboard({ onNavigate }) {
  const [aiLoading, setAiLoading] = useState(false);
  const [aiReport, setAiReport] = useState(null);

  const { data: items = [] } = useQuery({
    queryKey: ["vigilancia-items"],
    queryFn: () => base44.entities.VigilanciaItem.list(),
  });
  const { data: equipamentos = [] } = useQuery({
    queryKey: ["vigilancia-equipamentos"],
    queryFn: () => base44.entities.VigilanciaEquipamento.list(),
  });
  const { data: treinamentos = [] } = useQuery({
    queryKey: ["vigilancia-treinamentos"],
    queryFn: () => base44.entities.VigilanciaTreinamento.list(),
  });

  // Calcular score por seção
  const sectionScores = SECTIONS.map(sec => {
    const secItems = items.filter(i => i.section === sec.key);
    const total = sec.items.length;
    const done = secItems.filter(i => i.status === "concluido").length;
    const pending = secItems.filter(i => i.status === "em_andamento").length;
    const notStarted = total - secItems.filter(i => i.status !== "nao_iniciado").length;
    const score = total > 0 ? Math.round((done / total) * 100) : 0;
    return { ...sec, total, done, pending, notStarted, score };
  });

  const globalScore = Math.round(
    sectionScores.reduce((sum, s) => sum + s.score, 0) / sectionScores.length
  );

  // Alertas
  const today = new Date();
  const alertEquip = equipamentos.filter(e => {
    if (!e.proxima_manutencao) return false;
    const diff = (new Date(e.proxima_manutencao) - today) / (1000 * 60 * 60 * 24);
    return diff <= 30;
  });
  const alertTrein = treinamentos.filter(t => {
    if (!t.validade) return false;
    const diff = (new Date(t.validade) - today) / (1000 * 60 * 60 * 24);
    return diff <= 30;
  });

  const handleAuditoria = () => {
    // Scroll to checklist tab
    onNavigate("checklist");
  };

  const handleAnaliseIA = async () => {
    setAiLoading(true);
    try {
      const summary = sectionScores.map(s => `${s.label}: ${s.done}/${s.total} concluídos (${s.score}%)`).join("\n");
      const pending = sectionScores.flatMap(s => {
        const secItems = items.filter(i => i.section === s.key && i.status !== "concluido");
        return secItems.map(i => `[${s.label}] ${i.label || i.item_key} — ${i.status}`);
      });

      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `Você é um especialista em vigilância sanitária para clínicas de estética e medicina estética no Brasil, com profundo conhecimento da ANVISA, legislação sanitária e boas práticas clínicas.

Analise o seguinte status de conformidade da clínica:

SCORES POR SEÇÃO:
${summary}

ITENS PENDENTES (${pending.length} itens):
${pending.slice(0, 40).join("\n")}

Score geral: ${globalScore}%

Gere um relatório executivo completo com:
1. Avaliação geral da conformidade
2. Principais riscos identificados
3. Não conformidades críticas (se houver)
4. Plano de correção priorizado (por urgência)
5. Recomendações para a próxima fiscalização
6. Prazo sugerido para regularização

Seja direto, técnico e prático. Formate com seções claras.`,
      });
      setAiReport(typeof res === "string" ? res : res?.text || JSON.stringify(res));
    } catch (e) {
      setAiReport("Erro ao gerar análise. Verifique sua conexão e tente novamente.");
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Score + Alertas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Score central */}
        <div className="rounded-2xl border p-6 flex flex-col items-center justify-center"
          style={{ backgroundColor: "#0f172a", borderColor: "#1e293b" }}>
          <ScoreRing score={globalScore} />
          <div className="flex gap-3 mt-4">
            <Button size="sm" onClick={handleAuditoria}
              style={{ backgroundColor: "#1e40af", color: "#fff" }}
              className="text-xs hover:opacity-90">
              Realizar Auditoria
            </Button>
            <Button size="sm" variant="outline" onClick={handleAnaliseIA}
              disabled={aiLoading}
              className="text-xs border-blue-500/30 text-blue-400 hover:bg-blue-500/10">
              {aiLoading ? "Analisando..." : "Analisar com IA"}
            </Button>
          </div>
        </div>

        {/* Resumo numérico */}
        <div className="rounded-2xl border p-5 space-y-3"
          style={{ backgroundColor: "#0f172a", borderColor: "#1e293b" }}>
          <p className="text-xs uppercase tracking-widest font-semibold" style={{ color: "#64748b" }}>Resumo</p>
          {[
            { label: "Total de itens", value: SECTIONS.reduce((s, sec) => s + sec.items.length, 0), color: "#e2e8f0" },
            { label: "Concluídos", value: items.filter(i => i.status === "concluido").length, color: "#10b981" },
            { label: "Em andamento", value: items.filter(i => i.status === "em_andamento").length, color: "#f59e0b" },
            { label: "Pendentes", value: SECTIONS.reduce((s, sec) => s + sec.items.length, 0) - items.filter(i => i.status !== "nao_iniciado").length, color: "#ef4444" },
          ].map(r => (
            <div key={r.label} className="flex items-center justify-between">
              <span className="text-sm" style={{ color: "#94a3b8" }}>{r.label}</span>
              <span className="text-lg font-semibold" style={{ color: r.color }}>{r.value}</span>
            </div>
          ))}
        </div>

        {/* Alertas */}
        <div className="rounded-2xl border p-5 space-y-3"
          style={{ backgroundColor: "#0f172a", borderColor: "#1e293b" }}>
          <p className="text-xs uppercase tracking-widest font-semibold" style={{ color: "#64748b" }}>Alertas</p>
          {alertEquip.length === 0 && alertTrein.length === 0 ? (
            <div className="flex items-center gap-2 text-emerald-400 text-sm">
              <CheckCircle2 className="h-4 w-4" /> Nenhum alerta ativo
            </div>
          ) : (
            <div className="space-y-2">
              {alertEquip.map(e => (
                <div key={e.id} className="flex items-start gap-2 p-2 rounded-lg"
                  style={{ backgroundColor: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>
                  <AlertTriangle className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-red-300 font-medium">{e.nome}</p>
                    <p className="text-xs text-red-400/70">Manutenção: {e.proxima_manutencao}</p>
                  </div>
                </div>
              ))}
              {alertTrein.map(t => (
                <div key={t.id} className="flex items-start gap-2 p-2 rounded-lg"
                  style={{ backgroundColor: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)" }}>
                  <AlertTriangle className="h-4 w-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-yellow-300 font-medium">{t.colaborador} — {t.curso}</p>
                    <p className="text-xs text-yellow-400/70">Vence: {t.validade}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Cards por seção */}
      <div>
      <p className="text-xs uppercase tracking-widest font-semibold mb-3" style={{ color: "#64748b" }}>
        Conformidade por Seção
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {sectionScores.map(sec => {
          const barColor = sec.score >= 90 ? "#10b981" : sec.score >= 70 ? "#f59e0b" : "#ef4444";
          return (
            <button key={sec.key} onClick={() => onNavigate("checklist")}
              className="rounded-2xl border p-4 text-left hover:border-blue-500/40 transition-all group"
              style={{ backgroundColor: "#0f172a", borderColor: "#1e293b" }}>
              <div className="flex items-center justify-between mb-3">
                <ChevronRight className="h-4 w-4 text-slate-600 group-hover:text-blue-400 transition-colors ml-auto" />
              </div>
              <p className="text-sm font-medium text-white mb-1">{sec.label}</p>
                <p className="text-xs mb-3" style={{ color: "#64748b" }}>
                  {sec.done} de {sec.total} concluídos
                </p>
                <div className="w-full h-1.5 rounded-full" style={{ backgroundColor: "#1e293b" }}>
                  <div className="h-1.5 rounded-full transition-all"
                    style={{ width: `${sec.score}%`, backgroundColor: barColor }} />
                </div>
                <p className="text-xs font-semibold mt-1" style={{ color: barColor }}>{sec.score}%</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Relatório IA */}
      {aiReport && (
        <div className="rounded-2xl border p-6 space-y-3"
          style={{ backgroundColor: "#0f172a", borderColor: "#1e40af" }}>
          <div className="flex items-center gap-2 mb-2">
            <p className="text-sm font-semibold text-blue-300">Análise de Conformidade — Inteligência Artificial</p>
            <Button size="sm" variant="ghost" onClick={() => setAiReport(null)}
              className="ml-auto text-slate-500 hover:text-white text-xs">Fechar</Button>
          </div>
          <pre className="text-sm whitespace-pre-wrap leading-relaxed" style={{ color: "#cbd5e1", fontFamily: "inherit" }}>
            {aiReport}
          </pre>
        </div>
      )}
    </div>
  );
}