import React from "react";
import { T, openWhatsapp } from "./portalConfig";
import { Home, Calendar, TrendingUp, MessageCircle, Pencil } from "lucide-react";

const NAV = [
  { key: "home", label: "Início", icon: Home },
  { key: "plano", label: "Plano", icon: Pencil },
  { key: "agenda", label: "Agenda", icon: Calendar },
  { key: "evolucao", label: "Evolução", icon: TrendingUp },
];

export default function PortalLayout({ patient, section, onNavigate, children, token }) {
  return (
    <div className="min-h-screen flex flex-col"
      style={{ background: T.bg, color: T.text, fontFamily: "'Inter', system-ui, sans-serif" }}>

      <header className="sticky top-0 z-30 flex items-center justify-between px-5 py-3"
        style={{ background: "rgba(250,248,243,0.92)", backdropFilter: "blur(16px)", borderBottom: `1px solid ${T.border}` }}>
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center justify-center rounded-full flex-shrink-0"
            style={{ width: 38, height: 38, background: T.wineSoft, border: `1px solid ${T.wine}40` }}>
            <span className="text-sm" style={{ color: T.wine, fontWeight: 600, fontFamily: "'Playfair Display', Georgia, serif" }}>P</span>
          </div>
          <div className="min-w-0">
            <p className="text-[10px] uppercase truncate" style={{ color: T.dim, letterSpacing: "0.14em" }}>Jornada da Beleza Natural</p>
            <p className="text-sm truncate" style={{ color: T.text, fontWeight: 500 }}>{patient?.full_name || "Bem-vinda"}</p>
          </div>
        </div>
        <button onClick={() => openWhatsapp(token, "topo")}
          className="flex items-center justify-center rounded-full transition-opacity hover:opacity-80 flex-shrink-0"
          style={{ width: 42, height: 42, background: T.wine, border: "none" }} title="Falar no WhatsApp">
          <MessageCircle style={{ width: 18, height: 18, color: T.offWhite }} />
        </button>
      </header>

      <main className="flex-1 overflow-y-auto pb-24" style={{ maxWidth: 720, width: "100%", margin: "0 auto" }}>
        {children}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-30 flex"
        style={{ background: "rgba(250,248,243,0.96)", backdropFilter: "blur(20px)", borderTop: `1px solid ${T.border}`, maxWidth: 720, margin: "0 auto" }}>
        {NAV.map(({ key, label, icon: Icon }) => {
          const active = section === key;
          return (
            <button key={key} onClick={() => onNavigate(key)}
              className="flex-1 flex flex-col items-center gap-1 py-3 transition-colors"
              style={{ color: active ? T.wine : T.dim, border: "none", background: "transparent" }}>
              <Icon style={{ width: 18, height: 18 }} />
              <span className="text-[10px]" style={{ fontWeight: active ? 600 : 500 }}>{label}</span>
            </button>
          );
        })}
        <button onClick={() => openWhatsapp(token, "menu")}
          className="flex-1 flex flex-col items-center gap-1 py-3" style={{ color: T.wine, border: "none", background: "transparent" }} title="WhatsApp">
          <MessageCircle style={{ width: 18, height: 18 }} />
          <span className="text-[10px]" style={{ fontWeight: 500 }}>WhatsApp</span>
        </button>
      </nav>
    </div>
  );
}