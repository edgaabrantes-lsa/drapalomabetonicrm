import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, parseISO, addMonths } from "date-fns";
import LancamentoForm from "./LancamentoForm";
import BaixaPagamentoModal from "./BaixaPagamentoModal";
import ResumoDiario from "./ResumoDiario";
import { fmtBRL, DRE_TIPOS } from "@/lib/dreUtils";
import { usePermissions } from "@/lib/PermissionsContext";

const statusConfig = {
  pago: { label: "Pago", color: "rgba(74,222,128,0.15)", textColor: "#4ADE80" },
  pendente: { label: "Pendente", color: "rgba(245,158,11,0.15)", textColor: "#F59E0B" },
  vencido: { label: "Vencido", color: "rgba(239,68,68,0.15)", textColor: "#EF4444" },
  cancelado: { label: "Cancelado", color: "rgba(107,114,128,0.15)", textColor: "#6B7280" },
};

const MESES_NOMES = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
const hoje = () => format(new Date(), "yyyy-MM-dd");

const statusEfetivo = (l) =>
  l.status === "pendente" && l.data_vencimento && l.data_vencimento < format(new Date(), "yyyy-MM-dd")
    ? "vencido"
    : l.status;

const th = { textAlign: "left", padding: "10px 12px", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", color: "#666666", whiteSpace: "nowrap" };

export default function LancamentosDRE({ filters }) {
  const queryClient = useQueryClient();
  const { hasAction } = usePermissions();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [tipoFilter, setTipoFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [busca, setBusca] = useState("");
  const [verResumo, setVerResumo] = useState(false);
  const [baixa, setBaixa] = useState(null);

  const { data: lancamentos = [], isLoading } = useQuery({
    queryKey: ["dreLancamentos"],
    queryFn: () => base44.entities.DRELancamento.list("-created_date", 2000),
  });

  const inval = () => {
    queryClient.invalidateQueries({ queryKey: ["dreLancamentos"] });
    setIsFormOpen(false);
    setEditing(null);
  };

  const createMut = useMutation({ mutationFn: (data) => base44.entities.DRELancamento.create(data), onSuccess: inval });
  const bulkCreateMut = useMutation({ mutationFn: (records) => base44.entities.DRELancamento.bulkCreate(records), onSuccess: inval });
  const updateMut = useMutation({ mutationFn: ({ id, data }) => base44.entities.DRELancamento.update(id, data), onSuccess: inval });
  const deleteMut = useMutation({
    mutationFn: (id) => base44.entities.DRELancamento.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["dreLancamentos"] }),
  });

  const novoGrupoId = () => `g${Date.now()}${Math.random().toString(36).slice(2, 7)}`;

  // Recorrência: gera uma ocorrência por mês/ano, com identificador de grupo (evita duplicação)
  const expandRecurring = (data, grupoId) => {
    if (lancamentos.some((l) => l.grupo_id === grupoId)) return [];
    const records = [];
    const inicio = data.data_inicio ? parseISO(data.data_inicio) : parseISO(data.data_vencimento);
    const vencDay = parseISO(data.data_vencimento).getDate();
    const fim = data.data_fim ? parseISO(data.data_fim) : addMonths(inicio, data.recorrencia === "anual" ? 36 : 11);
    let atual = new Date(inicio.getFullYear(), inicio.getMonth(), vencDay);
    while (atual <= fim) {
      const venc = format(atual, "yyyy-MM-dd");
      const { recorrencia, data_inicio, data_fim, ...rest } = data;
      records.push({
        ...rest,
        recorrencia: "unica",
        grupo_id: grupoId,
        origem: data.origem || "manual",
        data_vencimento: venc,
        data_inicio: venc,
        data_fim: "",
        data_pagamento: data.status === "pago" && venc <= hoje() ? venc : "",
        status: data.status === "pago" && venc <= hoje() ? "pago" : "pendente",
      });
      atual = addMonths(atual, data.recorrencia === "anual" ? 12 : 1);
    }
    return records;
  };

  // Parcelamento: divide o total, ajustando os centavos na última parcela
  const expandirParcelas = (data, quantidade, grupoId) => {
    if (quantidade < 2) return [data];
    const total = Number(data.valor || 0);
    const base = Math.floor((total / quantidade) * 100) / 100;
    const records = [];
    for (let i = 1; i <= quantidade; i++) {
      const valor = i === quantidade ? Number((total - base * (quantidade - 1)).toFixed(2)) : base;
      const venc = format(addMonths(parseISO(data.data_vencimento), i - 1), "yyyy-MM-dd");
      const { recorrencia, data_inicio, data_fim, ...rest } = data;
      records.push({
        ...rest,
        valor,
        recorrencia: "unica",
        grupo_id: grupoId,
        num_parcelas: quantidade,
        parcela_atual: i,
        origem: data.origem || "manual",
        descricao: `${data.descricao} (${i}/${quantidade})`,
        data_vencimento: venc,
        data_inicio: venc,
        data_fim: "",
        data_pagamento: i === 1 && data.status === "pago" ? (data.data_pagamento || hoje()) : "",
        status: i === 1 && data.status === "pago" ? "pago" : "pendente",
      });
    }
    return records;
  };

  const handleSave = (data, meta = {}) => {
    if (editing) {
      updateMut.mutate({ id: editing.id, data });
      return;
    }
    const grupoId = novoGrupoId();
    if (meta.parcelas > 1) {
      bulkCreateMut.mutate(expandirParcelas(data, meta.parcelas, grupoId));
    } else if (data.recorrencia === "mensal" || data.recorrencia === "anual") {
      const records = expandRecurring(data, grupoId);
      if (records.length === 0) return;
      bulkCreateMut.mutate(records);
    } else {
      createMut.mutate({ ...data, origem: data.origem || "manual" });
    }
  };

  const filtered = lancamentos.filter((l) => {
    const isEntrada = l.tipo === "receita";
    if (tipoFilter !== "all" && (tipoFilter === "entrada" ? !isEntrada : isEntrada)) return false;
    if (statusFilter !== "all" && statusEfetivo(l) !== statusFilter) return false;
    if (busca.trim()) {
      const alvo = `${l.descricao || ""} ${l.fornecedor || ""} ${l.categoria || ""}`.toLowerCase();
      if (!alvo.includes(busca.trim().toLowerCase())) return false;
    }
    if (filters?.mes != null && filters?.ano && l.data_vencimento) {
      try {
        const d = parseISO(l.data_vencimento);
        if (d.getMonth() !== filters.mes || d.getFullYear() !== filters.ano) return false;
      } catch { return false; }
    }
    return true;
  });

  const canEdit = hasAction("editar");
  const canDelete = hasAction("excluir");

  const confirmarBaixa = (dataPagamento) => {
    if (!baixa) return;
    updateMut.mutate({ id: baixa.id, data: { ...baixa, status: "pago", data_pagamento: dataPagamento } });
    setBaixa(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex gap-2 items-center flex-wrap">
          {filters?.mes != null && filters?.ano && (
            <span style={{ fontSize: 13, fontWeight: 600, color: "#C8A96A", whiteSpace: "nowrap" }}>
              {MESES_NOMES[filters.mes]} {filters.ano}
            </span>
          )}
          <Input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar descrição ou fornecedor..."
            className="bg-[#121212] border-[#2B2B2B] text-white"
            style={{ height: 34, fontSize: 12, width: 220 }}
          />
          <Select value={tipoFilter} onValueChange={setTipoFilter}>
            <SelectTrigger
              className="bg-[#121212] border-[#2B2B2B] text-white flex-none"
              style={{
                height: 34,
                fontSize: 12,
                width: "max-content",
                minWidth: 136,
                maxWidth: "100%",
                paddingLeft: 12,
                paddingRight: 12,
                whiteSpace: "nowrap",
              }}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#1A1A1A] border-[#2B2B2B]">
              <SelectItem value="all" className="text-white">Entradas e saídas</SelectItem>
              <SelectItem value="entrada" className="text-white">Entradas</SelectItem>
              <SelectItem value="saida" className="text-white">Saídas</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32 bg-[#121212] border-[#2B2B2B] text-white" style={{ height: 34, fontSize: 12 }}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#1A1A1A] border-[#2B2B2B]">
              <SelectItem value="all" className="text-white">Todos status</SelectItem>
              {Object.entries(statusConfig).map(([k, v]) => (
                <SelectItem key={k} value={k} className="text-white">{v.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <button
            type="button"
            onClick={() => setVerResumo((v) => !v)}
            style={{
              height: 34, padding: "0 12px", fontSize: 12, fontWeight: 500,
              background: verResumo ? "rgba(200,169,106,0.12)" : "transparent",
              border: `1px solid ${verResumo ? "#C8A96A" : "#2B2B2B"}`,
              borderRadius: 6, color: verResumo ? "#C8A96A" : "#B0B0B0", cursor: "pointer",
            }}
          >
            {verResumo ? "Ver lançamentos" : "Resumo de entradas e saídas"}
          </button>
        </div>

        {canEdit && (
          <Dialog open={isFormOpen} onOpenChange={(o) => { setIsFormOpen(o); if (!o) setEditing(null); }}>
            <DialogTrigger asChild>
              <button
                style={{
                  background: "#C8A96A", color: "#000", border: "none", borderRadius: 6,
                  fontSize: 13, fontWeight: 600, padding: "8px 18px", height: 36,
                  cursor: "pointer", whiteSpace: "nowrap",
                }}
              >
                + Novo Lançamento
              </button>
            </DialogTrigger>
            <DialogContent className="text-white max-w-lg max-h-[90vh] overflow-hidden flex flex-col" style={{ backgroundColor: "#1A1A1A", borderColor: "#2B2B2B" }}>
              <DialogHeader className="flex-shrink-0">
                <DialogTitle style={{ fontSize: 16, fontWeight: 600, color: "#FFFFFF" }}>
                  {editing ? "Editar Lançamento" : "Novo Lançamento"}
                </DialogTitle>
              </DialogHeader>
              <LancamentoForm lancamento={editing} onSave={handleSave} onClose={() => { setIsFormOpen(false); setEditing(null); }} />
            </DialogContent>
          </Dialog>
        )}
      </div>

      {verResumo ? (
        <ResumoDiario lancamentos={filtered} />
      ) : (
        <div
          className="dre-table-scroll w-full min-w-0"
          style={{
            backgroundColor: "#1A1A1A",
            border: "1px solid #2B2B2B",
            borderRadius: 8,
            width: "100%",
            maxWidth: "100%",
            minWidth: 0,
            overflowX: "auto",
            overflowY: "hidden",
          }}
        >
          {isLoading ? (
            <div style={{ padding: 40, textAlign: "center" }}>
              <div className="inline-block w-6 h-6 border-2 border-[#2B2B2B] border-t-[#C8A96A] rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center" }}>
              <p style={{ fontSize: 14, color: "#666666" }}>Nenhum lançamento registrado</p>
              <p style={{ fontSize: 12, color: "#555555", marginTop: 4 }}>
                Use “Novo Lançamento” para registrar entradas e saídas da clínica.
              </p>
            </div>
          ) : (
            <div>
              {/* Cabeçalho — visível no desktop */}
              <div className="hidden lg:flex items-center gap-x-3" style={{ padding: "10px 12px", borderBottom: "1px solid #2B2B2B" }}>
                <span style={{ ...th, padding: 0, width: 88 }}>Data</span>
                <span style={{ ...th, padding: 0, flex: 1, minWidth: 0 }}>Descrição</span>
                <span style={{ ...th, padding: 0, width: 68 }}>Tipo</span>
                <span className="hidden xl:block" style={{ ...th, padding: 0, width: 110 }}>Categoria</span>
                <span style={{ ...th, padding: 0, width: 92, textAlign: "right" }}>Valor</span>
                <span style={{ ...th, padding: 0, width: 92, textAlign: "center" }}>Vencimento</span>
                <span style={{ ...th, padding: 0, width: 84, textAlign: "center" }}>Status</span>
                <span style={{ ...th, padding: 0, width: 104, textAlign: "center" }}>Ações</span>
              </div>

              {filtered.map((l) => {
                const stKey = statusEfetivo(l);
                const st = statusConfig[stKey] || statusConfig.pendente;
                const isEntrada = l.tipo === "receita";
                return (
                  <div
                    key={l.id}
                    onClick={() => { if (canEdit) { setEditing(l); setIsFormOpen(true); } }}
                    className="flex flex-wrap items-center gap-x-3 gap-y-2 hover:bg-white/5"
                    style={{ padding: "10px 12px", borderBottom: "1px solid #1E1E1E", cursor: canEdit ? "pointer" : "default" }}
                  >
                    <span style={{ width: 88, fontSize: 13, color: "#FFFFFF", whiteSpace: "nowrap" }}>
                      {l.data_pagamento ? format(parseISO(l.data_pagamento), "dd/MM/yyyy") : "—"}
                    </span>
                    <span
                      title={l.descricao}
                      style={{ flex: 1, minWidth: 140, fontSize: 13, fontWeight: 500, color: "#FFFFFF", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                    >
                      {l.descricao}
                      {l.fornecedor && <span style={{ fontSize: 10, color: "#555555", marginLeft: 6 }}>{l.fornecedor}</span>}
                    </span>
                    <span style={{ width: 68, fontSize: 11, fontWeight: 600, letterSpacing: "0.04em", color: isEntrada ? "#4ADE80" : "#EF4444", whiteSpace: "nowrap" }}>
                      {isEntrada ? "ENTRADA" : "SAÍDA"}
                    </span>
                    <span
                      className="hidden xl:block"
                      title={l.categoria || ""}
                      style={{ width: 110, fontSize: 13, color: "#B0B0B0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                    >
                      {l.categoria || "-"}
                    </span>
                    <span style={{ width: 92, textAlign: "right", fontSize: 13, fontWeight: 600, color: isEntrada ? "#4ADE80" : "#EF4444", whiteSpace: "nowrap" }}>
                      {fmtBRL(l.valor)}
                    </span>
                    <span className="hidden lg:block" style={{ width: 92, textAlign: "center", fontSize: 13, color: "#B0B0B0", whiteSpace: "nowrap" }}>
                      {l.data_vencimento ? format(parseISO(l.data_vencimento), "dd/MM/yyyy") : "-"}
                    </span>
                    <span style={{ width: 84, textAlign: "center" }} onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        disabled={!canEdit || l.status === "pago"}
                        onClick={() => setBaixa(l)}
                        title={canEdit && l.status !== "pago" ? (isEntrada ? "Marcar como recebido" : "Marcar como pago") : undefined}
                        style={{
                          padding: "3px 8px", borderRadius: 4, fontSize: 11, fontWeight: 500,
                          backgroundColor: st.color, color: st.textColor, border: "none",
                          cursor: canEdit && l.status !== "pago" ? "pointer" : "default",
                        }}
                      >
                        {stKey === "pago" ? (isEntrada ? "Recebido" : "Pago") : st.label}
                      </button>
                    </span>
                    <span style={{ width: 104, display: "flex", justifyContent: "center", gap: 6 }} onClick={(e) => e.stopPropagation()}>
                      {l.tipo !== "receita" && l.status !== "pago" && canEdit && (
                        <button
                          type="button"
                          onClick={() => setBaixa(l)}
                          style={{ background: "transparent", border: "1px solid rgba(74,222,128,0.3)", borderRadius: 4, cursor: "pointer", padding: "3px 8px", fontSize: 10, fontWeight: 600, color: "#4ADE80" }}
                        >
                          Pagar
                        </button>
                      )}
                      {canDelete && (
                        <button
                          type="button"
                          onClick={() => { if (confirm("Excluir este lançamento?")) deleteMut.mutate(l.id); }}
                          style={{ background: "transparent", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 4, cursor: "pointer", padding: "3px 8px", fontSize: 10, fontWeight: 600, color: "#EF4444" }}
                        >
                          Excluir
                        </button>
                      )}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      <BaixaPagamentoModal
        open={!!baixa}
        lancamento={baixa}
        isEntrada={baixa?.tipo === "receita"}
        salvando={updateMut.isPending}
        onConfirm={confirmarBaixa}
        onClose={() => setBaixa(null)}
      />
    </div>
  );
}