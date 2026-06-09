import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { T, S } from "@/lib/designTokens";
import { ShieldCheck, GitBranch, Clock, XSquare, FileSearch, Search } from "lucide-react";

import VersionamentoDocumentos  from "@/components/governanca/VersionamentoDocumentos";
import PoliticaRetornoAdmin     from "@/components/governanca/PoliticaRetornoAdmin";
import PoliticaCancelamentoAdmin from "@/components/governanca/PoliticaCancelamentoAdmin";
import AuditoriaDocumental      from "@/components/governanca/AuditoriaDocumental";

const ABAS = [
  { id: "auditoria",     label: "Auditoria Documental",       icon: ShieldCheck },
  { id: "versoes",       label: "Versionamento",              icon: GitBranch },
  { id: "retorno",       label: "Política de Retorno",        icon: Clock },
  { id: "cancelamento",  label: "Cancelamento e Reembolso",   icon: XSquare },
];

export default function Governanca() {
  const [activeTab, setActiveTab] = useState("auditoria");
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
  }, []);

  return (
    <div style={{ fontFamily: T.font }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <div style={{
          width: 42, height: 42, borderRadius: 10,
          backgroundColor: "rgba(200,169,106,0.1)",
          border: "1px solid rgba(200,169,106,0.25)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <ShieldCheck style={{ width: 20, height: 20, color: T.gold }} />
        </div>
        <div>
          <h1 style={{ ...S.pageTitle }}>Governança Documental</h1>
          <p style={S.pageSubtitle}>Controle jurídico, versionamento, auditoria e políticas operacionais</p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        backgroundColor: T.bgSecondary, border: `1px solid ${T.border}`,
        borderRadius: 10, padding: "0 16px", marginBottom: 24,
        overflowX: "auto",
      }}>
        <div style={{ display: "flex", minWidth: "max-content" }}>
          {ABAS.map(aba => {
            const isActive = activeTab === aba.id;
            const Icon = aba.icon;
            return (
              <button
                key={aba.id}
                onClick={() => setActiveTab(aba.id)}
                style={{
                  display: "flex", alignItems: "center", gap: 7,
                  padding: "13px 18px",
                  fontFamily: T.font, fontSize: 13,
                  fontWeight: isActive ? 500 : 400,
                  color: isActive ? T.textPrimary : T.textMuted,
                  background: "none", border: "none",
                  borderBottom: isActive ? `2px solid ${T.gold}` : "2px solid transparent",
                  cursor: "pointer", whiteSpace: "nowrap",
                  transition: "all 0.15s",
                }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.color = T.textSecondary; }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.color = T.textMuted; }}
              >
                <Icon style={{ width: 14, height: 14, color: isActive ? T.gold : "currentColor" }} />
                {aba.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Conteúdo */}
      <div>
        {activeTab === "auditoria"    && <AuditoriaDocumental />}
        {activeTab === "versoes"      && <VersionamentoDocumentos currentUser={currentUser} />}
        {activeTab === "retorno"      && <PoliticaRetornoAdmin />}
        {activeTab === "cancelamento" && <PoliticaCancelamentoAdmin />}
      </div>
    </div>
  );
}