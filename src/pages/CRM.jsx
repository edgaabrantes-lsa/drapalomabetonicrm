import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Plus,
  Search,
  Filter,
  Phone,
  Mail,
  MessageSquare,
  User,
  Calendar,
  Tag,
  MoreVertical,
  ChevronRight,
  Star,
  Clock,
  CheckCircle,
  XCircle,
  ArrowRight
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const pipelineStages = [
  { id: "inbox", label: "Entrada", color: "bg-gray-500" },
  { id: "first_contact", label: "1º Contato", color: "bg-blue-500" },
  { id: "interested", label: "Interessado", color: "bg-purple-500" },
  { id: "scheduling", label: "Agendando", color: "bg-yellow-500" },
  { id: "scheduled", label: "Agendado", color: "bg-emerald-500" },
  { id: "converted", label: "Convertido", color: "bg-[#c9a55c]" },
];

const sourceLabels = {
  instagram: "Instagram",
  google: "Google",
  referral: "Indicação",
  website: "Website",
  whatsapp: "WhatsApp",
  tiktok: "TikTok",
  facebook: "Facebook",
  other: "Outro"
};

const priorityConfig = {
  vip: { label: "VIP", color: "bg-[#c9a55c]/20 text-[#c9a55c] border-[#c9a55c]/30" },
  high: { label: "Alta", color: "bg-red-500/20 text-red-400 border-red-500/30" },
  medium: { label: "Média", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
  low: { label: "Baixa", color: "bg-gray-500/20 text-gray-400 border-gray-500/30" }
};

const LeadCard = ({ lead, onUpdate, onSelect }) => {
  return (
    <div
      onClick={() => onSelect(lead)}
      className="p-4 bg-[#1a1a25] rounded-xl border border-[#1e1e2a] hover:border-[#c9a55c]/30 cursor-pointer transition-all group"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-[#c9a55c]/20 flex items-center justify-center">
            <span className="text-[#c9a55c] font-medium">{lead.name?.[0]?.toUpperCase()}</span>
          </div>
          <div>
            <h4 className="font-medium text-white group-hover:text-[#c9a55c] transition-colors">{lead.name}</h4>
            <p className="text-xs text-gray-500">{sourceLabels[lead.source] || lead.source}</p>
          </div>
        </div>
        {lead.priority && (
          <Badge className={priorityConfig[lead.priority]?.color || priorityConfig.medium.color}>
            {priorityConfig[lead.priority]?.label || "Média"}
          </Badge>
        )}
      </div>
      
      {lead.interest?.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {lead.interest.slice(0, 2).map((int, i) => (
            <Badge key={i} variant="outline" className="text-xs border-[#1e1e2a] text-gray-400">
              {int}
            </Badge>
          ))}
          {lead.interest.length > 2 && (
            <Badge variant="outline" className="text-xs border-[#1e1e2a] text-gray-400">
              +{lead.interest.length - 2}
            </Badge>
          )}
        </div>
      )}

      <div className="flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {lead.created_date && format(parseISO(lead.created_date), "dd/MM", { locale: ptBR })}
        </div>
        <div className="flex items-center gap-2">
          <Phone className="h-3 w-3" />
          <MessageSquare className="h-3 w-3" />
        </div>
      </div>
    </div>
  );
};

const LeadForm = ({ lead, onSave, onClose }) => {
  const [formData, setFormData] = useState(lead || {
    name: "",
    phone: "",
    email: "",
    source: "instagram",
    priority: "medium",
    interest: [],
    notes: "",
    pipeline_stage: "inbox"
  });

  const [interestInput, setInterestInput] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const addInterest = () => {
    if (interestInput.trim()) {
      setFormData(prev => ({
        ...prev,
        interest: [...(prev.interest || []), interestInput.trim()]
      }));
      setInterestInput("");
    }
  };

  const removeInterest = (idx) => {
    setFormData(prev => ({
      ...prev,
      interest: prev.interest.filter((_, i) => i !== idx)
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <Label className="text-gray-300">Nome *</Label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            className="bg-[#1a1a25] border-[#1e1e2a] text-white mt-1"
            required
          />
        </div>
        <div>
          <Label className="text-gray-300">Telefone *</Label>
          <Input
            value={formData.phone}
            onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
            className="bg-[#1a1a25] border-[#1e1e2a] text-white mt-1"
            required
          />
        </div>
        <div>
          <Label className="text-gray-300">E-mail</Label>
          <Input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            className="bg-[#1a1a25] border-[#1e1e2a] text-white mt-1"
          />
        </div>
        <div>
          <Label className="text-gray-300">Origem</Label>
          <Select
            value={formData.source}
            onValueChange={(value) => setFormData(prev => ({ ...prev, source: value }))}
          >
            <SelectTrigger className="bg-[#1a1a25] border-[#1e1e2a] text-white mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#12121a] border-[#1e1e2a]">
              {Object.entries(sourceLabels).map(([key, label]) => (
                <SelectItem key={key} value={key} className="text-white hover:bg-[#c9a55c]/10">
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-gray-300">Prioridade</Label>
          <Select
            value={formData.priority}
            onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}
          >
            <SelectTrigger className="bg-[#1a1a25] border-[#1e1e2a] text-white mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#12121a] border-[#1e1e2a]">
              {Object.entries(priorityConfig).map(([key, config]) => (
                <SelectItem key={key} value={key} className="text-white hover:bg-[#c9a55c]/10">
                  {config.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label className="text-gray-300">Interesses</Label>
        <div className="flex gap-2 mt-1">
          <Input
            value={interestInput}
            onChange={(e) => setInterestInput(e.target.value)}
            placeholder="Ex: Botox, Preenchimento..."
            className="bg-[#1a1a25] border-[#1e1e2a] text-white"
            onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addInterest())}
          />
          <Button type="button" onClick={addInterest} variant="outline" className="border-[#c9a55c]/30 text-[#c9a55c]">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        {formData.interest?.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {formData.interest.map((int, i) => (
              <Badge
                key={i}
                className="bg-[#c9a55c]/20 text-[#c9a55c] cursor-pointer"
                onClick={() => removeInterest(i)}
              >
                {int} ×
              </Badge>
            ))}
          </div>
        )}
      </div>

      <div>
        <Label className="text-gray-300">Observações</Label>
        <Textarea
          value={formData.notes}
          onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
          className="bg-[#1a1a25] border-[#1e1e2a] text-white mt-1"
          rows={3}
        />
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="ghost" onClick={onClose} className="text-gray-400">
          Cancelar
        </Button>
        <Button type="submit" className="bg-[#c9a55c] hover:bg-[#a17f3f] text-black">
          {lead ? "Salvar Alterações" : "Criar Lead"}
        </Button>
      </div>
    </form>
  );
};

const LeadDetails = ({ lead, onClose, onUpdate }) => {
  if (!lead) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-[#c9a55c]/20 flex items-center justify-center">
            <span className="text-2xl text-[#c9a55c] font-medium">{lead.name?.[0]?.toUpperCase()}</span>
          </div>
          <div>
            <h2 className="text-xl font-medium text-white">{lead.name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <Badge className={priorityConfig[lead.priority]?.color}>
                {priorityConfig[lead.priority]?.label}
              </Badge>
              <Badge variant="outline" className="border-[#1e1e2a] text-gray-400">
                {sourceLabels[lead.source]}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-[#1a1a25] rounded-lg">
          <p className="text-xs text-gray-500 mb-1">Telefone</p>
          <p className="text-white">{lead.phone}</p>
        </div>
        <div className="p-4 bg-[#1a1a25] rounded-lg">
          <p className="text-xs text-gray-500 mb-1">E-mail</p>
          <p className="text-white">{lead.email || "-"}</p>
        </div>
      </div>

      {lead.interest?.length > 0 && (
        <div>
          <p className="text-sm text-gray-400 mb-2">Interesses</p>
          <div className="flex flex-wrap gap-2">
            {lead.interest.map((int, i) => (
              <Badge key={i} className="bg-[#c9a55c]/20 text-[#c9a55c]">{int}</Badge>
            ))}
          </div>
        </div>
      )}

      <div>
        <p className="text-sm text-gray-400 mb-2">Mover para</p>
        <div className="flex flex-wrap gap-2">
          {pipelineStages.map((stage) => (
            <Button
              key={stage.id}
              variant="outline"
              size="sm"
              onClick={() => onUpdate(lead.id, { pipeline_stage: stage.id })}
              className={`border-[#1e1e2a] ${lead.pipeline_stage === stage.id ? "bg-[#c9a55c]/20 text-[#c9a55c] border-[#c9a55c]/30" : "text-gray-400 hover:text-white"}`}
            >
              {stage.label}
            </Button>
          ))}
        </div>
      </div>

      {lead.notes && (
        <div>
          <p className="text-sm text-gray-400 mb-2">Observações</p>
          <p className="text-gray-300 bg-[#1a1a25] p-4 rounded-lg">{lead.notes}</p>
        </div>
      )}

      <div className="flex gap-3">
        <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700">
          <MessageSquare className="mr-2 h-4 w-4" />
          WhatsApp
        </Button>
        <Button className="flex-1 bg-[#c9a55c] hover:bg-[#a17f3f] text-black">
          <Calendar className="mr-2 h-4 w-4" />
          Agendar
        </Button>
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

  const { data: leads = [], isLoading } = useQuery({
    queryKey: ["leads"],
    queryFn: () => base44.entities.Lead.list("-created_date", 500),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Lead.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      setIsFormOpen(false);
      setEditingLead(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Lead.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      setSelectedLead(null);
    },
  });

  const handleSave = (data) => {
    if (editingLead) {
      updateMutation.mutate({ id: editingLead.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleUpdate = (id, data) => {
    updateMutation.mutate({ id, data });
  };

  const filteredLeads = leads.filter(lead =>
    lead.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.phone?.includes(searchTerm) ||
    lead.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getLeadsByStage = (stageId) => {
    return filteredLeads.filter(lead => lead.pipeline_stage === stageId);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif text-white">CRM</h1>
          <p className="text-gray-400">Gerencie seus leads e oportunidades</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative flex-1 lg:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Buscar leads..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-[#1a1a25] border-[#1e1e2a] text-white"
            />
          </div>
          <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#c9a55c] hover:bg-[#a17f3f] text-black">
                <Plus className="mr-2 h-4 w-4" />
                Novo Lead
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#12121a] border-[#1e1e2a] text-white max-w-lg">
              <DialogHeader>
                <DialogTitle className="text-xl font-serif">{editingLead ? "Editar Lead" : "Novo Lead"}</DialogTitle>
              </DialogHeader>
              <LeadForm
                lead={editingLead}
                onSave={handleSave}
                onClose={() => { setIsFormOpen(false); setEditingLead(null); }}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        {pipelineStages.map((stage) => {
          const count = getLeadsByStage(stage.id).length;
          return (
            <Card key={stage.id} className="bg-[#12121a] border-[#1e1e2a]">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <div className={`w-2 h-2 rounded-full ${stage.color}`} />
                  <span className="text-xs text-gray-400">{stage.label}</span>
                </div>
                <p className="text-2xl font-light text-white">{count}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* View Toggle */}
      <Tabs value={viewMode} onValueChange={setViewMode} className="w-full">
        <TabsList className="bg-[#1a1a25] border border-[#1e1e2a]">
          <TabsTrigger value="kanban" className="data-[state=active]:bg-[#c9a55c]/20 data-[state=active]:text-[#c9a55c]">
            Kanban
          </TabsTrigger>
          <TabsTrigger value="list" className="data-[state=active]:bg-[#c9a55c]/20 data-[state=active]:text-[#c9a55c]">
            Lista
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Kanban Board */}
      {viewMode === "kanban" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 overflow-x-auto pb-4">
          {pipelineStages.map((stage) => (
            <div key={stage.id} className="min-w-[280px]">
              <div className="flex items-center gap-2 mb-4 px-2">
                <div className={`w-3 h-3 rounded-full ${stage.color}`} />
                <h3 className="font-medium text-white">{stage.label}</h3>
                <Badge variant="outline" className="ml-auto border-[#1e1e2a] text-gray-400">
                  {getLeadsByStage(stage.id).length}
                </Badge>
              </div>
              <div className="space-y-3 max-h-[calc(100vh-400px)] overflow-y-auto pr-2">
                {getLeadsByStage(stage.id).map((lead) => (
                  <LeadCard
                    key={lead.id}
                    lead={lead}
                    onUpdate={handleUpdate}
                    onSelect={setSelectedLead}
                  />
                ))}
                {getLeadsByStage(stage.id).length === 0 && (
                  <div className="p-4 border-2 border-dashed border-[#1e1e2a] rounded-xl text-center text-gray-500 text-sm">
                    Nenhum lead
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* List View */}
      {viewMode === "list" && (
        <Card className="bg-[#12121a] border-[#1e1e2a]">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#1e1e2a]">
                    <th className="text-left p-4 text-sm text-gray-400 font-medium">Nome</th>
                    <th className="text-left p-4 text-sm text-gray-400 font-medium">Telefone</th>
                    <th className="text-left p-4 text-sm text-gray-400 font-medium">Origem</th>
                    <th className="text-left p-4 text-sm text-gray-400 font-medium">Etapa</th>
                    <th className="text-left p-4 text-sm text-gray-400 font-medium">Prioridade</th>
                    <th className="text-left p-4 text-sm text-gray-400 font-medium">Data</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLeads.map((lead) => (
                    <tr
                      key={lead.id}
                      onClick={() => setSelectedLead(lead)}
                      className="border-b border-[#1e1e2a] hover:bg-[#c9a55c]/5 cursor-pointer"
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#c9a55c]/20 flex items-center justify-center">
                            <span className="text-sm text-[#c9a55c]">{lead.name?.[0]?.toUpperCase()}</span>
                          </div>
                          <span className="text-white">{lead.name}</span>
                        </div>
                      </td>
                      <td className="p-4 text-gray-400">{lead.phone}</td>
                      <td className="p-4 text-gray-400">{sourceLabels[lead.source]}</td>
                      <td className="p-4">
                        <Badge variant="outline" className="border-[#1e1e2a] text-gray-400">
                          {pipelineStages.find(s => s.id === lead.pipeline_stage)?.label || "Entrada"}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <Badge className={priorityConfig[lead.priority]?.color}>
                          {priorityConfig[lead.priority]?.label}
                        </Badge>
                      </td>
                      <td className="p-4 text-gray-400">
                        {lead.created_date && format(parseISO(lead.created_date), "dd/MM/yyyy")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lead Details Dialog */}
      <Dialog open={!!selectedLead} onOpenChange={() => setSelectedLead(null)}>
        <DialogContent className="bg-[#12121a] border-[#1e1e2a] text-white max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-serif">Detalhes do Lead</DialogTitle>
          </DialogHeader>
          <LeadDetails
            lead={selectedLead}
            onClose={() => setSelectedLead(null)}
            onUpdate={handleUpdate}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}