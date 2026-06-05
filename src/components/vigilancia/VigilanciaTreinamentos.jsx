import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, GraduationCap, AlertTriangle, CheckCircle2, Upload } from "lucide-react";

const STATUS_CFG = {
  valido:             { label: "Válido",                color: "#10b981", bg: "rgba(16,185,129,0.12)" },
  proximo_vencimento: { label: "Próximo do vencimento", color: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
  vencido:            { label: "Vencido",               color: "#ef4444", bg: "rgba(239,68,68,0.12)" },
};

function calcStatus(validade) {
  if (!validade) return "valido";
  const diff = (new Date(validade) - new Date()) / (1000 * 60 * 60 * 24);
  if (diff < 0) return "vencido";
  if (diff <= 30) return "proximo_vencimento";
  return "valido";
}

function TreinamentoForm({ item, onSave, onClose }) {
  const [form, setForm] = useState(item || {
    colaborador: "", curso: "", data: "", validade: "", certificado_url: "", status: "valido"
  });
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm(p => ({ ...p, certificado_url: file_url }));
    setUploading(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const auto = calcStatus(form.validade);
    onSave({ ...form, status: auto });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <Label className="text-xs" style={{ color: "#94a3b8" }}>Colaborador *</Label>
          <Input required value={form.colaborador} onChange={e => setForm(p => ({ ...p, colaborador: e.target.value }))}
            className="mt-1 text-sm" style={{ backgroundColor: "#1e293b", borderColor: "#334155", color: "#e2e8f0" }} />
        </div>
        <div className="col-span-2">
          <Label className="text-xs" style={{ color: "#94a3b8" }}>Curso / Treinamento *</Label>
          <Input required value={form.curso} onChange={e => setForm(p => ({ ...p, curso: e.target.value }))}
            className="mt-1 text-sm" style={{ backgroundColor: "#1e293b", borderColor: "#334155", color: "#e2e8f0" }} />
        </div>
        <div>
          <Label className="text-xs" style={{ color: "#94a3b8" }}>Data de Realização</Label>
          <Input type="date" value={form.data} onChange={e => setForm(p => ({ ...p, data: e.target.value }))}
            className="mt-1 text-sm" style={{ backgroundColor: "#1e293b", borderColor: "#334155", color: "#e2e8f0" }} />
        </div>
        <div>
          <Label className="text-xs" style={{ color: "#94a3b8" }}>Validade</Label>
          <Input type="date" value={form.validade} onChange={e => setForm(p => ({ ...p, validade: e.target.value }))}
            className="mt-1 text-sm" style={{ backgroundColor: "#1e293b", borderColor: "#334155", color: "#e2e8f0" }} />
        </div>
        <div className="col-span-2">
          <Label className="text-xs" style={{ color: "#94a3b8" }}>Certificado</Label>
          <label className="mt-1 flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border cursor-pointer hover:opacity-80 w-full"
            style={{ borderColor: "#334155", color: "#60a5fa" }}>
            <Upload className="h-3 w-3" />
            {uploading ? "Enviando..." : form.certificado_url ? "Substituir certificado" : "Anexar certificado"}
            <input type="file" className="hidden" onChange={handleUpload} disabled={uploading} />
          </label>
          {form.certificado_url && (
            <a href={form.certificado_url} target="_blank" className="text-xs text-blue-400 hover:underline mt-1 block">
              Ver certificado
            </a>
          )}
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-2 border-t" style={{ borderColor: "#1e293b" }}>
        <Button type="button" variant="ghost" onClick={onClose} style={{ color: "#94a3b8" }}>Cancelar</Button>
        <Button type="submit" style={{ backgroundColor: "#1e40af", color: "#fff" }}>
          {item ? "Salvar" : "Registrar Treinamento"}
        </Button>
      </div>
    </form>
  );
}

export default function VigilanciaTreinamentos() {
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const { data: treinamentos = [] } = useQuery({
    queryKey: ["vigilancia-treinamentos"],
    queryFn: () => base44.entities.VigilanciaTreinamento.list(),
  });

  const createMutation = useMutation({
    mutationFn: (d) => base44.entities.VigilanciaTreinamento.create(d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["vigilancia-treinamentos"] }); setFormOpen(false); },
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, d }) => base44.entities.VigilanciaTreinamento.update(id, d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["vigilancia-treinamentos"] }); setFormOpen(false); setEditing(null); },
  });

  const handleSave = (d) => {
    if (editing) updateMutation.mutate({ id: editing.id, d });
    else createMutation.mutate(d);
  };

  // Aplica status automático
  const enriched = treinamentos.map(t => ({ ...t, _status: calcStatus(t.validade) }));
  const alertas = enriched.filter(t => t._status !== "valido");

  return (
    <div className="space-y-4">
      {/* Alertas */}
      {alertas.length > 0 && (
        <div className="rounded-2xl border p-4 space-y-2"
          style={{ backgroundColor: "rgba(245,158,11,0.06)", borderColor: "rgba(245,158,11,0.25)" }}>
          <div className="flex items-center gap-2 text-yellow-400 text-sm font-medium">
            <AlertTriangle className="h-4 w-4" />
            {alertas.length} treinamento(s) requerem atenção
          </div>
          {alertas.map(t => (
            <div key={t.id} className="text-xs text-yellow-300/80 ml-6">
              {t.colaborador} — {t.curso}
              <span className="ml-1" style={{ color: STATUS_CFG[t._status]?.color }}>
                ({STATUS_CFG[t._status]?.label})
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-white">{treinamentos.length} treinamentos registrados</p>
        <Button size="sm" onClick={() => { setEditing(null); setFormOpen(true); }}
          style={{ backgroundColor: "#1e40af", color: "#fff" }}>
          <Plus className="h-4 w-4 mr-1" /> Novo Treinamento
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {enriched.map(t => {
          const cfg = STATUS_CFG[t._status] || STATUS_CFG.valido;
          return (
            <div key={t.id} className="rounded-2xl border p-4 cursor-pointer hover:border-blue-500/30 transition-colors"
              style={{ backgroundColor: "#0f172a", borderColor: t._status !== "valido" ? `${cfg.color}40` : "#1e293b" }}
              onClick={() => { setEditing(t); setFormOpen(true); }}>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-medium text-white text-sm">{t.colaborador}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{t.curso}</p>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full"
                  style={{ color: cfg.color, backgroundColor: cfg.bg }}>
                  {cfg.label}
                </span>
              </div>
              <div className="flex items-center gap-4 text-xs" style={{ color: "#64748b" }}>
                {t.data && <span>Realizado: {t.data}</span>}
                {t.validade && <span style={{ color: t._status !== "valido" ? cfg.color : "#64748b" }}>Validade: {t.validade}</span>}
                {t.certificado_url && (
                  <a href={t.certificado_url} target="_blank" onClick={e => e.stopPropagation()}
                    className="text-blue-400 hover:underline">Ver certificado</a>
                )}
              </div>
            </div>
          );
        })}
        {treinamentos.length === 0 && (
          <div className="col-span-2 text-center py-10 rounded-2xl border" style={{ borderColor: "#1e293b", color: "#64748b" }}>
            <GraduationCap className="h-8 w-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">Nenhum treinamento registrado</p>
          </div>
        )}
      </div>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent style={{ backgroundColor: "#0f172a", borderColor: "#1e293b", color: "#e2e8f0" }} className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-serif">{editing ? "Editar Treinamento" : "Novo Treinamento"}</DialogTitle>
          </DialogHeader>
          <TreinamentoForm item={editing} onSave={handleSave} onClose={() => { setFormOpen(false); setEditing(null); }} />
        </DialogContent>
      </Dialog>
    </div>
  );
}