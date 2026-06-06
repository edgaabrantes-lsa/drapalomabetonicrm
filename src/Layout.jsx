import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
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
  FolderOpen
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
  { name: "Dashboard", href: "Dashboard", icon: LayoutDashboard },
  { name: "CRM", href: "CRM", icon: MessageSquare },
  { name: "Bate-papo", href: "Chat", icon: MessagesSquare },
  { name: "Agenda", href: "Agenda", icon: Calendar },
  { name: "Pacientes", href: "Patients", icon: Users },
  { name: "Prontuários", href: "MedicalRecords", icon: FileText },
  { name: "Protocolos", href: "Protocols", icon: ClipboardList },
  { name: "Protocolos Premium", href: "ProtocolosPremium", icon: Layers },
  { name: "Estoque", href: "Inventory", icon: Package },
  { name: "Financeiro", href: "Financial", icon: DollarSign },
  { name: "Precificação", href: "Pricing", icon: Calculator },
  { name: "Análise Facial", href: "FacialAnalysis", icon: Eye },
  { name: "Gerar Antes e Depois", href: "BeforeAfterIA", icon: ScanFace },
  { name: "Dossiê da Paciente", href: "DossiePatient", icon: FolderOpen },
  { name: "Vigilância Sanitária", href: "VigilanciaPage", icon: ShieldCheck },
  { name: "Triagem IA", href: "Intake", icon: ClipboardList },
  { name: "Configurações", href: "Settings", icon: Settings },
];

export default function Layout({ children, currentPageName }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
    // Força dark mode no html root
    document.documentElement.classList.add("dark");
    document.documentElement.style.colorScheme = "dark";
  }, []);

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#111620", color: "#E8EDF5" }}>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 border-b" style={{ backgroundColor: "#0D1119", borderColor: "#1E2535" }}>
        <div className="flex items-center justify-between px-4 py-2">
          <Button variant="ghost" size="icon" onClick={() => setMobileOpen(true)} className="text-[#E8EDF5] hover:bg-white/5">
            <Menu className="h-5 w-5" />
          </Button>
          <img
            src="https://media.base44.com/images/public/699dbefdfbf6a591f90b6e3b/87c946eb1_ChatGPT_Image_8_de_mai_de_2026__14_52_26-removebg-preview.png"
            alt="Paloma Betoni"
            style={{ height: 108, objectFit: "contain" }}
          />
          <Avatar className="h-8 w-8 border border-[#C5A059]/40">
            <AvatarFallback style={{ backgroundColor: "rgba(197,160,89,0.15)", color: "#C5A059" }} className="text-xs">
              {user?.full_name?.[0] || "P"}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/70" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed top-0 left-0 z-50 h-full border-r transition-all duration-300 flex flex-col",
        collapsed ? "w-[68px]" : "w-64",
        mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )} style={{ backgroundColor: "#0D1119", borderColor: "#1A2030" }}>

        {/* Logo */}
        <div className="h-[130px] flex items-center justify-between px-4 flex-shrink-0" style={{ borderBottom: "1px solid #1A2030" }}>
          {!collapsed && (
            <img
              src="https://media.base44.com/images/public/699dbefdfbf6a591f90b6e3b/409f9cb09_ChatGPT_Image_8_de_mai_de_2026__14_52_21-removebg-preview.png"
              alt="Paloma Betoni"
              style={{
                height: 330,
                objectFit: "contain",
                objectPosition: "center",
                maxWidth: 240,
              }}
            />
          )}
          <Button
            variant="ghost" size="icon"
            onClick={() => { setCollapsed(!collapsed); setMobileOpen(false); }}
            className="hidden lg:flex ml-auto hover:bg-white/5"
            style={{ color: "#4A5568" }}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setMobileOpen(false)} className="lg:hidden hover:bg-white/5" style={{ color: "#4A5568" }}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          {navigation.map((item) => {
            const isActive = currentPageName === item.href;
            return (
              <Link
                key={item.name}
                to={createPageUrl(item.href)}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-sm transition-all duration-150 border-l-2",
                  isActive
                    ? "border-[#C5A059] text-white"
                    : "border-transparent text-[#5A6478] hover:text-[#C8D0DF] hover:bg-white/4"
                )}
                style={isActive ? { backgroundColor: "rgba(197,160,89,0.08)" } : {}}
              >
                <item.icon className={cn("h-4 w-4 flex-shrink-0", isActive ? "text-[#C5A059]" : "")} />
                {!collapsed && (
                  <span className="text-sm font-light tracking-wide">{item.name}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Section */}
        <div className="flex-shrink-0 p-2" style={{ borderTop: "1px solid #1A2030" }}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start gap-3 rounded-sm hover:bg-white/5",
                  collapsed && "justify-center px-0"
                )}
                style={{ color: "#8A95AA" }}
              >
                <Avatar className="h-8 w-8 border flex-shrink-0" style={{ borderColor: "rgba(197,160,89,0.25)" }}>
                  <AvatarFallback style={{ backgroundColor: "rgba(197,160,89,0.12)", color: "#C5A059" }} className="text-xs">
                    {user?.full_name?.[0] || "P"}
                  </AvatarFallback>
                </Avatar>
                {!collapsed && (
                  <div className="text-left min-w-0">
                    <p className="text-xs font-medium truncate" style={{ color: "#E8EDF5" }}>{user?.full_name || "Dra. Paloma"}</p>
                    <p className="text-[10px] tracking-widest uppercase" style={{ color: "#4A5568" }}>{user?.role || "admin"}</p>
                  </div>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52" style={{ backgroundColor: "#171D29", borderColor: "#252D3E", color: "#E8EDF5" }}>
              <DropdownMenuItem className="cursor-pointer text-sm hover:bg-white/5" style={{ color: "#C8D0DF" }}>
                <UserCircle className="mr-2 h-4 w-4" /> Meu Perfil
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer text-sm hover:bg-white/5" style={{ color: "#C8D0DF" }}>
                <Settings className="mr-2 h-4 w-4" /> Configurações
              </DropdownMenuItem>
              <DropdownMenuSeparator style={{ backgroundColor: "#252D3E" }} />
              <DropdownMenuItem onClick={() => base44.auth.logout()} className="cursor-pointer text-sm" style={{ color: "#F87171" }}>
                <LogOut className="mr-2 h-4 w-4" /> Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* Main Content */}
      <main className={cn(
        "min-h-screen transition-all duration-300 pt-[108px] lg:pt-0",
        collapsed ? "lg:pl-[68px]" : "lg:pl-64"
      )}>

        {/* Top Bar */}
        <header className="hidden lg:flex h-[120px] items-center justify-between px-8 sticky top-0 z-40"
          style={{ backgroundColor: "#0F1521", borderBottom: "1px solid #1A2030" }}>

          <div className="absolute left-1/2 -translate-x-1/2">
            <img
              src="https://media.base44.com/images/public/699dbefdfbf6a591f90b6e3b/87c946eb1_ChatGPT_Image_8_de_mai_de_2026__14_52_26-removebg-preview.png"
              alt="Paloma Betoni"
              style={{ height: 110, objectFit: "contain" }}
            />
          </div>

          <div className="relative max-w-xs w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "#4A5568" }} />
            <Input
              placeholder="Buscar pacientes..."
              className="pl-10 h-9 rounded-sm text-sm"
              style={{
                backgroundColor: "#1A2030",
                borderColor: "#252D3E",
                color: "#C8D0DF",
              }}
            />
          </div>

          <div className="flex items-center gap-5">
            <Button variant="ghost" size="icon" className="relative rounded-sm hover:bg-white/5" style={{ color: "#5A6478" }}>
              <Bell className="h-4 w-4" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-[#C5A059] rounded-full" />
            </Button>
            <div className="h-6 w-px" style={{ backgroundColor: "#1E2535" }} />
            <div className="text-right">
              <p className="text-[10px] tracking-[0.12em] uppercase" style={{ color: "#4A5568" }}>Bem-vinda</p>
              <p className="text-sm font-medium" style={{ fontFamily: "'Playfair Display', serif", color: "#E8EDF5" }}>
                {user?.full_name || "Dra. Paloma Betoni"}
              </p>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-4 lg:p-8 min-h-[calc(100vh-120px)]" style={{ backgroundColor: "#111620" }}>
          {children}
        </div>
      </main>
    </div>
  );
}