import React, { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, Mail, Phone, MapPin, Calendar, FileText, CheckCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { findDuplicateCandidates } from "@/lib/patientUtils";

export default function PatientRegistration({ existingPatient, onComplete, onCancel }) {
  const [formData, setFormData] = useState({
    full_name: existingPatient?.full_name || "",
    document_type: "cpf",
    document_number: "",
    birth_date: "",
    gender: "female",
    phone: "",
    whatsapp: "",
    email: "",
    address: {
      street: "",
      number: "",
      complement: "",
      neighborhood: "",
      city: "",
      state: "",
      zip_code: ""
    },
    source: "instagram",
    notes: "",
    consent_whatsapp: false,
    consent_images: false,
    consent_terms_signed: false
  });

  const [loading, setLoading] = useState(false);
  const submittingRef = useRef(false); // proteção contra duplo clique

  const handleSubmit = async () => {
    if (submittingRef.current) return;
    if (!formData.full_name || !formData.phone) {
      toast.error("Preencha nome e telefone obrigatórios");
      return;
    }

    if (!formData.consent_terms_signed) {
      toast.error("Aceite os termos LGPD para continuar");
      return;
    }

    // Verificação de duplicidade contra pacientes existentes
    try {
      const existing = await base44.entities.Patient.list("-created_date", 1000);
      const candidates = findDuplicateCandidates(formData, existing);
      if (candidates.length > 0) {
        const nomes = candidates.map((c) => `${c.full_name} (${c.phone})`).join(", ");
        const confirmar = window.confirm(
          `Já existe um paciente com dados semelhantes:\n\n${nomes}\n\nDeseja abrir o cadastro existente (Cancelar) ou confirmar a criação de um novo cadastro (OK)?`
        );
        if (!confirmar) {
          onComplete?.(candidates[0]); // abre o cadastro existente
          return;
        }
      }
    } catch (e) {
      // se a checagem falhar, segue o fluxo (não bloqueia cadastro)
      console.warn("Checagem de duplicidade indisponível:", e);
    }

    submittingRef.current = true;
    setLoading(true);

    try {
      const patientData = {
        ...formData,
        consent_date: new Date().toISOString()
      };

      const response = await base44.entities.Patient.create(patientData);
      
      toast.success("Paciente cadastrado com sucesso!");
      onComplete?.(response);
    } catch (error) {
      console.error("Erro ao cadastrar paciente:", error);
      toast.error("Erro ao cadastrar paciente. Tente novamente.");
    } finally {
      submittingRef.current = false;
      setLoading(false);
    }
  };

  const handleAddressChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      address: { ...prev.address, [field]: value }
    }));
  };

  return (
    <Card className="bg-[#1a1a25] border-[#1e1e2a]">
      <CardContent className="p-6 space-y-6">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <User className="h-6 w-6 text-[#C5A059]" />
            <h3 className="text-xl font-serif text-white">
              {existingPatient ? "Completar Cadastro" : "Novo Cadastro de Paciente"}
            </h3>
          </div>
          <p className="text-sm text-gray-400">
            Preencha os dados para vincular à análise facial
          </p>
        </div>

        {/* Dados Pessoais */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-[#C5A059] uppercase tracking-wider">
            Dados Pessoais
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-gray-300">Nome Completo *</Label>
              <Input
                value={formData.full_name}
                onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                placeholder="Nome completo"
                className="bg-[#111620] border-[#1e1e2a] text-white"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-300">Data de Nascimento</Label>
              <Input
                type="date"
                value={formData.birth_date}
                onChange={(e) => setFormData({...formData, birth_date: e.target.value})}
                className="bg-[#111620] border-[#1e1e2a] text-white"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-300">Gênero</Label>
              <Select
                value={formData.gender}
                onValueChange={(value) => setFormData({...formData, gender: value})}
              >
                <SelectTrigger className="bg-[#111620] border-[#1e1e2a] text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a25] border-[#1e1e2a]">
                  <SelectItem value="female">Feminino</SelectItem>
                  <SelectItem value="male">Masculino</SelectItem>
                  <SelectItem value="other">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-300">CPF</Label>
              <Input
                value={formData.document_number}
                onChange={(e) => setFormData({...formData, document_number: e.target.value})}
                placeholder="000.000.000-00"
                className="bg-[#111620] border-[#1e1e2a] text-white"
              />
            </div>
          </div>
        </div>

        {/* Contato */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-[#C5A059] uppercase tracking-wider">
            Contato
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-gray-300">Telefone *</Label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                placeholder="(00) 00000-0000"
                className="bg-[#111620] border-[#1e1e2a] text-white"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-300">WhatsApp</Label>
              <Input
                value={formData.whatsapp}
                onChange={(e) => setFormData({...formData, whatsapp: e.target.value})}
                placeholder="(00) 00000-0000"
                className="bg-[#111620] border-[#1e1e2a] text-white"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label className="text-gray-300">E-mail</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                placeholder="email@example.com"
                className="bg-[#111620] border-[#1e1e2a] text-white"
              />
            </div>
          </div>
        </div>

        {/* Endereço */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-[#C5A059] uppercase tracking-wider">
            Endereço
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div className="md:col-span-3 space-y-2">
              <Label className="text-gray-300">Rua</Label>
              <Input
                value={formData.address.street}
                onChange={(e) => handleAddressChange("street", e.target.value)}
                placeholder="Rua"
                className="bg-[#111620] border-[#1e1e2a] text-white"
              />
            </div>

            <div className="md:col-span-1 space-y-2">
              <Label className="text-gray-300">Número</Label>
              <Input
                value={formData.address.number}
                onChange={(e) => handleAddressChange("number", e.target.value)}
                placeholder="123"
                className="bg-[#111620] border-[#1e1e2a] text-white"
              />
            </div>

            <div className="md:col-span-2 space-y-2">
              <Label className="text-gray-300">Complemento</Label>
              <Input
                value={formData.address.complement}
                onChange={(e) => handleAddressChange("complement", e.target.value)}
                placeholder="Apto 101"
                className="bg-[#111620] border-[#1e1e2a] text-white"
              />
            </div>

            <div className="md:col-span-2 space-y-2">
              <Label className="text-gray-300">Bairro</Label>
              <Input
                value={formData.address.neighborhood}
                onChange={(e) => handleAddressChange("neighborhood", e.target.value)}
                placeholder="Bairro"
                className="bg-[#111620] border-[#1e1e2a] text-white"
              />
            </div>

            <div className="md:col-span-2 space-y-2">
              <Label className="text-gray-300">Cidade</Label>
              <Input
                value={formData.address.city}
                onChange={(e) => handleAddressChange("city", e.target.value)}
                placeholder="Cidade"
                className="bg-[#111620] border-[#1e1e2a] text-white"
              />
            </div>

            <div className="md:col-span-2 space-y-2">
              <Label className="text-gray-300">CEP</Label>
              <Input
                value={formData.address.zip_code}
                onChange={(e) => handleAddressChange("zip_code", e.target.value)}
                placeholder="00000-000"
                className="bg-[#111620] border-[#1e1e2a] text-white"
              />
            </div>
          </div>
        </div>

        {/* Consentimentos LGPD */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-[#C5A059] uppercase tracking-wider">
            Consentimentos LGPD
          </h4>
          
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Checkbox
                id="consent_whatsapp"
                checked={formData.consent_whatsapp}
                onCheckedChange={(checked) => setFormData({...formData, consent_whatsapp: checked})}
                className="border-[#C5A059] data-[state=checked]:bg-[#C5A059]"
              />
              <div>
                <Label htmlFor="consent_whatsapp" className="text-sm text-gray-300 cursor-pointer">
                  Autorizo contato via WhatsApp
                </Label>
                <p className="text-xs text-gray-500">Receber mensagens sobre tratamentos e agendamentos</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Checkbox
                id="consent_images"
                checked={formData.consent_images}
                onCheckedChange={(checked) => setFormData({...formData, consent_images: checked})}
                className="border-[#C5A059] data-[state=checked]:bg-[#C5A059]"
              />
              <div>
                <Label htmlFor="consent_images" className="text-sm text-gray-300 cursor-pointer">
                  Autorizo uso de imagens
                </Label>
                <p className="text-xs text-gray-500">Fotos para acompanhamento clínico (uso interno)</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Checkbox
                id="consent_terms"
                checked={formData.consent_terms_signed}
                onCheckedChange={(checked) => setFormData({...formData, consent_terms_signed: checked})}
                className="border-[#C5A059] data-[state=checked]:bg-[#C5A059]"
              />
              <div>
                <Label htmlFor="consent_terms" className="text-sm text-gray-300 cursor-pointer">
                  Aceito os termos de privacidade *
                </Label>
                <p className="text-xs text-gray-500">Concordo com o tratamento de dados conforme LGPD</p>
              </div>
            </div>
          </div>
        </div>

        {/* Ações */}
        <div className="flex gap-3 pt-4 border-t border-[#1e1e2a]">
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 bg-[#C5A059] text-[#111620] hover:bg-[#D9BB82]"
          >
            {loading
              ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...</>
              : <><CheckCircle className="mr-2 h-4 w-4" /> Salvar e Vincular Análise</>}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="border-[#1e1e2a] text-white hover:bg-[#1e1e2a]"
          >
            Cancelar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}