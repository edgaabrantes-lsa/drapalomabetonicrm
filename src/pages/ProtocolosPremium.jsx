import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Syringe, Sparkles, Search, Plus, Edit, Trash2, Check } from "lucide-react";

const fmtBRL = (v) => (v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const CATEGORIAS_PROC = [
  { value: "preenchimento", label: "Preenchimento" },
  { value: "toxina", label: "Toxina (UltraTox)" },
  { value: "fios", label: "Fios" },
  { value: "bioestimulador", label: "Bioestimulador" },
  { value: "microagulhamento", label: "Microagulhamento" },
  { value: "enzimas", label: "Enzimas" },
];

// ─── Aba Procedimentos ──────────────────────────────────────────────────────
function ProcedimentosTab() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const { data: procedimentos, isLoading } = useQuery({
    queryKey: ["procedures-oficial"],
    queryFn: () => base44.entities.Procedure.list(),
  });

  const saveMutation = useMutation({
    mutationFn: ({ id, data }) =>
      id
        ? base44.entities.Procedure.update(id, data)
        : base44.entities.Procedure.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(["procedures-oficial"]);
      setDialogOpen(false);
      setEditing(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Procedure.delete(id),
    onSuccess: () => queryClient.invalidateQueries(["procedures-oficial"]),
  });

  const filtered = (procedimentos || [])
    .filter((p) => p.status !== "inactive")
    .filter((p) => {
      const matchSearch = p.name?.toLowerCase().includes(search.toLowerCase()) ||
        (p.linha || "").toLowerCase().includes(search.toLowerCase());
      const matchCat = catFilter === "all" || p.category === catFilter;
      return matchSearch && matchCat;
    })
    .sort((a, b) => (a.linha || "").localeCompare(b.linha || "") || a.name.localeCompare(b.name));

  const linhas = [...new Set((procedimentos || []).map((p) => p.linha).filter(Boolean))];

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
        <div className="flex gap-3 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#555" }} />
            <Input
              placeholder="Buscar procedimento..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={catFilter} onValueChange={setCatFilter}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {CATEGORIAS_PROC.map((c) => (
                <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          className="gap-2"
          style={{ backgroundColor: "#C8A96A", color: "#0A0A0A" }}
          onClick={() => { setEditing(null); setDialogOpen(true); }}
        >
          <Plus className="w-4 h-4" /> Novo Procedimento
        </Button>
      </div>

      {isLoading ? (
        <p className="text-sm" style={{ color: "#666" }}>Carregando procedimentos...</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((proc) => {
            const cat = CATEGORIAS_PROC.find((c) => c.value === proc.category);
            return (
              <div
                key={proc.id}
                className="rounded-lg border p-5 transition-all hover:border-[#3A3A3A]"
                style={{ backgroundColor: "#1A1A1A", borderColor: "#2B2B2B" }}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex flex-wrap gap-1.5">
                    {proc.linha && (
                      <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "#C8A96A" }}>
                        {proc.linha}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => { setEditing(proc); setDialogOpen(true); }}
                      className="p-1.5 rounded hover:bg-white/5 transition-colors"
                    >
                      <Edit className="w-3.5 h-3.5" style={{ color: "#888" }} />
                    </button>
                    <button
                      onClick={() => deleteMutation.mutate(proc.id)}
                      className="p-1.5 rounded hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" style={{ color: "#EF4444" }} />
                    </button>
                  </div>
                </div>
                <h3 className="text-base font-semibold mb-1" style={{ color: "#FFFFFF" }}>{proc.name}</h3>
                {proc.description && (
                  <p className="text-sm mb-3" style={{ color: "#B0B0B0" }}>{proc.description}</p>
                )}
                <div className="flex items-center justify-between mt-3">
                  <Badge variant="outline" className="text-xs" style={{ borderColor: "#2B2B2B", color: "#888" }}>
                    {cat?.label || proc.category}
                  </Badge>
                  <div className="text-right">
                    <span className="text-lg font-semibold" style={{ color: "#C8A96A" }}>
                      {fmtBRL(proc.price)}
                    </span>
                    {proc.valor_por_ml && (
                      <span className="text-xs ml-1" style={{ color: "#666" }}>/ml</span>
                    )}
                  </div>
                </div>
                {proc.inclui?.length > 0 && (
                  <div className="mt-3 pt-3 border-t flex flex-wrap gap-1" style={{ borderColor: "#2B2B2B" }}>
                    {proc.inclui.map((r, i) => (
                      <Badge key={i} variant="outline" className="text-[10px]" style={{ borderColor: "#2B2B2B", color: "#B0B0B0" }}>
                        {r}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar Procedimento" : "Novo Procedimento"}</DialogTitle>
          </DialogHeader>
          <ProcedimentoForm
            procedimento={editing}
            onSubmit={(data) =>
              saveMutation.mutate({ id: editing?.id, data })
            }
            onCancel={() => { setDialogOpen(false); setEditing(null); }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ProcedimentoForm({ procedimento, onSubmit, onCancel }) {
  const [form, setForm] = useState(
    procedimento || {
      name: "",
      linha: "",
      category: "preenchimento",
      description: "",
      price: 0,
      valor_por_ml: false,
      inclui: [],
      duration_minutes: 60,
      status: "active",
    }
  );
  const [incluiText, setIncluiText] = useState((procedimento?.inclui || []).join(", "));

  const submit = (e) => {
    e.preventDefault();
    onSubmit({
      ...form,
      price: Number(form.price) || 0,
      duration_minutes: Number(form.duration_minutes) || 60,
      inclui: incluiText.split(",").map((s) => s.trim()).filter(Boolean),
    });
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <Label>Nome</Label>
        <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1" required />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Linha</Label>
          <Input value={form.linha || ""} onChange={(e) => setForm({ ...form, linha: e.target.value })} className="mt-1" placeholder="Ex: UltraTox" />
        </div>
        <div>
          <Label>Categoria</Label>
          <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              {CATEGORIAS_PROC.map((c) => (
                <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div>
        <Label>Descrição</Label>
        <Textarea value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value })} className="mt-1" rows={2} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Valor (R$)</Label>
          <Input type="number" value={form.price || ""} onChange={(e) => setForm({ ...form, price: e.target.value })} className="mt-1" required />
        </div>
        <div>
          <Label>Duração (min)</Label>
          <Input type="number" value={form.duration_minutes || ""} onChange={(e) => setForm({ ...form, duration_minutes: e.target.value })} className="mt-1" />
        </div>
      </div>
      <div>
        <Label>Inclui (separe por vírgula)</Label>
        <Input value={incluiText} onChange={(e) => setIncluiText(e.target.value)} className="mt-1" placeholder="Ex: Glabela, Frontal" />
      </div>
      <label className="flex items-center gap-2 text-sm" style={{ color: "#B0B0B0" }}>
        <input type="checkbox" checked={!!form.valor_por_ml} onChange={(e) => setForm({ ...form, valor_por_ml: e.target.checked })} />
        Cobrado por ml
      </label>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" style={{ backgroundColor: "#C8A96A", color: "#0A0A0A" }}>Salvar</Button>
      </div>
    </form>
  );
}

// ─── Aba Protocolos ──────────────────────────────────────────────────────────
function ProtocolosTab() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const { data: protocolos, isLoading } = useQuery({
    queryKey: ["protocolos-premium-oficial"],
    queryFn: () => base44.entities.ProtocoloPremium.list(),
  });

  const saveMutation = useMutation({
    mutationFn: ({ id, data }) =>
      id
        ? base44.entities.ProtocoloPremium.update(id, data)
        : base44.entities.ProtocoloPremium.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(["protocolos-premium-oficial"]);
      setDialogOpen(false);
      setEditing(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ProtocoloPremium.delete(id),
    onSuccess: () => queryClient.invalidateQueries(["protocolos-premium-oficial"]),
  });

  const list = (protocolos || [])
    .filter((p) => p.status !== "inativo")
    .sort((a, b) => (a.nome || "").localeCompare(b.nome || ""));

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <Button
          className="gap-2"
          style={{ backgroundColor: "#C8A96A", color: "#0A0A0A" }}
          onClick={() => { setEditing(null); setDialogOpen(true); }}
        >
          <Plus className="w-4 h-4" /> Novo Protocolo
        </Button>
      </div>

      {isLoading ? (
        <p className="text-sm" style={{ color: "#666" }}>Carregando protocolos...</p>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {list.map((proto) => {
            const economia =
              proto.valor_procedimentos && proto.valor_min && !proto.valor_a_partir
                ? proto.valor_procedimentos - proto.valor_min
                : 0;
            return (
              <div
                key={proto.id}
                className="rounded-xl border p-6 transition-all hover:border-[#3A3A3A] relative overflow-hidden"
                style={{
                  backgroundColor: proto.destaque ? "#1C1813" : "#1A1A1A",
                  borderColor: proto.destaque ? "rgba(200,169,106,0.35)" : "#2B2B2B",
                }}
              >
                {proto.destaque && (
                  <div className="absolute top-4 right-4 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider" style={{ color: "#C8A96A" }}>
                    <Sparkles className="w-3 h-3" /> Premium
                  </div>
                )}
                <div className="flex items-start justify-between gap-3 pr-20">
                  <h3 className="text-lg font-semibold pr-2" style={{ color: "#FFFFFF" }}>{proto.nome}</h3>
                  <div className="flex gap-1">
                    <button onClick={() => { setEditing(proto); setDialogOpen(true); }} className="p-1.5 rounded hover:bg-white/5 transition-colors">
                      <Edit className="w-3.5 h-3.5" style={{ color: "#888" }} />
                    </button>
                    <button onClick={() => deleteMutation.mutate(proto.id)} className="p-1.5 rounded hover:bg-red-500/10 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" style={{ color: "#EF4444" }} />
                    </button>
                  </div>
                </div>
                <p className="text-sm mt-1 mb-4" style={{ color: "#B0B0B0" }}>{proto.objetivo}</p>

                {proto.inclui?.length > 0 && (
                  <div className="mb-4">
                    <p className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: "#666" }}>Inclui</p>
                    <div className="flex flex-wrap gap-1.5">
                      {proto.inclui.map((it, i) => (
                        <Badge key={i} className="text-xs" style={{ backgroundColor: "rgba(200,169,106,0.08)", color: "#C8A96A", border: "1px solid rgba(200,169,106,0.2)" }}>
                          {it}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {proto.beneficios?.length > 0 && (
                  <div className="mb-4">
                    <p className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: "#666" }}>Benefícios</p>
                    <ul className="space-y-1">
                      {proto.beneficios.map((b, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm" style={{ color: "#B0B0B0" }}>
                          <Check className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: "#C8A96A" }} />
                          {b}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="pt-4 border-t flex items-end justify-between" style={{ borderColor: "#2B2B2B" }}>
                  <div>
                    {proto.valor_procedimentos && !proto.valor_a_partir && (
                      <p className="text-xs line-through" style={{ color: "#555" }}>
                        Valor dos procedimentos: {fmtBRL(proto.valor_procedimentos)}
                      </p>
                    )}
                    {economia > 0 && (
                      <p className="text-xs mt-0.5" style={{ color: "#10B981" }}>
                        Economia de {fmtBRL(economia)}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    {proto.valor_a_partir && (
                      <span className="text-xs mr-1" style={{ color: "#666" }}>a partir de</span>
                    )}
                    <span className="text-2xl font-semibold" style={{ color: "#C8A96A" }}>
                      {fmtBRL(proto.valor_min)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar Protocolo" : "Novo Protocolo"}</DialogTitle>
          </DialogHeader>
          <ProtocoloForm
            protocolo={editing}
            onSubmit={(data) => saveMutation.mutate({ id: editing?.id, data })}
            onCancel={() => { setDialogOpen(false); setEditing(null); }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ProtocoloForm({ protocolo, onSubmit, onCancel }) {
  const [form, setForm] = useState(
    protocolo || {
      nome: "",
      categoria: "protocolo",
      objetivo: "",
      inclui: [],
      beneficios: [],
      valor_procedimentos: 0,
      valor_min: 0,
      valor_a_partir: false,
      personalizado: false,
      destaque: false,
      nivel_complexidade: "medio",
      status: "ativo",
    }
  );
  const [incluiText, setIncluiText] = useState((protocolo?.inclui || []).join(", "));
  const [benefText, setBenefText] = useState((protocolo?.beneficios || []).join(", "));

  const submit = (e) => {
    e.preventDefault();
    onSubmit({
      ...form,
      valor_min: Number(form.valor_min) || 0,
      valor_procedimentos: Number(form.valor_procedimentos) || 0,
      inclui: incluiText.split(",").map((s) => s.trim()).filter(Boolean),
      beneficios: benefText.split(",").map((s) => s.trim()).filter(Boolean),
    });
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <Label>Nome do Protocolo</Label>
        <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} className="mt-1" required />
      </div>
      <div>
        <Label>Objetivo</Label>
        <Textarea value={form.objetivo || ""} onChange={(e) => setForm({ ...form, objetivo: e.target.value })} className="mt-1" rows={2} />
      </div>
      <div>
        <Label>Inclui (separe por vírgula)</Label>
        <Input value={incluiText} onChange={(e) => setIncluiText(e.target.value)} className="mt-1" placeholder="Ex: UltraTox Essential, Bioestimulador Facial" />
      </div>
      <div>
        <Label>Benefícios (separe por vírgula)</Label>
        <Input value={benefText} onChange={(e) => setBenefText(e.target.value)} className="mt-1" placeholder="Ex: Suavização das rugas, Estímulo de colágeno" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Valor dos procedimentos (R$)</Label>
          <Input type="number" value={form.valor_procedimentos || ""} onChange={(e) => setForm({ ...form, valor_procedimentos: e.target.value })} className="mt-1" />
        </div>
        <div>
          <Label>Valor do protocolo (R$)</Label>
          <Input type="number" value={form.valor_min || ""} onChange={(e) => setForm({ ...form, valor_min: e.target.value })} className="mt-1" required />
        </div>
      </div>
      <div className="flex flex-wrap gap-4 pt-1">
        <label className="flex items-center gap-2 text-sm" style={{ color: "#B0B0B0" }}>
          <input type="checkbox" checked={!!form.valor_a_partir} onChange={(e) => setForm({ ...form, valor_a_partir: e.target.checked })} />
          Valor "a partir de"
        </label>
        <label className="flex items-center gap-2 text-sm" style={{ color: "#B0B0B0" }}>
          <input type="checkbox" checked={!!form.personalizado} onChange={(e) => setForm({ ...form, personalizado: e.target.checked })} />
          Personalizado
        </label>
        <label className="flex items-center gap-2 text-sm" style={{ color: "#B0B0B0" }}>
          <input type="checkbox" checked={!!form.destaque} onChange={(e) => setForm({ ...form, destaque: e.target.checked })} />
          Destaque
        </label>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" style={{ backgroundColor: "#C8A96A", color: "#0A0A0A" }}>Salvar</Button>
      </div>
    </form>
  );
}

// ─── Página principal ────────────────────────────────────────────────────────
export default function ProtocolosPremium() {
  const [tab, setTab] = useState("procedimentos");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold" style={{ color: "#FFFFFF" }}>Protocolos e Procedimentos</h1>
        <p className="text-sm mt-1" style={{ color: "#666" }}>
          Base oficial da clínica — procedimentos avulsos e protocolos completos para orçamentos e planejamentos.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b" style={{ borderColor: "#2B2B2B" }}>
        <button
          onClick={() => setTab("procedimentos")}
          className="flex items-center gap-2 px-5 py-3 text-sm font-medium transition-colors relative"
          style={{
            color: tab === "procedimentos" ? "#FFFFFF" : "#666",
          }}
        >
          <Syringe className="w-4 h-4" style={{ color: tab === "procedimentos" ? "#C8A96A" : "#666" }} />
          Procedimentos
          {tab === "procedimentos" && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5" style={{ backgroundColor: "#C8A96A" }} />
          )}
        </button>
        <button
          onClick={() => setTab("protocolos")}
          className="flex items-center gap-2 px-5 py-3 text-sm font-medium transition-colors relative"
          style={{
            color: tab === "protocolos" ? "#FFFFFF" : "#666",
          }}
        >
          <Sparkles className="w-4 h-4" style={{ color: tab === "protocolos" ? "#C8A96A" : "#666" }} />
          Protocolos
          {tab === "protocolos" && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5" style={{ backgroundColor: "#C8A96A" }} />
          )}
        </button>
      </div>

      {tab === "procedimentos" ? <ProcedimentosTab /> : <ProtocolosTab />}
    </div>
  );
}