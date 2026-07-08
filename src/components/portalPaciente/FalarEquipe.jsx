import React, { useState } from "react";
import { T, portalApi, whatsappLink, WHATSAPP_MESSAGES } from "./portalConfig";
import { MessageCircle, ChevronRight, Loader2 } from "lucide-react";

const OPCOES = [
  { key: "duvida", label: "Tenho dúvida sobre meu procedimento", msg: WHATSAPP_MESSAGES.duvida },
  { key: "agendar", label: "Quero agendar", msg: WHATSAPP_MESSAGES.agendar },
  { key: "reagendar", label: "Quero reagendar", msg: WHATSAPP_MESSAGES.reagendar },
  { key: "foto", label: "Quero enviar foto", msg: WHATSAPP_MESSAGES.foto, navigate: "evolucao" },
  { key: "plano", label: "Quero falar sobre meu plano de tratamento", msg: WHATSAPP_MESSAGES.plano },
  { key: "valores", label: "Quero saber sobre valores", msg: WHATSAPP_MESSAGES.valores },
  { key: "consultora", label: "Quero falar com a consultora", msg: WHATSAPP_MESSAGES.consultora },
];

export default function FalarEquipe({ token, whatsappNumber, onNavigate }) {
  const [busy, setBusy] = useState(null);

  async function handle(op) {
    setBusy(op.key);
    try {
      await portalApi("falar", { token, motivo: op.label });
    } catch {}
    if (op.navigate) {
      onNavigate(op.navigate);
      setBusy(null);
      return;
    }
    window.open(whatsappLink(whatsappNumber, op.msg), "_blank", "noopener,noreferrer");
    setBusy(null);
  }

  return (
    <div className="px-5 py-6">
      <div className="mb-5">
        <p className="text-[11px] uppercase tracking-widest mb-1" style={{ color: T.dim }}>Atendimento concierge</p>
        <h1 className="font-serif text-xl" style={{ color: T.text }}>Falar com a equipe</h1>
        <p className="text-sm mt-2 leading-relaxed" style={{ color: T.muted }}>
          Escolha o motivo e fale conosco no WhatsApp. Sua mensagem chega com contexto da sua jornada.
        </p>
      </div>

      <div className="space-y-2.5">
        {OPCOES.map(op => (
          <button key={op.key} onClick={() => handle(op)} disabled={busy === op.key}
            className="w-full flex items-center justify-between rounded-2xl p-4 text-left transition-all hover:scale-[1.01] disabled:opacity-60"
            style={{ background: T.card, border: `1px solid ${T.border}` }}>
            <span className="text-sm font-medium" style={{ color: T.text }}>{op.label}</span>
            {busy === op.key
              ? <Loader2 className="h-4 w-4 animate-spin" style={{ color: T.gold }} />
              : <div className="flex items-center gap-2">
                  <MessageCircle style={{ width: 16, height: 16, color: T.gold }} />
                  <ChevronRight style={{ width: 16, height: 16, color: T.dim }} />
                </div>}
          </button>
        ))}
      </div>

      <p className="mt-6 text-center text-xs leading-relaxed" style={{ color: T.dim }}>
        Atendimento nos horários de funcionamento da clínica. Em emergências, ligue diretamente.
      </p>
    </div>
  );
}