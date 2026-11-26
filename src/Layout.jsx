import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { usePermissions } from "@/lib/PermissionsContext";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import BuscaPacientes from "@/components/layout/BuscaPacientes";
import ThemeToggle from "@/components/layout/ThemeToggle";

const navigation = [
  // Clínico
  { name: "Dashboard",           href: "Dashboard",          group: "clinico" },
  { name: "Pacientes",           href: "Patients",            group: "clinico" },
  { name: "Anamnese de Pacientes", href: "AnamnesePacientes", group: "clinico" },
  { name: "Dossiê da Paciente",  href: "DossiePatient",      group: "clinico" },
  { name: "Agenda",              href: "Agenda",             group: "clinico" },
  { name: "Prontuários",         href: "MedicalRecords",     group: "clinico" },
  { name: "Análise Facial",      href: "FacialAnalysis",     group: "clinico" },
  { name: "Antes e Depois",      href: "BeforeAfterIA",      group: "clinico" },
  { name: "Protocolos",          href: "Protocols",          group: "clinico" },
  { name: "Protocolos e Procedimentos",  href: "ProtocolosPremium",  group: "clinico" },
  { name: "Planos de Assinatura",href: "PlanosAssinatura",   group: "clinico" },
  { name: "Financeiro",          href: "Financial",          group: "clinico" },
  { name: "DRE da Clínica",      href: "DREClinica",         group: "clinico" },
  { name: "Gestão Financeira",   href: "GestaoFinanceira",   group: "clinico" },
  { name: "Analytics Agenda",   href: "AnalyticsAgenda",    group: "comercial" },
  { name: "Search Console",     href: "SearchConsoleAgenda", group: "comercial" },
  { name: "Estoque",             href: "Inventory",          group: "clinico" },
  // Comercial
  { name: "CRM",                 href: "CRM",                group: "comercial" },
  { name: "Bate-papo",           href: "Chat",               group: "comercial" },
  { name: "Triagem IA",          href: "Intake",             group: "comercial" },
  // Administrativo
  { name: "GitHub Monitor",      href: "GitHubMonitor",      group: "admin" },
  { name: "Mesclar Pacientes",   href: "MesclarPacientes",   group: "admin" },
  { name: "Auditoria Duplicid.", href: "AuditoriaDuplicidades", group: "admin" },
  { name: "Governança Doc.",     href: "Governanca",         group: "admin" },
  { name: "Vigilância Sanitária",href: "VigilanciaPage",     group: "admin" },
  { name: "Config. da Clínica",  href: "ClinicSettingsPage", group: "admin" },
  { name: "Configurações",       href: "Settings",           group: "admin" },
  { name: "Usuários",            href: "UsuariosPermissoes",  group: "admin" },
  { name: "Portal da Paciente",  href: "PortalAdmin",        group: "admin" },
];

const SIDEBAR_W_OPEN   = 240;
const SIDEBAR_W_CLOSED = 60;
const TOPBAR_H         = 56;

const SIDEBAR_LINE = "rgba(255,255,255,0.12)";


export default function Layout({ children, currentPageName }) {
  const [collapsed, setCollapsed]   = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser]             = useState(null);
  const [isLgScreen, setIsLgScreen] = useState(window.innerWidth >= 1024);
  const { hasMenu } = usePermissions();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  useEffect(() => {
    const handler = () => setIsLgScreen(window.innerWidth >= 1024);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  const sidebarWidth = collapsed ? SIDEBAR_W_CLOSED : SIDEBAR_W_OPEN;

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--color-bg-primary)", color: "var(--color-text-primary)", overflowX: "hidden" }}>

      {/* ── Mobile top bar ── */}
      <div
        className="lg:hidden fixed top-0 left-0 right-0 z-50 glass-topbar"
        style={{ borderBottom: "1px solid var(--color-border)" }}
      >
        <div className="flex items-center justify-between px-4" style={{ height: 52 }}>
          <button
            onClick={() => setMobileOpen(true)}
            className="flex items-center justify-center rounded-md transition-colors"
            style={{ color: "var(--color-text-secondary)", padding: "6px 10px", fontSize: 13, fontWeight: 500, border: "none", background: "transparent", cursor: "pointer" }}
          >
            Menu
          </button>

          <div style={{ backgroundColor: "var(--sidebar-bg)", borderRadius: 6, padding: "2px 10px" }}>
            <img
              src="https://media.base44.com/images/public/699dbefdfbf6a591f90b6e3b/87c946eb1_ChatGPT_Image_8_de_mai_de_2026__14_52_26-removebg-preview.png"
              alt="Paloma Betoni"
              style={{ height: 32, objectFit: "contain", display: "block" }}
            />
          </div>

          <Avatar className="h-8 w-8" style={{ border: "1px solid var(--color-border)" }}>
            <AvatarFallback
              style={{ backgroundColor: "var(--color-accent-subtle)", color: "var(--color-brand)", fontSize: 12, fontWeight: 600 }}
            >
              {user?.full_name?.[0] || "P"}
            </AvatarFallback>
          </Avatar>
        </div>

        {/* Busca de pacientes — mobile */}
        <div style={{ padding: "0 12px 10px" }}>
          <BuscaPacientes variant="mobile" />
        </div>
      </div>

      {/* ── Mobile overlay ── */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40"
          style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ══ SIDEBAR ══ */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-full flex flex-col transition-[width,transform] duration-200 ease-in-out",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
        style={{
          width: mobileOpen ? "min(240px, 85vw)" : (isLgScreen ? sidebarWidth : SIDEBAR_W_OPEN),
          backgroundColor: "var(--sidebar-bg)",
          borderRight: "1px solid rgba(255,255,255,0.10)",
        }}
      >
        {/* Logo / Brand */}
        <div
          className="flex items-center flex-shrink-0 relative"
          style={{
            height: 100,
            borderBottom: `1px solid ${SIDEBAR_LINE}`,
            padding: "0 16px",
            overflow: "visible",
          }}
        >
          {(!collapsed || !isLgScreen) ? (
            <img
              src="https://media.base44.com/images/public/699dbefdfbf6a591f90b6e3b/409f9cb09_ChatGPT_Image_8_de_mai_de_2026__14_52_21-removebg-preview.png"
              alt="Paloma Betoni"
              style={{ height: 90, objectFit: "contain", width: "100%", maxWidth: 200 }}
            />
          ) : (
            <span style={{
              fontFamily: "'Inter', system-ui, sans-serif",
              fontSize: 15,
              fontWeight: 600,
              letterSpacing: "0.08em",
              color: "rgba(255,255,255,0.92)",
            }}>
              PB
            </span>
          )}

          {/* Botão fechar — mobile */}
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden flex items-center justify-center rounded-md transition-colors"
            style={{ width: 28, height: 28, color: "rgba(255,255,255,0.6)", fontSize: 18, fontWeight: 300, border: "none", background: "transparent", cursor: "pointer", flexShrink: 0 }}
          >
            ×
          </button>
        </div>

        {/* Botão recolher / expandir — desktop */}
        <button
          onClick={() => { setCollapsed(!collapsed); setMobileOpen(false); }}
          className="hidden lg:flex items-center transition-colors flex-shrink-0"
          title={collapsed ? "Expandir menu" : "Recolher menu"}
          aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
          style={{
            width: "100%",
            padding: collapsed ? "10px 0" : "10px 16px",
            justifyContent: collapsed ? "center" : "flex-start",
            gap: 8,
            background: "transparent",
            border: "none",
            borderBottom: `1px solid ${SIDEBAR_LINE}`,
            color: "rgba(255,255,255,0.7)",
            fontFamily: "'Inter', system-ui, sans-serif",
            fontSize: 12,
            fontWeight: 500,
            cursor: "pointer",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "#FFFFFF";
            e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.07)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "rgba(255,255,255,0.7)";
            e.currentTarget.style.backgroundColor = "transparent";
          }}
        >
          <span style={{ fontSize: 14, lineHeight: 1 }}>{collapsed ? "›" : "‹"}</span>
          {!collapsed && <span>Recolher menu</span>}
        </button>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto" style={{ padding: "8px 0" }}>
          {(() => {
            const groups = [
              { key: "clinico",   label: "Clínico" },
              { key: "comercial", label: "Comercial" },
              { key: "admin",     label: "Administrativo" },
            ];
            return groups.map((group) => {
              const items = navigation.filter(n => n.group === group.key && hasMenu(n.href));
              return (
                <div key={group.key}>
                  {!collapsed && (
                    <p style={{
                      fontSize: 10,
                      fontWeight: 600,
                      letterSpacing: "0.09em",
                      textTransform: "uppercase",
                      color: "rgba(255,255,255,0.42)",
                      padding: "12px 24px 4px",
                    }}>
                      {group.label}
                    </p>
                  )}
                  {items.map((item) => {
                    const isActive = currentPageName === item.href;
                    return (
                      <Link
                        key={item.name}
                        to={createPageUrl(item.href)}
                        onClick={() => setMobileOpen(false)}
                        title={collapsed ? item.name : undefined}
                        className="flex items-center transition-colors duration-150 relative group"
                        style={{
                          padding: collapsed ? "10px 0" : "9px 16px",
                          justifyContent: collapsed ? "center" : "flex-start",
                          gap: collapsed ? 0 : 10,
                          margin: "1px 8px",
                          borderRadius: 6,
                          backgroundColor: isActive ? "rgba(255,255,255,0.16)" : "transparent",
                          color: isActive ? "#FFFFFF" : "rgba(255,255,255,0.74)",
                          textDecoration: "none",
                        }}
                        onMouseEnter={(e) => {
                          if (!isActive) {
                            e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.08)";
                            e.currentTarget.style.color = "#FFFFFF";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isActive) {
                            e.currentTarget.style.backgroundColor = "transparent";
                            e.currentTarget.style.color = "rgba(255,255,255,0.74)";
                          }
                        }}
                      >
                        {!collapsed && (
                          <span style={{
                            fontSize: 13,
                            fontWeight: isActive ? 600 : 400,
                            letterSpacing: 0,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}>
                            {item.name}
                          </span>
                        )}
                        {collapsed && (
                          <span
                            className="absolute left-full ml-2 px-2 py-1 text-xs rounded-md pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 whitespace-nowrap z-50"
                            style={{ backgroundColor: "#4A0A18", border: "1px solid rgba(255,255,255,0.2)", color: "#FFFFFF", fontSize: 12 }}
                          >
                            {item.name}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              );
            });
          })()}
        </nav>

        {/* Alternador de tema — modo diurno / noturno */}
        <div style={{ borderTop: `1px solid ${SIDEBAR_LINE}`, flexShrink: 0 }}>
          <ThemeToggle compact={collapsed && isLgScreen} />
        </div>

        {/* User section */}
        <div style={{ borderTop: `1px solid ${SIDEBAR_LINE}`, padding: 8, flexShrink: 0 }}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="w-full flex items-center rounded-md transition-colors"
                style={{
                  padding: collapsed ? "8px 0" : "8px 10px",
                  justifyContent: collapsed ? "center" : "flex-start",
                  gap: 10,
                  cursor: "pointer",
                  border: "none",
                  background: "transparent",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.08)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
              >
                <Avatar
                  className="flex-shrink-0"
                  style={{ width: 28, height: 28, border: "1px solid rgba(255,255,255,0.3)" }}
                >
                  <AvatarFallback
                    style={{
                      backgroundColor: "rgba(255,255,255,0.16)",
                      color: "#FFFFFF",
                      fontSize: 11,
                      fontWeight: 600,
                    }}
                  >
                    {user?.full_name?.[0] || "P"}
                  </AvatarFallback>
                </Avatar>
                {!collapsed && (
                  <div className="text-left min-w-0">
                    <p style={{ fontSize: 13, fontWeight: 500, color: "#FFFFFF", truncate: true }}>
                      {user?.full_name || "Dra. Paloma"}
                    </p>
                    <p style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", letterSpacing: "0.04em" }}>
                      {user?.role === "admin" ? "Administrador" : (user?.role || "Usuário")}
                    </p>
                  </div>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-48"
              style={{
                backgroundColor: "var(--color-card)",
                borderColor: "var(--color-border)",
                borderRadius: 8,
              }}
            >
              <DropdownMenuItem
                className="cursor-pointer"
                style={{ color: "var(--color-text-secondary)", fontSize: 13 }}
              >
                Meu Perfil
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer"
                style={{ color: "var(--color-text-secondary)", fontSize: 13 }}
              >
                Configurações
              </DropdownMenuItem>
              <DropdownMenuSeparator style={{ backgroundColor: "var(--color-border)" }} />
              <DropdownMenuItem
                onClick={() => base44.auth.logout()}
                className="cursor-pointer"
                style={{ color: "#EF4444", fontSize: 13 }}
              >
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* ══ MAIN CONTENT ══ */}
      <main
        className="min-h-screen transition-[margin-left,width] duration-200 ease-in-out hidden-lg-override"
        style={isLgScreen ? {
          marginLeft: sidebarWidth,
          width: `calc(100vw - ${sidebarWidth}px)`,
          minWidth: 0,
          maxWidth: `calc(100vw - ${sidebarWidth}px)`,
        } : {
          marginLeft: 0,
          width: "100%",
          minWidth: 0,
        }}
      >
        {/* ── Top bar — desktop ── */}
        <header
          className="hidden lg:flex items-center justify-between sticky top-0 z-40 glass-topbar"
          style={{
            height: TOPBAR_H,
            borderBottom: "1px solid var(--color-border)",
            padding: "0 32px",
          }}
        >
          {/* Busca de pacientes */}
          <BuscaPacientes />

          {/* Right side */}
          <div className="flex items-center" style={{ gap: 16 }}>
            <div style={{ width: 1, height: 20, backgroundColor: "var(--color-border)" }} />

            <div className="text-right">
              <p style={{ fontSize: 11, color: "var(--color-text-muted)", letterSpacing: "0.07em", textTransform: "uppercase" }}>
                Bem-vinda
              </p>
              <p style={{ fontSize: 13, fontWeight: 500, color: "var(--color-text-primary)" }}>
                {user?.full_name || "Dra. Paloma Betoni"}
              </p>
            </div>
          </div>
        </header>

        {/* ── Page content ── */}
        <div
          className="min-h-[calc(100vh-56px)] w-full overflow-x-auto overflow-y-auto"
          style={{
            backgroundColor: "var(--color-bg-primary)",
            padding: "max(16px, 2vw)",
          }}
        >
          {/* Mobile top-bar spacer */}
          <div className="lg:hidden" style={{ height: 96 }} />
          <div className="min-w-0" style={{ minWidth: 0 }}>
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}