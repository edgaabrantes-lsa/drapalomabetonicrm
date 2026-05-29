import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { PIPELINE_STAGES } from "@/hooks/useConversations";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Plus, Search, Phone, MessageSquare, Calendar, Tag,
  Clock, Star, Zap, FileText, MoreHorizontal, ArrowRight,
  User, TrendingUp
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const BG_MAP = {
  inbox: "from-gray-500/10 to-transparent",
  first_contact: "from-blue-500/10 to-transparent",
  interested: "from-purple-500/10 to-transparent",
  scheduling: "from-yellow-500/10 to-transparent",
  scheduled: "from-emerald-500/10 to-transparent",
  converted: "from-yellow-600/10 to-transparent",
  lost: "from-red-500/10 to-transparent",
};

const pipelineStages = PIPELINE_STAGES.map(s => ({ ...s, bg: BG_MAP[s.id] || "from-gray-500/10 to-transparent" }));

const sourceLabels = {
  instagram: "Instagram", google: "Google", referral: "Indicação",
  website: "Website", whatsapp: "WhatsApp", tiktok: "TikTok",
  facebook: "Facebook", other: "Outro"
};

const priorityConfig = {
  vip:    { label: "VIP",   color: "bg-[#c9a55c]/20 text-[#c9a55c]" },
  high:   { label: "Alta",  color: "bg-red-500/20 text-red-400" },
  medium: { label: "Média", color: "bg-yellow-500/20 text-yellow-400" },
  low:    { label: "Baixa", color: "bg-gray-500/20 text-gray-400" }
};

const DraggableLeadCard = ({ lead, index, onSelect, onQuickAction }) => {
  return (
    <Draggable draggableId={lead.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`p-4 rounded-xl border cursor-grab active:cursor-grabbing transition-all select-none ${
            snapshot.isDragging
              ? "bg-[#2a2a35] border-[#c9a55c]/60 shadow-2xl shadow-black/50 rotate-1 scale-105"
              : "bg-[#1a1a25] border-[#1e1e2a] hover:border-[#c9a55c]/30"
          }`}
        >
          {/* Card Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className="w-9 h-9 rounded-full bg-[#c9a55c]/20 flex items-center justify-center flex-shrink-0">
                <span className="text-[#c9a55c] font-semibold text-sm">{lead.name?.[0]?.toUpperCase()}</span>
              </div>
              <div className="min-w-0">
                <h4
                  className="font-medium text-white text-sm truncate hover:text-[#c9a55c] cursor-pointer transition-colors"
                  onClick={(e) => { e.stopPropagation(); onSelect(lead); }}
                >
                  {lead.name}
                </h4>
                <p className="text-xs text-gray-500">{sourceLabels[lead.source] || "—"}</p>
              </div>
            </div>
            {lead.priority === "vip" && (
              <Star className="h-4 w-4 text-[#c9a55c] flex-shrink-0 fill-[#c9a55c]" />
            )}
          </div>

          {/* Interests */}
          {lead.interest?.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {lead.interest.slice(0, 2).map((int, i) => (
                <span key={i} className="text-xs px-2 py-0.5 bg-[#12121a] text-gray-400 rounded-full border border-[#1e1e2a]">
                  {int}
                </span>
              ))}
              {lead.interest.length > 2 && (
                <span className="text-xs px-2 py-0.5 bg-[#12121a] text-gray-500 rounded-full border border-[#1e1e2a]">
                  +{lead.interest.length - 2}
                </span>
              )}
            </div>
          )}

          {/* Estimated Value */}
          {lead.estimated_value > 0 && (
            <div className="flex items-center gap-1 mb-3">
              <TrendingUp className="h-3 w-3 text-emerald-400" />
              <span className="text-xs text-emerald-400">
                R$ {lead.estimated_value.toLocaleString("pt-BR")}
              </span>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-600">
              {lead.created_date && format(parseISO(lead.created_date), "dd/MM", { locale: ptBR })}
            </span>
            {/* Quick Actions */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={(e) => { e.stopPropagation(); onQuickAction("whatsapp", lead); }}
                className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-emerald-500/20 text-gray-500 hover:text-emerald-400 transition-colors"
                title="WhatsApp"
              >
                <MessageSquare className="h-3 w-3" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onQuickAction("schedule", lead); }}
                className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-[#c9a55c]/20 text-gray-500 hover:text-[#c9a55c] transition-colors"
                title="Agendar"
              >
                <Calendar className="h-3 w-3" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onSelect(lead); }}
                className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-blue-500/20 text-gray-500 hover:text-blue-400 transition-colors"
                title="Ver detalhes"
              >
                <FileText className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );
};

const KanbanColumn = ({ stage, leads, onSelect, onQuickAction }) => {
  const totalValue = leads.reduce((sum, l) => sum + (l.estimated_value || 0), 0);

  return (
    <div className="flex flex-col min-w-[270px] max-w-[270px]">
      {/* Column Header */}
      <div className={`p-3 mb-3 rounded-xl bg-gradient-to-b ${stage.bg} border border-[#1e1e2a]`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: stage.color }} />
            <span className="font-medium text-white text-sm">{stage.label}</span>
          </div>
          <span
            className="text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{ backgroundColor: `${stage.color}25`, color: stage.color }}
          >
            {leads.length}
          </span>
        </div>
        {totalValue > 0 && (
          <p className="text-xs text-gray-500 mt-1">
            R$ {totalValue.toLocaleString("pt-BR")}
          </p>
        )}
      </div>

      {/* Droppable Area */}
      <Droppable droppableId={stage.id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex-1 space-y-2 min-h-[120px] p-2 rounded-xl transition-colors ${
              snapshot.isDraggingOver ? "bg-[#c9a55c]/5 border border-dashed border-[#c9a55c]/30" : ""
            }`}
          >
            {leads.map((lead, index) => (
              <DraggableLeadCard
                key={lead.id}
                lead={lead}
                index={index}
                onSelect={onSelect}
                onQuickAction={onQuickAction}
              />
            ))}
            {provided.placeholder}
            {leads.length === 0 && !snapshot.isDraggingOver && (
              <div className="h-20 flex items-center justify-center">
                <p className="text-xs text-gray-700 italic">Arraste cards aqui</p>
              </div>
            )}
          </div>
        )}
      </Droppable>
    </div>
  );
};

const LeadForm = ({ lead, onSave, onClose }) => {
  const [formData, setFormData] = useState(lead || {
    name: "", phone: "", email: "", source: "instagram",
    priority: "medium", interest: [], notes: "", pipeline_stage: "inbox", estimated_value: 0
  });
  const [interestInput, setInterestInput] = useState("");

  const handleSubmit = (e) => { e.preventDefault(); onSave(formData); };

  const addInterest = () => {
    if (interestInput.trim()) {
      setFormData(prev => ({ ...prev, interest: [...(prev.interest || []), interestInput.trim()] }));
      setInterestInput("");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-h-[65vh] overflow-y-auto pr-1">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <Label className="text-gray-300">Nome *</Label>
          <Input value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
            className="bg-[#1a1a25] border-[#1e1e2a] text-white mt-1" required />
        </div>
        <div>
          <Label className="text-gray-300">Telefone *</Label>
          <Input value={formData.phone} onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))}
            className="bg-[#1a1a25] border-[#1e1e2a] text-white mt-1" required />
        </div>
        <div>
          <Label className="text-gray-300">E-mail</Label>
          <Input type="email" value={formData.email} onChange={e => setFormData(p => ({ ...p, email: e.target.value }))}
            className="bg-[#1a1a25] border-[#1e1e2a] text-white mt-1" />
        </div>
        <div>
          <Label className="text-gray-300">Origem</Label>
          <Select value={formData.source} onValueChange={v => setFormData(p => ({ ...p, source: v }))}>
            <SelectTrigger className="bg-[#1a1a25] border-[#1e1e2a] text-white mt-1"><SelectValue /></SelectTrigger>
            <SelectContent className="bg-[#12121a] border-[#1e1e2a]">
              {Object.entries(sourceLabels).map(([key, label]) => (
                <SelectItem key={key} value={key} className="text-white">{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-gray-300">Prioridade</Label>
          <Select value={formData.priority} onValueChange={v => setFormData(p => ({ ...p, priority: v }))}>
            <SelectTrigger className="bg-[#1a1a25] border-[#1e1e2a] text-white mt-1"><SelectValue /></SelectTrigger>
            <SelectContent className="bg-[#12121a] border-[#1e1e2a]">
              {Object.entries(priorityConfig).map(([key, config]) => (
                <SelectItem key={key} value={key} className="text-white">{config.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="col-span-2">
          <Label className="text-gray-300">Valor Estimado (R$)</Label>
          <Input type="number" value={formData.estimated_value}
            onChange={e => setFormData(p => ({ ...p, estimated_value: parseFloat(e.target.value) || 0 }))}
            className="bg-[#1a1a25] border-[#1e1e2a] text-white mt-1" />
        </div>
      </div>
      <div>
        <Label className="text-gray-300">Interesses</Label>
        <div className="flex gap-2 mt-1">
          <Input value={interestInput} onChange={e => setInterestInput(e.target.value)}
            placeholder="Ex: Botox, Preenchimento..." className="bg-[#1a1a25] border-[#1e1e2a] text-white"
            onKeyPress={e => e.key === "Enter" && (e.preventDefault(), addInterest())} />
          <Button type="button" onClick={addInterest} variant="outline" className="border-[#c9a55c]/30 text-[#c9a55c]">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        {formData.interest?.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {formData.interest.map((int, i) => (
              <Badge key={i} className="bg-[#c9a55c]/20 text-[#c9a55c] cursor-pointer"
                onClick={() => setFormData(p => ({ ...p, interest: p.interest.filter((_, idx) => idx !== i) }))}>
                {int} ×
              </Badge>
            ))}
          </div>
        )}
      </div>
      <div>
        <Label className="text-gray-300">Observações</Label>
        <Textarea value={formData.notes} onChange={e => setFormData(p => ({ ...p, notes: e.target.value }))}
          className="bg-[#1a1a25] border-[#1e1e2a] text-white mt-1" rows={3} />
      </div>
      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="ghost" onClick={onClose} className="text-gray-400">Cancelar</Button>
        <Button type="submit" className="bg-[#c9a55c] hover:bg-[#a17f3f] text-black">
          {lead ? "Salvar" : "Criar Lead"}
        </Button>
      </div>
    </form>
  );
};

const LeadDetailPanel = ({ lead, onClose, onUpdate, onEdit }) => {
  const [note, setNote] = useState("");

  if (!lead) return null;

  const stage = pipelineStages.find(s => s.id === lead.pipeline_stage);

  return (
    <div className="space-y-5 overflow-y-auto max-h-[80vh] pr-1">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="w-16 h-16 rounded-full bg-[#c9a55c]/20 flex items-center justify-center flex-shrink-0">
          <span className="text-2xl text-[#c9a55c] font-bold">{lead.name?.[0]?.toUpperCase()}</span>
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-semibold text-white">{lead.name}</h2>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <Badge className={priorityConfig[lead.priority]?.color}>{priorityConfig[lead.priority]?.label}</Badge>
            <Badge variant="outline" className="border-[#1e1e2a] text-gray-400">{sourceLabels[lead.source]}</Badge>
            {stage && (
              <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: `${stage.color}20`, color: stage.color }}>
                {stage.label}
              </span>
            )}
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={onEdit} className="text-[#c9a55c] hover:bg-[#c9a55c]/10">
          Editar
        </Button>
      </div>

      {/* Contact */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 bg-[#1a1a25] rounded-xl">
          <p className="text-xs text-gray-500 mb-1">Telefone</p>
          <p className="text-sm text-white font-medium">{lead.phone}</p>
        </div>
        <div className="p-3 bg-[#1a1a25] rounded-xl">
          <p className="text-xs text-gray-500 mb-1">E-mail</p>
          <p className="text-sm text-white font-medium truncate">{lead.email || "—"}</p>
        </div>
        {lead.estimated_value > 0 && (
          <div className="col-span-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
            <p className="text-xs text-gray-500 mb-1">Valor Estimado</p>
            <p className="text-lg font-semibold text-emerald-400">
              R$ {lead.estimated_value.toLocaleString("pt-BR")}
            </p>
          </div>
        )}
      </div>

      {/* Interests */}
      {lead.interest?.length > 0 && (
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Interesses</p>
          <div className="flex flex-wrap gap-2">
            {lead.interest.map((int, i) => (
              <Badge key={i} className="bg-[#c9a55c]/20 text-[#c9a55c]">{int}</Badge>
            ))}
          </div>
        </div>
      )}

      {/* Move Stage */}
      <div>
        <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Mover para etapa</p>
        <div className="grid grid-cols-3 gap-2">
          {pipelineStages.map((s) => (
            <button
              key={s.id}
              onClick={() => onUpdate(lead.id, { pipeline_stage: s.id })}
              className={`p-2 rounded-lg text-xs font-medium border transition-all ${
                lead.pipeline_stage === s.id
                  ? "text-white border-opacity-60"
                  : "border-[#1e1e2a] text-gray-500 hover:text-white hover:border-opacity-40"
              }`}
              style={{
                backgroundColor: lead.pipeline_stage === s.id ? `${s.color}20` : "",
                borderColor: lead.pipeline_stage === s.id ? s.color : "",
                color: lead.pipeline_stage === s.id ? s.color : ""
              }}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Notes */}
      {lead.notes && (
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Observações</p>
          <p className="text-sm text-gray-300 bg-[#1a1a25] p-3 rounded-xl">{lead.notes}</p>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <a
          href={`https://wa.me/${lead.phone?.replace(/\D/g, "")}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 p-3 bg-emerald-600/20 text-emerald-400 rounded-xl border border-emerald-600/30 hover:bg-emerald-600/30 transition-colors text-sm font-medium"
        >
          <MessageSquare className="h-4 w-4" />
          WhatsApp
        </a>
        <button
          className="flex items-center justify-center gap-2 p-3 bg-[#c9a55c]/20 text-[#c9a55c] rounded-xl border border-[#c9a55c]/30 hover:bg-[#c9a55c]/30 transition-colors text-sm font-medium"
        >
          <Calendar className="h-4 w-4" />
          Agendar
        </button>
      </div>
    </div>
  );
};

export default function CRM() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLead, setSelectedLead] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingLead, setEditingLead] = useState(null);
  const [viewMode, setViewMode] = useState("kanban");

  const { data: leads = [] } = useQuery({
    queryKey: ["leads"],
    queryFn: () => base44.entities.Lead.list("-created_date", 500),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Lead.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["leads"] }); setIsFormOpen(false); setEditingLead(null); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Lead.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["leads"] }); },
  });

  const handleDragEnd = (result) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId) return;

    const lead = leads.find(l => l.id === draggableId);
    if (!lead) return;

    const newStage = destination.droppableId;

    // Atualização otimista imediata
    queryClient.setQueryData(["leads"], (old = []) =>
      old.map(l => l.id === draggableId
        ? { ...l, pipeline_stage: newStage }
        : l
      )
    );

    // Persiste no banco — pipeline_stage é a fonte única de verdade
    updateMutation.mutate({
      id: draggableId,
      data: { ...lead, pipeline_stage: newStage }
    });
  };

  const handleSave = (data) => {
    if (editingLead) {
      updateMutation.mutate({ id: editingLead.id, data });
      setEditingLead(null);
      setIsFormOpen(false);
    } else {
      createMutation.mutate(data);
    }
  };

  const handleUpdate = (id, data) => {
    const lead = leads.find(l => l.id === id);
    updateMutation.mutate({ id, data: { ...lead, ...data } });
    if (selectedLead?.id === id) {
      setSelectedLead(prev => ({ ...prev, ...data }));
    }
  };

  const handleQuickAction = (action, lead) => {
    if (action === "whatsapp") {
      window.open(`https://wa.me/${lead.phone?.replace(/\D/g, "")}`, "_blank");
    } else if (action === "schedule") {
      setSelectedLead(lead);
    }
  };

  const filteredLeads = leads.filter(lead =>
    lead.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.phone?.includes(searchTerm) ||
    lead.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getLeadsByStage = (stageId) => filteredLeads.filter(l => l.pipeline_stage === stageId);

  const totalPipeline = leads.reduce((sum, l) => sum + (l.estimated_value || 0), 0);

  return (
    <div className="space-y-6 bg-[#0d0d14] min-h-screen -m-4 lg:-m-8 p-4 lg:p-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif text-white">CRM — Pipeline de Vendas</h1>
          <p className="text-gray-400">
            {leads.length} leads • Pipeline total: <span className="text-[#c9a55c]">R$ {totalPipeline.toLocaleString("pt-BR")}</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative lg:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <Input placeholder="Buscar leads..." value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-10 bg-[#1a1a25] border-[#1e1e2a] text-white" />
          </div>
          <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#c9a55c] hover:bg-[#a17f3f] text-black">
                <Plus className="mr-2 h-4 w-4" /> Novo Lead
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#12121a] border-[#1e1e2a] text-white max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
              <DialogHeader className="flex-shrink-0">
                <DialogTitle className="text-xl font-serif">{editingLead ? "Editar Lead" : "Novo Lead"}</DialogTitle>
              </DialogHeader>
              <LeadForm lead={editingLead} onSave={handleSave}
                onClose={() => { setIsFormOpen(false); setEditingLead(null); }} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stage Stats Bar */}
      <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
        {pipelineStages.map(stage => (
          <div key={stage.id} className="p-3 rounded-xl bg-[#12121a] border border-[#1e1e2a]">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: stage.color }} />
              <span className="text-xs text-gray-400 truncate">{stage.label}</span>
            </div>
            <p className="text-xl font-light text-white">{getLeadsByStage(stage.id).length}</p>
          </div>
        ))}
      </div>

      {/* View Toggle */}
      <Tabs value={viewMode} onValueChange={setViewMode}>
        <TabsList className="bg-[#1a1a25] border border-[#1e1e2a]">
          <TabsTrigger value="kanban" className="data-[state=active]:bg-[#c9a55c]/20 data-[state=active]:text-[#c9a55c]">
            Kanban
          </TabsTrigger>
          <TabsTrigger value="list" className="data-[state=active]:bg-[#c9a55c]/20 data-[state=active]:text-[#c9a55c]">
            Lista
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Kanban Board with DnD */}
      {viewMode === "kanban" && (
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="flex gap-4 overflow-x-auto pb-6">
            {pipelineStages.map(stage => (
              <KanbanColumn
                key={stage.id}
                stage={stage}
                leads={getLeadsByStage(stage.id)}
                onSelect={setSelectedLead}
                onQuickAction={handleQuickAction}
              />
            ))}
          </div>
        </DragDropContext>
      )}

      {/* List View */}
      {viewMode === "list" && (
        <div className="rounded-xl border border-[#1e1e2a] overflow-hidden bg-[#12121a]">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#1e1e2a]">
                <th className="text-left p-4 text-xs text-gray-500 uppercase tracking-wider font-medium">Nome</th>
                <th className="text-left p-4 text-xs text-gray-500 uppercase tracking-wider font-medium">Telefone</th>
                <th className="text-left p-4 text-xs text-gray-500 uppercase tracking-wider font-medium">Origem</th>
                <th className="text-left p-4 text-xs text-gray-500 uppercase tracking-wider font-medium">Etapa</th>
                <th className="text-left p-4 text-xs text-gray-500 uppercase tracking-wider font-medium">Prioridade</th>
                <th className="text-left p-4 text-xs text-gray-500 uppercase tracking-wider font-medium">Valor</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeads.map(lead => {
                const stage = pipelineStages.find(s => s.id === lead.pipeline_stage);
                return (
                  <tr key={lead.id} onClick={() => setSelectedLead(lead)}
                    className="border-b border-[#1e1e2a] hover:bg-[#c9a55c]/5 cursor-pointer transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#c9a55c]/20 flex items-center justify-center">
                          <span className="text-sm text-[#c9a55c] font-semibold">{lead.name?.[0]?.toUpperCase()}</span>
                        </div>
                        <span className="text-white font-medium">{lead.name}</span>
                      </div>
                    </td>
                    <td className="p-4 text-gray-400">{lead.phone}</td>
                    <td className="p-4 text-gray-400">{sourceLabels[lead.source]}</td>
                    <td className="p-4">
                      <span className="text-xs px-2 py-1 rounded-full" style={{ backgroundColor: `${stage?.color}20`, color: stage?.color }}>
                        {stage?.label}
                      </span>
                    </td>
                    <td className="p-4">
                      <Badge className={priorityConfig[lead.priority]?.color}>{priorityConfig[lead.priority]?.label}</Badge>
                    </td>
                    <td className="p-4 text-emerald-400 font-medium">
                      {lead.estimated_value > 0 ? `R$ ${lead.estimated_value.toLocaleString("pt-BR")}` : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Lead Details Side Panel */}
      <Dialog open={!!selectedLead} onOpenChange={() => setSelectedLead(null)}>
        <DialogContent className="bg-[#12121a] border-[#1e1e2a] text-white max-w-md max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-xl font-serif">Detalhes do Lead</DialogTitle>
          </DialogHeader>
          <LeadDetailPanel
            lead={selectedLead}
            onClose={() => setSelectedLead(null)}
            onUpdate={handleUpdate}
            onEdit={() => {
              setEditingLead(selectedLead);
              setSelectedLead(null);
              setIsFormOpen(true);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}