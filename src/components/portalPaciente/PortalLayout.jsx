import React from "react";
import { T } from "./portalConfig";
import { Home, Calendar, TrendingUp, MessageCircle, Pencil } from "lucide-react";

const NAV = [
  { key: "home", label: "Início", icon: Home },
  { key: "plano", label: "Plano", icon: Pencil },
  { key: "agenda", label: "Agenda", icon: Calendar },
  { key: "evolucao", label: "Evolução", icon: TrendingUp },
];

export default function PortalLayout({ patient, section, onNavigate, children, whatsappUrl }) {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: T.bg, color: T.text, fontFamily: "'Inter', system-ui, sans-serif" }}>
      <header className="sticky top-0 z-30 flex items-center justify-between px-5 py-3"
        style={{ background: "rgba(10,10,10,0.92)", backdropFilter: "blur(16px)", borderBottom: `1px solid ${T.border}` }}>
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center justify-center rounded-full flex-shrink-0"
            style={{ width: 36, height: 36, background: T.goldSoft, border: `1px solid ${T.gold}40` }}>
            <span className="text-sm" style={{ color: T.gold, fontWeight: 600 }}>P</span>
          </div>
          <div className="min-w-0">
            <p className="text-[10px] uppercase truncate" style={{ color: T.dim, letterSpacing: "0.12em" }}>Jornada da Beleza Natural</p>
            <p className="text-sm truncate" style={{ color: T.text, fontWeight: 500 }}>{patient?.full_name || "Bem-vinda"}</p>
          </div>
        </div>
        <a href={whatsappUrl} target="_blank" rel="noopener noreferrer"
          className="flex items-center justify-center rounded-full transition-opacity hover:opacity-80 flex-shrink-0"
          style={{ width: 40, height: 40, background: T.goldSoft, border: `1px solid ${T.gold}40` }} title="Falar no WhatsApp">
          <MessageCircle style={{ width: 16, height: 16, color: T.gold }} />
        </a>
      </header>

      <main className="flex-1 overflow-y-auto pb-24" style={{ maxWidth: 720, width: "100%", margin: "0 auto" }}>
        {children}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-30 flex"
        style={{ background: "rgba(10,10,10,0.95)", backdropFilter: "blur(20px)", borderTop: `1px solid ${T.border}`, maxWidth: 720, margin: "0 auto" }}>
        {NAV.map(({ key, label, icon: Icon }) => {
          const active = section === key;
          return (
            <button key={key} onClick={() => onNavigate(key)}
              className="flex-1 flex flex-col items-center gap-1 py-3 transition-colors"
              style={{ color: active ? T.gold : T.dim }}>
              <Icon style={{ width: 18, height: 18 }} />
              <span className="text-[10px]" style={{ fontWeight: 500 }}>{label}</span>
            </button>
          );
        })}
        <a href={whatsappUrl} target="_blank" rel="noopener noreferrer"
          className="flex-1 flex flex-col items-center gap-1 py-3" style={{ color: T.dim }} title="WhatsApp">
          <MessageCircle style={{ width: 18, height: 18 }} />
          <span className="text-[10px]" style={{ fontWeight: 500 }}>WhatsApp</span>
        </a>
      </nav>
    </div>
  );
}