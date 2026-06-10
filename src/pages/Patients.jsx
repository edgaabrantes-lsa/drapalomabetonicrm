import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { differenceInYears, parseISO } from "date-fns";
import { Link } from "react-router-dom";
import { Plus, Search, FileUp, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import PatientImport from "@/components/patients/PatientImport";
import PatientTreatmentPanel from "@/components/patients/PatientTreatmentPanel";
import TreatmentWizard from "@/components/patients/TreatmentWizard";

const statusConfig = {
  active:   { label: "Ativo",   color: "#4ADE80", bg: "rgba(74,222,128,0.08)",   border: "rgba(74,222,128,0.2)" },
  inactive: { label: "Inativo", color: "#666666", bg: "transparent",              border: "#2B2B2B" },
  vip:      { label: "VIP",     color: "#C8A96A", bg: "rgba(200,169,106,0.08)",  border: "rgba(200,169,106,0.2)" },
};

// ─── Monta payload seguro e compatível com a entidade Patient ───────────────
function buildPayload(formData) {
  const payload = {
    full_name:            String(formData.full_name || "").trim(),
    document_type:        formData.document_type || "cpf",
    document_number:      String(formData.document_number || "").trim(),
    rg:                   String(formData.rg || "").trim(),
    birth_date:           formData.birth_date || null,
    gender:               formData.gender || "female",
    phone:                String(formData.phone || "").trim(),
    whatsapp:             String(formData.whatsapp || formData.phone || "").trim(),
    email:                String(formData.email || "").trim(),
    profession:           String(formData.profession || "").trim(),
    marital_status:       formData.marital_status || undefined,
    status:               formData.status || "active",
    dossie_status:        formData.dossie_status || "lead",
    source:               formData.source || "other",
    notes:                String(formData.notes || "").trim(),
    consent_whatsapp:     Boolean(formData.consent_whatsapp),
    consent_images:       Boolean(formData.consent_images),
    consent_terms_signed: Boolean(formData.consent_terms_signed),
    consent_date:         formData.consent_terms_signed ? new Date().toISOString() : null,
    tags:                 Array.isArray(formData.tags) ? formData.tags : [],
  };

  // address — só inclui se pelo menos um campo foi preenchido
  const addr = formData.address || {};
  const hasAddress = Object.values(addr).some(v => v && String(v).trim());
  if (hasAddress) {
    payload.address = {
      street:       String(addr.street || "").trim(),
      number:       String(addr.number || "").trim(),
      complement:   String(addr.complement || "").trim(),
      neighborhood: String(addr.neighborhood || "").trim(),
      city:         String(addr.city || "").trim(),
      state:        String(addr.state || "").trim(),
      zip_code:     String(addr.zip_code || "").trim(),
    };
  }

  // remove campos undefined para não poluir o payload
  Object.keys(payload).forEach(k => payload[k] === undefined && delete payload[k]);

  return payload;
}

// ─── Validação mínima ────────────────────────────────────────────────────────
function validate(formData) {
  if (!formData.full_name?.trim()) return "Informe o nome completo da paciente.";
  if (!formData.phone?.trim() && !formData.whatsapp?.trim()) return "Informe telefone ou WhatsApp.";
  return null;
}

// ─── Formulário ─────────────────────────────────────────────────────────────
const PatientForm = ({ patient, onSave, onClose, isSaving }) => {
  const [formData, setFormData] = useState(patient || {
    full_name: "", document_type: "cpf", document_number: "", rg: "",
    birth_date: "", gender: "female", phone: "", whatsapp: "", email: "",
    address: { street: "", number: "", complement: "", neighborhood: "", city: "", state: "", zip_code: "" },
    status: "active", dossie_status: "lead", source: "instagram", notes: "",
    consent_whatsapp: false, consent_images: false, consent_terms_signed: false, tags: []
  });
  const [error, setError] = useState("");

  const handleSubmit = () => {
    setError("");
    const validationError = validate(formData);
    if (validationError) { setError(validationError); return; }
    onSave(buildPayload(formData));
  };

  const set = (field, value) => setFormData(p => ({ ...p, [field]: value }));
  const setAddr = (field, value) => setFormData(p => ({ ...p, address: { ...p.address, [field]: value } }));

  return (
    <div className="flex flex-col" style={{ maxHeight: "72vh", minHeight: 0 }}>
      {/* Campos roláveis */}
      <div className="overflow-y-auto pr-1 space-y-5 flex-1">

        {/* Dados Pessoais */}
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-widest text-[#c9a55c] mb-3">Dados Pessoais</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label className="text-gray-300 text-sm">Nome Completo *</Label>
              <Input value={formData.full_name} onChange={e => set("full_name", e.target.value)}
                placeholder="Nome completo da paciente"
                className="bg-[#1a1a25] border-[#1e1e2a] text-white mt-1" />
            </div>
            <div>
              <Label className="text-gray-300 text-sm">Tipo de Documento</Label>
              <Select value={formData.document_type} onValueChange={v => set("document_type", v)}>
                <SelectTrigger className="bg-[#1a1a25] border-[#1e1e2a] text-white mt-1"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-[#12121a] border-[#1e1e2a]">
                  <SelectItem value="cpf" className="text-white">CPF</SelectItem>
                  <SelectItem value="rg" className="text-white">RG</SelectItem>
                  <SelectItem value="passport" className="text-white">Passaporte</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-gray-300 text-sm">Número do Documento</Label>
              <Input value={formData.document_number} onChange={e => set("document_number", e.target.value)}
                placeholder="000.000.000-00"
                className="bg-[#1a1a25] border-[#1e1e2a] text-white mt-1" />
            </div>
            <div>
              <Label className="text-gray-300 text-sm">Data de Nascimento</Label>
              <Input type="date" value={formData.birth_date} onChange={e => set("birth_date", e.target.value)}
                className="bg-[#1a1a25] border-[#1e1e2a] text-white mt-1" />
            </div>
            <div>
              <Label className="text-gray-300 text-sm">Gênero</Label>
              <Select value={formData.gender} onValueChange={v => set("gender", v)}>
                <SelectTrigger className="bg-[#1a1a25] border-[#1e1e2a] text-white mt-1"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-[#12121a] border-[#1e1e2a]">
                  <SelectItem value="female" className="text-white">Feminino</SelectItem>
                  <SelectItem value="male" className="text-white">Masculino</SelectItem>
                  <SelectItem value="other" className="text-white">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </section>

        {/* Contato */}
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-widest text-[#c9a55c] mb-3">Contato</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-gray-300 text-sm">Telefone *</Label>
              <Input value={formData.phone} onChange={e => set("phone", e.target.value)}
                placeholder="(11) 99999-0000"
                className="bg-[#1a1a25] border-[#1e1e2a] text-white mt-1" />
            </div>
            <div>
              <Label className="text-gray-300 text-sm">WhatsApp</Label>
              <Input value={formData.whatsapp} onChange={e => set("whatsapp", e.target.value)}
                placeholder="(11) 99999-0000"
                className="bg-[#1a1a25] border-[#1e1e2a] text-white mt-1" />
            </div>
            <div className="col-span-2">
              <Label className="text-gray-300 text-sm">E-mail</Label>
              <Input type="email" value={formData.email} onChange={e => set("email", e.target.value)}
                placeholder="email@exemplo.com"
                className="bg-[#1a1a25] border-[#1e1e2a] text-white mt-1" />
            </div>
          </div>
        </section>

        {/* Endereço */}
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-widest text-[#c9a55c] mb-3">Endereço <span className="text-[#555] normal-case tracking-normal font-normal">(opcional)</span></h3>
          <div className="grid grid-cols-6 gap-3">
            <div className="col-span-4">
              <Label className="text-gray-300 text-sm">Rua</Label>
              <Input value={formData.address?.street || ""} onChange={e => setAddr("street", e.target.value)}
                className="bg-[#1a1a25] border-[#1e1e2a] text-white mt-1" />
            </div>
            <div className="col-span-2">
              <Label className="text-gray-300 text-sm">Número</Label>
              <Input value={formData.address?.number || ""} onChange={e => setAddr("number", e.target.value)}
                className="bg-[#1a1a25] border-[#1e1e2a] text-white mt-1" />
            </div>
            <div className="col-span-3">
              <Label className="text-gray-300 text-sm">Bairro</Label>
              <Input value={formData.address?.neighborhood || ""} onChange={e => setAddr("neighborhood", e.target.value)}
                className="bg-[#1a1a25] border-[#1e1e2a] text-white mt-1" />
            </div>
            <div className="col-span-3">
              <Label className="text-gray-300 text-sm">Cidade</Label>
              <Input value={formData.address?.city || ""} onChange={e => setAddr("city", e.target.value)}
                className="bg-[#1a1a25] border-[#1e1e2a] text-white mt-1" />
            </div>
          </div>
        </section>

        {/* Status e Origem */}
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-widest text-[#c9a55c] mb-3">Status e Origem</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-gray-300 text-sm">Status</Label>
              <Select value={formData.status} onValueChange={v => set("status", v)}>
                <SelectTrigger className="bg-[#1a1a25] border-[#1e1e2a] text-white mt-1"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-[#12121a] border-[#1e1e2a]">
                  <SelectItem value="active" className="text-white">Ativo</SelectItem>
                  <SelectItem value="inactive" className="text-white">Inativo</SelectItem>
                  <SelectItem value="vip" className="text-white">VIP</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-gray-300 text-sm">Origem</Label>
              <Select value={formData.source} onValueChange={v => set("source", v)}>
                <SelectTrigger className="bg-[#1a1a25] border-[#1e1e2a] text-white mt-1"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-[#12121a] border-[#1e1e2a]">
                  <SelectItem value="instagram" className="text-white">Instagram</SelectItem>
                  <SelectItem value="google" className="text-white">Google</SelectItem>
                  <SelectItem value="referral" className="text-white">Indicação</SelectItem>
                  <SelectItem value="website" className="text-white">Website</SelectItem>
                  <SelectItem value="whatsapp" className="text-white">WhatsApp</SelectItem>
                  <SelectItem value="other" className="text-white">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </section>

        {/* Consentimentos */}
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-widest text-[#c9a55c] mb-3">Consentimentos LGPD <span className="text-[#555] normal-case tracking-normal font-normal">(opcional)</span></h3>
          <div className="space-y-3">
            {[
              { id: "cw", field: "consent_whatsapp",     label: "Autorizo comunicações via WhatsApp" },
              { id: "ci", field: "consent_images",       label: "Autorizo uso de imagens para documentação" },
              { id: "ct", field: "consent_terms_signed", label: "Termos e condições aceitos" },
            ].map(item => (
              <div key={item.id} className="flex items-center gap-3">
                <Checkbox
                  id={item.id}
                  checked={!!formData[item.field]}
                  onCheckedChange={v => set(item.field, Boolean(v))}
                />
                <Label htmlFor={item.id} className="text-gray-300 text-sm cursor-pointer">{item.label}</Label>
              </div>
            ))}
          </div>
        </section>

        {/* Observações */}
        <section>
          <Label className="text-gray-300 text-sm">Observações</Label>
          <Textarea value={formData.notes || ""} onChange={e => set("notes", e.target.value)}
            className="bg-[#1a1a25] border-[#1e1e2a] text-white mt-1" rows={3} />
        </section>
      </div>

      {/* Erro de validação */}
      {error && (
        <div className="mt-3 px-3 py-2 rounded-md text-sm" style={{ backgroundColor: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171" }}>
          {error}
        </div>
      )}

      {/* Botões fixos */}
      <div className="flex justify-end gap-3 pt-4 mt-3 border-t border-[#1e1e2a] flex-shrink-0">
        <Button type="button" variant="ghost" onClick={onClose} disabled={isSaving} className="text-gray-400">
          Cancelar
        </Button>
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={isSaving}
          className="bg-[#c9a55c] hover:bg-[#a17f3f] text-black min-w-[160px]"
        >
          {isSaving
            ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Salvando...</>
            : patient ? "Salvar Alterações" : "Cadastrar Paciente"
          }
        </Button>
      </div>
    </div>
  );
};

// ─── Card de Paciente ────────────────────────────────────────────────────────
const PatientCard = ({ patient, onStartTreatment, onViewTreatments }) => {
  const age = patient.birth_date ? differenceInYears(new Date(), parseISO(patient.birth_date)) : null;
  const st = statusConfig[patient.status] || statusConfig.active;

  return (
    <div style={{
      backgroundColor: "#1A1A1A", border: "1px solid #2B2B2B", borderRadius: 8,
      padding: "16px 20px", display: "flex", alignItems: "center", gap: 16,
      fontFamily: "'Inter', system-ui, sans-serif", transition: "border-color 0.15s",
    }}
      onMouseEnter={e => e.currentTarget.style.borderColor = "#3A3A3A"}
      onMouseLeave={e => e.currentTarget.style.borderColor = "#2B2B2B"}
    >
      <div style={{
        width: 36, height: 36, borderRadius: 6, flexShrink: 0,
        backgroundColor: "rgba(200,169,106,0.08)", border: "1px solid rgba(200,169,106,0.2)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 14, fontWeight: 600, color: "#C8A96A",
      }}>
        {patient.full_name?.[0]?.toUpperCase() || "?"}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <p style={{ fontSize: 14, fontWeight: 500, color: "#FFFFFF", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {patient.full_name}
          </p>
          <span style={{
            fontSize: 10, fontWeight: 500, padding: "1px 7px", borderRadius: 4, flexShrink: 0,
            color: st.color, backgroundColor: st.bg, border: `1px solid ${st.border}`,
          }}>
            {st.label}
          </span>
        </div>
        <p style={{ fontSize: 12, color: "#666666" }}>
          {patient.phone}{age ? ` · ${age} anos` : ""}
        </p>
      </div>

      <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
        <button onClick={e => { e.stopPropagation(); onStartTreatment(patient); }}
          style={{ background: "#C8A96A", color: "#000", border: "none", borderRadius: 5, fontSize: 12, fontWeight: 600, padding: "5px 12px", cursor: "pointer" }}>
          Iniciar
        </button>
        <Link to={`/DossiePatient?patient_id=${patient.id}`} onClick={e => e.stopPropagation()} style={{ textDecoration: "none" }}>
          <button style={{ background: "transparent", color: "#C8A96A", border: "1px solid rgba(200,169,106,0.3)", borderRadius: 5, fontSize: 12, fontWeight: 500, padding: "5px 12px", cursor: "pointer" }}>
            Dossiê
          </button>
        </Link>
        <button onClick={e => { e.stopPropagation(); onViewTreatments(patient); }}
          style={{ background: "transparent", color: "#666666", border: "1px solid #2B2B2B", borderRadius: 5, fontSize: 12, padding: "5px 12px", cursor: "pointer" }}>
          Histórico
        </button>
      </div>
    </div>
  );
};

// ─── Página principal ────────────────────────────────────────────────────────
export default function Patients() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm]               = useState("");
  const [statusFilter, setStatusFilter]           = useState("all");
  const [isFormOpen, setIsFormOpen]               = useState(false);
  const [editingPatient, setEditingPatient]       = useState(null);
  const [isImportOpen, setIsImportOpen]           = useState(false);
  const [isTreatmentModalOpen, setIsTreatmentModalOpen] = useState(false);
  const [patientForTreatment, setPatientForTreatment]   = useState(null);
  const [isWizardOpen, setIsWizardOpen]           = useState(false);
  const [patientForWizard, setPatientForWizard]   = useState(null);
  const [saveError, setSaveError]                 = useState("");

  const { data: patients = [], isLoading } = useQuery({
    queryKey: ["patients"],
    queryFn: () => base44.entities.Patient.list("-created_date", 1000),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Patient.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      setSaveError("");
      setIsFormOpen(false);
      setEditingPatient(null);
    },
    onError: (err) => {
      setSaveError(err?.message || "Não foi possível finalizar o cadastro. Verifique os campos obrigatórios.");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Patient.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      setSaveError("");
      setIsFormOpen(false);
      setEditingPatient(null);
    },
    onError: (err) => {
      setSaveError(err?.message || "Erro ao atualizar paciente.");
    },
  });

  const isSaving = createMutation.isPending || updateMutation.isPending ||
                   createMutation.isLoading || updateMutation.isLoading;

  const handleSave = (payload) => {
    setSaveError("");
    if (editingPatient) {
      updateMutation.mutate({ id: editingPatient.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleOpenForm = (patient = null) => {
    setEditingPatient(patient);
    setSaveError("");
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    if (isSaving) return; // não fechar enquanto salva
    setIsFormOpen(false);
    setEditingPatient(null);
    setSaveError("");
  };

  const filteredPatients = patients.filter(p => {
    const q = searchTerm.toLowerCase();
    const matchSearch = !q ||
      p.full_name?.toLowerCase().includes(q) ||
      p.phone?.includes(q) ||
      p.email?.toLowerCase().includes(q);
    const matchStatus = statusFilter === "all" || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const stats = {
    total:    patients.length,
    active:   patients.filter(p => p.status === "active").length,
    vip:      patients.filter(p => p.status === "vip").length,
    thisMonth: patients.filter(p => {
      if (!p.created_date) return false;
      const d = parseISO(p.created_date), now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length,
  };

  return (
    <div className="space-y-6" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 600, letterSpacing: "-0.02em", color: "#FFFFFF", margin: 0 }}>Pacientes</h1>
          <p style={{ fontSize: 13, color: "#666666", marginTop: 4 }}>Cadastro e gestão de pacientes</p>
        </div>
        <div className="flex gap-3">
          {/* Importar */}
          <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="border-[#c9a55c]/30 text-[#c9a55c] hover:bg-[#c9a55c]/10">
                <FileUp className="mr-2 h-4 w-4" /> Importar Planilha
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#12121a] border-[#1e1e2a] text-white max-w-xl">
              <DialogHeader><DialogTitle>Importar Pacientes</DialogTitle></DialogHeader>
              <PatientImport
                existingPatients={patients}
                onDone={() => { queryClient.invalidateQueries({ queryKey: ["patients"] }); setIsImportOpen(false); }}
              />
            </DialogContent>
          </Dialog>

          {/* Novo Paciente */}
          <Button className="bg-[#c9a55c] hover:bg-[#a17f3f] text-black" onClick={() => handleOpenForm()}>
            <Plus className="mr-2 h-4 w-4" /> Novo Paciente
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Total de Pacientes", value: stats.total,     accent: "#FFFFFF" },
          { label: "Pacientes Ativos",   value: stats.active,    accent: "#4ADE80" },
          { label: "Pacientes VIP",      value: stats.vip,       accent: "#C8A96A" },
          { label: "Novos Este Mês",     value: stats.thisMonth, accent: "#FFFFFF" },
        ].map((s, i) => (
          <div key={i} style={{ backgroundColor: "#1A1A1A", border: "1px solid #2B2B2B", borderRadius: 8, padding: "16px 20px" }}>
            <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: "#666666", marginBottom: 8 }}>{s.label}</p>
            <p style={{ fontSize: 28, fontWeight: 600, letterSpacing: "-0.02em", color: s.accent, lineHeight: 1.1 }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Buscar por nome, telefone ou e-mail..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-10 bg-[#1a1a25] border-[#1e1e2a] text-white"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40 bg-[#1a1a25] border-[#1e1e2a] text-white">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="bg-[#12121a] border-[#1e1e2a]">
            <SelectItem value="all"      className="text-white">Todos</SelectItem>
            <SelectItem value="active"   className="text-white">Ativos</SelectItem>
            <SelectItem value="inactive" className="text-white">Inativos</SelectItem>
            <SelectItem value="vip"      className="text-white">VIP</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Lista */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {filteredPatients.map(p => (
          <PatientCard
            key={p.id}
            patient={p}
            onStartTreatment={p => { setPatientForWizard(p); setIsWizardOpen(true); }}
            onViewTreatments={p => { setPatientForTreatment(p); setIsTreatmentModalOpen(true); }}
          />
        ))}
      </div>

      {filteredPatients.length === 0 && !isLoading && (
        <div style={{ textAlign: "center", padding: "48px 0" }}>
          <p style={{ fontSize: 14, color: "#666666", marginBottom: 16 }}>Nenhum paciente encontrado</p>
          <button onClick={() => handleOpenForm()}
            style={{ background: "rgba(200,169,106,0.1)", color: "#C8A96A", border: "1px solid rgba(200,169,106,0.25)", borderRadius: 6, fontSize: 13, padding: "8px 18px", cursor: "pointer" }}>
            Cadastrar Primeira Paciente
          </button>
        </div>
      )}

      {/* Modal Cadastro/Edição */}
      <Dialog open={isFormOpen} onOpenChange={open => { if (!open && !isSaving) handleCloseForm(); }}>
        <DialogContent
          className="bg-[#12121a] border-[#1e1e2a] text-white max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
          onPointerDownOutside={e => { if (isSaving) e.preventDefault(); }}
          onInteractOutside={e => { if (isSaving) e.preventDefault(); }}
        >
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="text-xl">
              {editingPatient ? "Editar Paciente" : "Novo Paciente"}
            </DialogTitle>
          </DialogHeader>

          {saveError && (
            <div className="px-3 py-2 rounded-md text-sm flex-shrink-0" style={{ backgroundColor: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171" }}>
              ⚠️ {saveError}
            </div>
          )}

          <PatientForm
            key={editingPatient?.id ?? "new"}
            patient={editingPatient}
            onSave={handleSave}
            onClose={handleCloseForm}
            isSaving={isSaving}
          />
        </DialogContent>
      </Dialog>

      {/* Modal Histórico */}
      <Dialog open={isTreatmentModalOpen} onOpenChange={setIsTreatmentModalOpen}>
        <DialogContent className="bg-[#12121a] border-[#1e1e2a] text-white max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">Tratamentos de {patientForTreatment?.full_name}</DialogTitle>
          </DialogHeader>
          {patientForTreatment && (
            <PatientTreatmentPanel patientId={patientForTreatment.id} patientName={patientForTreatment.full_name} />
          )}
        </DialogContent>
      </Dialog>

      {/* Wizard */}
      {isWizardOpen && patientForWizard && (
        <TreatmentWizard
          patient={patientForWizard}
          onClose={() => { setIsWizardOpen(false); setPatientForWizard(null); }}
          onSuccess={() => { setIsWizardOpen(false); setPatientForWizard(null); }}
        />
      )}
    </div>
  );
}