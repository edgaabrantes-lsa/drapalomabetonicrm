import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, AlertTriangle, CheckCircle2, Wrench, Upload, X } from "lucide-react";
import { format } from "date-fns";

const STATUS_CFG = {
  ativo:       { label: "Ativo",       color: "#10b981", bg: "rgba(16,185,129,0.12)" },
  manutencao:  { label: "Manutenção",  color: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
  inativo:     { label: "Inativo",     color: "#ef4444", bg: "rgba(239,68,68,0.12)" },
};

function daysDiff(dateStr) {
  if (!dateStr) return null;
  return Math.round((new Date(dateStr) - new Date()) / (1000 * 60 * 60 * 24));
}

function EquipamentoForm({ equip, onSave, onClose }) {
  const [form, setForm] = useState(equip || {
    nome: "", fabricante: "", numero_serie: "", data_compra: "",
    data_manutencao: "", proxima_manutencao: "", status: "ativo",
    nota_fiscal_url: "", manual_url: "", registro: "", observacoes: ""
  });
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e, field) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm(p => ({ ...p, [field]: file_url }));
    setUploading(false);
  };

  return (
    <form onSubmit={e => { e.preventDefault(); onSave(form); }}
      className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <Label className="text-xs" style={{ color: "#94a3b8" }}>Nome do Equipamento *</Label>
          <Input value={form.nome} required onChange={e => setForm(p => ({ ...p, nome: e.target.value }))}
            className="mt-1 text-sm" style={{ backgroundColor: "#1e293b", borderColor: "#334155", color: "#e2e8f0" }} />
        </div>
        <div>
          <Label className="text-xs" style={{ color: "#94a3b8" }}>Fabricante</Label>
          <Input value={form.fabricante} onChange={e => setForm(p => ({ ...p, fabricante: e.target.value }))}
            className="mt-1 text-sm" style={{ backgroundColor: "#1e293b", borderColor: "#334155", color: "#e2e8f0" }} />
        </div>
        <div>
          <Label className="text-xs" style={{ color: "#94a3b8" }}>Número de Série</Label>
          <Input value={form.numero_serie} onChange={e => setForm(p => ({ ...p, numero_serie: e.target.value }))}
            className="mt-1 text-sm" style={{ backgroundColor: "#1e293b", borderColor: "#334155", color: "#e2e8f0" }} />
        </div>
        <div>
          <Label className="text-xs" style={{ color: "#94a3b8" }}>Data de Compra</Label>
          <Input type="date" value={form.data_compra} onChange={e => setForm(p => ({ ...p, data_compra: e.target.value }))}
            className="mt-1 text-sm" style={{ backgroundColor: "#1e293b", borderColor: "#334155", color: "#e2e8f0" }} />
        </div>
        <div>
          <Label className="text-xs" style={{ color: "#94a3b8" }}>Última Manutenção</Label>
          <Input type="date" value={form.data_manutencao} onChange={e => setForm(p => ({ ...p, data_manutencao: e.target.value }))}
            className="mt-1 text-sm" style={{ backgroundColor: "#1e293b", borderColor: "#334155", color: "#e2e8f0" }} />
        </div>
        <div>
          <Label className="text-xs" style={{ color: "#94a3b8" }}>Próxima Manutenção</Label>
          <Input type="date" value={form.proxima_manutencao} onChange={e => setForm(p => ({ ...p, proxima_manutencao: e.target.value }))}
            className="mt-1 text-sm" style={{ backgroundColor: "#1e293b", borderColor: "#334155", color: "#e2e8f0" }} />
        </div>
        <div>
          <Label className="text-xs" style={{ color: "#94a3b8" }}>Status</Label>
          <Select value={form.status} onValueChange={v => setForm(p => ({ ...p, status: v }))}>
            <SelectTrigger className="mt-1 text-sm" style={{ backgroundColor: "#1e293b", borderColor: "#334155", color: "#e2e8f0" }}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent style={{ backgroundColor: "#1e293b", borderColor: "#334155" }}>
              {Object.entries(STATUS_CFG).map(([k, v]) => (
                <SelectItem key={k} value={k} className="text-slate-200 text-sm">{v.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="col-span-2">
          <Label className="text-xs" style={{ color: "#94a3b8" }}>Registro / Certificado</Label>
          <Input value={form.registro} onChange={e => setForm(p => ({ ...p, registro: e.target.value }))}
            className="mt-1 text-sm" style={{ backgroundColor: "#1e293b", borderColor: "#334155", color: "#e2e8f0" }} />
        </div>
        <div>
          <Label className="text-xs" style={{ color: "#94a3b8" }}>Nota Fiscal</Label>
          <label className="mt-1 flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border cursor-pointer hover:opacity-80 w-full"
            style={{ borderColor: "#334155", color: "#60a5fa" }}>
            <Upload className="h-3 w-3" />
            {form.nota_fiscal_url ? "Substituir" : "Anexar PDF"}
            <input type="file" className="hidden" onChange={e => handleUpload(e, "nota_fiscal_url")} />
          </label>
          {form.nota_fiscal_url && <a href={form.nota_fiscal_url} target="_blank" className="text-xs text-blue-400 hover:underline mt-1 block">Ver arquivo</a>}
        </div>
        <div>
          <Label className="text-xs" style={{ color: "#94a3b8" }}>Manual</Label>
          <label className="mt-1 flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border cursor-pointer hover:opacity-80 w-full"
            style={{ borderColor: "#334155", color: "#60a5fa" }}>
            <Upload className="h-3 w-3" />
            {form.manual_url ? "Substituir" : "Anexar PDF"}
            <input type="file" className="hidden" onChange={e => handleUpload(e, "manual_url")} />
          </label>
          {form.manual_url && <a href={form.manual_url} target="_blank" className="text-xs text-blue-400 hover:underline mt-1 block">Ver arquivo</a>}
        </div>
        <div className="col-span-2">
          <Label className="text-xs" style={{ color: "#94a3b8" }}>Observações</Label>
          <Textarea value={form.observacoes} rows={2} onChange={e => setForm(p => ({ ...p, observacoes: e.target.value }))}
            className="mt-1 text-sm resize-none" style={{ backgroundColor: "#1e293b", borderColor: "#334155", color: "#e2e8f0" }} />
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-2 border-t" style={{ borderColor: "#1e293b" }}>
        <Button type="button" variant="ghost" onClick={onClose} style={{ color: "#94a3b8" }}>Cancelar</Button>
        <Button type="submit" style={{ backgroundColor: "#1e40af", color: "#fff" }}>
          {equip ? "Salvar" : "Cadastrar Equipamento"}
        </Button>
      </div>
    </form>
  );
}

export default function VigilanciaEquipamentos() {
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const { data: equipamentos = [] } = useQuery({
    queryKey: ["vigilancia-equipamentos"],
    queryFn: () => base44.entities.VigilanciaEquipamento.list(),
  });

  const createMutation = useMutation({
    mutationFn: (d) => base44.entities.VigilanciaEquipamento.create(d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["vigilancia-equipamentos"] }); setFormOpen(false); setEditing(null); },
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, d }) => base44.entities.VigilanciaEquipamento.update(id, d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["vigilancia-equipamentos"] }); setFormOpen(false); setEditing(null); },
  });

  const handleSave = (d) => {
    if (editing) updateMutation.mutate({ id: editing.id, d });
    else createMutation.mutate(d);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-white">{equipamentos.length} equipamentos cadastrados</p>
        <Button size="sm" onClick={() => { setEditing(null); setFormOpen(true); }}
          style={{ backgroundColor: "#1e40af", color: "#fff" }}>
          <Plus className="h-4 w-4 mr-1" /> Novo Equipamento
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {equipamentos.map(e => {
          const diff = daysDiff(e.proxima_manutencao);
          const alert = diff !== null && diff <= 30;
          const cfg = STATUS_CFG[e.status] || STATUS_CFG.ativo;
          return (
            <div key={e.id} className="rounded-2xl border p-4 space-y-3 cursor-pointer hover:border-blue-500/30 transition-colors"
              style={{ backgroundColor: "#0f172a", borderColor: alert ? "#dc2626" : "#1e293b" }}
              onClick={() => { setEditing(e); setFormOpen(true); }}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-white">{e.nome}</p>
                  {e.fabricante && <p className="text-xs text-slate-400">{e.fabricante}</p>}
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full"
                  style={{ color: cfg.color, backgroundColor: cfg.bg }}>
                  {cfg.label}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {e.numero_serie && (
                  <div><span style={{ color: "#64748b" }}>Série: </span><span className="text-slate-300">{e.numero_serie}</span></div>
                )}
                {e.data_manutencao && (
                  <div><span style={{ color: "#64748b" }}>Última manut.: </span><span className="text-slate-300">{e.data_manutencao}</span></div>
                )}
                {e.proxima_manutencao && (
                  <div className={alert ? "col-span-2" : ""}>
                    <span style={{ color: "#64748b" }}>Próxima manut.: </span>
                    <span style={{ color: alert ? "#ef4444" : "#94a3b8" }}>
                      {e.proxima_manutencao} {alert && `(${diff <= 0 ? "vencida" : `${diff}d`})`}
                    </span>
                  </div>
                )}
              </div>
              {alert && (
                <div className="flex items-center gap-1.5 text-xs" style={{ color: "#fca5a5" }}>
                  <AlertTriangle className="h-3 w-3" />
                  Manutenção {diff <= 0 ? "vencida" : "próxima do vencimento"}
                </div>
              )}
            </div>
          );
        })}
        {equipamentos.length === 0 && (
          <div className="col-span-2 text-center py-10 rounded-2xl border" style={{ borderColor: "#1e293b", color: "#64748b" }}>
            <Wrench className="h-8 w-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">Nenhum equipamento cadastrado</p>
          </div>
        )}
      </div>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent style={{ backgroundColor: "#0f172a", borderColor: "#1e293b", color: "#e2e8f0" }} className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="font-serif">{editing ? "Editar Equipamento" : "Novo Equipamento"}</DialogTitle>
          </DialogHeader>
          <EquipamentoForm equip={editing} onSave={handleSave} onClose={() => { setFormOpen(false); setEditing(null); }} />
        </DialogContent>
      </Dialog>
    </div>
  );
}