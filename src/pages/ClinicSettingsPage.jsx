import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Save, Building2, User, MapPin, Phone, FileText, Palette, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Field = ({ label, children }) => (
  <div className="flex flex-col gap-1.5">
    <Label style={{ fontSize: 12, color: "#B0B0B0", fontWeight: 500 }}>{label}</Label>
    {children}
  </div>
);

const inputStyle = {
  backgroundColor: "#121212",
  borderColor: "#2B2B2B",
  color: "#FFFFFF",
  fontSize: 14,
};

export default function ClinicSettingsPage() {
  const queryClient = useQueryClient();
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    clinic_name: "",
    legal_name: "",
    professional_name: "",
    professional_title: "Dra.",
    professional_registry: "",
    cnpj: "",
    cpf: "",
    phone: "",
    whatsapp: "",
    email: "",
    website: "",
    instagram: "",
    logo_url: "",
    primary_color: "#C8A96A",
    accent_color: "#D4BC88",
    conselho_regional: "",
    numero_conselho: "",
    especialidade: "",
    horario_funcionamento: "",
    contract_header: "",
    contract_footer: "",
    default_lgpd_text: "",
    default_payment_policy: "",
    default_cancellation_policy: "",
    observacoes_legais: "",
    address: {
      street: "",
      number: "",
      complement: "",
      neighborhood: "",
      city: "",
      state: "",
      zip_code: "",
    },
  });

  const { data: settingsList = [] } = useQuery({
    queryKey: ["clinic_settings"],
    queryFn: () => base44.entities.ClinicSettings.list(),
  });

  const existingSettings = settingsList[0];

  useEffect(() => {
    if (existingSettings) {
      setForm((prev) => ({
        ...prev,
        ...existingSettings,
        address: { ...prev.address, ...(existingSettings.address || {}) },
      }));
    }
  }, [existingSettings]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (existingSettings?.id) {
        return base44.entities.ClinicSettings.update(existingSettings.id, data);
      } else {
        return base44.entities.ClinicSettings.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clinic_settings"] });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    },
  });

  const set = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));
  const setAddr = (field, value) =>
    setForm((prev) => ({ ...prev, address: { ...prev.address, [field]: value } }));

  return (
    <div className="w-full max-w-4xl min-w-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">Configurações da Clínica</h1>
          <p style={{ fontSize: 13, color: "#666666", marginTop: 4 }}>
            Dados usados em contratos, PDFs, relatórios e identidade visual
          </p>
        </div>
        <Button
          onClick={() => saveMutation.mutate(form)}
          disabled={saveMutation.isPending}
          style={{
            backgroundColor: saved ? "#22c55e" : "#C8A96A",
            color: "#000",
            fontWeight: 600,
            fontSize: 13,
            height: 36,
            minWidth: 120,
          }}
        >
          {saved ? (
            <><CheckCircle className="h-4 w-4 mr-2" />Salvo!</>
          ) : (
            <><Save className="h-4 w-4 mr-2" />{saveMutation.isPending ? "Salvando..." : "Salvar"}</>
          )}
        </Button>
      </div>

      <Tabs defaultValue="identidade">
        <TabsList
          className="mb-6 flex-wrap gap-1"
          style={{ backgroundColor: "#1A1A1A", border: "1px solid #2B2B2B", padding: 4, borderRadius: 8 }}
        >
          {[
            { value: "identidade", label: "Identidade" },
            { value: "profissional", label: "Profissional" },
            { value: "contato", label: "Contato & Endereço" },
            { value: "documentos", label: "Documentos & PDFs" },
          ].map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="text-[12px] data-[state=active]:bg-[#C8A96A]/15 data-[state=active]:text-[#C8A96A]"
              style={{ color: "#B0B0B0" }}
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* ── Identidade ── */}
        <TabsContent value="identidade">
          <div
            style={{
              backgroundColor: "#1A1A1A",
              border: "1px solid #2B2B2B",
              borderRadius: 8,
              padding: 24,
            }}
          >
            <div className="flex items-center gap-2 mb-5">
              <Building2 className="h-4 w-4 text-[#C8A96A]" />
              <span style={{ fontSize: 13, fontWeight: 600, color: "#FFFFFF" }}>Identidade da Clínica</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Field label="Nome da Clínica *">
                <Input value={form.clinic_name} onChange={(e) => set("clinic_name", e.target.value)} style={inputStyle} />
              </Field>
              <Field label="Razão Social">
                <Input value={form.legal_name} onChange={(e) => set("legal_name", e.target.value)} style={inputStyle} />
              </Field>
              <Field label="CNPJ">
                <Input value={form.cnpj} onChange={(e) => set("cnpj", e.target.value)} placeholder="00.000.000/0001-00" style={inputStyle} />
              </Field>
              <Field label="CPF (se pessoa física)">
                <Input value={form.cpf} onChange={(e) => set("cpf", e.target.value)} placeholder="000.000.000-00" style={inputStyle} />
              </Field>
              <Field label="URL do Logo">
                <Input value={form.logo_url} onChange={(e) => set("logo_url", e.target.value)} placeholder="https://..." style={inputStyle} />
              </Field>
              <Field label="Horário de Funcionamento">
                <Input value={form.horario_funcionamento} onChange={(e) => set("horario_funcionamento", e.target.value)} placeholder="Seg–Sex 9h–19h" style={inputStyle} />
              </Field>
            </div>

            <div className="mt-6 border-t pt-5" style={{ borderColor: "#2B2B2B" }}>
              <div className="flex items-center gap-2 mb-4">
                <Palette className="h-4 w-4 text-[#C8A96A]" />
                <span style={{ fontSize: 13, fontWeight: 600, color: "#FFFFFF" }}>Cores da Marca</span>
              </div>
              <div className="grid grid-cols-2 gap-5">
                <Field label="Cor Principal">
                  <div className="flex gap-2 items-center">
                    <Input type="color" value={form.primary_color} onChange={(e) => set("primary_color", e.target.value)} style={{ ...inputStyle, width: 44, height: 36, padding: 2 }} />
                    <Input value={form.primary_color} onChange={(e) => set("primary_color", e.target.value)} style={{ ...inputStyle, flex: 1 }} />
                  </div>
                </Field>
                <Field label="Cor de Destaque">
                  <div className="flex gap-2 items-center">
                    <Input type="color" value={form.accent_color} onChange={(e) => set("accent_color", e.target.value)} style={{ ...inputStyle, width: 44, height: 36, padding: 2 }} />
                    <Input value={form.accent_color} onChange={(e) => set("accent_color", e.target.value)} style={{ ...inputStyle, flex: 1 }} />
                  </div>
                </Field>
              </div>
            </div>

            {form.logo_url && (
              <div className="mt-5">
                <p style={{ fontSize: 11, color: "#666666", marginBottom: 8, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em" }}>Pré-visualização do Logo</p>
                <div style={{ backgroundColor: "#0A0A0A", border: "1px solid #2B2B2B", borderRadius: 6, padding: 16, display: "inline-block" }}>
                  <img src={form.logo_url} alt="Logo" style={{ maxHeight: 80, maxWidth: 240, objectFit: "contain" }} />
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        {/* ── Profissional ── */}
        <TabsContent value="profissional">
          <div style={{ backgroundColor: "#1A1A1A", border: "1px solid #2B2B2B", borderRadius: 8, padding: 24 }}>
            <div className="flex items-center gap-2 mb-5">
              <User className="h-4 w-4 text-[#C8A96A]" />
              <span style={{ fontSize: 13, fontWeight: 600, color: "#FFFFFF" }}>Dados da Profissional</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Field label="Título">
                <Input value={form.professional_title} onChange={(e) => set("professional_title", e.target.value)} placeholder="Dra." style={inputStyle} />
              </Field>
              <Field label="Nome Completo *">
                <Input value={form.professional_name} onChange={(e) => set("professional_name", e.target.value)} style={inputStyle} />
              </Field>
              <Field label="Especialidade">
                <Input value={form.especialidade} onChange={(e) => set("especialidade", e.target.value)} placeholder="Medicina Estética" style={inputStyle} />
              </Field>
              <Field label="Conselho Regional (CRM, CFO, COREN...)">
                <Input value={form.conselho_regional} onChange={(e) => set("conselho_regional", e.target.value)} placeholder="CRM" style={inputStyle} />
              </Field>
              <Field label="Número do Registro">
                <Input value={form.numero_conselho} onChange={(e) => set("numero_conselho", e.target.value)} placeholder="000000-SP" style={inputStyle} />
              </Field>
              <Field label="Número de Registro Geral">
                <Input value={form.professional_registry} onChange={(e) => set("professional_registry", e.target.value)} style={inputStyle} />
              </Field>
            </div>
          </div>
        </TabsContent>

        {/* ── Contato & Endereço ── */}
        <TabsContent value="contato">
          <div style={{ backgroundColor: "#1A1A1A", border: "1px solid #2B2B2B", borderRadius: 8, padding: 24 }}>
            <div className="flex items-center gap-2 mb-5">
              <Phone className="h-4 w-4 text-[#C8A96A]" />
              <span style={{ fontSize: 13, fontWeight: 600, color: "#FFFFFF" }}>Contato</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
              <Field label="Telefone">
                <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} style={inputStyle} />
              </Field>
              <Field label="WhatsApp">
                <Input value={form.whatsapp} onChange={(e) => set("whatsapp", e.target.value)} style={inputStyle} />
              </Field>
              <Field label="E-mail">
                <Input value={form.email} onChange={(e) => set("email", e.target.value)} type="email" style={inputStyle} />
              </Field>
              <Field label="Website">
                <Input value={form.website} onChange={(e) => set("website", e.target.value)} placeholder="https://..." style={inputStyle} />
              </Field>
              <Field label="Instagram">
                <Input value={form.instagram} onChange={(e) => set("instagram", e.target.value)} placeholder="@clinica" style={inputStyle} />
              </Field>
            </div>

            <div className="border-t pt-5" style={{ borderColor: "#2B2B2B" }}>
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="h-4 w-4 text-[#C8A96A]" />
                <span style={{ fontSize: 13, fontWeight: 600, color: "#FFFFFF" }}>Endereço</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                  <Field label="Rua / Avenida">
                    <Input value={form.address.street} onChange={(e) => setAddr("street", e.target.value)} style={inputStyle} />
                  </Field>
                </div>
                <Field label="Número">
                  <Input value={form.address.number} onChange={(e) => setAddr("number", e.target.value)} style={inputStyle} />
                </Field>
                <Field label="Complemento">
                  <Input value={form.address.complement} onChange={(e) => setAddr("complement", e.target.value)} style={inputStyle} />
                </Field>
                <Field label="Bairro">
                  <Input value={form.address.neighborhood} onChange={(e) => setAddr("neighborhood", e.target.value)} style={inputStyle} />
                </Field>
                <Field label="Cidade">
                  <Input value={form.address.city} onChange={(e) => setAddr("city", e.target.value)} style={inputStyle} />
                </Field>
                <Field label="Estado">
                  <Input value={form.address.state} onChange={(e) => setAddr("state", e.target.value)} placeholder="SP" style={inputStyle} />
                </Field>
                <Field label="CEP">
                  <Input value={form.address.zip_code} onChange={(e) => setAddr("zip_code", e.target.value)} placeholder="00000-000" style={inputStyle} />
                </Field>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ── Documentos & PDFs ── */}
        <TabsContent value="documentos">
          <div style={{ backgroundColor: "#1A1A1A", border: "1px solid #2B2B2B", borderRadius: 8, padding: 24 }}>
            <div className="flex items-center gap-2 mb-5">
              <FileText className="h-4 w-4 text-[#C8A96A]" />
              <span style={{ fontSize: 13, fontWeight: 600, color: "#FFFFFF" }}>Textos Padrão para Documentos</span>
            </div>
            <p style={{ fontSize: 12, color: "#666666", marginBottom: 20 }}>
              Esses textos são usados automaticamente em contratos, PDFs e relatórios gerados pela plataforma.
            </p>
            <div className="flex flex-col gap-5">
              <Field label="Cabeçalho do Contrato">
                <Textarea
                  value={form.contract_header}
                  onChange={(e) => set("contract_header", e.target.value)}
                  rows={3}
                  placeholder="Ex: Este contrato é firmado entre a Clínica X, CNPJ 00.000.000/0001-00, localizada na Rua Y..."
                  style={{ ...inputStyle, resize: "vertical" }}
                />
              </Field>
              <Field label="Rodapé do Contrato">
                <Textarea
                  value={form.contract_footer}
                  onChange={(e) => set("contract_footer", e.target.value)}
                  rows={3}
                  placeholder="Ex: O presente instrumento está sujeito às leis brasileiras..."
                  style={{ ...inputStyle, resize: "vertical" }}
                />
              </Field>
              <Field label="Texto Padrão LGPD">
                <Textarea
                  value={form.default_lgpd_text}
                  onChange={(e) => set("default_lgpd_text", e.target.value)}
                  rows={4}
                  placeholder="Texto de conformidade com a LGPD (Lei 13.709/2018)..."
                  style={{ ...inputStyle, resize: "vertical" }}
                />
              </Field>
              <Field label="Política de Pagamento Padrão">
                <Textarea
                  value={form.default_payment_policy}
                  onChange={(e) => set("default_payment_policy", e.target.value)}
                  rows={3}
                  placeholder="Ex: O pagamento deve ser efetuado no ato do procedimento..."
                  style={{ ...inputStyle, resize: "vertical" }}
                />
              </Field>
              <Field label="Política de Cancelamento Padrão">
                <Textarea
                  value={form.default_cancellation_policy}
                  onChange={(e) => set("default_cancellation_policy", e.target.value)}
                  rows={3}
                  placeholder="Ex: Cancelamentos com menos de 24h de antecedência..."
                  style={{ ...inputStyle, resize: "vertical" }}
                />
              </Field>
              <Field label="Observações Legais Gerais">
                <Textarea
                  value={form.observacoes_legais}
                  onChange={(e) => set("observacoes_legais", e.target.value)}
                  rows={3}
                  placeholder="Outras observações de cunho jurídico ou regulatório..."
                  style={{ ...inputStyle, resize: "vertical" }}
                />
              </Field>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}