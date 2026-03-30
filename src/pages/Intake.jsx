import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Sparkles, Search, Clock, CheckCircle, XCircle,
  AlertTriangle, ChevronRight, User, Loader2, Plus, FileText
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const urgencyColor = {
  alta: "bg-red-500/20 text-red-400 border-red-500/30",
  media: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  baixa: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
};

const validationColor = {
  pending: "bg-yellow-500/20 text-yellow-400",
  approved: "bg-emerald-500/20 text-emerald-400",
  rejected: "bg-red-500/20 text-red-400"
};

const validationLabel = {
  pending: "Aguardando Validação",
  approved: "Aprovado",
  rejected: "Rejeitado"
};

// ---- New Intake Form ----
const NewIntakeForm = ({ patients, onSuccess }) => {
  const [patientId, setPatientId] = useState("");
  const [complaint, setComplaint] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const selectedPatient = patients.find(p => p.id === patientId);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setResult(null);
    setIsLoading(true);
    try {
      const res = await base44.functions.invoke("processIntake", {
        patient_id: patientId,
        patient_name: selectedPatient?.full_name || "",
        raw_complaint: complaint
      });
      setResult(res.data);
      onSuccess();
    } catch (err) {
      setError(err?.response?.data?.error || "Erro ao processar triagem. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  if (result) {
    const ai = result.ai_analysis;
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
          <CheckCircle className="h-5 w-5 text-emerald-400 flex-shrink-0" />
          <p className="text-emerald-300 text-sm">{result.message}</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <InfoTile label="Queixa" value={ai.queixa_principal} />
          <InfoTile label="Hipótese" value={ai.hipotese_triagem} />
          <InfoTile label="Tom Emocional" value={ai.tom_emocional} />
          <InfoTile label="Área" value={ai.area_tratamento} />
        </div>
        {result.workflow_suggestion && (
          <div className={`p-3 rounded-xl border flex gap-2 ${result.workflow_suggestion === 'MOVER_PARA_URGENCIA' ? 'bg-red-500/10 border-red-500/30' : 'bg-blue-500/10 border-blue-500/30'}`}>
            <p className={`text-sm font-medium ${result.workflow_suggestion === 'MOVER_PARA_URGENCIA' ? 'text-red-400' : 'text-blue-400'}`}>
              🔀 {result.workflow_suggestion === 'MOVER_PARA_URGENCIA' ? 'Mover para Urgência' : 'Agendar Avaliação'}
            </p>
          </div>
        )}
        {result.lsa_commercial_hint && (
          <div className="p-3 bg-[#c9a55c]/10 border border-[#c9a55c]/20 rounded-xl">
            <p className="text-xs text-[#c9a55c] font-medium mb-0.5">💡 Dica Comercial LSA</p>
            <p className="text-[#e4c98a] text-sm">{result.lsa_commercial_hint}</p>
          </div>
        )}
        {ai.alerta_saude && ai.alerta_saude !== 'Nenhum alerta identificado' && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex gap-2">
            <AlertTriangle className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
            <p className="text-red-300 text-sm">{ai.alerta_saude}</p>
          </div>
        )}
        <p className="text-xs text-gray-500 text-center">Aguardando confirmação da Dra. Paloma para gravar no prontuário.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label className="text-gray-300">Paciente *</Label>
        <Select value={patientId} onValueChange={setPatientId}>
          <SelectTrigger className="bg-[#1a1a25] border-[#1e1e2a] text-white mt-1">
            <SelectValue placeholder="Selecione o paciente" />
          </SelectTrigger>
          <SelectContent className="bg-[#12121a] border-[#1e1e2a] max-h-52">
            {patients.map(p => (
              <SelectItem key={p.id} value={p.id} className="text-white">{p.full_name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label className="text-gray-300">Relato do Paciente *</Label>
        <Textarea
          value={complaint}
          onChange={e => setComplaint(e.target.value)}
          placeholder="Cole aqui o relato enviado pelo WhatsApp, formulário ou descrito verbalmente..."
          className="bg-[#1a1a25] border-[#1e1e2a] text-white mt-1"
          rows={5}
        />
        <p className="text-xs text-gray-600 mt-1">{complaint.length}/2000 caracteres</p>
      </div>
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">{error}</div>
      )}
      <Button
        type="submit"
        disabled={!patientId || complaint.trim().length < 5 || isLoading}
        className="w-full bg-[#c9a55c] hover:bg-[#a17f3f] text-black font-medium"
      >
        {isLoading ? (
          <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Analisando com IA...</>
        ) : (
          <><Sparkles className="h-4 w-4 mr-2" /> Processar Triagem</>
        )}
      </Button>
      <p className="text-xs text-gray-600 text-center">
        A IA analisa o relato. Nenhum dado é gravado no prontuário sem validação da Dra. Paloma.
      </p>
    </form>
  );
};

const InfoTile = ({ label, value }) => (
  <div className="p-3 bg-[#1a1a25] rounded-xl">
    <p className="text-xs text-gray-500 mb-1">{label}</p>
    <p className="text-white text-sm font-medium">{value || "—"}</p>
  </div>
);

// ---- Screening Detail & Validation ----
const ScreeningDetail = ({ screening, patient, onValidate, isValidating }) => {
  const [notes, setNotes] = useState(screening.notes || "");
  const ai = screening.ai_output || {};
  const isPending = screening.validation_status === "pending";

  return (
    <div className="space-y-5">
      {/* Patient */}
      <div className="flex items-center gap-3">
        <Avatar className="h-12 w-12 border border-[#c9a55c]/30">
          <AvatarFallback className="bg-[#c9a55c]/20 text-[#c9a55c]">
            {patient?.full_name?.[0] || "?"}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="text-white font-medium">{patient?.full_name || "Paciente"}</p>
          <p className="text-xs text-gray-500">
            {screening.created_date && format(parseISO(screening.created_date), "dd/MM/yyyy HH:mm", { locale: ptBR })}
          </p>
        </div>
      </div>

      {/* Raw Complaint */}
      <div className="p-3 bg-[#1a1a25] rounded-xl border border-[#1e1e2a]">
        <p className="text-xs text-gray-500 mb-1 uppercase tracking-wider">Relato Original</p>
        <p className="text-gray-300 text-sm leading-relaxed">{screening.raw_complaint}</p>
      </div>

      {/* AI Analysis */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-4 w-4 text-[#c9a55c]" />
          <p className="text-sm font-medium text-[#c9a55c] uppercase tracking-wider">Análise da IA</p>
          {ai.urgencia && (
            <Badge className={`${urgencyColor[ai.urgencia]} border text-xs`}>
              Urgência {ai.urgencia}
            </Badge>
          )}
          {ai.comercial_priority && (
            <Badge className="bg-[#c9a55c]/20 text-[#c9a55c] border border-[#c9a55c]/30 text-xs">
              Prioridade Comercial
            </Badge>
          )}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <InfoTile label="Queixa Principal" value={ai.queixa_principal} />
          <InfoTile label="Hipótese de Triagem" value={ai.hipotese_triagem} />
          <InfoTile label="Tom Emocional" value={ai.tom_emocional} />
          <InfoTile label="Área de Tratamento" value={ai.area_tratamento} />
          {ai.urgency !== undefined && (
            <InfoTile label="Urgência (0–5)" value={`${ai.urgency}/5`} />
          )}
        </div>
        {screening.ai_output?.workflow_suggestion || screening.lsa_commercial_hint ? null : null}
        {ai.alerta_saude && ai.alerta_saude !== 'Nenhum alerta identificado' && (
          <div className="mt-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex gap-2">
            <AlertTriangle className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs text-red-400 font-medium mb-0.5">Alerta de Saúde</p>
              <p className="text-red-300 text-sm">{ai.alerta_saude}</p>
            </div>
          </div>
        )}
      </div>

      {/* Validation — LSA Pattern: human must click */}
      {isPending ? (
        <div className="space-y-3 pt-2 border-t border-[#1e1e2a]">
          <div>
            <Label className="text-gray-400 text-xs uppercase tracking-wider">Observações (opcional)</Label>
            <Textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Adicione notas antes de confirmar..."
              className="bg-[#1a1a25] border-[#1e1e2a] text-white mt-1"
              rows={2}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={() => onValidate("reject", notes)}
              disabled={isValidating}
              variant="outline"
              className="border-red-500/30 text-red-400 hover:bg-red-500/10"
            >
              {isValidating ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4 mr-2" />}
              Rejeitar
            </Button>
            <Button
              onClick={() => onValidate("approve", notes)}
              disabled={isValidating}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {isValidating ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />}
              Confirmar e Gravar
            </Button>
          </div>
          <p className="text-xs text-gray-600 text-center">
            Ao confirmar, um prontuário oficial será criado. Esta ação é auditada.
          </p>
        </div>
      ) : (
        <div className="pt-2 border-t border-[#1e1e2a]">
          <div className={`p-3 rounded-xl ${validationColor[screening.validation_status]}`}>
            <p className="text-sm font-medium">{validationLabel[screening.validation_status]}</p>
            <p className="text-xs opacity-70 mt-0.5">
              Por {screening.validated_by} em{" "}
              {screening.validated_at && format(parseISO(screening.validated_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
            </p>
            {screening.notes && <p className="text-xs mt-1 opacity-80">{screening.notes}</p>}
          </div>
          {screening.medical_record_id && (
            <div className="mt-2 flex items-center gap-2 text-emerald-400 text-sm">
              <FileText className="h-4 w-4" />
              Prontuário criado com sucesso
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ---- Main Page ----
export default function Intake() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("pending");
  const [isNewOpen, setIsNewOpen] = useState(false);
  const [selectedScreening, setSelectedScreening] = useState(null);
  const [isValidating, setIsValidating] = useState(false);

  const { data: screenings = [] } = useQuery({
    queryKey: ["intake-screenings"],
    queryFn: () => base44.entities.IntakeScreening.list("-created_date", 200),
  });

  const { data: patients = [] } = useQuery({
    queryKey: ["patients"],
    queryFn: () => base44.entities.Patient.list("-created_date", 1000),
  });

  const getPatient = (id) => patients.find(p => p.id === id);

  const filtered = screenings.filter(s => {
    const patient = getPatient(s.patient_id);
    const matchSearch = patient?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.raw_complaint?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = filterStatus === "all" || s.validation_status === filterStatus;
    return matchSearch && matchStatus;
  });

  const handleValidate = async (action, notes) => {
    if (!selectedScreening) return;
    setIsValidating(true);
    try {
      await base44.functions.invoke("approveIntake", {
        screening_id: selectedScreening.id,
        action,
        notes
      });
      queryClient.invalidateQueries({ queryKey: ["intake-screenings"] });
      queryClient.invalidateQueries({ queryKey: ["medical-records"] });
      setSelectedScreening(null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsValidating(false);
    }
  };

  const stats = {
    pending: screenings.filter(s => s.validation_status === "pending").length,
    approved: screenings.filter(s => s.validation_status === "approved").length,
    priority: screenings.filter(s => s.ai_output?.comercial_priority && s.validation_status === "pending").length
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif text-white flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-[#c9a55c]" />
            Triagem Inteligente
          </h1>
          <p className="text-gray-400">Análise de relatos por IA com validação humana obrigatória</p>
        </div>
        <Button onClick={() => setIsNewOpen(true)} className="bg-[#c9a55c] hover:bg-[#a17f3f] text-black">
          <Plus className="mr-2 h-4 w-4" /> Nova Triagem
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-[#12121a] border-[#1e1e2a]">
          <CardContent className="p-4">
            <p className="text-xs text-gray-500">Aguardando Validação</p>
            <p className="text-2xl font-light text-yellow-400 mt-1">{stats.pending}</p>
          </CardContent>
        </Card>
        <Card className="bg-[#12121a] border-[#1e1e2a]">
          <CardContent className="p-4">
            <p className="text-xs text-gray-500">Aprovadas</p>
            <p className="text-2xl font-light text-emerald-400 mt-1">{stats.approved}</p>
          </CardContent>
        </Card>
        <Card className="bg-[#12121a] border-red-500/20 border">
          <CardContent className="p-4">
            <p className="text-xs text-red-400">Prioridade Comercial</p>
            <p className="text-2xl font-light text-red-400 mt-1">{stats.priority}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Buscar por paciente ou relato..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-10 bg-[#1a1a25] border-[#1e1e2a] text-white"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-48 bg-[#1a1a25] border-[#1e1e2a] text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-[#12121a] border-[#1e1e2a]">
            <SelectItem value="all" className="text-white">Todas</SelectItem>
            <SelectItem value="pending" className="text-white">Aguardando</SelectItem>
            <SelectItem value="approved" className="text-white">Aprovadas</SelectItem>
            <SelectItem value="rejected" className="text-white">Rejeitadas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* List */}
      <div className="space-y-3">
        {filtered.map(screening => {
          const patient = getPatient(screening.patient_id);
          const ai = screening.ai_output || {};
          return (
            <Card
              key={screening.id}
              onClick={() => setSelectedScreening(screening)}
              className="bg-[#12121a] border-[#1e1e2a] hover:border-[#c9a55c]/30 cursor-pointer transition-all"
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <Avatar className="h-9 w-9 border border-[#c9a55c]/20 flex-shrink-0">
                      <AvatarFallback className="bg-[#c9a55c]/10 text-[#c9a55c] text-xs">
                        {patient?.full_name?.[0] || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <p className="text-white font-medium text-sm">{patient?.full_name || "Paciente"}</p>
                        <Badge className={validationColor[screening.validation_status]}>
                          {validationLabel[screening.validation_status]}
                        </Badge>
                        {ai.urgencia && (
                          <Badge className={`${urgencyColor[ai.urgencia]} border text-xs`}>
                            {ai.urgencia}
                          </Badge>
                        )}
                        {ai.comercial_priority && (
                          <Badge className="bg-[#c9a55c]/20 text-[#c9a55c] text-xs">★ Prioridade</Badge>
                        )}
                      </div>
                      <p className="text-gray-500 text-xs line-clamp-1">{screening.raw_complaint}</p>
                      {ai.queixa_principal && (
                        <p className="text-[#c9a55c] text-xs mt-0.5">IA: {ai.queixa_principal} · {ai.hipotese_triagem}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <p className="text-xs text-gray-600 hidden lg:block">
                      {screening.created_date && format(parseISO(screening.created_date), "dd/MM HH:mm")}
                    </p>
                    <ChevronRight className="h-4 w-4 text-gray-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {filtered.length === 0 && (
          <div className="text-center py-12">
            <Clock className="h-10 w-10 text-gray-700 mx-auto mb-3" />
            <p className="text-gray-500">Nenhuma triagem encontrada</p>
          </div>
        )}
      </div>

      {/* New Intake Dialog */}
      <Dialog open={isNewOpen} onOpenChange={setIsNewOpen}>
        <DialogContent className="bg-[#12121a] border-[#1e1e2a] text-white max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-serif flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-[#c9a55c]" />
              Nova Triagem com IA
            </DialogTitle>
          </DialogHeader>
          <NewIntakeForm
            patients={patients}
            onSuccess={() => {
              queryClient.invalidateQueries({ queryKey: ["intake-screenings"] });
              setTimeout(() => setIsNewOpen(false), 2000);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Screening Detail Dialog */}
      <Dialog open={!!selectedScreening} onOpenChange={() => setSelectedScreening(null)}>
        <DialogContent className="bg-[#12121a] border-[#1e1e2a] text-white max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-serif">Detalhes da Triagem</DialogTitle>
          </DialogHeader>
          {selectedScreening && (
            <ScreeningDetail
              screening={selectedScreening}
              patient={getPatient(selectedScreening.patient_id)}
              onValidate={handleValidate}
              isValidating={isValidating}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}