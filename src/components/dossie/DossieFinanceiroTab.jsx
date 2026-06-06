import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { format, parseISO } from "date-fns";

const STATUS_FIN = {
  pendente: { label: "Pendente", color: "bg-yellow-500/20 text-yellow-400" },
  entrada_paga: { label: "Entrada Paga", color: "bg-blue-500/20 text-blue-400" },
  pago_parcial: { label: "Pago Parcial", color: "bg-orange-500/20 text-orange-400" },
  pago_integral: { label: "Pago Integral", color: "bg-green-500/20 text-green-400" },
  aguardando_conferencia: { label: "Aguard. Conferência", color: "bg-purple-500/20 text-purple-400" },
  conferido: { label: "Conferido", color: "bg-emerald-500/20 text-emerald-400" },
  em_atraso: { label: "Em Atraso", color: "bg-red-500/20 text-red-400" },
  cancelado: { label: "Cancelado", color: "bg-gray-500/20 text-gray-400" },
  reembolsado: { label: "Reembolsado", color: "bg-pink-500/20 text-pink-400" }
};

const PAGAMENTOS = ["pix", "dinheiro", "cartao_credito", "cartao_debito", "transferencia", "boleto", "link_pagamento", "outro"];
const PAG_LABELS = { pix: "PIX", dinheiro: "Dinheiro", cartao_credito: "Cartão de Crédito", cartao_debito: "Cartão de Débito", transferencia: "Transferência", boleto: "Boleto", link_pagamento: "Link de Pagamento", outro: "Outro" };

export default function DossieFinanceiroTab({ patient, currentUser }) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showComprovante, setShowComprovante] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [comprForm, setComprForm] = useState({ nome: "", tipo_pagamento: "pix", valor: "", data_pagamento: "", procedimento: "", observacao: "", file: null });

  const [form, setForm] = useState({
    procedimento: "", valor_total: "", entrada: "", num_parcelas: 1,
    forma_pagamento: "pix", status_financeiro: "pendente",
    data_vencimento: "", data_pagamento: "", observacoes: ""
  });

  const { data: registros = [] } = useQuery({
    queryKey: ["dossie-financeiro", patient.id],
    queryFn: () => base44.entities.DossieFinanceiro.filter({ patient_id: patient.id }, "-created_date", 100)
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.DossieFinanceiro.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dossie-financeiro", patient.id] });
      setShowForm(false);
      resetForm();
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.DossieFinanceiro.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dossie-financeiro", patient.id] });
      setEditingId(null);
    }
  });

  const resetForm = () => setForm({ procedimento: "", valor_total: "", entrada: "", num_parcelas: 1, forma_pagamento: "pix", status_financeiro: "pendente", data_vencimento: "", data_pagamento: "", observacoes: "" });

  const handleSave = () => {
    const payload = {
      ...form,
      patient_id: patient.id,
      patient_name: patient.full_name,
      valor_total: parseFloat(form.valor_total) || 0,
      entrada: parseFloat(form.entrada) || 0,
      num_parcelas: parseInt(form.num_parcelas) || 1,
      comprovantes: []
    };
    if (editingId) updateMutation.mutate({ id: editingId, data: form });
    else createMutation.mutate(payload);
  };

  const handleAddComprovante = async (registro) => {
    if (!comprForm.file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: comprForm.file });
      const novoCompr = {
        nome: comprForm.nome || comprForm.file.name,
        tipo_pagamento: comprForm.tipo_pagamento,
        valor: parseFloat(comprForm.valor) || 0,
        data_pagamento: comprForm.data_pagamento,
        procedimento: comprForm.procedimento || registro.procedimento,
        observacao: comprForm.observacao,
        file_url,
        data_upload: new Date().toISOString(),
        usuario: currentUser?.full_name || currentUser?.email || "Sistema"
      };
      const updated = [...(registro.comprovantes || []), novoCompr];
      await updateMutation.mutateAsync({ id: registro.id, data: { comprovantes: updated } });
      setShowComprovante(null);
      setComprForm({ nome: "", tipo_pagamento: "pix", valor: "", data_pagamento: "", procedimento: "", observacao: "", file: null });
    } finally {
      setUploading(false);
    }
  };

  const fmtMoney = (v) => v ? `R$ ${parseFloat(v).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "—";

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setShowForm(!showForm)} size="sm" className="bg-[#C5A059] hover:bg-[#a17f3f] text-black text-xs">
          Novo Registro Financeiro
        </Button>
      </div>

      {showForm && (
        <div className="border border-[#252D3E] rounded-md p-5 bg-[#0F1521] space-y-4">
          <h3 className="text-sm font-medium text-white">Registro Financeiro</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Label className="text-[#8A95AA] text-xs uppercase tracking-wider">Procedimento Contratado</Label>
              <Input value={form.procedimento} onChange={(e) => setForm(p => ({ ...p, procedimento: e.target.value }))} className="mt-1 bg-[#1A2030] border-[#252D3E] text-white" />
            </div>
            <div>
              <Label className="text-[#8A95AA] text-xs uppercase tracking-wider">Valor Total (R$)</Label>
              <Input type="number" value={form.valor_total} onChange={(e) => setForm(p => ({ ...p, valor_total: e.target.value }))} className="mt-1 bg-[#1A2030] border-[#252D3E] text-white" />
            </div>
            <div>
              <Label className="text-[#8A95AA] text-xs uppercase tracking-wider">Entrada (R$)</Label>
              <Input type="number" value={form.entrada} onChange={(e) => setForm(p => ({ ...p, entrada: e.target.value }))} className="mt-1 bg-[#1A2030] border-[#252D3E] text-white" />
            </div>
            <div>
              <Label className="text-[#8A95AA] text-xs uppercase tracking-wider">Nº de Parcelas</Label>
              <Input type="number" min="1" value={form.num_parcelas} onChange={(e) => setForm(p => ({ ...p, num_parcelas: e.target.value }))} className="mt-1 bg-[#1A2030] border-[#252D3E] text-white" />
            </div>
            <div>
              <Label className="text-[#8A95AA] text-xs uppercase tracking-wider">Forma de Pagamento</Label>
              <Select value={form.forma_pagamento} onValueChange={(v) => setForm(p => ({ ...p, forma_pagamento: v }))}>
                <SelectTrigger className="mt-1 bg-[#1A2030] border-[#252D3E] text-white"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-[#171D29] border-[#252D3E]">
                  {PAGAMENTOS.map(p => <SelectItem key={p} value={p} className="text-white">{PAG_LABELS[p]}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[#8A95AA] text-xs uppercase tracking-wider">Status Financeiro</Label>
              <Select value={form.status_financeiro} onValueChange={(v) => setForm(p => ({ ...p, status_financeiro: v }))}>
                <SelectTrigger className="mt-1 bg-[#1A2030] border-[#252D3E] text-white"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-[#171D29] border-[#252D3E]">
                  {Object.entries(STATUS_FIN).map(([k, v]) => <SelectItem key={k} value={k} className="text-white">{v.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[#8A95AA] text-xs uppercase tracking-wider">Data de Vencimento</Label>
              <Input type="date" value={form.data_vencimento} onChange={(e) => setForm(p => ({ ...p, data_vencimento: e.target.value }))} className="mt-1 bg-[#1A2030] border-[#252D3E] text-white" />
            </div>
            <div>
              <Label className="text-[#8A95AA] text-xs uppercase tracking-wider">Data de Pagamento</Label>
              <Input type="date" value={form.data_pagamento} onChange={(e) => setForm(p => ({ ...p, data_pagamento: e.target.value }))} className="mt-1 bg-[#1A2030] border-[#252D3E] text-white" />
            </div>
            <div className="sm:col-span-2">
              <Label className="text-[#8A95AA] text-xs uppercase tracking-wider">Observações</Label>
              <Textarea value={form.observacoes} onChange={(e) => setForm(p => ({ ...p, observacoes: e.target.value }))} rows={2} className="mt-1 bg-[#1A2030] border-[#252D3E] text-white" />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-[#252D3E]">
            <Button onClick={() => setShowForm(false)} variant="ghost" size="sm" className="text-gray-400">Cancelar</Button>
            <Button onClick={handleSave} size="sm" className="bg-[#C5A059] hover:bg-[#a17f3f] text-black" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {registros.length === 0 && (
          <div className="text-center py-10 text-[#4A5568] text-sm">Nenhum registro financeiro</div>
        )}
        {registros.map((reg) => (
          <div key={reg.id} className="border border-[#252D3E] rounded-md bg-[#0F1521] p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="text-white font-medium">{reg.procedimento}</p>
                <div className="flex items-center gap-3 mt-1">
                  <Badge className={STATUS_FIN[reg.status_financeiro]?.color}>{STATUS_FIN[reg.status_financeiro]?.label}</Badge>
                  <span className="text-xs text-[#8A95AA]">{PAG_LABELS[reg.forma_pagamento]}</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[#C5A059] font-semibold">{fmtMoney(reg.valor_total)}</p>
                {reg.entrada > 0 && <p className="text-xs text-[#8A95AA]">Entrada: {fmtMoney(reg.entrada)}</p>}
                {reg.num_parcelas > 1 && <p className="text-xs text-[#8A95AA]">{reg.num_parcelas}x de {fmtMoney(reg.valor_total / reg.num_parcelas)}</p>}
              </div>
            </div>

            {(reg.data_vencimento || reg.data_pagamento || reg.observacoes) && (
              <div className="mt-3 pt-3 border-t border-[#252D3E] grid grid-cols-2 gap-2 text-xs">
                {reg.data_vencimento && <p className="text-[#8A95AA]">Vencimento: <span className="text-white">{format(parseISO(reg.data_vencimento), "dd/MM/yyyy")}</span></p>}
                {reg.data_pagamento && <p className="text-[#8A95AA]">Pagamento: <span className="text-white">{format(parseISO(reg.data_pagamento), "dd/MM/yyyy")}</span></p>}
                {reg.observacoes && <p className="col-span-2 text-[#8A95AA]">{reg.observacoes}</p>}
              </div>
            )}

            {/* Comprovantes */}
            {reg.comprovantes?.length > 0 && (
              <div className="mt-3 pt-3 border-t border-[#252D3E]">
                <p className="text-xs uppercase tracking-wider text-[#8A95AA] mb-2">Comprovantes</p>
                <div className="space-y-1">
                  {reg.comprovantes.map((c, i) => (
                    <div key={i} className="flex items-center justify-between bg-[#1A2030] rounded px-3 py-1.5">
                      <div>
                        <span className="text-xs text-white">{c.nome}</span>
                        <span className="text-xs text-[#8A95AA] ml-2">{PAG_LABELS[c.tipo_pagamento]} · {fmtMoney(c.valor)}</span>
                      </div>
                      <a href={c.file_url} target="_blank" rel="noreferrer">
                        <Button size="sm" variant="ghost" className="text-xs text-[#C5A059] h-6 px-2">Ver</Button>
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-3 flex gap-2">
              <Button onClick={() => setShowComprovante(reg.id)} size="sm" variant="outline" className="border-[#252D3E] text-[#8A95AA] text-xs h-7">
                Anexar Comprovante
              </Button>
            </div>

            {showComprovante === reg.id && (
              <div className="mt-3 pt-3 border-t border-[#252D3E] space-y-3">
                <h4 className="text-xs font-medium text-white">Novo Comprovante</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-[#8A95AA] text-xs">Nome</Label>
                    <Input value={comprForm.nome} onChange={(e) => setComprForm(p => ({ ...p, nome: e.target.value }))} className="mt-1 bg-[#1A2030] border-[#252D3E] text-white text-xs h-8" />
                  </div>
                  <div>
                    <Label className="text-[#8A95AA] text-xs">Tipo de Pagamento</Label>
                    <Select value={comprForm.tipo_pagamento} onValueChange={(v) => setComprForm(p => ({ ...p, tipo_pagamento: v }))}>
                      <SelectTrigger className="mt-1 bg-[#1A2030] border-[#252D3E] text-white h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-[#171D29] border-[#252D3E]">
                        {PAGAMENTOS.map(p => <SelectItem key={p} value={p} className="text-white text-xs">{PAG_LABELS[p]}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-[#8A95AA] text-xs">Valor (R$)</Label>
                    <Input type="number" value={comprForm.valor} onChange={(e) => setComprForm(p => ({ ...p, valor: e.target.value }))} className="mt-1 bg-[#1A2030] border-[#252D3E] text-white text-xs h-8" />
                  </div>
                  <div>
                    <Label className="text-[#8A95AA] text-xs">Data do Pagamento</Label>
                    <Input type="date" value={comprForm.data_pagamento} onChange={(e) => setComprForm(p => ({ ...p, data_pagamento: e.target.value }))} className="mt-1 bg-[#1A2030] border-[#252D3E] text-white text-xs h-8" />
                  </div>
                  <div className="col-span-2">
                    <Label className="text-[#8A95AA] text-xs">Arquivo (PDF, JPG, PNG)</Label>
                    <Input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => setComprForm(p => ({ ...p, file: e.target.files[0] }))} className="mt-1 bg-[#1A2030] border-[#252D3E] text-white text-xs h-8" />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button onClick={() => setShowComprovante(null)} variant="ghost" size="sm" className="text-gray-400 text-xs">Cancelar</Button>
                  <Button onClick={() => handleAddComprovante(reg)} size="sm" className="bg-[#C5A059] hover:bg-[#a17f3f] text-black text-xs" disabled={!comprForm.file || uploading}>
                    {uploading ? "Enviando..." : "Salvar Comprovante"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}