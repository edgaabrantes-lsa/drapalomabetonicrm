import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { usePermissions } from "@/lib/PermissionsContext";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Calendar,
  FileText,
  Package,
  DollarSign,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  UserCircle,
  MessageSquare,
  MessagesSquare,
  ClipboardList,
  Calculator,
  Bell,
  Search,
  Eye,
  ScanFace,
  Layers,
  ShieldCheck,
  FolderOpen,
  GitBranch,
  BarChart3,
  Copy
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";

const navigation = [
  // Clínico
  { name: "Dashboard",           href: "Dashboard",          icon: LayoutDashboard, group: "clinico" },
  { name: "Pacientes",           href: "Patients",           icon: Users,            group: "clinico" },
  { name: "Dossiê da Paciente",  href: "DossiePatient",      icon: FolderOpen,       group: "clinico" },
  { name: "Agenda",              href: "Agenda",             icon: Calendar,         group: "clinico" },
  { name: "Prontuários",         href: "MedicalRecords",     icon: FileText,         group: "clinico" },
  { name: "Análise Facial",      href: "FacialAnalysis",     icon: Eye,              group: "clinico" },
  { name: "Antes e Depois",      href: "BeforeAfterIA",      icon: ScanFace,         group: "clinico" },
  { name: "Protocolos",          href: "Protocols",          icon: ClipboardList,    group: "clinico" },
  { name: "Protocolos Premium",  href: "ProtocolosPremium",  icon: Layers,           group: "clinico" },
  { name: "Financeiro",          href: "Financial",          icon: DollarSign,       group: "clinico" },
  { name: "DRE da Clínica",      href: "DREClinica",         icon: BarChart3,        group: "clinico" },
  { name: "Estoque",             href: "Inventory",          icon: Package,          group: "clinico" },
  // Comercial
  { name: "CRM",                 href: "CRM",                icon: MessageSquare,    group: "comercial" },
  { name: "Bate-papo",           href: "Chat",               icon: MessagesSquare,   group: "comercial" },
  { name: "Triagem IA",          href: "Intake",             icon: ClipboardList,    group: "comercial" },
  // Administrativo
  { name: "GitHub Monitor",      href: "GitHubMonitor",      icon: GitBranch,        group: "admin" },
  { name: "Mesclar Pacientes",   href: "MesclarPacientes",   icon: Copy,             group: "admin" },
  { name: "Auditoria Duplicid.", href: "AuditoriaDuplicidades", icon: ShieldCheck,    group: "admin" },
  { name: "Governança Doc.",     href: "Governanca",         icon: ShieldCheck,      group: "admin" },
  { name: "Vigilância Sanitária",href: "VigilanciaPage",     icon: ShieldCheck,      group: "admin" },
  { name: "Config. da Clínica",  href: "ClinicSettingsPage", icon: Settings,         group: "admin" },
  { name: "Configurações",       href: "Settings",           icon: Settings,         group: "admin" },
  { name: "Usuários",            href: "UsuariosPermissoes",  icon: Users,            group: "admin" },
  { name: "Portal da Paciente",  href: "PortalAdmin",        icon: Users,            group: "admin" },
];

const SIDEBAR_W_OPEN   = 240;
const SIDEBAR_W_CLOSED = 60;
const TOPBAR_H         = 56;

// Contexto para que páginas filhas saibam a largura da sidebar (opcional, não obrigatório)


export default function Layout({ children, currentPageName }) {
  const [collapsed, setCollapsed]   = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser]             = useState(null);
  const [isLgScreen, setIsLgScreen] = useState(window.innerWidth >= 1024);
  const { hasMenu } = usePermissions();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
    document.documentElement.classList.add("dark");
    document.documentElement.style.colorScheme = "dark";
  }, []);

  useEffect(() => {
    const handler = () => setIsLgScreen(window.innerWidth >= 1024);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  const sidebarWidth = collapsed ? SIDEBAR_W_CLOSED : SIDEBAR_W_OPEN;

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#0A0A0A", color: "#FFFFFF", overflowX: "hidden" }}>

      {/* ── Mobile top bar ── */}
      <div
        className="lg:hidden fixed top-0 left-0 right-0 z-50 glass-topbar"
        style={{ borderBottom: "1px solid #1E1E1E", height: 52 }}
      >
        <div className="flex items-center justify-between h-full px-4">
          <button
            onClick={() => setMobileOpen(true)}
            className="flex items-center justify-center w-9 h-9 rounded-md transition-colors hover:bg-white/5"
            style={{ color: "#B0B0B0" }}
          >
            <Menu className="h-5 w-5" />
          </button>

          <img
            src="https://media.base44.com/images/public/699dbefdfbf6a591f90b6e3b/87c946eb1_ChatGPT_Image_8_de_mai_de_2026__14_52_26-removebg-preview.png"
            alt="Paloma Betoni"
            style={{ height: 36, objectFit: "contain" }}
          />

          <Avatar className="h-8 w-8" style={{ border: "1px solid #2B2B2B" }}>
            <AvatarFallback
              style={{ backgroundColor: "rgba(200,169,106,0.1)", color: "#C8A96A", fontSize: 12, fontWeight: 600 }}
            >
              {user?.full_name?.[0] || "P"}
            </AvatarFallback>
          </Avatar>
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
          "fixed top-0 left-0 z-50 h-full flex flex-col glass-sidebar transition-[width,transform] duration-200 ease-in-out",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
        style={{
          width: mobileOpen ? "min(240px, 85vw)" : (isLgScreen ? sidebarWidth : SIDEBAR_W_OPEN),
          borderRight: "1px solid #1E1E1E",
        }}
      >
        {/* Logo / Brand */}
        <div
          className="flex items-center flex-shrink-0 relative"
          style={{
            height: 100,
            borderBottom: "1px solid #1E1E1E",
            padding: "0 16px",
            overflow: "visible",
          }}
        >
          {/* Logo — visível apenas quando aberto */}
          {!collapsed && (
            <img
              src="https://media.base44.com/images/public/699dbefdfbf6a591f90b6e3b/409f9cb09_ChatGPT_Image_8_de_mai_de_2026__14_52_21-removebg-preview.png"
              alt="Paloma Betoni"
              style={{ height: 90, objectFit: "contain", width: "100%", maxWidth: 200 }}
            />
          )}

          {/* Botão colapsar — desktop */}
          <button
            onClick={() => { setCollapsed(!collapsed); setMobileOpen(false); }}
            className="hidden lg:flex items-center justify-center rounded-md transition-colors hover:bg-white/5 ml-auto flex-shrink-0"
            style={{
              width: 28, height: 28,
              color: "#555555",
              position: collapsed ? "static" : "absolute",
              right: collapsed ? undefined : 12,
            }}
            title={collapsed ? "Expandir menu" : "Recolher menu"}
          >
            {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
          </button>

          {/* Botão fechar — mobile */}
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden flex items-center justify-center rounded-md transition-colors hover:bg-white/5 ml-auto"
            style={{ width: 28, height: 28, color: "#555555" }}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

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
                      color: "#3A3A3A",
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
                          backgroundColor: isActive ? "rgba(200,169,106,0.08)" : "transparent",
                          color: isActive ? "#FFFFFF" : "#666666",
                          textDecoration: "none",
                          borderLeft: isActive ? "2px solid #C8A96A" : "2px solid transparent",
                        }}
                        onMouseEnter={(e) => {
                          if (!isActive) {
                            e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.03)";
                            e.currentTarget.style.color = "#B0B0B0";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isActive) {
                            e.currentTarget.style.backgroundColor = "transparent";
                            e.currentTarget.style.color = "#666666";
                          }
                        }}
                      >
                        <item.icon
                          className="flex-shrink-0"
                          style={{ width: 15, height: 15, color: isActive ? "#C8A96A" : "currentColor" }}
                        />
                        {!collapsed && (
                          <span style={{
                            fontSize: 13,
                            fontWeight: isActive ? 500 : 400,
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
                            style={{ backgroundColor: "#1A1A1A", border: "1px solid #2B2B2B", color: "#FFFFFF", fontSize: 12 }}
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

        {/* User section */}
        <div style={{ borderTop: "1px solid #1E1E1E", padding: 8, flexShrink: 0 }}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="w-full flex items-center rounded-md transition-colors hover:bg-white/4"
                style={{
                  padding: collapsed ? "8px 0" : "8px 10px",
                  justifyContent: collapsed ? "center" : "flex-start",
                  gap: 10,
                  cursor: "pointer",
                  border: "none",
                  background: "transparent",
                }}
              >
                <Avatar
                  className="flex-shrink-0"
                  style={{ width: 28, height: 28, border: "1px solid #2B2B2B" }}
                >
                  <AvatarFallback
                    style={{
                      backgroundColor: "rgba(200,169,106,0.08)",
                      color: "#C8A96A",
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
                    <p style={{ fontSize: 11, color: "#555555", letterSpacing: "0.04em" }}>
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
                backgroundColor: "#1A1A1A",
                borderColor: "#2B2B2B",
                borderRadius: 8,
              }}
            >
              <DropdownMenuItem
                className="cursor-pointer"
                style={{ color: "#B0B0B0", fontSize: 13 }}
              >
                <UserCircle className="mr-2 h-4 w-4" /> Meu Perfil
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer"
                style={{ color: "#B0B0B0", fontSize: 13 }}
              >
                <Settings className="mr-2 h-4 w-4" /> Configurações
              </DropdownMenuItem>
              <DropdownMenuSeparator style={{ backgroundColor: "#2B2B2B" }} />
              <DropdownMenuItem
                onClick={() => base44.auth.logout()}
                className="cursor-pointer"
                style={{ color: "#EF4444", fontSize: 13 }}
              >
                <LogOut className="mr-2 h-4 w-4" /> Sair
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
            borderBottom: "1px solid #1E1E1E",
            padding: "0 32px",
          }}
        >
          {/* Search */}
          <div className="relative" style={{ width: 280 }}>
            <Search
              className="absolute top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ left: 10, width: 14, height: 14, color: "#555555" }}
            />
            <Input
              placeholder="Buscar pacientes..."
              style={{
                paddingLeft: 32,
                height: 34,
                backgroundColor: "#121212",
                borderColor: "#2B2B2B",
                color: "#FFFFFF",
                fontSize: 13,
                borderRadius: 6,
              }}
            />
          </div>

          {/* Logo central */}
          <div className="absolute left-1/2 -translate-x-1/2 flex items-center">
            <img
              src="https://media.base44.com/images/public/699dbefdfbf6a591f90b6e3b/87c946eb1_ChatGPT_Image_8_de_mai_de_2026__14_52_26-removebg-preview.png"
              alt="Paloma Betoni"
              style={{ height: 132, objectFit: "contain" }}
            />
          </div>

          {/* Right side */}
          <div className="flex items-center" style={{ gap: 16 }}>
            <button
              className="relative flex items-center justify-center rounded-md transition-colors hover:bg-white/5"
              style={{
                width: 34, height: 34,
                color: "#555555",
                border: "none",
                background: "transparent",
                cursor: "pointer",
              }}
            >
              <Bell style={{ width: 15, height: 15 }} />
              <span
                className="absolute"
                style={{
                  top: 8, right: 8,
                  width: 5, height: 5,
                  backgroundColor: "#C8A96A",
                  borderRadius: "50%",
                }}
              />
            </button>

            <div style={{ width: 1, height: 20, backgroundColor: "#1E1E1E" }} />

            <div className="text-right">
              <p style={{ fontSize: 11, color: "#555555", letterSpacing: "0.07em", textTransform: "uppercase" }}>
                Bem-vinda
              </p>
              <p style={{ fontSize: 13, fontWeight: 500, color: "#FFFFFF" }}>
                {user?.full_name || "Dra. Paloma Betoni"}
              </p>
            </div>
          </div>
        </header>

        {/* ── Page content ── */}
        <div
          className="min-h-[calc(100vh-56px)] w-full overflow-x-auto overflow-y-auto"
          style={{
            backgroundColor: "#0A0A0A",
            padding: "max(16px, 2vw)",
          }}
        >
          {/* Mobile top-bar spacer */}
          <div className="lg:hidden" style={{ height: 52 }} />
          <div className="min-w-0" style={{ minWidth: 0 }}>
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}