import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { differenceInYears, parseISO } from "date-fns";
import {
  Plus, Search, Phone, User, Activity, FileUp
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import PatientImport from "@/components/patients/PatientImport";
import PatientTreatmentPanel from "@/components/patients/PatientTreatmentPanel";
import TreatmentWizard from "@/components/patients/TreatmentWizard";

const statusConfig = {
  active: { label: "Ativo", color: "bg-emerald-500/20 text-emerald-400" },
  inactive: { label: "Inativo", color: "bg-gray-500/20 text-gray-400" },
  vip: { label: "VIP", color: "bg-[#c9a55c]/20 text-[#c9a55c]" }
};

const PatientForm = ({ patient, onSave, onClose }) => {
  const [formData, setFormData] = useState(patient || {
    full_name: "", document_type: "cpf", document_number: "",
    birth_date: "", gender: "female", phone: "", whatsapp: "", email: "",
    address: { street: "", number: "", complement: "", neighborhood: "", city: "", state: "", zip_code: "" },
    status: "active", source: "instagram", notes: "",
    consent_whatsapp: false, consent_images: false, consent_terms_signed: false, tags: []
  });

  const handleSubmit = (e) => { e.preventDefault(); onSave(formData); };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
      <div>
        <h3 className="text-sm font-medium text-[#c9a55c] mb-3">Dados Pessoais</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <Label className="text-gray-300">Nome Completo *</Label>
            <Input value={formData.full_name} onChange={(e) => setFormData(p => ({ ...p, full_name: e.target.value }))} className="bg-[#1a1a25] border-[#1e1e2a] text-white mt-1" required />
          </div>
          <div>
            <Label className="text-gray-300">Tipo de Documento</Label>
            <Select value={formData.document_type} onValueChange={(v) => setFormData(p => ({ ...p, document_type: v }))}>
              <SelectTrigger className="bg-[#1a1a25] border-[#1e1e2a] text-white mt-1"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-[#12121a] border-[#1e1e2a]">
                <SelectItem value="cpf" className="text-white">CPF</SelectItem>
                <SelectItem value="rg" className="text-white">RG</SelectItem>
                <SelectItem value="passport" className="text-white">Passaporte</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-gray-300">Número do Documento</Label>
            <Input value={formData.document_number} onChange={(e) => setFormData(p => ({ ...p, document_number: e.target.value }))} className="bg-[#1a1a25] border-[#1e1e2a] text-white mt-1" />
          </div>
          <div>
            <Label className="text-gray-300">Data de Nascimento</Label>
            <Input type="date" value={formData.birth_date} onChange={(e) => setFormData(p => ({ ...p, birth_date: e.target.value }))} className="bg-[#1a1a25] border-[#1e1e2a] text-white mt-1" />
          </div>
          <div>
            <Label className="text-gray-300">Gênero</Label>
            <Select value={formData.gender} onValueChange={(v) => setFormData(p => ({ ...p, gender: v }))}>
              <SelectTrigger className="bg-[#1a1a25] border-[#1e1e2a] text-white mt-1"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-[#12121a] border-[#1e1e2a]">
                <SelectItem value="female" className="text-white">Feminino</SelectItem>
                <SelectItem value="male" className="text-white">Masculino</SelectItem>
                <SelectItem value="other" className="text-white">Outro</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium text-[#c9a55c] mb-3">Contato</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-gray-300">Telefone *</Label>
            <Input value={formData.phone} onChange={(e) => setFormData(p => ({ ...p, phone: e.target.value }))} className="bg-[#1a1a25] border-[#1e1e2a] text-white mt-1" required />
          </div>
          <div>
            <Label className="text-gray-300">WhatsApp</Label>
            <Input value={formData.whatsapp} onChange={(e) => setFormData(p => ({ ...p, whatsapp: e.target.value }))} className="bg-[#1a1a25] border-[#1e1e2a] text-white mt-1" />
          </div>
          <div className="col-span-2">
            <Label className="text-gray-300">E-mail</Label>
            <Input type="email" value={formData.email} onChange={(e) => setFormData(p => ({ ...p, email: e.target.value }))} className="bg-[#1a1a25] border-[#1e1e2a] text-white mt-1" />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium text-[#c9a55c] mb-3">Endereço</h3>
        <div className="grid grid-cols-6 gap-4">
          <div className="col-span-4">
            <Label className="text-gray-300">Rua</Label>
            <Input value={formData.address?.street} onChange={(e) => setFormData(p => ({ ...p, address: { ...p.address, street: e.target.value } }))} className="bg-[#1a1a25] border-[#1e1e2a] text-white mt-1" />
          </div>
          <div className="col-span-2">
            <Label className="text-gray-300">Número</Label>
            <Input value={formData.address?.number} onChange={(e) => setFormData(p => ({ ...p, address: { ...p.address, number: e.target.value } }))} className="bg-[#1a1a25] border-[#1e1e2a] text-white mt-1" />
          </div>
          <div className="col-span-3">
            <Label className="text-gray-300">Bairro</Label>
            <Input value={formData.address?.neighborhood} onChange={(e) => setFormData(p => ({ ...p, address: { ...p.address, neighborhood: e.target.value } }))} className="bg-[#1a1a25] border-[#1e1e2a] text-white mt-1" />
          </div>
          <div className="col-span-3">
            <Label className="text-gray-300">Cidade</Label>
            <Input value={formData.address?.city} onChange={(e) => setFormData(p => ({ ...p, address: { ...p.address, city: e.target.value } }))} className="bg-[#1a1a25] border-[#1e1e2a] text-white mt-1" />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium text-[#c9a55c] mb-3">Status e Origem</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-gray-300">Status</Label>
            <Select value={formData.status} onValueChange={(v) => setFormData(p => ({ ...p, status: v }))}>
              <SelectTrigger className="bg-[#1a1a25] border-[#1e1e2a] text-white mt-1"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-[#12121a] border-[#1e1e2a]">
                <SelectItem value="active" className="text-white">Ativo</SelectItem>
                <SelectItem value="inactive" className="text-white">Inativo</SelectItem>
                <SelectItem value="vip" className="text-white">VIP</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-gray-300">Origem</Label>
            <Select value={formData.source} onValueChange={(v) => setFormData(p => ({ ...p, source: v }))}>
              <SelectTrigger className="bg-[#1a1a25] border-[#1e1e2a] text-white mt-1"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-[#12121a] border-[#1e1e2a]">
                <SelectItem value="instagram" className="text-white">Instagram</SelectItem>
                <SelectItem value="google" className="text-white">Google</SelectItem>
                <SelectItem value="referral" className="text-white">Indicação</SelectItem>
                <SelectItem value="website" className="text-white">Website</SelectItem>
                <SelectItem value="whatsapp" className="text-white">WhatsApp</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium text-[#c9a55c] mb-3">Consentimentos (LGPD)</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Checkbox id="consent_whatsapp" checked={formData.consent_whatsapp} onCheckedChange={(v) => setFormData(p => ({ ...p, consent_whatsapp: v }))} />
            <Label htmlFor="consent_whatsapp" className="text-gray-300 text-sm">Autorizo comunicações via WhatsApp</Label>
          </div>
          <div className="flex items-center gap-3">
            <Checkbox id="consent_images" checked={formData.consent_images} onCheckedChange={(v) => setFormData(p => ({ ...p, consent_images: v }))} />
            <Label htmlFor="consent_images" className="text-gray-300 text-sm">Autorizo uso de imagens para documentação</Label>
          </div>
          <div className="flex items-center gap-3">
            <Checkbox id="consent_terms" checked={formData.consent_terms_signed} onCheckedChange={(v) => setFormData(p => ({ ...p, consent_terms_signed: v }))} />
            <Label htmlFor="consent_terms" className="text-gray-300 text-sm">Termos e condições aceitos</Label>
          </div>
        </div>
      </div>

      <div>
        <Label className="text-gray-300">Observações</Label>
        <Textarea value={formData.notes} onChange={(e) => setFormData(p => ({ ...p, notes: e.target.value }))} className="bg-[#1a1a25] border-[#1e1e2a] text-white mt-1" rows={3} />
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-[#1e1e2a]">
        <Button type="button" variant="ghost" onClick={onClose} className="text-gray-400">Cancelar</Button>
        <Button type="submit" className="bg-[#c9a55c] hover:bg-[#a17f3f] text-black">
          {patient ? "Salvar Alterações" : "Cadastrar Paciente"}
        </Button>
      </div>
    </form>
  );
};

const PatientCard = ({ patient, onStartTreatment, onViewTreatments }) => {
  const age = patient.birth_date ? differenceInYears(new Date(), parseISO(patient.birth_date)) : null;

  return (
    <Card className="bg-[#12121a] border-[#1e1e2a] hover:border-[#c9a55c]/30 transition-all group">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <Avatar className="h-12 w-12 border border-[#c9a55c]/30 flex-shrink-0">
            <AvatarImage src={patient.photo_url} />
            <AvatarFallback className="bg-[#c9a55c]/20 text-[#c9a55c]">
              {patient.full_name?.[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-medium text-white truncate group-hover:text-[#c9a55c] transition-colors">
                {patient.full_name}
              </h3>
              <Badge className={statusConfig[patient.status]?.color || statusConfig.active.color}>
                {statusConfig[patient.status]?.label || "Ativo"}
              </Badge>
            </div>
            <div className="flex items-center gap-4 mt-1 text-sm text-gray-400">
              {age && <span>{age} anos</span>}
              <span className="flex items-center gap-1">
                <Phone className="h-3 w-3" />
                {patient.phone}
              </span>
            </div>
            {patient.tags?.length > 0 && (
              <div className="flex gap-1 mt-2 flex-wrap">
                {patient.tags.slice(0, 3).map((tag, i) => (
                  <Badge key={i} variant="outline" className="text-xs border-[#1e1e2a] text-gray-500">{tag}</Badge>
                ))}
              </div>
            )}
          </div>
          <div className="flex flex-col gap-1.5 flex-shrink-0">
            <Button
              size="sm"
              onClick={(e) => { e.stopPropagation(); onStartTreatment(patient); }}
              className="bg-[#c9a55c] hover:bg-[#a17f3f] text-black text-xs h-7 px-3"
            >
              <Activity className="mr-1 h-3 w-3" />
              Iniciar
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => { e.stopPropagation(); onViewTreatments(patient); }}
              className="text-[#c9a55c] hover:bg-[#c9a55c]/10 text-xs h-7 px-3"
            >
              Histórico
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default function Patients() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState(null);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isTreatmentModalOpen, setIsTreatmentModalOpen] = useState(false);
  const [patientForTreatment, setPatientForTreatment] = useState(null);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [patientForWizard, setPatientForWizard] = useState(null);

  const { data: patients = [], isLoading } = useQuery({
    queryKey: ["patients"],
    queryFn: () => base44.entities.Patient.list("-created_date", 1000),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Patient.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["patients"] }); setIsFormOpen(false); setEditingPatient(null); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Patient.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["patients"] }); setEditingPatient(null); setIsFormOpen(false); },
  });

  const handleSave = (data) => {
    if (editingPatient) updateMutation.mutate({ id: editingPatient.id, data });
    else createMutation.mutate(data);
  };

  const filteredPatients = patients.filter(patient => {
    const matchesSearch = patient.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.phone?.includes(searchTerm) ||
      patient.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || patient.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: patients.length,
    active: patients.filter(p => p.status === "active").length,
    vip: patients.filter(p => p.status === "vip").length,
    thisMonth: patients.filter(p => {
      if (!p.created_date) return false;
      const created = parseISO(p.created_date);
      const now = new Date();
      return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
    }).length
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif text-white">Pacientes</h1>
          <p className="text-gray-400">Gerencie o cadastro de pacientes</p>
        </div>
        <div className="flex gap-3">
          <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="border-[#c9a55c]/30 text-[#c9a55c] hover:bg-[#c9a55c]/10">
                <FileUp className="mr-2 h-4 w-4" />
                Importar Planilha
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#12121a] border-[#1e1e2a] text-white max-w-xl">
              <DialogHeader>
                <DialogTitle className="text-xl font-serif">Importar Pacientes</DialogTitle>
              </DialogHeader>
              <PatientImport
                existingPatients={patients}
                onDone={() => { queryClient.invalidateQueries({ queryKey: ["patients"] }); setIsImportOpen(false); }}
              />
            </DialogContent>
          </Dialog>

          <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#c9a55c] hover:bg-[#a17f3f] text-black">
                <Plus className="mr-2 h-4 w-4" />
                Novo Paciente
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#12121a] border-[#1e1e2a] text-white max-w-2xl">
              <DialogHeader>
                <DialogTitle className="text-xl font-serif">
                  {editingPatient ? "Editar Paciente" : "Novo Paciente"}
                </DialogTitle>
              </DialogHeader>
              <PatientForm
                patient={editingPatient}
                onSave={handleSave}
                onClose={() => { setIsFormOpen(false); setEditingPatient(null); }}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total de Pacientes", value: stats.total, color: "text-white" },
          { label: "Pacientes Ativos", value: stats.active, color: "text-emerald-400" },
          { label: "Pacientes VIP", value: stats.vip, color: "text-[#c9a55c]" },
          { label: "Novos Este Mês", value: stats.thisMonth, color: "text-white" },
        ].map((s, i) => (
          <Card key={i} className="bg-[#12121a] border-[#1e1e2a]">
            <CardContent className="p-4">
              <p className="text-xs text-gray-500">{s.label}</p>
              <p className={`text-2xl font-light mt-1 ${s.color}`}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Buscar por nome, telefone ou e-mail..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-[#1a1a25] border-[#1e1e2a] text-white"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40 bg-[#1a1a25] border-[#1e1e2a] text-white">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="bg-[#12121a] border-[#1e1e2a]">
            <SelectItem value="all" className="text-white">Todos</SelectItem>
            <SelectItem value="active" className="text-white">Ativos</SelectItem>
            <SelectItem value="inactive" className="text-white">Inativos</SelectItem>
            <SelectItem value="vip" className="text-white">VIP</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Patient List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredPatients.map((patient) => (
          <PatientCard
            key={patient.id}
            patient={patient}
            onStartTreatment={(p) => { setPatientForWizard(p); setIsWizardOpen(true); }}
            onViewTreatments={(p) => { setPatientForTreatment(p); setIsTreatmentModalOpen(true); }}
          />
        ))}
      </div>

      {/* Treatment History Modal */}
      <Dialog open={isTreatmentModalOpen} onOpenChange={setIsTreatmentModalOpen}>
        <DialogContent className="bg-[#12121a] border-[#1e1e2a] text-white max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-serif">
              Tratamentos de {patientForTreatment?.full_name}
            </DialogTitle>
          </DialogHeader>
          {patientForTreatment && (
            <PatientTreatmentPanel
              patientId={patientForTreatment.id}
              patientName={patientForTreatment.full_name}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Treatment Wizard */}
      {isWizardOpen && patientForWizard && (
        <TreatmentWizard
          patient={patientForWizard}
          onClose={() => { setIsWizardOpen(false); setPatientForWizard(null); }}
          onSuccess={() => { setIsWizardOpen(false); setPatientForWizard(null); }}
        />
      )}

      {filteredPatients.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <User className="h-12 w-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">Nenhum paciente encontrado</p>
          <Button onClick={() => setIsFormOpen(true)} className="mt-4 bg-[#c9a55c]/20 text-[#c9a55c] hover:bg-[#c9a55c]/30">
            Cadastrar Primeiro Paciente
          </Button>
        </div>
      )}
    </div>
  );
}