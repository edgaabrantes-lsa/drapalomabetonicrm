import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { T, S } from "@/lib/designTokens";
import {
  Coffee, Leaf, Wind, Thermometer, Sparkles, MessageCircle,
  Clock, AlertTriangle, FileText, Globe, Monitor
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

export default function DossiePerfilSensorial({ patient }) {
  const { data: perfis = [], isLoading } = useQuery({
    queryKey: ["perfilSensorial", patient.id],
    queryFn: () => base44.entities.PerfilSensorial.filter({ patient_id: patient.id }),
    enabled: !!patient.id,
  });

  const perfil = perfis[0];

  if (isLoading) {
    return (
      <div style={{ textAlign: "center", padding: "48px 0" }}>
        <p style={S.pageSubtitle}>Carregando perfil sensorial...</p>
      </div>
    );
  }

  if (!perfil) {
    return (
      <div style={{
        textAlign: "center", padding: "64px 24px",
        backgroundColor: T.card, border: `1px solid ${T.border}`,
        borderRadius: 8,
      }}>
        <Sparkles style={{ width: 32, height: 32, color: T.textMuted, margin: "0 auto 12px" }} />
        <p style={{ ...S.value, marginBottom: 6 }}>Nenhum perfil sensorial encontrado</p>
        <p style={{ ...S.pageSubtitle, fontSize: 13 }}>
          O perfil será preenchido automaticamente quando a paciente responder o formulário SensorlyFlow.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

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

        {/* Horários preferidos */}
        <Section icon={Clock} title="Horários Preferidos">
          <TagList items={perfil.appointment_periods} />
        </Section>

        {/* Bebidas */}
        <Section icon={Coffee} title="Preferências de Bebidas">
          <TagList items={perfil.beverage_preferences} />
        </Section>

        {/* Alimentação */}
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

        {/* Ambiente */}
        <Section icon={Wind} title="Preferências de Ambiente">
          <TagList items={perfil.environment_preferences} />
        </Section>

        {/* Temperatura */}
        <Section icon={Thermometer} title="Temperatura">
          <p style={{ color: T.textPrimary, fontSize: 13, margin: 0 }}>
            {perfil.temperature_preference || "—"}
          </p>
        </Section>

        {/* Aromas */}
        <Section icon={Sparkles} title="Aromas">
          <p style={{ fontSize: 12, color: T.textMuted, marginBottom: 8 }}>
            Aprecia aromas: <span style={{ color: perfil.likes_aromas ? T.gold : T.textMuted, fontWeight: 600 }}>
              {perfil.likes_aromas ? "Sim" : "Não"}
            </span>
          </p>
          {perfil.likes_aromas && <TagList items={perfil.aroma_preferences} />}
        </Section>

        {/* Estilo de atendimento */}
        <Section icon={MessageCircle} title="Estilo de Atendimento">
          <p style={{ color: T.textPrimary, fontSize: 13, margin: 0 }}>
            {perfil.service_style || "—"}
          </p>
        </Section>

      </div>

      {/* LGPD + Metadados */}
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