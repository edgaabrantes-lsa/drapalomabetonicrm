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
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import AIRecordInput from "@/components/medical/AIRecordInput";


const statusConfig = {
  draft: { label: "Rascunho", color: "bg-gray-500/20 text-gray-400" },
  pending_review: { label: "Revisão", color: "bg-yellow-500/20 text-yellow-400" },
  approved: { label: "Aprovado", color: "bg-emerald-500/20 text-emerald-400" }
};

const MedicalRecordForm = ({ record, patients, procedures, onSave, onClose }) => {
  const [formData, setFormData] = useState(record ? {
    ...record,
    chief_complaint:      record.chief_complaint      || "",
    medical_history:      record.medical_history      || "",
    evolution:            record.evolution            || "",
    recommendations:      record.recommendations      || "",
    audio_transcription:  record.audio_transcription  || "",
    allergies:            Array.isArray(record.allergies)            ? record.allergies            : [],
    contraindications:    Array.isArray(record.contraindications)    ? record.contraindications    : [],
    current_medications:  Array.isArray(record.current_medications)  ? record.current_medications  : [],
    procedures_performed: Array.isArray(record.procedures_performed) ? record.procedures_performed : [],
  } : {
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

  // ── MAPEAMENTO DEFINITIVO: campos do AIRecordInput → campos do formulario ──
  // AIRecordInput entrega: chief_complaint, medical_history, allergies_str,
  // medications_str, evolution, recommendations, audio_transcription
  // Este handler aplica diretamente ao formData sem conversao intermediaria.

  const s = (v) => (v && typeof v === "string" && v.trim()) ? v.trim() : "";

  // Converte string CSV para array e mescla sem duplicatas
  const mergeCSVIntoArray = (csvStr, existingArr) => {
    if (!s(csvStr)) return existingArr || [];
    const novas = s(csvStr).split(/[,;]+/).map(x => x.trim()).filter(Boolean);
    const base  = Array.isArray(existingArr) ? existingArr : [];
    return [...base, ...novas.filter(n => !base.includes(n))];
  };

  const handleAIResult = (aiData) => {
    setFormData(prev => {
      const upd = { ...prev };

      // Queixa principal
      if (s(aiData.chief_complaint))
        upd.chief_complaint = s(aiData.chief_complaint);

      // Historico medico
      if (s(aiData.medical_history))
        upd.medical_history = s(aiData.medical_history);

      // Recomendacoes
      if (s(aiData.recommendations))
        upd.recommendations = s(aiData.recommendations);

      // Transcricao
      if (s(aiData.audio_transcription))
        upd.audio_transcription = s(aiData.audio_transcription);

      // Evolucao / conduta — concatenar se ja tiver conteudo
      if (s(aiData.evolution)) {
        upd.evolution = prev.evolution
          ? prev.evolution + "\n\n" + s(aiData.evolution)
          : s(aiData.evolution);
      }

      // Alergias: string CSV → array
      upd.allergies = mergeCSVIntoArray(aiData.allergies_str, prev.allergies);

      // Medicacoes: string CSV → array
      upd.current_medications = mergeCSVIntoArray(aiData.medications_str, prev.current_medications);

      return upd;
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-h-[75vh] overflow-y-auto pr-2">
      {/* Preencher prontuario por audio ou foto */}
      {/* existingFields usa os nomes do schema do AudioRecorder (portugues) para deteccao de conflitos */}
      <AIRecordInput
        section="prontuario"
        existingFields={{
          queixa_principal:         formData.chief_complaint                          || "",
          historico_medico:         formData.medical_history                          || "",
          conduta_planejada:        formData.evolution                                || "",
          recomendacoes:            formData.recommendations                          || "",
          alergias:                 (formData.allergies         || []).join(", "),
          medicacoes_em_uso:        (formData.current_medications || []).join(", "),
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
        {/* AIRecordInput section="evolucao" usa o contrato correto com os campos de evolucao */}
        <AIRecordInput
          section="evolucao"
          existingFields={{
            evolucao_tratamento:              formData.evolution        || "",
            recomendacoes_pos_procedimento:   formData.recommendations  || "",
          }}
          onResult={(data) => {
            // data contém: evolucao_tratamento, resultado_observado, feedback_paciente,
            // intercorrencias, recomendacoes_pos_procedimento, proximo_retorno,
            // observacoes_finais, audio_transcription
            const v = (x) => (x && typeof x === "string" && x.trim()) ? x.trim() : "";
            setFormData(prev => {
              const upd = { ...prev };
              // Concatenar todos os campos de evolucao em um texto estruturado
              const partes = [];
              if (v(data.evolucao_tratamento))   partes.push(v(data.evolucao_tratamento));
              if (v(data.resultado_observado))    partes.push("Resultado: " + v(data.resultado_observado));
              if (v(data.feedback_paciente))      partes.push("Feedback da paciente: " + v(data.feedback_paciente));
              if (v(data.intercorrencias))        partes.push("Intercorrencias: " + v(data.intercorrencias));
              if (v(data.proximo_retorno))        partes.push("Proximo retorno: " + v(data.proximo_retorno));
              if (v(data.observacoes_finais))     partes.push("Observacoes: " + v(data.observacoes_finais));
              if (partes.length > 0) {
                const texto = partes.join("\n\n");
                upd.evolution = prev.evolution ? prev.evolution + "\n\n" + texto : texto;
              }
              // Recomendacoes pos-procedimento
              if (v(data.recomendacoes_pos_procedimento)) {
                upd.recommendations = prev.recommendations
                  ? prev.recommendations + "\n\n" + v(data.recomendacoes_pos_procedimento)
                  : v(data.recomendacoes_pos_procedimento);
              }
              // Transcricao
              if (v(data.audio_transcription)) upd.audio_transcription = v(data.audio_transcription);
              return upd;
            });
          }}
        />
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