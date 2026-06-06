import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";

const DOSSIE_STATUS = {
  lead: { label: "Lead", color: "bg-blue-500/20 text-blue-400" },
  avaliacao_agendada: { label: "Avaliação Agendada", color: "bg-yellow-500/20 text-yellow-400" },
  avaliacao_realizada: { label: "Avaliação Realizada", color: "bg-orange-500/20 text-orange-400" },
  em_tratamento: { label: "Em Tratamento", color: "bg-green-500/20 text-green-400" },
  procedimento_realizado: { label: "Procedimento Realizado", color: "bg-emerald-500/20 text-emerald-400" },
  em_acompanhamento: { label: "Em Acompanhamento", color: "bg-purple-500/20 text-purple-400" },
  finalizado: { label: "Finalizado", color: "bg-gray-500/20 text-gray-400" },
  inativo: { label: "Inativo", color: "bg-red-500/20 text-red-400" },
  cancelado: { label: "Cancelado", color: "bg-red-700/20 text-red-600" }
};

export default function DossieCadastro({ patient, onPatientUpdate }) {
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({ ...patient });
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.Patient.update(patient.id, data),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      onPatientUpdate?.(updated);
      setEditing(false);
    }
  });

  const handleSave = () => updateMutation.mutate(formData);

  const field = (label, key, type = "text", required = false) => (
    <div>
      <Label className="text-[#8A95AA] text-xs uppercase tracking-wider">{label}{required && " *"}</Label>
      <Input
        type={type}
        value={formData[key] || ""}
        onChange={(e) => setFormData(p => ({ ...p, [key]: e.target.value }))}
        disabled={!editing}
        className="mt-1 bg-[#1A2030] border-[#252D3E] text-white disabled:opacity-60 disabled:cursor-default"
      />
    </div>
  );

  const addrField = (label, key) => (
    <div>
      <Label className="text-[#8A95AA] text-xs uppercase tracking-wider">{label}</Label>
      <Input
        value={formData.address?.[key] || ""}
        onChange={(e) => setFormData(p => ({ ...p, address: { ...p.address, [key]: e.target.value } }))}
        disabled={!editing}
        className="mt-1 bg-[#1A2030] border-[#252D3E] text-white disabled:opacity-60 disabled:cursor-default"
      />
    </div>
  );

  const currentStatus = DOSSIE_STATUS[formData.dossie_status] || DOSSIE_STATUS.lead;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Badge className={currentStatus.color}>{currentStatus.label}</Badge>
        </div>
        {!editing ? (
          <Button onClick={() => setEditing(true)} variant="outline" size="sm" className="border-[#C5A059]/40 text-[#C5A059] hover:bg-[#C5A059]/10">
            Editar Cadastro
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button onClick={() => { setEditing(false); setFormData({ ...patient }); }} variant="ghost" size="sm" className="text-gray-400">Cancelar</Button>
            <Button onClick={handleSave} size="sm" className="bg-[#C5A059] hover:bg-[#a17f3f] text-black" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        )}
      </div>

      {/* Status Clínico */}
      {editing && (
        <div>
          <Label className="text-[#8A95AA] text-xs uppercase tracking-wider">Status da Paciente</Label>
          <Select value={formData.dossie_status || "lead"} onValueChange={(v) => setFormData(p => ({ ...p, dossie_status: v }))}>
            <SelectTrigger className="mt-1 bg-[#1A2030] border-[#252D3E] text-white"><SelectValue /></SelectTrigger>
            <SelectContent className="bg-[#171D29] border-[#252D3E]">
              {Object.entries(DOSSIE_STATUS).map(([k, v]) => (
                <SelectItem key={k} value={k} className="text-white">{v.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Dados Pessoais */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-[#C5A059] mb-3">Dados Pessoais</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {field("Nome Completo", "full_name", "text", true)}
          {field("CPF", "document_number")}
          {field("RG", "rg")}
          {field("Data de Nascimento", "birth_date", "date")}
          {field("Profissão", "profession")}
          <div>
            <Label className="text-[#8A95AA] text-xs uppercase tracking-wider">Estado Civil</Label>
            <Select value={formData.marital_status || ""} onValueChange={(v) => setFormData(p => ({ ...p, marital_status: v }))} disabled={!editing}>
              <SelectTrigger className="mt-1 bg-[#1A2030] border-[#252D3E] text-white disabled:opacity-60"><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent className="bg-[#171D29] border-[#252D3E]">
                <SelectItem value="solteira" className="text-white">Solteira</SelectItem>
                <SelectItem value="casada" className="text-white">Casada</SelectItem>
                <SelectItem value="divorciada" className="text-white">Divorciada</SelectItem>
                <SelectItem value="viuva" className="text-white">Viúva</SelectItem>
                <SelectItem value="uniao_estavel" className="text-white">União Estável</SelectItem>
                <SelectItem value="outro" className="text-white">Outro</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-[#8A95AA] text-xs uppercase tracking-wider">Gênero</Label>
            <Select value={formData.gender || ""} onValueChange={(v) => setFormData(p => ({ ...p, gender: v }))} disabled={!editing}>
              <SelectTrigger className="mt-1 bg-[#1A2030] border-[#252D3E] text-white disabled:opacity-60"><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent className="bg-[#171D29] border-[#252D3E]">
                <SelectItem value="female" className="text-white">Feminino</SelectItem>
                <SelectItem value="male" className="text-white">Masculino</SelectItem>
                <SelectItem value="other" className="text-white">Outro</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Contato */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-[#C5A059] mb-3">Contato</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {field("Telefone", "phone", "tel", true)}
          {field("WhatsApp", "whatsapp", "tel")}
          <div className="sm:col-span-2">{field("E-mail", "email", "email")}</div>
          {field("Contato de Emergência", "emergency_contact")}
          {field("Telefone de Emergência", "emergency_phone", "tel")}
        </div>
      </div>

      {/* Endereço */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-[#C5A059] mb-3">Endereço</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">{addrField("Rua", "street")}</div>
          {addrField("Número", "number")}
          {addrField("Complemento", "complement")}
          {addrField("Bairro", "neighborhood")}
          {addrField("Cidade", "city")}
          {addrField("Estado", "state")}
          {addrField("CEP", "zip_code")}
        </div>
      </div>

      {/* Origem e Interesse */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-[#C5A059] mb-3">Origem e Interesse</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label className="text-[#8A95AA] text-xs uppercase tracking-wider">Origem</Label>
            <Select value={formData.source || ""} onValueChange={(v) => setFormData(p => ({ ...p, source: v }))} disabled={!editing}>
              <SelectTrigger className="mt-1 bg-[#1A2030] border-[#252D3E] text-white disabled:opacity-60"><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent className="bg-[#171D29] border-[#252D3E]">
                <SelectItem value="instagram" className="text-white">Instagram</SelectItem>
                <SelectItem value="google" className="text-white">Google</SelectItem>
                <SelectItem value="referral" className="text-white">Indicação</SelectItem>
                <SelectItem value="website" className="text-white">Website</SelectItem>
                <SelectItem value="whatsapp" className="text-white">WhatsApp</SelectItem>
                <SelectItem value="other" className="text-white">Outro</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {field("Procedimento de Interesse", "interest")}
        </div>
      </div>

      {/* Consentimentos */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-[#C5A059] mb-3">Consentimentos LGPD</h3>
        <div className="space-y-3">
          {[
            { key: "consent_whatsapp", label: "Autoriza comunicação via WhatsApp" },
            { key: "consent_images", label: "Autoriza uso de imagens para documentação" },
            { key: "consent_terms_signed", label: "Termos e condições aceitos" }
          ].map(c => (
            <div key={c.key} className="flex items-center gap-3">
              <Checkbox
                id={c.key}
                checked={!!formData[c.key]}
                onCheckedChange={(v) => editing && setFormData(p => ({ ...p, [c.key]: v }))}
                disabled={!editing}
              />
              <Label htmlFor={c.key} className="text-[#C8D0DF] text-sm cursor-pointer">{c.label}</Label>
            </div>
          ))}
        </div>
      </div>

      {/* Observações */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-[#C5A059] mb-3">Observações Gerais</h3>
        <Textarea
          value={formData.notes || ""}
          onChange={(e) => setFormData(p => ({ ...p, notes: e.target.value }))}
          disabled={!editing}
          rows={3}
          className="bg-[#1A2030] border-[#252D3E] text-white disabled:opacity-60"
        />
      </div>
    </div>
  );
}