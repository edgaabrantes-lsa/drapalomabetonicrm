import React from "react";
import { T } from "./portalConfig";
import {
  Sparkles, Calendar, HeartPulse, TrendingUp, FileText, Award,
  BookOpen, MessageCircle, ChevronRight
} from "lucide-react";

const CARDS = [
  { key: "plano", label: "Meu plano", desc: "Acompanhe as etapas do seu tratamento.", icon: Sparkles },
  { key: "agenda", label: "Meus agendamentos", desc: "Veja e agende seus próximos cuidados.", icon: Calendar },
  { key: "cuidados", label: "Cuidados pós-procedimento", desc: "Orientações para cada fase do seu tratamento.", icon: HeartPulse },
  { key: "evolucao", label: "Minha evolução", desc: "Suas fotos e a jornada dos seus resultados.", icon: TrendingUp },
  { key: "termos", label: "Termos e consentimentos", desc: "Revise e aceite seus documentos.", icon: FileText },
  { key: "clube", label: "Clube de recorrência", desc: "Sua manutenção e seus benefícios.", icon: Award },
  { key: "biblioteca", label: "Biblioteca de conteúdos", desc: "Conteúdos para a sua beleza natural.", icon: BookOpen },
  { key: "falar", label: "Falar com a equipe", desc: "Atendimento concierge para você.", icon: MessageCircle },
];

export default function PortalHome({ patient, onNavigate }) {
  return (
    <div className="px-5 py-6">
      {/* Saudação */}
      <div className="mb-7">
        <p className="text-[11px] uppercase tracking-widest mb-1" style={{ color: T.dim }}>Sua jornada</p>
        <h1 className="font-serif text-2xl mb-2" style={{ color: T.text, letterSpacing: "0.02em" }}>
          Olá, {patient?.full_name?.split(" ")[0] || "Bem-vinda"}
        </h1>
        <p className="text-sm leading-relaxed" style={{ color: T.muted }}>
          Estamos aqui para cuidar de você em cada etapa. Escolha por onde deseja começar.
        </p>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {CARDS.map(({ key, label, desc, icon: Icon }) => (
          <button key={key} onClick={() => onNavigate(key)}
            className="group text-left rounded-2xl p-5 transition-all hover:scale-[1.01]"
            style={{ background: T.card, border: `1px solid ${T.border}` }}>
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center justify-center rounded-xl"
                style={{ width: 44, height: 44, background: T.goldSoft, border: `1px solid ${T.gold}30` }}>
                <Icon style={{ width: 18, height: 18, color: T.gold }} />
              </div>
              <ChevronRight className="opacity-30 group-hover:opacity-70 transition-opacity" style={{ width: 18, height: 18, color: T.muted }} />
            </div>
            <p className="text-sm font-medium mb-1" style={{ color: T.text }}>{label}</p>
            <p className="text-xs leading-relaxed" style={{ color: T.muted }}>{desc}</p>
          </button>
        ))}
      </div>
    </div>
  );
}