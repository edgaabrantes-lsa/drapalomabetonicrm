import React, { useEffect, useState } from "react";
import { T, portalApi, whatsappLink, WHATSAPP_MESSAGES } from "./portalConfig";
import { Loader2, Award, MessageCircle, CalendarCheck, ChevronRight } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function ClubeRecorrencia({ token, whatsappNumber, onNavigate }) {
  const [clubs, setClubs] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    portalApi("clube", { token })
      .then(d => setClubs(d.clubs || []))
      .catch(() => setClubs([]))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return <div className="px-5 py-20 flex justify-center"><Loader2 className="h-7 w-7 animate-spin" style={{ color: T.gold }} /></div>;

  return (
    <div className="px-5 py-6">
      <div className="mb-5">
        <p className="text-[11px] uppercase tracking-widest mb-1" style={{ color: T.dim }}>Manutenção</p>
        <h1 className="font-serif text-xl" style={{ color: T.text }}>Clube de recorrência</h1>
        <p className="text-sm mt-2 leading-relaxed" style={{ color: T.muted }}>
          Seus benefícios contínuos e a manutenção dos seus resultados.
        </p>
      </div>

      {clubs.length === 0 ? (
        <div className="rounded-2xl p-8 text-center" style={{ background: T.card, border: `1px solid ${T.border}` }}>
          <Award className="mx-auto mb-3" style={{ width: 28, height: 28, color: T.dim }} />
          <p className="text-sm" style={{ color: T.muted }}>Você ainda não participa de um clube de manutenção.</p>
          <a href={whatsappLink(whatsappNumber, WHATSAPP_MESSAGES.consultora)} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 mt-5 px-5 py-2.5 rounded-lg text-sm font-medium"
            style={{ background: T.goldSoft, border: `1px solid ${T.gold}40`, color: T.gold }}>
            <MessageCircle className="h-4 w-4" /> Saber mais
          </a>
        </div>
      ) : (
        <div className="space-y-4">
          {clubs.map(c => (
            <div key={c.id} className="rounded-2xl overflow-hidden" style={{ background: T.card, border: `1px solid ${T.border}` }}>
              <div className="p-5" style={{ borderBottom: `1px solid ${T.border}` }}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-base font-medium" style={{ color: T.text }}>{c.club_name}</p>
                  <ClubeBadge status={c.status} />
                </div>
                {c.notes && <p className="text-sm leading-relaxed" style={{ color: T.muted }}>{c.notes}</p>}
              </div>

              {c.benefits && c.benefits.length > 0 && (
                <div className="p-5">
                  <p className="text-[10px] uppercase tracking-widest mb-3" style={{ color: T.gold }}>Benefícios</p>
                  <ul className="space-y-2">
                    {c.benefits.map((b, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm leading-relaxed" style={{ color: T.muted }}>
                        <span className="mt-1.5 flex-shrink-0 rounded-full" style={{ width: 4, height: 4, background: T.gold }} />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {c.recommended_procedures && c.recommended_procedures.length > 0 && (
                <div className="px-5 pb-4">
                  <p className="text-[10px] uppercase tracking-widest mb-2" style={{ color: T.dim }}>Procedimentos recomendados</p>
                  <div className="flex flex-wrap gap-2">
                    {c.recommended_procedures.map((p, i) => (
                      <span key={i} className="text-xs px-2.5 py-1 rounded-full" style={{ background: T.surface, border: `1px solid ${T.border}`, color: T.muted }}>{p}</span>
                    ))}
                  </div>
                </div>
              )}

              {c.next_maintenance_date && (
                <div className="px-5 py-3 flex items-center gap-2 text-sm" style={{ background: T.goldSoft, borderTop: `1px solid ${T.gold}40` }}>
                  <CalendarCheck className="h-4 w-4" style={{ color: T.gold }} />
                  <span style={{ color: T.text }}>Próxima manutenção: {format(parseISO(c.next_maintenance_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</span>
                </div>
              )}

              <div className="flex gap-2 p-4">
                <button onClick={() => onNavigate("agenda")}
                  className="flex-1 flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold"
                  style={{ background: T.gold, color: "#0A0A0A" }}>
                  Agendar manutenção <ChevronRight className="h-4 w-4" />
                </button>
                <a href={whatsappLink(whatsappNumber, WHATSAPP_MESSAGES.manutencao)} target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center rounded-lg px-4" style={{ background: T.goldSoft, border: `1px solid ${T.gold}40` }}>
                  <MessageCircle className="h-4 w-4" style={{ color: T.gold }} />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ClubeBadge({ status }) {
  const map = { ativo: { label: "Ativo", color: "#34d399" }, pausado: { label: "Pausado", color: T.gold }, encerrado: { label: "Encerrado", color: T.dim } };
  const s = map[status] || map.ativo;
  return <span className="text-[11px] px-2.5 py-1 rounded-full" style={{ background: `${s.color}15`, color: s.color, border: `1px solid ${s.color}30` }}>{s.label}</span>;
}