import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

const CATS = { atendimento: "Atendimento", financeiro: "Financeiro", clinico: "Clínico", preferencias: "Preferências", administrativo: "Administrativo", pos_venda: "Pós-venda", outros: "Outros" };
const PRIORIDADES = {
  baixa: { label: "Baixa", color: "bg-gray-500/20 text-gray-400" },
  media: { label: "Média", color: "bg-yellow-500/20 text-yellow-400" },
  alta: { label: "Alta", color: "bg-orange-500/20 text-orange-400" },
  urgente: { label: "Urgente", color: "bg-red-500/20 text-red-400" }
};

export default function DossieObservacoes({ patient, currentUser }) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ observacao: "", categoria: "atendimento", prioridade: "media" });

  const { data: obs = [] } = useQuery({
    queryKey: ["dossie-obs", patient.id],
    queryFn: () => base44.entities.DossieObservacao.filter({ patient_id: patient.id }, "-data_hora", 100)
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.DossieObservacao.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dossie-obs", patient.id] });
      setShowForm(false);
      setForm({ observacao: "", categoria: "atendimento", prioridade: "media" });
    }
  });

  const handleSave = () => {
    if (!form.observacao.trim()) return;
    createMutation.mutate({
      ...form,
      patient_id: patient.id,
      patient_name: patient.full_name,
      usuario: currentUser?.full_name || currentUser?.email || "Sistema",
      data_hora: new Date().toISOString()
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setShowForm(!showForm)} size="sm" className="bg-[#C5A059] hover:bg-[#a17f3f] text-black text-xs">
          Nova Observação
        </Button>
      </div>

      {showForm && (
        <div className="border border-[#252D3E] rounded-md p-5 bg-[#0F1521] space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-[#8A95AA] text-xs uppercase tracking-wider">Categoria</Label>
              <Select value={form.categoria} onValueChange={(v) => setForm(p => ({ ...p, categoria: v }))}>
                <SelectTrigger className="mt-1 bg-[#1A2030] border-[#252D3E] text-white"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-[#171D29] border-[#252D3E]">
                  {Object.entries(CATS).map(([k, v]) => <SelectItem key={k} value={k} className="text-white">{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[#8A95AA] text-xs uppercase tracking-wider">Prioridade</Label>
              <Select value={form.prioridade} onValueChange={(v) => setForm(p => ({ ...p, prioridade: v }))}>
                <SelectTrigger className="mt-1 bg-[#1A2030] border-[#252D3E] text-white"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-[#171D29] border-[#252D3E]">
                  {Object.entries(PRIORIDADES).map(([k, v]) => <SelectItem key={k} value={k} className="text-white">{v.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Label className="text-[#8A95AA] text-xs uppercase tracking-wider">Observação</Label>
              <Textarea value={form.observacao} onChange={(e) => setForm(p => ({ ...p, observacao: e.target.value }))} rows={3} className="mt-1 bg-[#1A2030] border-[#252D3E] text-white" />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-[#252D3E]">
            <Button onClick={() => setShowForm(false)} variant="ghost" size="sm" className="text-gray-400">Cancelar</Button>
            <Button onClick={handleSave} size="sm" className="bg-[#C5A059] hover:bg-[#a17f3f] text-black" disabled={createMutation.isPending || !form.observacao.trim()}>
              {createMutation.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {obs.length === 0 && (
          <div className="text-center py-10 text-[#4A5568] text-sm">Nenhuma observação registrada</div>
        )}
        {obs.map((o) => (
          <div key={o.id} className="border border-[#252D3E] rounded-md bg-[#0F1521] p-4">
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm text-[#C8D0DF] flex-1 whitespace-pre-wrap">{o.observacao}</p>
              <Badge className={PRIORIDADES[o.prioridade]?.color}>{PRIORIDADES[o.prioridade]?.label}</Badge>
            </div>
            <div className="flex items-center gap-3 mt-2 text-xs text-[#4A5568]">
              <Badge variant="outline" className="text-xs border-[#252D3E] text-[#8A95AA]">{CATS[o.categoria]}</Badge>
              <span>{o.usuario}</span>
              {o.data_hora && <span>{format(parseISO(o.data_hora), "dd/MM/yyyy HH:mm", { locale: ptBR })}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}