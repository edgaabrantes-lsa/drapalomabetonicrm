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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

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
  const location = useLocation();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);
      } catch (e) {
        console.log("User not logged in");
      }
    };
    loadUser();
  }, []);

  const handleLogout = () => {
    base44.auth.logout();
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <style>{`
        :root {
          --gold: #c9a55c;
          --gold-light: #e4c98a;
          --gold-dark: #a17f3f;
          --dark-bg: #0a0a0f;
          --dark-surface: #12121a;
          --dark-border: #1e1e2a;
          --dark-hover: #1a1a25;
        }
        
        .gold-gradient {
          background: linear-gradient(135deg, var(--gold) 0%, var(--gold-light) 50%, var(--gold) 100%);
        }
        
        .gold-text {
          background: linear-gradient(135deg, var(--gold) 0%, var(--gold-light) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        .sidebar-item {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .sidebar-item:hover {
          background: linear-gradient(90deg, rgba(201, 165, 92, 0.1) 0%, transparent 100%);
          border-left-color: var(--gold);
        }
        
        .sidebar-item.active {
          background: linear-gradient(90deg, rgba(201, 165, 92, 0.15) 0%, transparent 100%);
          border-left-color: var(--gold);
        }
        
        .glass-effect {
          background: rgba(18, 18, 26, 0.8);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(201, 165, 92, 0.1);
        }
        
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        
        .shimmer {
          background: linear-gradient(90deg, transparent, rgba(201, 165, 92, 0.1), transparent);
          background-size: 200% 100%;
          animation: shimmer 3s infinite;
        }
      `}</style>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 glass-effect">
        <div className="flex items-center justify-between px-4 py-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileOpen(true)}
            className="text-[#c9a55c] hover:bg-[#c9a55c]/10"
          >
            <Menu className="h-6 w-6" />
          </Button>
          <div className="flex items-center gap-2">
            <span className="font-serif text-lg tracking-wide gold-text">Dra. Paloma Betoni</span>
          </div>
          <Avatar className="h-8 w-8 border border-[#c9a55c]/30">
            <AvatarFallback className="bg-[#c9a55c]/20 text-[#c9a55c]">
              {user?.full_name?.[0] || "U"}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-full bg-[#12121a] border-r border-[#1e1e2a] transition-all duration-300 ease-in-out",
          collapsed ? "w-20" : "w-72",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo */}
        <div className="h-20 flex items-center justify-between px-6 border-b border-[#1e1e2a]">
          {!collapsed && (
            <div className="flex items-center gap-3">
              <div>
                <h1 className="font-serif text-lg tracking-wide gold-text">Dra. Paloma</h1>
                <p className="text-xs text-gray-500 tracking-widest uppercase">Clínica Premium</p>
              </div>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setCollapsed(!collapsed);
              setMobileOpen(false);
            }}
            className="hidden lg:flex text-gray-400 hover:text-[#c9a55c] hover:bg-[#c9a55c]/10"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileOpen(false)}
            className="lg:hidden text-gray-400 hover:text-[#c9a55c]"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1 overflow-y-auto h-[calc(100%-10rem)]">
          {navigation.map((item) => {
            const isActive = currentPageName === item.href;
            return (
              <Link
                key={item.name}
                to={createPageUrl(item.href)}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "sidebar-item flex items-center gap-3 px-4 py-3 rounded-lg border-l-2 border-transparent",
                  isActive
                    ? "active text-[#c9a55c]"
                    : "text-gray-400 hover:text-white"
                )}
              >
                <item.icon className={cn("h-5 w-5 flex-shrink-0", isActive && "text-[#c9a55c]")} />
                {!collapsed && (
                  <span className="font-light tracking-wide">{item.name}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Section */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-[#1e1e2a]">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start gap-3 hover:bg-[#c9a55c]/10 text-gray-300",
                  collapsed && "justify-center px-0"
                )}
              >
                <Avatar className="h-9 w-9 border border-[#c9a55c]/30">
                  <AvatarFallback className="bg-[#c9a55c]/20 text-[#c9a55c] text-sm">
                    {user?.full_name?.[0] || "U"}
                  </AvatarFallback>
                </Avatar>
                {!collapsed && (
                  <div className="text-left">
                    <p className="text-sm font-medium">{user?.full_name || "Usuário"}</p>
                    <p className="text-xs text-gray-500">{user?.role || "admin"}</p>
                  </div>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-56 bg-[#12121a] border-[#1e1e2a] text-white"
            >
              <DropdownMenuItem className="hover:bg-[#c9a55c]/10 cursor-pointer">
                <UserCircle className="mr-2 h-4 w-4" />
                Meu Perfil
              </DropdownMenuItem>
              <DropdownMenuItem className="hover:bg-[#c9a55c]/10 cursor-pointer">
                <Settings className="mr-2 h-4 w-4" />
                Configurações
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-[#1e1e2a]" />
              <DropdownMenuItem
                onClick={handleLogout}
                className="hover:bg-red-500/10 text-red-400 cursor-pointer"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* Main Content */}
      <main
        className={cn(
          "min-h-screen transition-all duration-300 pt-16 lg:pt-0",
          collapsed ? "lg:pl-20" : "lg:pl-72"
        )}
      >
        {/* Top Bar */}
        <header className="hidden lg:flex h-20 items-center justify-between px-8 border-b border-[#1e1e2a] bg-[#12121a]/50 backdrop-blur-sm sticky top-0 z-40">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative max-w-md w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Buscar pacientes, procedimentos..."
                className="pl-10 bg-[#1a1a25] border-[#1e1e2a] text-white placeholder:text-gray-500 focus:border-[#c9a55c]/50 focus:ring-[#c9a55c]/20"
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="relative text-gray-400 hover:text-[#c9a55c] hover:bg-[#c9a55c]/10"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-[#c9a55c] rounded-full" />
            </Button>
            <div className="h-8 w-px bg-[#1e1e2a]" />
            <div className="text-right">
              <p className="text-sm text-gray-400">Bem-vinda,</p>
              <p className="text-sm font-medium text-white">{user?.full_name || "Dra. Paloma"}</p>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-4 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}