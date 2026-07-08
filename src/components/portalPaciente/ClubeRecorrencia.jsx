import React, { useEffect, useState } from "react";
import { T, portalApi, openWhatsapp } from "./portalConfig";
import { Loader2, MessageCircle, CalendarCheck, ChevronRight } from "lucide-react";
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

  if (loading) return <div className="px-5 py-20 flex justify-center"><Loader2 className="h-7 w-7 animate-spin" style={{ color: T.wine }} /></div>;

  return (
    <div className="px-5 py-6">
      <div className="mb-5">
        <p className="text-[11px] uppercase tracking-widest mb-1" style={{ color: T.dim }}>Manutenção</p>
        <h1 className="text-xl" style={{ color: T.text, fontWeight: 600, letterSpacing: "-0.01em" }}>Clube de recorrência</h1>
        <p className="text-sm mt-2 leading-relaxed" style={{ color: T.muted }}>
          Seus benefícios contínuos e a manutenção dos seus resultados.
        </p>
      </div>

      {clubs.length === 0 ? (
        <div className="rounded-2xl p-8 text-center" style={{ background: T.card, border: `1px solid ${T.border}` }}>
          <p className="text-sm leading-relaxed" style={{ color: T.muted }}>
            Você ainda não participa de um clube de recorrência. Caso tenha interesse em um plano de manutenção, fale com a equipe.
          </p>
          <button onClick={() => openWhatsapp(token, "clube")}
            className="inline-flex items-center gap-2 mt-5 px-5 py-2.5 rounded-lg text-sm font-medium"
            style={{ background: T.wine, color: T.offWhite, border: "none" }}>
            <MessageCircle className="h-4 w-4" /> Falar com a equipe
          </button>
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
                  <p className="text-[10px] uppercase tracking-widest mb-3" style={{ color: T.wine }}>Benefícios</p>
                  <ul className="space-y-2">
                    {c.benefits.map((b, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm leading-relaxed" style={{ color: T.muted }}>
                        <span className="mt-1.5 flex-shrink-0 rounded-full" style={{ width: 4, height: 4, background: T.wine }} />
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
                <div className="px-5 py-3 flex items-center gap-2 text-sm" style={{ background: T.wineSoft, borderTop: `1px solid ${T.wine}40` }}>
                  <CalendarCheck className="h-4 w-4" style={{ color: T.wine }} />
                  <span style={{ color: T.text }}>Próxima manutenção: {format(parseISO(c.next_maintenance_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</span>
                </div>
              )}

              <div className="flex gap-2 p-4">
                <button onClick={() => onNavigate("agenda")}
                  className="flex-1 flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold"
                  style={{ background: T.wine, color: T.offWhite, border: "none" }}>
                  Agendar manutenção <ChevronRight className="h-4 w-4" />
                </button>
                <button onClick={() => openWhatsapp(token, "clube")}
                  className="flex items-center justify-center rounded-lg px-4" style={{ background: T.wineSoft, border: `1px solid ${T.wine}40` }}>
                  <MessageCircle className="h-4 w-4" style={{ color: T.wine }} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ClubeBadge({ status }) {
  const map = { ativo: { label: "Ativo", color: "#2e7d57" }, pausado: { label: "Pausado", color: T.wine }, encerrado: { label: "Encerrado", color: T.dim } };
  const s = map[status] || map.ativo;
  return <span className="text-[11px] px-2.5 py-1 rounded-full" style={{ background: `${s.color}15`, color: s.color, border: `1px solid ${s.color}30` }}>{s.label}</span>;
}