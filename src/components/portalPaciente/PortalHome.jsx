import React from "react";
import { T } from "./portalConfig";
import { ChevronRight } from "lucide-react";

const CARDS = [
  { key: "plano", label: "Meu plano", desc: "Acompanhe as etapas do seu tratamento." },
  { key: "agenda", label: "Meus agendamentos", desc: "Veja e agende seus próximos cuidados." },
  { key: "cuidados", label: "Cuidados pós-procedimento", desc: "Orientações para cada fase do seu tratamento." },
  { key: "evolucao", label: "Minha evolução", desc: "Suas fotos e a jornada dos seus resultados." },
  { key: "termos", label: "Termos e consentimentos", desc: "Revise e aceite seus documentos." },
  { key: "clube", label: "Clube de recorrência", desc: "Sua manutenção e seus benefícios." },
  { key: "biblioteca", label: "Biblioteca de conteúdos", desc: "Conteúdos para a sua beleza natural." },
  { key: "falar", label: "Falar com a equipe", desc: "Atendimento concierge para você." },
];

export default function PortalHome({ patient, onNavigate }) {
  const primeiroNome = patient?.full_name?.split(" ")[0] || "Bem-vinda";
  return (
    <div className="px-5 py-6">
      <div className="mb-7">
        <p className="text-[11px] uppercase tracking-widest mb-1" style={{ color: T.dim, letterSpacing: "0.12em" }}>Sua jornada</p>
        <h1 className="text-2xl mb-2" style={{ color: T.text, fontWeight: 600, letterSpacing: "-0.01em" }}>
          Olá, {primeiroNome}
        </h1>
        <p className="text-sm leading-relaxed" style={{ color: T.muted }}>
          Estamos aqui para cuidar de você em cada etapa. Escolha por onde deseja começar.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {CARDS.map(({ key, label, desc }) => (
          <button key={key} onClick={() => onNavigate(key)}
            className="group text-left rounded-2xl p-5 transition-all hover:scale-[1.01]"
            style={{ background: T.card, border: `1px solid ${T.border}` }}>
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-sm mb-1" style={{ color: T.text, fontWeight: 600 }}>{label}</p>
                <p className="text-xs leading-relaxed" style={{ color: T.muted }}>{desc}</p>
              </div>
              <ChevronRight className="opacity-30 group-hover:opacity-70 transition-opacity flex-shrink-0 ml-3"
                style={{ width: 18, height: 18, color: T.muted }} />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}