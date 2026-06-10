import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, parseISO, addMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Plus,
  Search,
  ClipboardList,
  Calendar,
  User,
  CheckCircle,
  Clock,
  Package,
  Edit,
  Play,
  Pause,
  ChevronRight,
  Target
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import CurrencyInput from "@/components/ui/CurrencyInput";
import { useDragScroll } from "@/hooks/useDragScroll";

const durationOptions = [
  { value: 3, label: "3 meses" },
  { value: 6, label: "6 meses" },
  { value: 12, label: "12 meses" }
];

const statusConfig = {
  active: { label: "Ativo", color: "bg-emerald-500/20 text-emerald-400" },
  completed: { label: "Concluído", color: "bg-blue-500/20 text-blue-400" },
  paused: { label: "Pausado", color: "bg-yellow-500/20 text-yellow-400" },
  cancelled: { label: "Cancelado", color: "bg-red-500/20 text-red-400" }
};

const ProtocolForm = ({ protocol, procedures, onSave, onClose }) => {
  const [formData, setFormData] = useState(protocol || {
    name: "",
    description: "",
    duration_months: 3,
    total_sessions: 6,
    procedures_included: [],
    items_included: [],
    items_not_included: [],
    total_price: 0,
    total_cost: 0,
    payment_conditions: "",
    status: "active"
  });

  const [procedureInput, setProcedureInput] = useState({
    procedure_id: "",
    procedure_name: "",
    sessions: 1,
    interval_days: 30
  });

  const [itemInput, setItemInput] = useState("");
  const [notIncludedInput, setNotIncludedInput] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const addProcedure = () => {
    if (procedureInput.procedure_name) {
      setFormData(prev => ({
        ...prev,
        procedures_included: [...(prev.procedures_included || []), { ...procedureInput }]
      }));
      setProcedureInput({ procedure_id: "", procedure_name: "", sessions: 1, interval_days: 30 });
    }
  };

  const addItem = () => {
    if (itemInput.trim()) {
      setFormData(prev => ({
        ...prev,
        items_included: [...(prev.items_included || []), itemInput.trim()]
      }));
      setItemInput("");
    }
  };

  const addNotIncluded = () => {
    if (notIncludedInput.trim()) {
      setFormData(prev => ({
        ...prev,
        items_not_included: [...(prev.items_not_included || []), notIncludedInput.trim()]
      }));
      setNotIncludedInput("");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <Label className="text-gray-300">Nome do Protocolo *</Label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            className="bg-[#1a1a25] border-[#1e1e2a] text-white mt-1"
            required
          />
        </div>
        <div className="col-span-2">
          <Label className="text-gray-300">Descrição</Label>
          <Textarea
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            className="bg-[#1a1a25] border-[#1e1e2a] text-white mt-1"
            rows={2}
          />
        </div>
        <div>
          <Label className="text-gray-300">Duração</Label>
          <Select
            value={formData.duration_months?.toString()}
            onValueChange={(value) => setFormData(prev => ({ ...prev, duration_months: parseInt(value) }))}
          >
            <SelectTrigger className="bg-[#1a1a25] border-[#1e1e2a] text-white mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#12121a] border-[#1e1e2a]">
              {durationOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value.toString()} className="text-white">
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-gray-300">Total de Sessões</Label>
          <Input
            type="number"
            value={formData.total_sessions}
            onChange={(e) => setFormData(prev => ({ ...prev, total_sessions: parseInt(e.target.value) }))}
            className="bg-[#1a1a25] border-[#1e1e2a] text-white mt-1"
          />
        </div>
        <div>
          <Label className="text-gray-300">Valor Total (R$)</Label>
          <CurrencyInput
            value={formData.total_price}
            onChange={(v) => setFormData(prev => ({ ...prev, total_price: v }))}
            className="bg-[#1a1a25] border-[#1e1e2a] text-white mt-1"
          />
        </div>
        <div>
          <Label className="text-gray-300">Custo Total (R$)</Label>
          <CurrencyInput
            value={formData.total_cost}
            onChange={(v) => setFormData(prev => ({ ...prev, total_cost: v }))}
            className="bg-[#1a1a25] border-[#1e1e2a] text-white mt-1"
          />
        </div>
      </div>

      {/* Procedures */}
      <div>
        <Label className="text-gray-300">Procedimentos Inclusos</Label>
        <div className="grid grid-cols-4 gap-2 mt-2">
          <Select
            value={procedureInput.procedure_id}
            onValueChange={(value) => {
              const proc = procedures.find(p => p.id === value);
              setProcedureInput(prev => ({
                ...prev,
                procedure_id: value,
                procedure_name: proc?.name || ""
              }));
            }}
          >
            <SelectTrigger className="col-span-2 bg-[#1a1a25] border-[#1e1e2a] text-white">
              <SelectValue placeholder="Procedimento" />
            </SelectTrigger>
            <SelectContent className="bg-[#12121a] border-[#1e1e2a]">
              {procedures.map((proc) => (
                <SelectItem key={proc.id} value={proc.id} className="text-white">{proc.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            type="number"
            placeholder="Sessões"
            value={procedureInput.sessions}
            onChange={(e) => setProcedureInput(prev => ({ ...prev, sessions: parseInt(e.target.value) }))}
            className="bg-[#1a1a25] border-[#1e1e2a] text-white"
          />
          <Button type="button" onClick={addProcedure} variant="outline" className="border-[#c9a55c]/30 text-[#c9a55c]">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        {formData.procedures_included?.length > 0 && (
          <div className="space-y-2 mt-3">
            {formData.procedures_included.map((proc, i) => (
              <div key={i} className="flex items-center justify-between p-2 bg-[#1a1a25] rounded border border-[#1e1e2a]">
                <span className="text-white">{proc.procedure_name}</span>
                <Badge variant="outline" className="border-[#c9a55c]/30 text-[#c9a55c]">
                  {proc.sessions} sessões
                </Badge>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Items Included */}
      <div>
        <Label className="text-gray-300">O que está incluso</Label>
        <div className="flex gap-2 mt-1">
          <Input
            value={itemInput}
            onChange={(e) => setItemInput(e.target.value)}
            placeholder="Ex: Avaliação inicial, produtos home care..."
            className="bg-[#1a1a25] border-[#1e1e2a] text-white"
            onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addItem())}
          />
          <Button type="button" onClick={addItem} variant="outline" className="border-[#c9a55c]/30 text-[#c9a55c]">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        {formData.items_included?.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {formData.items_included.map((item, i) => (
              <Badge key={i} className="bg-emerald-500/20 text-emerald-400">
                ✓ {item}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Items Not Included */}
      <div>
        <Label className="text-gray-300">O que NÃO está incluso</Label>
        <div className="flex gap-2 mt-1">
          <Input
            value={notIncludedInput}
            onChange={(e) => setNotIncludedInput(e.target.value)}
            placeholder="Ex: Medicamentos adicionais..."
            className="bg-[#1a1a25] border-[#1e1e2a] text-white"
            onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addNotIncluded())}
          />
          <Button type="button" onClick={addNotIncluded} variant="outline" className="border-gray-500/30 text-gray-400">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        {formData.items_not_included?.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {formData.items_not_included.map((item, i) => (
              <Badge key={i} className="bg-gray-500/20 text-gray-400">
                ✗ {item}
              </Badge>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-[#1e1e2a]">
        <Button type="button" variant="ghost" onClick={onClose} className="text-gray-400">
          Cancelar
        </Button>
        <Button type="submit" className="bg-[#c9a55c] hover:bg-[#a17f3f] text-black">
          {protocol ? "Salvar" : "Criar Protocolo"}
        </Button>
      </div>
    </form>
  );
};

const AssignProtocolForm = ({ protocols, patients, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    patient_id: "",
    protocol_id: "",
    protocol_name: "",
    start_date: format(new Date(), "yyyy-MM-dd"),
    total_value: 0,
    notes: ""
  });

  const handleProtocolChange = (protocolId) => {
    const protocol = protocols.find(p => p.id === protocolId);
    setFormData(prev => ({
      ...prev,
      protocol_id: protocolId,
      protocol_name: protocol?.name || "",
      total_value: protocol?.total_price || 0,
      total_sessions: protocol?.total_sessions || 0,
      expected_end_date: protocol?.duration_months
        ? format(addMonths(new Date(prev.start_date), protocol.duration_months), "yyyy-MM-dd")
        : ""
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-h-[65vh] overflow-y-auto pr-1">
      <div>
        <Label className="text-gray-300">Paciente *</Label>
        <Select
          value={formData.patient_id}
          onValueChange={(value) => setFormData(prev => ({ ...prev, patient_id: value }))}
        >
          <SelectTrigger className="bg-[#1a1a25] border-[#1e1e2a] text-white mt-1">
            <SelectValue placeholder="Selecione o paciente" />
          </SelectTrigger>
          <SelectContent className="bg-[#12121a] border-[#1e1e2a]">
            {patients.map((patient) => (
              <SelectItem key={patient.id} value={patient.id} className="text-white">
                {patient.full_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="text-gray-300">Protocolo *</Label>
        <Select
          value={formData.protocol_id}
          onValueChange={handleProtocolChange}
        >
          <SelectTrigger className="bg-[#1a1a25] border-[#1e1e2a] text-white mt-1">
            <SelectValue placeholder="Selecione o protocolo" />
          </SelectTrigger>
          <SelectContent className="bg-[#12121a] border-[#1e1e2a]">
            {protocols.filter(p => p.status === "active").map((protocol) => (
              <SelectItem key={protocol.id} value={protocol.id} className="text-white">
                {protocol.name} ({protocol.duration_months} meses)
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-gray-300">Data de Início</Label>
          <Input
            type="date"
            value={formData.start_date}
            onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
            className="bg-[#1a1a25] border-[#1e1e2a] text-white mt-1"
          />
        </div>
        <div>
          <Label className="text-gray-300">Valor (R$)</Label>
          <CurrencyInput
            value={formData.total_value}
            onChange={(v) => setFormData(prev => ({ ...prev, total_value: v }))}
            className="bg-[#1a1a25] border-[#1e1e2a] text-white mt-1"
          />
        </div>
      </div>

      <div>
        <Label className="text-gray-300">Observações</Label>
        <Textarea
          value={formData.notes}
          onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
          className="bg-[#1a1a25] border-[#1e1e2a] text-white mt-1"
          rows={2}
        />
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="ghost" onClick={onClose} className="text-gray-400">
          Cancelar
        </Button>
        <Button type="submit" className="bg-[#c9a55c] hover:bg-[#a17f3f] text-black">
          Iniciar Protocolo
        </Button>
      </div>
    </form>
  );
};

const PatientProtocolCard = ({ patientProtocol, patient, onClick }) => {
  const progress = patientProtocol.total_sessions > 0
    ? ((patientProtocol.sessions_completed || 0) / patientProtocol.total_sessions) * 100
    : 0;

  return (
    <Card
      onClick={onClick}
      className="bg-[#12121a] border-[#1e1e2a] hover:border-[#c9a55c]/30 cursor-pointer transition-all"
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 border border-[#c9a55c]/30">
              <AvatarFallback className="bg-[#c9a55c]/20 text-[#c9a55c]">
                {patient?.full_name?.[0]?.toUpperCase() || "?"}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-medium text-white">{patient?.full_name}</h3>
              <p className="text-sm text-gray-400">{patientProtocol.protocol_name}</p>
            </div>
          </div>
          <Badge className={statusConfig[patientProtocol.status]?.color || statusConfig.active.color}>
            {statusConfig[patientProtocol.status]?.label || "Ativo"}
          </Badge>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Progresso</span>
            <span className="text-[#c9a55c]">
              {patientProtocol.sessions_completed || 0}/{patientProtocol.total_sessions} sessões
            </span>
          </div>
          <Progress value={progress} className="h-2 bg-[#1e1e2a]" />
        </div>

        <div className="flex justify-between text-xs text-gray-500 mt-3">
          <span>Início: {patientProtocol.start_date && format(parseISO(patientProtocol.start_date), "dd/MM/yyyy")}</span>
          <span>Término: {patientProtocol.expected_end_date && format(parseISO(patientProtocol.expected_end_date), "dd/MM/yyyy")}</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default function Protocols() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("active");
  const [isProtocolFormOpen, setIsProtocolFormOpen] = useState(false);
  const [isAssignFormOpen, setIsAssignFormOpen] = useState(false);
  const [editingProtocol, setEditingProtocol] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const { data: protocols = [] } = useQuery({
    queryKey: ["protocols"],
    queryFn: () => base44.entities.Protocol.list("-created_date", 100),
  });

  const { data: patientProtocols = [] } = useQuery({
    queryKey: ["patient-protocols"],
    queryFn: () => base44.entities.PatientProtocol.list("-created_date", 500),
  });

  const { data: patients = [] } = useQuery({
    queryKey: ["patients"],
    queryFn: () => base44.entities.Patient.list("-created_date", 1000),
  });

  const { data: procedures = [] } = useQuery({
    queryKey: ["procedures"],
    queryFn: () => base44.entities.Procedure.list(),
  });

  const createProtocolMutation = useMutation({
    mutationFn: (data) => base44.entities.Protocol.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["protocols"] });
      setIsProtocolFormOpen(false);
      setEditingProtocol(null);
    },
  });

  const updateProtocolMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Protocol.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["protocols"] });
      setIsProtocolFormOpen(false);
      setEditingProtocol(null);
    },
  });

  const assignProtocolMutation = useMutation({
    mutationFn: (data) => base44.entities.PatientProtocol.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patient-protocols"] });
      setIsAssignFormOpen(false);
    },
  });

  const handleSaveProtocol = (data) => {
    if (editingProtocol) {
      updateProtocolMutation.mutate({ id: editingProtocol.id, data });
    } else {
      createProtocolMutation.mutate(data);
    }
  };

  const handleAssignProtocol = (data) => {
    const protocol = protocols.find(p => p.id === data.protocol_id);
    assignProtocolMutation.mutate({
      ...data,
      total_sessions: protocol?.total_sessions || 0,
      sessions_completed: 0,
      status: "active",
      expected_end_date: protocol?.duration_months
        ? format(addMonths(parseISO(data.start_date), protocol.duration_months), "yyyy-MM-dd")
        : ""
    });
  };

  const getPatient = (patientId) => patients.find(p => p.id === patientId);

  const activePatientProtocols = patientProtocols.filter(pp => pp.status === "active");
  const completedPatientProtocols = patientProtocols.filter(pp => pp.status === "completed");

  const dragRefActive    = useDragScroll();
  const dragRefCompleted = useDragScroll();
  const dragRefTemplates = useDragScroll();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif text-white">Protocolos</h1>
          <p className="text-gray-400">Gerencie protocolos de tratamento</p>
        </div>
        <div className="flex gap-3">
          <Dialog open={isAssignFormOpen} onOpenChange={setIsAssignFormOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="border-[#c9a55c]/30 text-[#c9a55c] hover:bg-[#c9a55c]/10">
                <Play className="mr-2 h-4 w-4" />
                Iniciar Protocolo
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#12121a] border-[#1e1e2a] text-white max-w-md max-h-[90vh] overflow-hidden flex flex-col">
              <DialogHeader className="flex-shrink-0">
                <DialogTitle className="text-xl font-serif">Iniciar Protocolo</DialogTitle>
              </DialogHeader>
              <AssignProtocolForm
                protocols={protocols}
                patients={patients}
                onSave={handleAssignProtocol}
                onClose={() => setIsAssignFormOpen(false)}
              />
            </DialogContent>
          </Dialog>
          <Dialog open={isProtocolFormOpen} onOpenChange={setIsProtocolFormOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#c9a55c] hover:bg-[#a17f3f] text-black">
                <Plus className="mr-2 h-4 w-4" />
                Novo Protocolo
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#12121a] border-[#1e1e2a] text-white max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
              <DialogHeader className="flex-shrink-0">
                <DialogTitle className="text-xl font-serif">
                  {editingProtocol ? "Editar Protocolo" : "Novo Protocolo"}
                </DialogTitle>
              </DialogHeader>
              <ProtocolForm
                protocol={editingProtocol}
                procedures={procedures}
                onSave={handleSaveProtocol}
                onClose={() => { setIsProtocolFormOpen(false); setEditingProtocol(null); }}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-[#12121a] border-[#1e1e2a]">
          <CardContent className="p-4">
            <p className="text-xs text-gray-500">Protocolos Ativos</p>
            <p className="text-2xl font-light text-[#c9a55c] mt-1">{activePatientProtocols.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-[#12121a] border-[#1e1e2a]">
          <CardContent className="p-4">
            <p className="text-xs text-gray-500">Concluídos</p>
            <p className="text-2xl font-light text-emerald-400 mt-1">{completedPatientProtocols.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-[#12121a] border-[#1e1e2a]">
          <CardContent className="p-4">
            <p className="text-xs text-gray-500">Modelos Disponíveis</p>
            <p className="text-2xl font-light text-white mt-1">
              {protocols.filter(p => p.status === "active").length}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-[#12121a] border-[#1e1e2a]">
          <CardContent className="p-4">
            <p className="text-xs text-gray-500">Valor Médio</p>
            <p className="text-2xl font-light text-white mt-1">
              R$ {protocols.length > 0
                ? (protocols.reduce((sum, p) => sum + (p.total_price || 0), 0) / protocols.length).toLocaleString("pt-BR")
                : "0"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-[#1a1a25] border border-[#1e1e2a]">
          <TabsTrigger value="active" className="data-[state=active]:bg-[#c9a55c]/20 data-[state=active]:text-[#c9a55c]">
            Em Andamento ({activePatientProtocols.length})
          </TabsTrigger>
          <TabsTrigger value="completed" className="data-[state=active]:bg-[#c9a55c]/20 data-[state=active]:text-[#c9a55c]">
            Concluídos ({completedPatientProtocols.length})
          </TabsTrigger>
          <TabsTrigger value="templates" className="data-[state=active]:bg-[#c9a55c]/20 data-[state=active]:text-[#c9a55c]">
            Modelos ({protocols.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-6">
          <div
            ref={dragRefActive}
            className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 overflow-auto select-none"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {activePatientProtocols.map((pp) => (
              <PatientProtocolCard
                key={pp.id}
                patientProtocol={pp}
                patient={getPatient(pp.patient_id)}
                onClick={() => {}}
              />
            ))}
          </div>
          {activePatientProtocols.length === 0 && (
            <div className="text-center py-12">
              <ClipboardList className="h-12 w-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">Nenhum protocolo em andamento</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="completed" className="mt-6">
          <div
            ref={dragRefCompleted}
            className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 overflow-auto select-none"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {completedPatientProtocols.map((pp) => (
              <PatientProtocolCard
                key={pp.id}
                patientProtocol={pp}
                patient={getPatient(pp.patient_id)}
                onClick={() => {}}
              />
            ))}
          </div>
          {completedPatientProtocols.length === 0 && (
            <div className="text-center py-12">
              <CheckCircle className="h-12 w-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">Nenhum protocolo concluído</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="templates" className="mt-6">
          <div
            ref={dragRefTemplates}
            className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 overflow-auto select-none"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {protocols.map((protocol) => (
              <Card
                key={protocol.id}
                onClick={() => { setEditingProtocol(protocol); setIsProtocolFormOpen(true); }}
                className="bg-[#12121a] border-[#1e1e2a] hover:border-[#c9a55c]/30 cursor-pointer transition-all"
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-medium text-white">{protocol.name}</h3>
                      <p className="text-sm text-gray-400">{protocol.duration_months} meses</p>
                    </div>
                    <Badge className={protocol.status === "active" ? "bg-emerald-500/20 text-emerald-400" : "bg-gray-500/20 text-gray-400"}>
                      {protocol.status === "active" ? "Ativo" : "Inativo"}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-500 line-clamp-2 mb-3">{protocol.description}</p>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">{protocol.total_sessions} sessões</span>
                    <span className="text-[#c9a55c] font-medium">
                      R$ {protocol.total_price?.toLocaleString("pt-BR")}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          {protocols.length === 0 && (
            <div className="text-center py-12">
              <Target className="h-12 w-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">Nenhum modelo de protocolo cadastrado</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}