import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Plus,
  Search,
  FileText,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AIRecordInput from "@/components/medical/AIRecordInput";
import AudioRecorder from "@/components/medical/AudioRecorder";

const statusConfig = {
  draft: { label: "Rascunho", color: "bg-gray-500/20 text-gray-400" },
  pending_review: { label: "Revisão", color: "bg-yellow-500/20 text-yellow-400" },
  approved: { label: "Aprovado", color: "bg-emerald-500/20 text-emerald-400" }
};

const MedicalRecordForm = ({ record, patients, procedures, onSave, onClose }) => {
  const [formData, setFormData] = useState(record || {
    patient_id: "",
    record_date: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    chief_complaint: "",
    medical_history: "",
    allergies: [],
    contraindications: [],
    current_medications: [],
    procedures_performed: [],
    evolution: "",
    recommendations: "",
    status: "draft"
  });

  const [allergyInput, setAllergyInput] = useState("");
  const [medicationInput, setMedicationInput] = useState("");
  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const addAllergy = () => {
    if (allergyInput.trim()) {
      setFormData(prev => ({
        ...prev,
        allergies: [...(prev.allergies || []), allergyInput.trim()]
      }));
      setAllergyInput("");
    }
  };

  const addMedication = () => {
    if (medicationInput.trim()) {
      setFormData(prev => ({
        ...prev,
        current_medications: [...(prev.current_medications || []), medicationInput.trim()]
      }));
      setMedicationInput("");
    }
  };

  const addProcedure = () => {
    setFormData(prev => ({
      ...prev,
      procedures_performed: [...(prev.procedures_performed || []), {
        procedure_name: "",
        quantity_applied: 0,
        unit: "ml",
        batch_number: "",
        area_treated: ""
      }]
    }));
  };

  const updateProcedure = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      procedures_performed: prev.procedures_performed.map((p, i) =>
        i === index ? { ...p, [field]: value } : p
      )
    }));
  };

  // Preenchimento por audio — secao prontuario
  const handleAIResult = (aiData) => {
    const val = (v) => (!v || v === "Nao informado no audio." || v === "Não informado no áudio.") ? "" : v.trim();
    setFormData(prev => {
      const updated = { ...prev };
      if (val(aiData.chief_complaint))  updated.chief_complaint = val(aiData.chief_complaint);
      if (val(aiData.medical_history))  updated.medical_history = val(aiData.medical_history);
      if (val(aiData.recommendations))  updated.recommendations = val(aiData.recommendations);
      if (val(aiData.audio_transcription)) updated.audio_transcription = val(aiData.audio_transcription);
      // Evolucao: adicionar ao invés de substituir se ja houver conteudo
      if (val(aiData.evolution)) {
        updated.evolution = prev.evolution
          ? prev.evolution + "\n\n" + val(aiData.evolution)
          : val(aiData.evolution);
      }
      // Alergias por audio (string) — adicionar ao array existente se mencionadas
      if (val(aiData.alergias)) {
        const novas = val(aiData.alergias).split(/[,;]+/).map(s => s.trim()).filter(Boolean);
        const existentes = prev.allergies || [];
        const combinadas = [...existentes, ...novas.filter(n => !existentes.includes(n))];
        updated.allergies = combinadas;
      }
      // Medicacoes por audio (string) — adicionar ao array existente se mencionadas
      if (val(aiData.medicacoes_em_uso)) {
        const novas = val(aiData.medicacoes_em_uso).split(/[,;]+/).map(s => s.trim()).filter(Boolean);
        const existentes = prev.current_medications || [];
        const combinadas = [...existentes, ...novas.filter(n => !existentes.includes(n))];
        updated.current_medications = combinadas;
      }
      return updated;
    });
  };

  // Preenchimento por audio — secao evolucao
  const handleEvolutionAudioResult = (aiData) => {
    const val = (v) => (!v || v === "Nao informado no audio." || v === "Não informado no áudio.") ? "" : v.trim();
    setFormData(prev => {
      const updated = { ...prev };
      if (val(aiData.evolution)) {
        updated.evolution = prev.evolution
          ? prev.evolution + "\n\n" + val(aiData.evolution)
          : val(aiData.evolution);
      }
      if (val(aiData.recommendations)) updated.recommendations = val(aiData.recommendations);
      if (val(aiData.audio_transcription)) updated.audio_transcription = val(aiData.audio_transcription);
      return updated;
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-h-[75vh] overflow-y-auto pr-2">
      {/* AI Input — secao prontuario */}
      <AIRecordInput
        section="prontuario"
        existingFields={{
          queixa_principal: formData.chief_complaint,
          historico_medico: formData.medical_history,
          conduta_planejada: formData.evolution,
          recomendacoes: formData.recommendations,
        }}
        onResult={handleAIResult}
      />

      {/* Patient Selection */}
      <div>
        <Label className="text-gray-300">Paciente *</Label>
        <Select
          value={formData.patient_id}
          onValueChange={(value) => setFormData(prev => ({ ...prev, patient_id: value }))}
        >
          <SelectTrigger className="bg-[#1a1a25] border-[#1e1e2a] text-white mt-1">
            <SelectValue placeholder="Selecione o paciente" />
          </SelectTrigger>
          <SelectContent className="bg-[#12121a] border-[#1e1e2a] max-h-60">
            {patients.map((patient) => (
              <SelectItem key={patient.id} value={patient.id} className="text-white hover:bg-[#c9a55c]/10">
                {patient.full_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Chief Complaint */}
      <div>
        <Label className="text-gray-300">Queixa Principal</Label>
        <Textarea
          value={formData.chief_complaint}
          onChange={(e) => setFormData(prev => ({ ...prev, chief_complaint: e.target.value }))}
          className="bg-[#1a1a25] border-[#1e1e2a] text-white mt-1"
          rows={2}
          placeholder="Descreva a queixa principal do paciente..."
        />
      </div>

      {/* Medical History */}
      <div>
        <Label className="text-gray-300">Histórico Médico</Label>
        <Textarea
          value={formData.medical_history}
          onChange={(e) => setFormData(prev => ({ ...prev, medical_history: e.target.value }))}
          className="bg-[#1a1a25] border-[#1e1e2a] text-white mt-1"
          rows={2}
          placeholder="Histórico médico relevante..."
        />
      </div>

      {/* Allergies */}
      <div>
        <Label className="text-gray-300">Alergias</Label>
        <div className="flex gap-2 mt-1">
          <Input
            value={allergyInput}
            onChange={(e) => setAllergyInput(e.target.value)}
            placeholder="Adicionar alergia..."
            className="bg-[#1a1a25] border-[#1e1e2a] text-white"
            onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addAllergy())}
          />
          <Button type="button" onClick={addAllergy} variant="outline" className="border-[#c9a55c]/30 text-[#c9a55c]">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        {formData.allergies?.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {formData.allergies.map((allergy, i) => (
              <Badge
                key={i}
                className="bg-red-500/20 text-red-400 cursor-pointer"
                onClick={() => setFormData(prev => ({
                  ...prev,
                  allergies: prev.allergies.filter((_, idx) => idx !== i)
                }))}
              >
                <AlertTriangle className="h-3 w-3 mr-1" />
                {allergy} ×
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Medications */}
      <div>
        <Label className="text-gray-300">Medicações em Uso</Label>
        <div className="flex gap-2 mt-1">
          <Input
            value={medicationInput}
            onChange={(e) => setMedicationInput(e.target.value)}
            placeholder="Adicionar medicação..."
            className="bg-[#1a1a25] border-[#1e1e2a] text-white"
            onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addMedication())}
          />
          <Button type="button" onClick={addMedication} variant="outline" className="border-[#c9a55c]/30 text-[#c9a55c]">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        {formData.current_medications?.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {formData.current_medications.map((med, i) => (
              <Badge
                key={i}
                className="bg-blue-500/20 text-blue-400 cursor-pointer"
                onClick={() => setFormData(prev => ({
                  ...prev,
                  current_medications: prev.current_medications.filter((_, idx) => idx !== i)
                }))}
              >
                {med} ×
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Procedures Performed */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <Label className="text-gray-300">Procedimentos Realizados</Label>
          <Button type="button" onClick={addProcedure} size="sm" variant="outline" className="border-[#c9a55c]/30 text-[#c9a55c]">
            <Plus className="h-3 w-3 mr-1" /> Adicionar
          </Button>
        </div>
        <div className="space-y-3">
          {formData.procedures_performed?.map((proc, i) => (
            <div key={i} className="p-3 bg-[#1a1a25] rounded-lg border border-[#1e1e2a] space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <Input
                  placeholder="Procedimento"
                  value={proc.procedure_name}
                  onChange={(e) => updateProcedure(i, "procedure_name", e.target.value)}
                  className="bg-[#12121a] border-[#1e1e2a] text-white"
                />
                <Input
                  placeholder="Área tratada"
                  value={proc.area_treated}
                  onChange={(e) => updateProcedure(i, "area_treated", e.target.value)}
                  className="bg-[#12121a] border-[#1e1e2a] text-white"
                />
                <Input
                  type="number"
                  placeholder="Quantidade"
                  value={proc.quantity_applied}
                  onChange={(e) => updateProcedure(i, "quantity_applied", parseFloat(e.target.value))}
                  className="bg-[#12121a] border-[#1e1e2a] text-white"
                />
                <Input
                  placeholder="Lote"
                  value={proc.batch_number}
                  onChange={(e) => updateProcedure(i, "batch_number", e.target.value)}
                  className="bg-[#12121a] border-[#1e1e2a] text-white"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Evolution */}
      <div className="space-y-2">
        <Label className="text-gray-300 block">Evolucao</Label>
        {/* Audio inteligente para evolucao */}
        <div className="rounded-xl border border-[#c9a55c]/20 bg-[#c9a55c]/5 p-3 space-y-2">
          <div className="flex items-center gap-2 mb-1">
            <FileText className="h-3.5 w-3.5 text-[#c9a55c]" />
            <span className="text-xs font-medium text-[#c9a55c]">Audio de Evolucao</span>
            <span className="text-xs text-gray-500">— grave o relato de evolucao e retorno</span>
          </div>
          <AudioRecorder
            section="evolucao"
            existingFields={{
              evolucao_tratamento: formData.evolution,
              recomendacoes_pos_procedimento: formData.recommendations,
            }}
            onStructured={(data) => {
              const val = (v) => (!v || v.trim().length === 0) ? "" : v.trim();
              setFormData(prev => {
                const updated = { ...prev };
                if (val(data.evolucao_tratamento)) {
                  updated.evolution = prev.evolution
                    ? prev.evolution + "\n\n" + val(data.evolucao_tratamento)
                    : val(data.evolucao_tratamento);
                }
                if (val(data.resultado_observado)) {
                  updated.evolution = (updated.evolution || "")
                    + (updated.evolution ? "\n\nResultado: " : "Resultado: ")
                    + val(data.resultado_observado);
                }
                if (val(data.intercorrencias)) {
                  updated.evolution = (updated.evolution || "")
                    + "\n\nIntercorrencias: " + val(data.intercorrencias);
                }
                if (val(data.recomendacoes_pos_procedimento)) {
                  updated.recommendations = prev.recommendations
                    ? prev.recommendations + "\n\n" + val(data.recomendacoes_pos_procedimento)
                    : val(data.recomendacoes_pos_procedimento);
                }
                if (val(data.transcricao_original)) updated.audio_transcription = val(data.transcricao_original);
                return updated;
              });
            }}
          />
        </div>
        <Textarea
          value={formData.evolution}
          onChange={(e) => setFormData(prev => ({ ...prev, evolution: e.target.value }))}
          className="bg-[#1a1a25] border-[#1e1e2a] text-white"
          rows={4}
          placeholder="Evolucao do tratamento..."
        />
      </div>

      {/* Recommendations */}
      <div>
        <Label className="text-gray-300">Recomendações</Label>
        <Textarea
          value={formData.recommendations}
          onChange={(e) => setFormData(prev => ({ ...prev, recommendations: e.target.value }))}
          className="bg-[#1a1a25] border-[#1e1e2a] text-white mt-1"
          rows={2}
          placeholder="Recomendações pós-procedimento..."
        />
      </div>

      {/* Status */}
      <div>
        <Label className="text-gray-300">Status</Label>
        <Select
          value={formData.status}
          onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
        >
          <SelectTrigger className="bg-[#1a1a25] border-[#1e1e2a] text-white mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-[#12121a] border-[#1e1e2a]">
            {Object.entries(statusConfig).map(([key, config]) => (
              <SelectItem key={key} value={key} className="text-white">{config.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-[#1e1e2a]">
        <Button type="button" variant="ghost" onClick={onClose} className="text-gray-400">
          Cancelar
        </Button>
        <Button type="submit" className="bg-[#c9a55c] hover:bg-[#a17f3f] text-black">
          {record ? "Salvar" : "Criar Prontuário"}
        </Button>
      </div>
    </form>
  );
};

const RecordCard = ({ record, patient, onClick }) => {
  return (
    <Card
      onClick={onClick}
      className="bg-[#12121a] border-[#1e1e2a] hover:border-[#c9a55c]/30 cursor-pointer transition-all group"
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
              <h3 className="font-medium text-white group-hover:text-[#c9a55c] transition-colors">
                {patient?.full_name || "Paciente"}
              </h3>
              <p className="text-xs text-gray-500">
                {record.record_date && format(parseISO(record.record_date), "dd/MM/yyyy HH:mm")}
              </p>
            </div>
          </div>
          <Badge className={statusConfig[record.status]?.color || statusConfig.draft.color}>
            {statusConfig[record.status]?.label || "Rascunho"}
          </Badge>
        </div>

        {record.chief_complaint && (
          <p className="text-sm text-gray-400 line-clamp-2 mb-3">{record.chief_complaint}</p>
        )}

        {record.procedures_performed?.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {record.procedures_performed.slice(0, 2).map((proc, i) => (
              <Badge key={i} variant="outline" className="text-xs border-[#1e1e2a] text-gray-500">
                {proc.procedure_name}
              </Badge>
            ))}
            {record.procedures_performed.length > 2 && (
              <Badge variant="outline" className="text-xs border-[#1e1e2a] text-gray-500">
                +{record.procedures_performed.length - 2}
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default function MedicalRecords() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [selectedRecord, setSelectedRecord] = useState(null);

  const { data: records = [] } = useQuery({
    queryKey: ["medical-records"],
    queryFn: () => base44.entities.MedicalRecord.list("-record_date", 500),
  });

  const { data: patients = [] } = useQuery({
    queryKey: ["patients"],
    queryFn: () => base44.entities.Patient.list("-created_date", 1000),
  });

  const { data: procedures = [] } = useQuery({
    queryKey: ["procedures"],
    queryFn: () => base44.entities.Procedure.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.MedicalRecord.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["medical-records"] });
      setIsFormOpen(false);
      setEditingRecord(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.MedicalRecord.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["medical-records"] });
      setIsFormOpen(false);
      setEditingRecord(null);
    },
  });

  const handleSave = (data) => {
    if (editingRecord) {
      updateMutation.mutate({ id: editingRecord.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const getPatient = (patientId) => patients.find(p => p.id === patientId);

  const filteredRecords = records.filter(record => {
    const patient = getPatient(record.patient_id);
    const matchesSearch = patient?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.chief_complaint?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || record.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: records.length,
    draft: records.filter(r => r.status === "draft").length,
    pending: records.filter(r => r.status === "pending_review").length,
    approved: records.filter(r => r.status === "approved").length
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif text-white">Prontuários</h1>
          <p className="text-gray-400">Histórico médico dos pacientes</p>
        </div>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#c9a55c] hover:bg-[#a17f3f] text-black">
              <Plus className="mr-2 h-4 w-4" />
              Novo Prontuário
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#12121a] border-[#1e1e2a] text-white max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader className="flex-shrink-0">
              <DialogTitle className="text-xl font-serif">
                {editingRecord ? "Editar Prontuário" : "Novo Prontuário"}
              </DialogTitle>
            </DialogHeader>
            <MedicalRecordForm
              record={editingRecord}
              patients={patients}
              procedures={procedures}
              onSave={handleSave}
              onClose={() => { setIsFormOpen(false); setEditingRecord(null); }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-[#12121a] border-[#1e1e2a]">
          <CardContent className="p-4">
            <p className="text-xs text-gray-500">Total</p>
            <p className="text-2xl font-light text-white mt-1">{stats.total}</p>
          </CardContent>
        </Card>
        <Card className="bg-[#12121a] border-[#1e1e2a]">
          <CardContent className="p-4">
            <p className="text-xs text-gray-500">Rascunhos</p>
            <p className="text-2xl font-light text-gray-400 mt-1">{stats.draft}</p>
          </CardContent>
        </Card>
        <Card className="bg-[#12121a] border-[#1e1e2a]">
          <CardContent className="p-4">
            <p className="text-xs text-gray-500">Em Revisão</p>
            <p className="text-2xl font-light text-yellow-400 mt-1">{stats.pending}</p>
          </CardContent>
        </Card>
        <Card className="bg-[#12121a] border-[#1e1e2a]">
          <CardContent className="p-4">
            <p className="text-xs text-gray-500">Aprovados</p>
            <p className="text-2xl font-light text-emerald-400 mt-1">{stats.approved}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Buscar por paciente ou queixa..."
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
            {Object.entries(statusConfig).map(([key, config]) => (
              <SelectItem key={key} value={key} className="text-white">{config.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Records Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredRecords.map((record) => (
          <RecordCard
            key={record.id}
            record={record}
            patient={getPatient(record.patient_id)}
            onClick={() => { setEditingRecord(record); setIsFormOpen(true); }}
          />
        ))}
      </div>

      {filteredRecords.length === 0 && (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">Nenhum prontuário encontrado</p>
        </div>
      )}
    </div>
  );
}