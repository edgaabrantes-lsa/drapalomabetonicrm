import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Search, Edit, Trash2, DollarSign, TrendingUp } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const CATEGORIAS = [
  { value: "preenchimento", label: "Preenchimento", color: "bg-blue-500/20 text-blue-400" },
  { value: "toxina", label: "Toxina Botulínica", color: "bg-purple-500/20 text-purple-400" },
  { value: "fios", label: "Fios", color: "bg-green-500/20 text-green-400" },
  { value: "bioestimulador", label: "Bioestimulador", color: "bg-orange-500/20 text-orange-400" },
  { value: "enzimas", label: "Enzimas", color: "bg-red-500/20 text-red-400" },
  { value: "microagulhamento", label: "Microagulhamento", color: "bg-teal-500/20 text-teal-400" },
];

export default function ProtocolosPremium() {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoriaFilter, setCategoriaFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProtocolo, setEditingProtocolo] = useState(null);

  const queryClient = useQueryClient();

  const { data: protocolos, isLoading } = useQuery({
    queryKey: ["protocolos-premium"],
    queryFn: () => base44.entities.ProtocoloPremium.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.ProtocoloPremium.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(["protocolos-premium"]);
      setDialogOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ProtocoloPremium.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(["protocolos-premium"]);
      setDialogOpen(false);
      setEditingProtocolo(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ProtocoloPremium.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(["protocolos-premium"]);
    },
  });

  const filtered = protocolos?.filter((p) => {
    const matchSearch = p.nome.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCat = categoriaFilter === "all" || p.categoria === categoriaFilter;
    return matchSearch && matchCat;
  });

  const formatValue = (val) => 
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-serif" style={{ color: "#F0F4FA" }}>Protocolos Premium HOF</h1>
          <p className="text-sm" style={{ color: "#8A95AA" }}>Gerencie os protocolos de tratamentos da clínica</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              className="gap-2"
              style={{ backgroundColor: "#C5A059", color: "#111620" }}
              onClick={() => setEditingProtocolo(null)}
            >
              <Plus className="w-4 h-4" /> Novo Protocolo
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl" style={{ backgroundColor: "#171D29", borderColor: "#252D3E", color: "#E8EDF5" }}>
            <DialogHeader>
              <DialogTitle style={{ color: "#F0F4FA" }}>
                {editingProtocolo ? "Editar Protocolo" : "Novo Protocolo"}
              </DialogTitle>
            </DialogHeader>
            <ProtocoloForm 
              protocolo={editingProtocolo}
              onSubmit={editingProtocolo ? 
                (data) => updateMutation.mutate({ id: editingProtocolo.id, data }) : 
                (data) => createMutation.mutate(data)
              }
              onCancel={() => {
                setDialogOpen(false);
                setEditingProtocolo(null);
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#4A5568" }} />
          <Input
            placeholder="Buscar protocolos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            style={{ backgroundColor: "#1A2030", borderColor: "#252D3E", color: "#E8EDF5" }}
          />
        </div>
        <Select value={categoriaFilter} onValueChange={setCategoriaFilter}>
          <SelectTrigger className="w-48" style={{ backgroundColor: "#1A2030", borderColor: "#252D3E", color: "#E8EDF5" }}>
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent style={{ backgroundColor: "#1A2030", borderColor: "#252D3E" }}>
            <SelectItem value="all">Todas</SelectItem>
            {CATEGORIAS.map((cat) => (
              <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filtered?.map((protocolo) => {
          const cat = CATEGORIAS.find((c) => c.value === protocolo.categoria);
          return (
            <Card key={protocolo.id} className="border transition-all hover:shadow-lg" style={{ backgroundColor: "#171D29", borderColor: "#252D3E" }}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <Badge className={cat?.color}>{cat?.label}</Badge>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-8 h-8 hover:bg-white/5"
                      onClick={() => {
                        setEditingProtocolo(protocolo);
                        setDialogOpen(true);
                      }}
                    >
                      <Edit className="w-4 h-4" style={{ color: "#8A95AA" }} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-8 h-8 hover:bg-red-500/20"
                      onClick={() => deleteMutation.mutate(protocolo.id)}
                    >
                      <Trash2 className="w-4 h-4" style={{ color: "#F87171" }} />
                    </Button>
                  </div>
                </div>
                <CardTitle className="mt-3" style={{ color: "#F0F4FA" }}>{protocolo.nome}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm" style={{ color: "#C8D0DF" }}>{protocolo.objetivo}</p>
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4" style={{ color: "#C5A059" }} />
                  <span className="font-semibold" style={{ color: "#E8EDF5" }}>
                    {protocolo.valor_por_ml ? `${formatValue(protocolo.valor_min)}/ml` : formatValue(protocolo.valor_min)}
                  </span>
                </div>
                {protocolo.regioes?.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {protocolo.regioes.slice(0, 3).map((r, i) => (
                      <Badge key={i} variant="outline" className="text-xs" style={{ borderColor: "#252D3E", color: "#8A95AA" }}>
                        {r}
                      </Badge>
                    ))}
                    {protocolo.regioes.length > 3 && (
                      <Badge variant="outline" className="text-xs" style={{ borderColor: "#252D3E", color: "#8A95AA" }}>
                        +{protocolo.regioes.length - 3}
                      </Badge>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function ProtocoloForm({ protocolo, onSubmit, onCancel }) {
  const [formData, setFormData] = useState(protocolo || {
    nome: "",
    categoria: "preenchimento",
    objetivo: "",
    indicacoes: [],
    regioes: [],
    valor_min: 0,
    valor_max: 0,
    valor_por_ml: false,
    nivel_complexidade: "medio",
    descricao_tecnica: "",
    status: "ativo",
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4">
        <div>
          <label className="text-sm mb-2 block" style={{ color: "#B0BBCF" }}>Nome do Protocolo</label>
          <Input
            value={formData.nome}
            onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
            style={{ backgroundColor: "#1A2030", borderColor: "#252D3E", color: "#E8EDF5" }}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm mb-2 block" style={{ color: "#B0BBCF" }}>Categoria</label>
            <Select value={formData.categoria} onValueChange={(v) => setFormData({ ...formData, categoria: v })}>
              <SelectTrigger style={{ backgroundColor: "#1A2030", borderColor: "#252D3E", color: "#E8EDF5" }}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent style={{ backgroundColor: "#1A2030", borderColor: "#252D3E" }}>
                {CATEGORIAS.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm mb-2 block" style={{ color: "#B0BBCF" }}>Nível de Complexidade</label>
            <Select value={formData.nivel_complexidade} onValueChange={(v) => setFormData({ ...formData, nivel_complexidade: v })}>
              <SelectTrigger style={{ backgroundColor: "#1A2030", borderColor: "#252D3E", color: "#E8EDF5" }}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent style={{ backgroundColor: "#1A2030", borderColor: "#252D3E" }}>
                <SelectItem value="leve">Leve</SelectItem>
                <SelectItem value="medio">Médio</SelectItem>
                <SelectItem value="grave">Grave</SelectItem>
                <SelectItem value="premium">Premium</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <label className="text-sm mb-2 block" style={{ color: "#B0BBCF" }}>Objetivo</label>
          <Input
            value={formData.objetivo}
            onChange={(e) => setFormData({ ...formData, objetivo: e.target.value })}
            style={{ backgroundColor: "#1A2030", borderColor: "#252D3E", color: "#E8EDF5" }}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm mb-2 block" style={{ color: "#B0BBCF" }}>Valor Mínimo (R$)</label>
            <Input
              type="number"
              value={formData.valor_min}
              onChange={(e) => setFormData({ ...formData, valor_min: Number(e.target.value) })}
              style={{ backgroundColor: "#1A2030", borderColor: "#252D3E", color: "#E8EDF5" }}
            />
          </div>
          <div>
            <label className="text-sm mb-2 block" style={{ color: "#B0BBCF" }}>Valor Máximo (R$)</label>
            <Input
              type="number"
              value={formData.valor_max}
              onChange={(e) => setFormData({ ...formData, valor_max: Number(e.target.value) })}
              style={{ backgroundColor: "#1A2030", borderColor: "#252D3E", color: "#E8EDF5" }}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="valorPorMl"
            checked={formData.valor_por_ml}
            onChange={(e) => setFormData({ ...formData, valor_por_ml: e.target.checked })}
            className="rounded"
          />
          <label htmlFor="valorPorMl" style={{ color: "#B0BBCF" }}>Cobrado por ml utilizado</label>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} style={{ borderColor: "#252D3E", color: "#E8EDF5" }}>
          Cancelar
        </Button>
        <Button type="submit" style={{ backgroundColor: "#C5A059", color: "#111620" }}>
          Salvar Protocolo
        </Button>
      </div>
    </form>
  );
}