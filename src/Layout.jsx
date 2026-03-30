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
  Sparkles,
  ClipboardList,
  Calculator,
  Bell,
  Search
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
  { name: "Agenda", href: "Agenda", icon: Calendar },
  { name: "Pacientes", href: "Patients", icon: Users },
  { name: "Prontuários", href: "MedicalRecords", icon: FileText },
  { name: "Protocolos", href: "Protocols", icon: ClipboardList },
  { name: "Estoque", href: "Inventory", icon: Package },
  { name: "Financeiro", href: "Financial", icon: DollarSign },
  { name: "Precificação", href: "Pricing", icon: Calculator },
  { name: "Análise Facial IA", href: "FacialAnalysis", icon: Sparkles },
  { name: "Triagem IA", href: "Intake", icon: ClipboardList },
  { name: "Configurações", href: "Settings", icon: Settings },
];

export default function Layout({ children, currentPageName }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F9F9F7", color: "#121212" }}>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-[#121212] border-b border-[#222]">
        <div className="flex items-center justify-between px-4 py-3">
          <Button variant="ghost" size="icon" onClick={() => setMobileOpen(true)} className="text-white hover:bg-white/10">
            <Menu className="h-5 w-5" />
          </Button>
          <img
            src="https://media.base44.com/images/public/699dbefdfbf6a591f90b6e3b/775d12811_WhatsApp_Image_2026-03-30_at_170145-removebg-preview.png"
            alt="Paloma Betoni"
            style={{ height: 36, objectFit: "contain", filter: "brightness(0) invert(1)" }}
          />
          <Avatar className="h-8 w-8 border border-[#C5A059]/40">
            <AvatarFallback className="bg-[#C5A059]/20 text-[#C5A059] text-xs">
              {user?.full_name?.[0] || "P"}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/50" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar — preta por contraste intencional */}
      <aside className={cn(
        "fixed top-0 left-0 z-50 h-full bg-[#121212] border-r border-[#222] transition-all duration-300 flex flex-col",
        collapsed ? "w-[72px]" : "w-64",
        mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>

        {/* Logo */}
        <div className="h-[140px] flex items-center justify-between px-5 border-b border-[#222] flex-shrink-0">
          {!collapsed && (
            <img
              src="https://media.base44.com/images/public/699dbefdfbf6a591f90b6e3b/775d12811_WhatsApp_Image_2026-03-30_at_170145-removebg-preview.png"
              alt="Paloma Betoni"
              style={{
                height: 110,
                objectFit: "contain",
                objectPosition: "left center",
                filter: "brightness(0) invert(1)",
                maxWidth: 220,
              }}
            />
          )}
          <Button
            variant="ghost" size="icon"
            onClick={() => { setCollapsed(!collapsed); setMobileOpen(false); }}
            className="hidden lg:flex text-[#555] hover:text-[#C5A059] hover:bg-white/5 ml-auto"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setMobileOpen(false)} className="lg:hidden text-[#555] hover:text-white">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
          {navigation.map((item) => {
            const isActive = currentPageName === item.href;
            return (
              <Link
                key={item.name}
                to={createPageUrl(item.href)}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-sm transition-all duration-200 group border-l-2",
                  isActive
                    ? "border-[#C5A059] bg-white/5 text-white"
                    : "border-transparent text-[#777] hover:text-white hover:bg-white/4 hover:border-[#444]"
                )}
              >
                <item.icon className={cn("h-4 w-4 flex-shrink-0 transition-colors", isActive ? "text-[#C5A059]" : "text-current")} />
                {!collapsed && (
                  <span className="text-sm font-light tracking-wide">{item.name}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Section */}
        <div className="flex-shrink-0 p-3 border-t border-[#222]">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start gap-3 hover:bg-white/5 text-[#999] hover:text-white rounded-sm",
                  collapsed && "justify-center px-0"
                )}
              >
                <Avatar className="h-8 w-8 border border-[#C5A059]/30 flex-shrink-0">
                  <AvatarFallback className="bg-[#C5A059]/15 text-[#C5A059] text-xs">
                    {user?.full_name?.[0] || "P"}
                  </AvatarFallback>
                </Avatar>
                {!collapsed && (
                  <div className="text-left min-w-0">
                    <p className="text-xs font-medium text-white truncate">{user?.full_name || "Dra. Paloma"}</p>
                    <p className="text-[10px] text-[#555] tracking-wider uppercase">{user?.role || "admin"}</p>
                  </div>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52 bg-[#1a1a1a] border-[#2a2a2a] text-white">
              <DropdownMenuItem className="hover:bg-white/5 cursor-pointer text-[#aaa] hover:text-white text-sm">
                <UserCircle className="mr-2 h-4 w-4" /> Meu Perfil
              </DropdownMenuItem>
              <DropdownMenuItem className="hover:bg-white/5 cursor-pointer text-[#aaa] hover:text-white text-sm">
                <Settings className="mr-2 h-4 w-4" /> Configurações
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-[#2a2a2a]" />
              <DropdownMenuItem onClick={() => base44.auth.logout()} className="hover:bg-red-500/10 text-red-400 cursor-pointer text-sm">
                <LogOut className="mr-2 h-4 w-4" /> Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* Main Content */}
      <main className={cn(
        "min-h-screen transition-all duration-300 pt-14 lg:pt-0",
        collapsed ? "lg:pl-[72px]" : "lg:pl-64"
      )}>

        {/* Top Bar */}
        <header className="hidden lg:flex h-[100px] items-center justify-between px-8 border-b border-[#EEEEEE] bg-white sticky top-0 z-40">
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#BBBBBB]" />
            <Input
              placeholder="Buscar pacientes, procedimentos..."
              className="pl-10 bg-[#F9F9F7] border-[#EEEEEE] text-[#121212] placeholder:text-[#BBBBBB] text-sm h-9 rounded-sm focus:border-[#121212]"
            />
          </div>
          <div className="absolute left-1/2 -translate-x-1/2">
            <img
              src="https://media.base44.com/images/public/699dbefdfbf6a591f90b6e3b/775d12811_WhatsApp_Image_2026-03-30_at_170145-removebg-preview.png"
              alt="Paloma Betoni"
              style={{ height: 80, objectFit: "contain" }}
            />
          </div>
          <div className="flex items-center gap-5">
            <Button variant="ghost" size="icon" className="relative text-[#999] hover:text-[#121212] hover:bg-[#F9F9F7] rounded-sm">
              <Bell className="h-4 w-4" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-[#C5A059] rounded-full" />
            </Button>
            <div className="h-6 w-px bg-[#EEEEEE]" />
            <div className="text-right">
              <p className="text-[10px] text-[#BBBBBB] tracking-[0.1em] uppercase">Bem-vinda</p>
              <p className="text-sm font-medium text-[#121212]" style={{ fontFamily: "'Playfair Display', serif" }}>
                {user?.full_name || "Dra. Paloma Betoni"}
              </p>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-4 lg:p-8 bg-[#F9F9F7] min-h-[calc(100vh-72px)]">
          {children}
        </div>
      </main>
    </div>
  );
}