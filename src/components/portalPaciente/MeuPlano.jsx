import React, { useEffect, useState } from "react";
import { T, portalApi, whatsappLink, WHATSAPP_MESSAGES } from "./portalConfig";
import { Loader2, CalendarDays, ChevronRight, MessageCircle } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function MeuPlano({ token, whatsappNumber, onNavigate }) {
  const [treatments, setTreatments] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    portalApi("plano", { token })
      .then(d => setTreatments(d.treatments || []))
      .catch(() => setTreatments([]))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return <CenterLoader />;
  if (!treatments || treatments.length === 0) {
    return (
      <Section title="Meu plano" subtitle="Acompanhamento do seu tratamento">
        <div className="rounded-2xl p-8 text-center" style={{ background: T.card, border: `1px solid ${T.border}` }}>
          <SparklesMuted />
          <p className="text-sm mt-3" style={{ color: T.muted }}>Seu plano está sendo preparado pela equipe.</p>
          <a href={whatsappLink(whatsappNumber, WHATSAPP_MESSAGES.plano)} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 mt-5 px-5 py-2.5 rounded-lg text-sm font-medium"
            style={{ background: T.goldSoft, border: `1px solid ${T.gold}40`, color: T.gold }}>
            <MessageCircle className="h-4 w-4" /> Falar com a equipe
          </a>
        </div>
      </Section>
    );
  }

  return (
    <Section title="Meu plano" subtitle="Acompanhamento do seu tratamento">
      <div className="space-y-4">
        {treatments.map(t => (
          <div key={t.id} className="rounded-2xl p-5" style={{ background: T.card, border: `1px solid ${T.border}` }}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-base font-medium" style={{ color: T.text }}>{t.protocolo_nome}</p>
              <StatusBadge status={t.status} />
            </div>
            {t.patient_friendly_description && (
              <p className="text-sm leading-relaxed mb-3" style={{ color: T.muted }}>{t.patient_friendly_description}</p>
            )}
            {t.next_step_label && (
              <div className="flex items-center gap-2 text-sm mb-3" style={{ color: T.gold }}>
                <ChevronRight className="h-4 w-4" />
                <span>Próxima etapa: {t.next_step_label}</span>
              </div>
            )}
            {t.next_step_date && (
              <div className="flex items-center gap-2 text-xs mb-4" style={{ color: T.muted }}>
                <CalendarDays className="h-3.5 w-3.5" />
                <span>Retorno sugerido: {format(parseISO(t.next_step_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</span>
              </div>
            )}
            <div className="flex gap-2 pt-3 border-t" style={{ borderColor: T.border }}>
              <button onClick={() => onNavigate("agenda")}
                className="flex-1 rounded-lg py-2.5 text-sm font-medium"
                style={{ background: T.gold, color: "#0A0A0A" }}>
                Agendar próxima etapa
              </button>
              <a href={whatsappLink(whatsappNumber, WHATSAPP_MESSAGES.plano)} target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center rounded-lg px-4"
                style={{ background: T.goldSoft, border: `1px solid ${T.gold}40` }}>
                <MessageCircle className="h-4 w-4" style={{ color: T.gold }} />
              </a>
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}

function Section({ title, subtitle, children }) {
  return (
    <div className="px-5 py-6">
      <div className="mb-5">
        <p className="text-[11px] uppercase tracking-widest mb-1" style={{ color: T.dim }}>{subtitle}</p>
        <h1 className="font-serif text-xl" style={{ color: T.text }}>{title}</h1>
      </div>
      {children}
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    indicado: { label: "Indicado", color: T.muted },
    agendado: { label: "Agendado", color: T.gold },
    realizado: { label: "Realizado", color: "#34d399" },
    cancelado: { label: "Cancelado", color: "#f87171" },
  };
  const s = map[status] || map.indicado;
  return <span className="text-[11px] px-2.5 py-1 rounded-full" style={{ background: `${s.color}15`, color: s.color, border: `1px solid ${s.color}30` }}>{s.label}</span>;
}

function CenterLoader() {
  return <div className="flex justify-center py-20"><Loader2 className="h-7 w-7 animate-spin" style={{ color: T.gold }} /></div>;
}
function SparklesMuted() {
  return <div className="inline-flex items-center justify-center rounded-full" style={{ width: 48, height: 48, background: T.surface }}><CalendarDays style={{ width: 20, height: 20, color: T.dim }} /></div>;
}