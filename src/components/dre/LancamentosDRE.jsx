import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, parseISO } from "date-fns";
import { Plus, Trash2, CheckCircle, Repeat } from "lucide-react";
import LancamentoForm from "./LancamentoForm";
import { fmtBRL, DRE_TIPOS } from "@/lib/dreUtils";
import { usePermissions } from "@/lib/PermissionsContext";

const statusConfig = {
  pago: { label: "Pago", color: "rgba(74,222,128,0.15)", textColor: "#4ADE80" },
  pendente: { label: "Pendente", color: "rgba(245,158,11,0.15)", textColor: "#F59E0B" },
  vencido: { label: "Vencido", color: "rgba(239,68,68,0.15)", textColor: "#EF4444" },
  cancelado: { label: "Cancelado", color: "rgba(107,114,128,0.15)", textColor: "#6B7280" },
};

export default function LancamentosDRE() {
  const queryClient = useQueryClient();
  const { hasAction } = usePermissions();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [tipoFilter, setTipoFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: lancamentos = [], isLoading } = useQuery({
    queryKey: ["dreLancamentos"],
    queryFn: () => base44.entities.DRELancamento.list("-created_date", 2000),
  });

  const createMut = useMutation({
    mutationFn: (data) => base44.entities.DRELancamento.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["dreLancamentos"] }); setIsFormOpen(false); setEditing(null); },
  });
  const updateMut = useMutation({
    mutationFn: ({ id, data }) => base44.entities.DRELancamento.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["dreLancamentos"] }); setIsFormOpen(false); setEditing(null); },
  });
  const deleteMut = useMutation({
    mutationFn: (id) => base44.entities.DRELancamento.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["dreLancamentos"] }),
  });

  const handleSave = (data) => {
    if (editing) updateMut.mutate({ id: editing.id, data });
    else createMut.mutate(data);
  };

  const filtered = lancamentos.filter((l) => {
    if (tipoFilter !== "all" && l.tipo !== tipoFilter) return false;
    if (statusFilter !== "all" && l.status !== statusFilter) return false;
    return true;
  });

  const canEdit = hasAction("editar");
  const canDelete = hasAction("excluir");

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex gap-3">
          <Select value={tipoFilter} onValueChange={setTipoFilter}>
            <SelectTrigger className="w-40 bg-[#121212] border-[#2B2B2B] text-white" style={{ height: 34, fontSize: 13 }}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#1A1A1A] border-[#2B2B2B]">
              <SelectItem value="all" className="text-white">Todos os Tipos</SelectItem>
              {Object.entries(DRE_TIPOS).map(([k, v]) => (
                <SelectItem key={k} value={k} className="text-white">{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36 bg-[#121212] border-[#2B2B2B] text-white" style={{ height: 34, fontSize: 13 }}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#1A1A1A] border-[#2B2B2B]">
              <SelectItem value="all" className="text-white">Todos Status</SelectItem>
              {Object.entries(statusConfig).map(([k, v]) => (
                <SelectItem key={k} value={k} className="text-white">{v.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {canEdit && (
          <Dialog open={isFormOpen} onOpenChange={(o) => { setIsFormOpen(o); if (!o) setEditing(null); }}>
            <DialogTrigger asChild>
              <button
                style={{
                  background: "#C8A96A",
                  color: "#000",
                  border: "none",
                  borderRadius: 6,
                  fontSize: 13,
                  fontWeight: 600,
                  padding: "8px 18px",
                  height: 36,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <Plus style={{ width: 14, height: 14 }} /> Novo Lançamento
              </button>
            </DialogTrigger>
            <DialogContent className="text-white max-w-lg max-h-[90vh] overflow-hidden flex flex-col" style={{ backgroundColor: "#1A1A1A", borderColor: "#2B2B2B" }}>
              <DialogHeader className="flex-shrink-0">
                <DialogTitle style={{ fontSize: 16, fontWeight: 600, color: "#FFFFFF" }}>
                  {editing ? "Editar Lançamento" : "Novo Lançamento"}
                </DialogTitle>
              </DialogHeader>
              <LancamentoForm
                lancamento={editing}
                onSave={handleSave}
                onClose={() => { setIsFormOpen(false); setEditing(null); }}
              />
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Table */}
      <div
        style={{
          backgroundColor: "#1A1A1A",
          border: "1px solid #2B2B2B",
          borderRadius: 8,
          overflow: "hidden",
          overflowX: "auto",
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
              Crie lançamentos manuais para despesas fixas, variáveis, custos diretos e outras receitas não importadas do módulo financeiro.
            </p>
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 800 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #2B2B2B" }}>
                <th style={{ textAlign: "left", padding: "10px 14px", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", color: "#666666" }}>Descrição</th>
                <th style={{ textAlign: "left", padding: "10px 14px", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", color: "#666666" }}>Tipo</th>
                <th style={{ textAlign: "left", padding: "10px 14px", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", color: "#666666" }}>Categoria</th>
                <th style={{ textAlign: "right", padding: "10px 14px", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", color: "#666666" }}>Valor</th>
                <th style={{ textAlign: "center", padding: "10px 14px", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", color: "#666666" }}>Vencimento</th>
                <th style={{ textAlign: "center", padding: "10px 14px", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", color: "#666666" }}>Status</th>
                <th style={{ textAlign: "center", padding: "10px 14px", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", color: "#666666" }}>Rec.</th>
                <th style={{ textAlign: "center", padding: "10px 14px", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", color: "#666666" }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((l) => {
                const st = statusConfig[l.status] || statusConfig.pendente;
                return (
                  <tr
                    key={l.id}
                    style={{ borderBottom: "1px solid #1E1E1E", cursor: "pointer" }}
                    onClick={() => { if (canEdit) { setEditing(l); setIsFormOpen(true); } }}
                    className="hover:bg-white/5"
                  >
                    <td style={{ padding: "10px 14px", fontSize: 13, color: "#FFFFFF", fontWeight: 500 }}>{l.descricao}</td>
                    <td style={{ padding: "10px 14px", fontSize: 12, color: "#B0B0B0" }}>{DRE_TIPOS[l.tipo]}</td>
                    <td style={{ padding: "10px 14px", fontSize: 12, color: "#B0B0B0" }}>{l.categoria || "-"}</td>
                    <td style={{ padding: "10px 14px", fontSize: 13, fontWeight: 600, color: l.tipo === "receita" ? "#4ADE80" : "#EF4444", textAlign: "right" }}>{fmtBRL(l.valor)}</td>
                    <td style={{ padding: "10px 14px", fontSize: 12, color: "#B0B0B0", textAlign: "center" }}>
                      {l.data_vencimento ? format(parseISO(l.data_vencimento), "dd/MM/yyyy") : "-"}
                    </td>
                    <td style={{ padding: "10px 14px", textAlign: "center" }}>
                      <span style={{ display: "inline-block", padding: "3px 8px", borderRadius: 4, fontSize: 11, fontWeight: 500, backgroundColor: st.color, color: st.textColor }}>
                        {st.label}
                      </span>
                    </td>
                    <td style={{ padding: "10px 14px", textAlign: "center" }}>
                      {l.recorrencia && l.recorrencia !== "unica" ? (
                        <Repeat style={{ width: 13, height: 13, color: "#C8A96A", display: "inline-block" }} />
                      ) : (
                        <span style={{ color: "#3A3A3A", fontSize: 11 }}>-</span>
                      )}
                    </td>
                    <td style={{ padding: "10px 14px", textAlign: "center" }} onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center" style={{ gap: 6 }}>
                        {l.status !== "pago" && canEdit && (
                          <button
                            onClick={() => updateMut.mutate({ id: l.id, data: { ...l, status: "pago", data_pagamento: format(new Date(), "yyyy-MM-dd") } })}
                            title="Marcar como pago"
                            style={{ background: "transparent", border: "none", cursor: "pointer", padding: 4 }}
                          >
                            <CheckCircle style={{ width: 15, height: 15, color: "#4ADE80" }} />
                          </button>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => { if (confirm("Excluir este lançamento?")) deleteMut.mutate(l.id); }}
                            title="Excluir"
                            style={{ background: "transparent", border: "none", cursor: "pointer", padding: 4 }}
                          >
                            <Trash2 style={{ width: 15, height: 15, color: "#EF4444" }} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}