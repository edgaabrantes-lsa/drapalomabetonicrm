import React, { useState, useEffect } from "react";
import { T, portalApi, openWhatsapp } from "./portalConfig";
import { PROCEDIMENTOS_GUIAS } from "./cuidadosData";
import { ChevronRight, MessageCircle, Camera, ChevronLeft, Clock, Heart } from "lucide-react";

export default function CuidadosPosProcedimento({ token, whatsappNumber, onNavigate }) {
  const [selected, setSelected] = useState(null);

  if (selected) {
    return <GuideDetail guide={selected} onBack={() => setSelected(null)} whatsappNumber={whatsappNumber} onNavigate={onNavigate} token={token} />;
  }

  return (
    <div className="px-5 py-6">
      <div className="mb-5">
        <p className="text-[11px] uppercase tracking-widest mb-1" style={{ color: T.dim }}>Orientações</p>
        <h1 className="font-serif text-xl" style={{ color: T.text }}>Cuidados pós-procedimento</h1>
        <p className="text-sm mt-2 leading-relaxed" style={{ color: T.muted }}>
          Selecione seu procedimento para acessar as orientações personalizadas de cada fase.
        </p>
      </div>

      <div className="space-y-2.5">
        {PROCEDIMENTOS_GUIAS.map(g => (
          <button key={g.id} onClick={() => setSelected(g)}
            className="w-full flex items-center justify-between rounded-2xl p-4 text-left transition-all hover:scale-[1.01]"
            style={{ background: T.card, border: `1px solid ${T.border}` }}>
            <div className="min-w-0">
              <p className="text-sm font-medium" style={{ color: T.text }}>{g.nome}</p>
              <p className="text-xs mt-0.5 leading-relaxed truncate" style={{ color: T.muted }}>{g.intro}</p>
            </div>
            <ChevronRight className="flex-shrink-0 ml-3" style={{ width: 18, height: 18, color: T.dim }} />
          </button>
        ))}
      </div>
    </div>
  );
}

function GuideDetail({ guide, onBack, whatsappNumber, onNavigate, token }) {
  const sections = [
    { title: "Antes do procedimento", icon: Clock, items: guide.antes },
    { title: "Nas primeiras horas", icon: Heart, items: guide.primeiras_horas },
    { title: "Primeiras 24 horas", icon: Heart, items: guide.primeiras_24h },
    { title: "Primeiros 7 dias", icon: Heart, items: guide.primeiros_7_dias },
    { title: "O que é normal sentir", icon: Heart, items: guide.normal_sentir },
    { title: "O que deve ser evitado", icon: Heart, items: guide.evitar },
    { title: "Quando entrar em contato", icon: Heart, items: guide.quando_contato },
  ];

  return (
    <div className="px-5 py-6">
      <button onClick={onBack} className="flex items-center gap-1 text-sm mb-4" style={{ color: T.muted }}>
        <ChevronLeft className="h-4 w-4" /> Voltar
      </button>
      <div className="mb-6">
        <p className="text-[11px] uppercase tracking-widest mb-1" style={{ color: T.dim }}>Guia de cuidados</p>
        <h1 className="font-serif text-xl mb-2" style={{ color: T.text }}>{guide.nome}</h1>
        <p className="text-sm leading-relaxed" style={{ color: T.muted }}>{guide.intro}</p>
      </div>

      <div className="space-y-4">
        {sections.map((s, i) => (
          <div key={i} className="rounded-2xl p-4" style={{ background: T.card, border: `1px solid ${T.border}` }}>
            <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: T.gold }}>{s.title}</p>
            <ul className="space-y-2">
              {s.items.map((item, j) => (
                <li key={j} className="flex items-start gap-2.5 text-sm leading-relaxed" style={{ color: T.muted }}>
                  <span className="mt-1.5 flex-shrink-0 rounded-full" style={{ width: 4, height: 4, background: T.gold }} />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}

        {/* Quando agendar retorno */}
        <div className="rounded-2xl p-4" style={{ background: T.goldSoft, border: `1px solid ${T.gold}40` }}>
          <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: T.gold }}>Quando agendar retorno</p>
          <p className="text-sm leading-relaxed" style={{ color: T.text }}>{guide.quando_retorno}</p>
        </div>
      </div>

      {/* Ações */}
      <div className="grid grid-cols-1 gap-2.5 mt-6">
        <button onClick={() => openWhatsapp(token, "cuidados")}
          className="flex items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-medium"
          style={{ background: T.goldSoft, border: `1px solid ${T.gold}40`, color: T.gold }}>
          <MessageCircle className="h-4 w-4" /> Tenho uma dúvida
        </button>
        <button onClick={() => onNavigate("evolucao")}
          className="flex items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-semibold"
          style={{ background: T.gold, color: T.offWhite }}>
          <Camera className="h-4 w-4" /> Enviar foto de evolução
        </button>
        <button onClick={() => openWhatsapp(token, "cuidados")}
          className="flex items-center justify-center gap-2 rounded-2xl py-3 text-sm font-medium"
          style={{ background: T.surface, border: `1px solid ${T.border}`, color: T.muted }}>
          <MessageCircle className="h-4 w-4" /> Falar no WhatsApp
        </button>
      </div>
    </div>
  );
}