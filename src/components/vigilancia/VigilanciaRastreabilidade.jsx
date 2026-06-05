import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Search, ScanBarcode } from "lucide-react";

function RastreabilidadeForm({ item, onSave, onClose }) {
  const [form, setForm] = useState(item || {
    produto: "", fabricante: "", lote: "", validade: "",
    paciente: "", profissional: "", quantidade: "", unidade: "ml",
    data_procedimento: "", observacoes: ""
  });

  return (
    <form onSubmit={e => { e.preventDefault(); onSave(form); }}
      className="space-y-3 max-h-[65vh] overflow-y-auto pr-1">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <Label className="text-xs" style={{ color: "#94a3b8" }}>Produto *</Label>
          <Input required value={form.produto} onChange={e => setForm(p => ({ ...p, produto: e.target.value }))}
            className="mt-1 text-sm" style={{ backgroundColor: "#1e293b", borderColor: "#334155", color: "#e2e8f0" }} />
        </div>
        <div>
          <Label className="text-xs" style={{ color: "#94a3b8" }}>Fabricante</Label>
          <Input value={form.fabricante} onChange={e => setForm(p => ({ ...p, fabricante: e.target.value }))}
            className="mt-1 text-sm" style={{ backgroundColor: "#1e293b", borderColor: "#334155", color: "#e2e8f0" }} />
        </div>
        <div>
          <Label className="text-xs" style={{ color: "#94a3b8" }}>Lote *</Label>
          <Input required value={form.lote} onChange={e => setForm(p => ({ ...p, lote: e.target.value }))}
            className="mt-1 text-sm" style={{ backgroundColor: "#1e293b", borderColor: "#334155", color: "#e2e8f0" }} />
        </div>
        <div>
          <Label className="text-xs" style={{ color: "#94a3b8" }}>Validade</Label>
          <Input type="date" value={form.validade} onChange={e => setForm(p => ({ ...p, validade: e.target.value }))}
            className="mt-1 text-sm" style={{ backgroundColor: "#1e293b", borderColor: "#334155", color: "#e2e8f0" }} />
        </div>
        <div>
          <Label className="text-xs" style={{ color: "#94a3b8" }}>Data do Procedimento *</Label>
          <Input type="date" required value={form.data_procedimento} onChange={e => setForm(p => ({ ...p, data_procedimento: e.target.value }))}
            className="mt-1 text-sm" style={{ backgroundColor: "#1e293b", borderColor: "#334155", color: "#e2e8f0" }} />
        </div>
        <div>
          <Label className="text-xs" style={{ color: "#94a3b8" }}>Paciente</Label>
          <Input value={form.paciente} onChange={e => setForm(p => ({ ...p, paciente: e.target.value }))}
            className="mt-1 text-sm" style={{ backgroundColor: "#1e293b", borderColor: "#334155", color: "#e2e8f0" }} />
        </div>
        <div>
          <Label className="text-xs" style={{ color: "#94a3b8" }}>Profissional</Label>
          <Input value={form.profissional} onChange={e => setForm(p => ({ ...p, profissional: e.target.value }))}
            className="mt-1 text-sm" style={{ backgroundColor: "#1e293b", borderColor: "#334155", color: "#e2e8f0" }} />
        </div>
        <div>
          <Label className="text-xs" style={{ color: "#94a3b8" }}>Quantidade</Label>
          <Input type="number" value={form.quantidade} onChange={e => setForm(p => ({ ...p, quantidade: e.target.value }))}
            className="mt-1 text-sm" style={{ backgroundColor: "#1e293b", borderColor: "#334155", color: "#e2e8f0" }} />
        </div>
        <div>
          <Label className="text-xs" style={{ color: "#94a3b8" }}>Unidade</Label>
          <Input value={form.unidade} onChange={e => setForm(p => ({ ...p, unidade: e.target.value }))}
            className="mt-1 text-sm" style={{ backgroundColor: "#1e293b", borderColor: "#334155", color: "#e2e8f0" }} />
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
          {item ? "Salvar" : "Registrar"}
        </Button>
      </div>
    </form>
  );
}

export default function VigilanciaRastreabilidade() {
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState("");

  const { data: registros = [] } = useQuery({
    queryKey: ["vigilancia-rastreabilidade"],
    queryFn: () => base44.entities.VigilanciaRastreabilidade.list("-data_procedimento", 500),
  });

  const createMutation = useMutation({
    mutationFn: (d) => base44.entities.VigilanciaRastreabilidade.create(d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["vigilancia-rastreabilidade"] }); setFormOpen(false); },
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, d }) => base44.entities.VigilanciaRastreabilidade.update(id, d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["vigilancia-rastreabilidade"] }); setFormOpen(false); setEditing(null); },
  });

  const handleSave = (d) => {
    if (editing) updateMutation.mutate({ id: editing.id, d });
    else createMutation.mutate(d);
  };

  const filtered = registros.filter(r =>
    r.produto?.toLowerCase().includes(search.toLowerCase()) ||
    r.lote?.toLowerCase().includes(search.toLowerCase()) ||
    r.paciente?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "#475569" }} />
          <Input placeholder="Buscar por produto, lote ou paciente..." value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10 text-sm" style={{ backgroundColor: "#1e293b", borderColor: "#334155", color: "#e2e8f0" }} />
        </div>
        <Button size="sm" onClick={() => { setEditing(null); setFormOpen(true); }}
          style={{ backgroundColor: "#1e40af", color: "#fff" }}>
          <Plus className="h-4 w-4 mr-1" /> Registrar
        </Button>
      </div>

      <div className="rounded-2xl border overflow-hidden" style={{ borderColor: "#1e293b", backgroundColor: "#0a0f1e" }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: "1px solid #1e293b", backgroundColor: "#0f172a" }}>
              {["Produto", "Fabricante", "Lote", "Validade", "Paciente", "Profissional", "Qtd", "Data"].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider"
                  style={{ color: "#475569" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(r => (
              <tr key={r.id} onClick={() => { setEditing(r); setFormOpen(true); }}
                className="cursor-pointer transition-colors hover:bg-blue-500/5"
                style={{ borderBottom: "1px solid #1e293b" }}>
                <td className="px-4 py-3 font-medium text-white">{r.produto}</td>
                <td className="px-4 py-3" style={{ color: "#94a3b8" }}>{r.fabricante || "—"}</td>
                <td className="px-4 py-3">
                  <span className="px-2 py-0.5 rounded text-xs font-mono"
                    style={{ backgroundColor: "#1e40af20", color: "#93c5fd" }}>{r.lote}</span>
                </td>
                <td className="px-4 py-3" style={{ color: "#94a3b8" }}>{r.validade || "—"}</td>
                <td className="px-4 py-3" style={{ color: "#e2e8f0" }}>{r.paciente || "—"}</td>
                <td className="px-4 py-3" style={{ color: "#94a3b8" }}>{r.profissional || "—"}</td>
                <td className="px-4 py-3 text-slate-300">{r.quantidade ? `${r.quantidade} ${r.unidade || ""}` : "—"}</td>
                <td className="px-4 py-3" style={{ color: "#94a3b8" }}>{r.data_procedimento}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center" style={{ color: "#475569" }}>
                  <ScanBarcode className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  Nenhum registro encontrado
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent style={{ backgroundColor: "#0f172a", borderColor: "#1e293b", color: "#e2e8f0" }} className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="font-serif">{editing ? "Editar Registro" : "Novo Registro de Rastreabilidade"}</DialogTitle>
          </DialogHeader>
          <RastreabilidadeForm item={editing} onSave={handleSave} onClose={() => { setFormOpen(false); setEditing(null); }} />
        </DialogContent>
      </Dialog>
    </div>
  );
}