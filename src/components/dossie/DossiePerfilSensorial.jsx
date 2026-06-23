import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { T, S } from "@/lib/designTokens";
import {
  Coffee, Leaf, Wind, Thermometer, Sparkles, MessageCircle,
  Clock, AlertTriangle, FileText, Globe, CheckCircle2, UserPen,
  ChevronDown, ChevronUp
} from "lucide-react";

function Tag({ label }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center",
      padding: "3px 10px", borderRadius: 20,
      backgroundColor: T.goldSubtle, border: `1px solid ${T.goldBorder}`,
      color: T.gold, fontSize: 12, fontWeight: 500, whiteSpace: "nowrap",
    }}>
      {label}
    </span>
  );
}

function Section({ icon: Icon, title, children }) {
  return (
    <div style={{
      backgroundColor: T.card, border: `1px solid ${T.border}`,
      borderRadius: 8, padding: "16px 20px",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <Icon style={{ width: 14, height: 14, color: T.gold }} />
        <p style={{ ...S.label, margin: 0 }}>{title}</p>
      </div>
      {children}
    </div>
  );
}

function TagList({ items }) {
  if (!items || items.length === 0) return <p style={{ ...S.pageSubtitle, margin: 0, fontSize: 13 }}>—</p>;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
      {items.map((item, i) => <Tag key={i} label={item} />)}
    </div>
  );
}

function Field({ label, value }) {
  return (
    <div>
      <p style={{ ...S.label, fontSize: 11, marginBottom: 4 }}>{label}</p>
      <p style={{ color: T.textPrimary, fontSize: 13, margin: 0 }}>{value || "—"}</p>
    </div>
  );
}

function FinalizarCadastroPanel({ patient, onSaved }) {
  const [open, setOpen] = useState(true);
  const [form, setForm] = useState({
    document_number: patient.document_number || "",
    rg: patient.rg || "",
    birth_date: patient.birth_date || "",
    gender: patient.gender || "",
    profession: patient.profession || "",
    marital_status: patient.marital_status || "",
    whatsapp: patient.whatsapp || "",
    address_street: patient.address?.street || "",
    address_number: patient.address?.number || "",
    address_neighborhood: patient.address?.neighborhood || "",
    address_city: patient.address?.city || "",
    address_state: patient.address?.state || "",
    address_zip: patient.address?.zip_code || "",
    notes: patient.notes || "",
  });

  const qc = useQueryClient();
  const mutation = useMutation({
    mutationFn: (data) => base44.entities.Patient.update(patient.id, data),
    onSuccess: () => {
      qc.invalidateQueries(["patients"]);
      onSaved?.();
    },
  });

  function handle(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  }

  function save() {
    mutation.mutate({
      document_number: form.document_number,
      rg: form.rg,
      birth_date: form.birth_date,
      gender: form.gender,
      profession: form.profession,
      marital_status: form.marital_status,
      whatsapp: form.whatsapp,
      dossie_status: "avaliacao_agendada",
      notes: form.notes,
      address: {
        street: form.address_street,
        number: form.address_number,
        neighborhood: form.address_neighborhood,
        city: form.address_city,
        state: form.address_state,
        zip_code: form.address_zip,
      },
    });
  }

  const inputStyle = {
    width: "100%", padding: "8px 10px", borderRadius: 6,
    backgroundColor: T.bgSecondary, border: `1px solid ${T.border}`,
    color: T.textPrimary, fontSize: 13, fontFamily: T.font, outline: "none",
  };

  const selectStyle = { ...inputStyle };

  return (
    <div style={{
      backgroundColor: T.card, border: `1px solid ${T.gold}`,
      borderRadius: 8, overflow: "hidden",
    }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "14px 20px", background: "none", border: "none", cursor: "pointer",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <UserPen style={{ width: 15, height: 15, color: T.gold }} />
          <span style={{ ...S.label, color: T.gold, margin: 0 }}>Finalizar Cadastro da Paciente</span>
        </div>
        {open
          ? <ChevronUp style={{ width: 15, height: 15, color: T.textMuted }} />
          : <ChevronDown style={{ width: 15, height: 15, color: T.textMuted }} />}
      </button>

      {open && (
        <div style={{ padding: "0 20px 20px", display: "flex", flexDirection: "column", gap: 16 }}>
          <p style={{ ...S.pageSubtitle, fontSize: 12, margin: 0 }}>
            Paciente chegou via SensorFlow. Complete os dados abaixo para finalizar o cadastro.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
            <div>
              <label style={{ ...S.label, display: "block", marginBottom: 4 }}>CPF</label>
              <input name="document_number" value={form.document_number} onChange={handle} style={inputStyle} placeholder="000.000.000-00" />
            </div>
            <div>
              <label style={{ ...S.label, display: "block", marginBottom: 4 }}>RG</label>
              <input name="rg" value={form.rg} onChange={handle} style={inputStyle} placeholder="RG" />
            </div>
            <div>
              <label style={{ ...S.label, display: "block", marginBottom: 4 }}>Data de Nascimento</label>
              <input name="birth_date" type="date" value={form.birth_date} onChange={handle} style={inputStyle} />
            </div>
            <div>
              <label style={{ ...S.label, display: "block", marginBottom: 4 }}>Gênero</label>
              <select name="gender" value={form.gender} onChange={handle} style={selectStyle}>
                <option value="">Selecionar</option>
                <option value="female">Feminino</option>
                <option value="male">Masculino</option>
                <option value="other">Outro</option>
              </select>
            </div>
            <div>
              <label style={{ ...S.label, display: "block", marginBottom: 4 }}>Profissão</label>
              <input name="profession" value={form.profession} onChange={handle} style={inputStyle} placeholder="Profissão" />
            </div>
            <div>
              <label style={{ ...S.label, display: "block", marginBottom: 4 }}>Estado Civil</label>
              <select name="marital_status" value={form.marital_status} onChange={handle} style={selectStyle}>
                <option value="">Selecionar</option>
                <option value="solteira">Solteira</option>
                <option value="casada">Casada</option>
                <option value="divorciada">Divorciada</option>
                <option value="viuva">Viúva</option>
                <option value="uniao_estavel">União Estável</option>
                <option value="outro">Outro</option>
              </select>
            </div>
            <div>
              <label style={{ ...S.label, display: "block", marginBottom: 4 }}>WhatsApp</label>
              <input name="whatsapp" value={form.whatsapp} onChange={handle} style={inputStyle} placeholder="+55 (00) 00000-0000" />
            </div>
          </div>

          <p style={{ ...S.label, margin: "4px 0 0", color: T.textMuted }}>Endereço</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
            <div style={{ gridColumn: "span 2" }}>
              <label style={{ ...S.label, display: "block", marginBottom: 4 }}>Rua</label>
              <input name="address_street" value={form.address_street} onChange={handle} style={inputStyle} placeholder="Logradouro" />
            </div>
            <div>
              <label style={{ ...S.label, display: "block", marginBottom: 4 }}>Número</label>
              <input name="address_number" value={form.address_number} onChange={handle} style={inputStyle} placeholder="Nº" />
            </div>
            <div>
              <label style={{ ...S.label, display: "block", marginBottom: 4 }}>Bairro</label>
              <input name="address_neighborhood" value={form.address_neighborhood} onChange={handle} style={inputStyle} placeholder="Bairro" />
            </div>
            <div>
              <label style={{ ...S.label, display: "block", marginBottom: 4 }}>Cidade</label>
              <input name="address_city" value={form.address_city} onChange={handle} style={inputStyle} placeholder="Cidade" />
            </div>
            <div>
              <label style={{ ...S.label, display: "block", marginBottom: 4 }}>Estado</label>
              <input name="address_state" value={form.address_state} onChange={handle} style={inputStyle} placeholder="SP" maxLength={2} />
            </div>
            <div>
              <label style={{ ...S.label, display: "block", marginBottom: 4 }}>CEP</label>
              <input name="address_zip" value={form.address_zip} onChange={handle} style={inputStyle} placeholder="00000-000" />
            </div>
          </div>

          <div>
            <label style={{ ...S.label, display: "block", marginBottom: 4 }}>Observações</label>
            <textarea name="notes" value={form.notes} onChange={handle} rows={2} style={{ ...inputStyle, resize: "vertical" }} placeholder="Anotações internas..." />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
            {mutation.isSuccess && (
              <span style={{ display: "flex", alignItems: "center", gap: 6, color: T.gold, fontSize: 13 }}>
                <CheckCircle2 style={{ width: 14, height: 14 }} /> Salvo com sucesso!
              </span>
            )}
            <button
              onClick={save}
              disabled={mutation.isPending}
              style={{
                padding: "8px 20px", borderRadius: 6, border: "none", cursor: "pointer",
                backgroundColor: T.gold, color: "#000", fontSize: 13, fontWeight: 600, fontFamily: T.font,
                opacity: mutation.isPending ? 0.7 : 1,
              }}
            >
              {mutation.isPending ? "Salvando..." : "Salvar e Avançar Status"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DossiePerfilSensorial({ patient }) {
  const [saved, setSaved] = useState(false);

  const { data: perfis = [], isLoading } = useQuery({
    queryKey: ["perfilSensorial", patient.id],
    queryFn: () => base44.entities.PerfilSensorial.filter({ patient_id: patient.id }),
    enabled: !!patient.id,
  });

  const perfil = perfis[0];

  // Paciente está incompleto se veio via SensorFlow (tem notes com esse texto ou faltam campos chave)
  const isIncomplete = !patient.document_number || !patient.birth_date || !patient.address?.city;

  if (isLoading) {
    return (
      <div style={{ textAlign: "center", padding: "48px 0" }}>
        <p style={S.pageSubtitle}>Carregando perfil sensorial...</p>
      </div>
    );
  }

  if (!perfil) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {isIncomplete && (
          <FinalizarCadastroPanel patient={patient} onSaved={() => setSaved(true)} />
        )}
        <div style={{
          textAlign: "center", padding: "48px 24px",
          backgroundColor: T.card, border: `1px solid ${T.border}`,
          borderRadius: 8,
        }}>
          <Sparkles style={{ width: 32, height: 32, color: T.textMuted, margin: "0 auto 12px" }} />
          <p style={{ ...S.value, marginBottom: 6 }}>Nenhum perfil sensorial ainda</p>
          <p style={{ ...S.pageSubtitle, fontSize: 13 }}>
            Será preenchido automaticamente quando a paciente responder o formulário SensorlyFlow.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* Painel de finalização de cadastro, se incompleto */}
      {isIncomplete && !saved && (
        <FinalizarCadastroPanel patient={patient} onSaved={() => setSaved(true)} />
      )}

      {/* Resumo de hospitalidade */}
      {perfil.hospitality_summary && (
        <div style={{
          backgroundColor: T.goldSubtle, border: `1px solid ${T.goldBorder}`,
          borderRadius: 8, padding: "14px 18px",
          display: "flex", gap: 10, alignItems: "flex-start",
        }}>
          <Sparkles style={{ width: 15, height: 15, color: T.gold, flexShrink: 0, marginTop: 1 }} />
          <div>
            <p style={{ ...S.label, color: T.gold, marginBottom: 4 }}>Resumo de Hospitalidade (IA)</p>
            <p style={{ color: T.textPrimary, fontSize: 13, margin: 0, lineHeight: 1.6 }}>
              {perfil.hospitality_summary}
            </p>
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>

        <Section icon={Clock} title="Horários Preferidos">
          <TagList items={perfil.appointment_periods} />
        </Section>

        <Section icon={Coffee} title="Preferências de Bebidas">
          <TagList items={perfil.beverage_preferences} />
        </Section>

        <Section icon={Leaf} title="Preferências Alimentares">
          <TagList items={perfil.food_preferences} />
          {perfil.dietary_restrictions?.length > 0 && (
            <div style={{ marginTop: 10 }}>
              <p style={{ ...S.label, fontSize: 11, marginBottom: 6, display: "flex", alignItems: "center", gap: 4 }}>
                <AlertTriangle style={{ width: 11, height: 11 }} /> Restrições
              </p>
              <TagList items={perfil.dietary_restrictions} />
            </div>
          )}
        </Section>

        <Section icon={Wind} title="Preferências de Ambiente">
          <TagList items={perfil.environment_preferences} />
        </Section>

        <Section icon={Thermometer} title="Temperatura">
          <p style={{ color: T.textPrimary, fontSize: 13, margin: 0 }}>
            {perfil.temperature_preference || "—"}
          </p>
        </Section>

        <Section icon={Sparkles} title="Aromas">
          <p style={{ fontSize: 12, color: T.textMuted, marginBottom: 8 }}>
            Aprecia aromas: <span style={{ color: perfil.likes_aromas ? T.gold : T.textMuted, fontWeight: 600 }}>
              {perfil.likes_aromas ? "Sim" : "Não"}
            </span>
          </p>
          {perfil.likes_aromas && <TagList items={perfil.aroma_preferences} />}
        </Section>

        <Section icon={MessageCircle} title="Estilo de Atendimento">
          <p style={{ color: T.textPrimary, fontSize: 13, margin: 0 }}>
            {perfil.service_style || "—"}
          </p>
        </Section>

      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>

        <Section icon={FileText} title="LGPD">
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <Field label="Consentimento" value={perfil.lgpd_consent ? "✓ Aceito" : "Não registrado"} />
            <Field label="Data" value={perfil.lgpd_consent_date ? new Date(perfil.lgpd_consent_date).toLocaleDateString("pt-BR") : null} />
            <Field label="Versão" value={perfil.lgpd_consent_version} />
          </div>
        </Section>

        <Section icon={Globe} title="Origem do Formulário">
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <Field label="Fonte" value={perfil.form_source} />
            <Field label="URL de Origem" value={perfil.url_origem} />
            <Field label="Dispositivo" value={perfil.dispositivo} />
            <Field label="Navegador" value={perfil.navegador} />
          </div>
        </Section>

      </div>

      <p style={{ ...S.pageSubtitle, fontSize: 11, textAlign: "right" }}>
        Subm. ID: {perfil.submission_id || "—"} · CRM Status: {perfil.crm_status || "—"}
      </p>
    </div>
  );
}