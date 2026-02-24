import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format, startOfMonth, endOfMonth, isToday, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Users,
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Clock,
  ArrowRight,
  Package,
  AlertTriangle,
  CheckCircle,
  XCircle,
  MessageSquare,
  Sparkles,
  Activity
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from "recharts";

const StatCard = ({ title, value, subtitle, icon: Icon, trend, trendValue, color = "gold" }) => (
  <Card className="bg-[#12121a] border-[#1e1e2a] overflow-hidden group hover:border-[#c9a55c]/30 transition-all duration-300">
    <CardContent className="p-6">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm text-gray-400 mb-1">{title}</p>
          <h3 className="text-3xl font-light tracking-tight text-white">{value}</h3>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
          {trend && (
            <div className={`flex items-center gap-1 mt-2 text-xs ${trend === "up" ? "text-emerald-400" : "text-red-400"}`}>
              {trend === "up" ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              <span>{trendValue}</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-xl bg-[#c9a55c]/10 group-hover:bg-[#c9a55c]/20 transition-colors`}>
          <Icon className="h-6 w-6 text-[#c9a55c]" />
        </div>
      </div>
    </CardContent>
  </Card>
);

const AppointmentCard = ({ appointment }) => {
  const statusColors = {
    scheduled: "bg-blue-500/20 text-blue-400",
    confirmed: "bg-emerald-500/20 text-emerald-400",
    in_progress: "bg-[#c9a55c]/20 text-[#c9a55c]",
    completed: "bg-gray-500/20 text-gray-400",
    cancelled: "bg-red-500/20 text-red-400",
    no_show: "bg-orange-500/20 text-orange-400"
  };

  return (
    <div className="flex items-center gap-4 p-4 bg-[#1a1a25] rounded-xl border border-[#1e1e2a] hover:border-[#c9a55c]/20 transition-all">
      <div className="text-center min-w-[60px]">
        <p className="text-2xl font-light text-white">
          {format(parseISO(appointment.start_time), "HH:mm")}
        </p>
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-white truncate">{appointment.patient_name}</p>
        <p className="text-sm text-gray-400 truncate">{appointment.procedure_name}</p>
      </div>
      <Badge className={statusColors[appointment.status] || statusColors.scheduled}>
        {appointment.status === "confirmed" ? "Confirmado" : 
         appointment.status === "scheduled" ? "Agendado" :
         appointment.status === "in_progress" ? "Em andamento" : appointment.status}
      </Badge>
    </div>
  );
};

export default function Dashboard() {
  const today = new Date();
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);

  const { data: appointments = [] } = useQuery({
    queryKey: ["appointments"],
    queryFn: () => base44.entities.Appointment.list("-start_time", 100),
  });

  const { data: patients = [] } = useQuery({
    queryKey: ["patients"],
    queryFn: () => base44.entities.Patient.list("-created_date", 1000),
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ["transactions"],
    queryFn: () => base44.entities.Transaction.list("-created_date", 1000),
  });

  const { data: leads = [] } = useQuery({
    queryKey: ["leads"],
    queryFn: () => base44.entities.Lead.list("-created_date", 100),
  });

  const { data: supplies = [] } = useQuery({
    queryKey: ["supplies"],
    queryFn: () => base44.entities.Supply.list(),
  });

  // Calculate stats
  const todayAppointments = appointments.filter(a => {
    try {
      return isToday(parseISO(a.start_time));
    } catch {
      return false;
    }
  });

  const monthlyIncome = transactions
    .filter(t => t.type === "income" && t.status === "paid")
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const monthlyExpenses = transactions
    .filter(t => t.type === "expense" && t.status === "paid")
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const lowStockItems = supplies.filter(s => s.current_stock <= (s.minimum_stock || 5));

  const newLeadsThisMonth = leads.filter(l => {
    try {
      const created = parseISO(l.created_date);
      return created >= monthStart && created <= monthEnd;
    } catch {
      return false;
    }
  });

  // Chart data
  const revenueData = [
    { name: "Jan", receita: 45000, despesas: 32000 },
    { name: "Fev", receita: 52000, despesas: 28000 },
    { name: "Mar", receita: 48000, despesas: 35000 },
    { name: "Abr", receita: 61000, despesas: 30000 },
    { name: "Mai", receita: 55000, despesas: 33000 },
    { name: "Jun", receita: 67000, despesas: 29000 },
  ];

  const procedureData = [
    { name: "Botox", value: 35, color: "#c9a55c" },
    { name: "Preenchimento", value: 25, color: "#e4c98a" },
    { name: "Skinbooster", value: 20, color: "#a17f3f" },
    { name: "Bioestimuladores", value: 15, color: "#8b6914" },
    { name: "Outros", value: 5, color: "#5c4a1f" },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif tracking-tight text-white">
            Bem-vinda, <span className="gold-text">Dra. Paloma</span>
          </h1>
          <p className="text-gray-400 mt-1">
            {format(today, "EEEE, d 'de' MMMM", { locale: ptBR })}
          </p>
        </div>
        <div className="flex gap-3">
          <Link to={createPageUrl("Agenda")}>
            <Button className="bg-[#c9a55c] hover:bg-[#a17f3f] text-black">
              <Calendar className="mr-2 h-4 w-4" />
              Nova Consulta
            </Button>
          </Link>
          <Link to={createPageUrl("Patients")}>
            <Button variant="outline" className="border-[#c9a55c]/30 text-[#c9a55c] hover:bg-[#c9a55c]/10">
              <Users className="mr-2 h-4 w-4" />
              Novo Paciente
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Agenda Hoje"
          value={todayAppointments.length}
          subtitle="consultas agendadas"
          icon={Calendar}
          trend="up"
          trendValue="+2 vs ontem"
        />
        <StatCard
          title="Pacientes Ativos"
          value={patients.filter(p => p.status === "active").length}
          subtitle="total no sistema"
          icon={Users}
          trend="up"
          trendValue="+5% este mês"
        />
        <StatCard
          title="Receita do Mês"
          value={`R$ ${monthlyIncome.toLocaleString("pt-BR")}`}
          subtitle={`Despesas: R$ ${monthlyExpenses.toLocaleString("pt-BR")}`}
          icon={DollarSign}
          trend={monthlyIncome > monthlyExpenses ? "up" : "down"}
          trendValue={`Lucro: R$ ${(monthlyIncome - monthlyExpenses).toLocaleString("pt-BR")}`}
        />
        <StatCard
          title="Leads Novos"
          value={newLeadsThisMonth.length}
          subtitle="este mês"
          icon={MessageSquare}
          trend="up"
          trendValue="+12% vs mês anterior"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <Card className="lg:col-span-2 bg-[#12121a] border-[#1e1e2a]">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-light text-white">Receita vs Despesas</CardTitle>
              <Badge variant="outline" className="border-[#c9a55c]/30 text-[#c9a55c]">
                Últimos 6 meses
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData}>
                  <defs>
                    <linearGradient id="colorReceita" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#c9a55c" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#c9a55c" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorDespesas" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2a" />
                  <XAxis dataKey="name" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" tickFormatter={(value) => `R$${value / 1000}k`} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#12121a",
                      border: "1px solid #1e1e2a",
                      borderRadius: "8px",
                      color: "#fff"
                    }}
                    formatter={(value) => [`R$ ${value.toLocaleString("pt-BR")}`, ""]}
                  />
                  <Area
                    type="monotone"
                    dataKey="receita"
                    stroke="#c9a55c"
                    fillOpacity={1}
                    fill="url(#colorReceita)"
                    name="Receita"
                  />
                  <Area
                    type="monotone"
                    dataKey="despesas"
                    stroke="#ef4444"
                    fillOpacity={1}
                    fill="url(#colorDespesas)"
                    name="Despesas"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Procedures Distribution */}
        <Card className="bg-[#12121a] border-[#1e1e2a]">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-light text-white">Procedimentos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={procedureData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {procedureData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#12121a",
                      border: "1px solid #1e1e2a",
                      borderRadius: "8px",
                      color: "#fff"
                    }}
                    formatter={(value) => [`${value}%`, ""]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2 mt-4">
              {procedureData.map((item) => (
                <div key={item.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-gray-300">{item.name}</span>
                  </div>
                  <span className="text-gray-400">{item.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Appointments */}
        <Card className="bg-[#12121a] border-[#1e1e2a]">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-light text-white flex items-center gap-2">
                <Clock className="h-5 w-5 text-[#c9a55c]" />
                Agenda de Hoje
              </CardTitle>
              <Link to={createPageUrl("Agenda")}>
                <Button variant="ghost" size="sm" className="text-[#c9a55c] hover:bg-[#c9a55c]/10">
                  Ver tudo
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {todayAppointments.length > 0 ? (
              <div className="space-y-3">
                {todayAppointments.slice(0, 5).map((apt) => (
                  <AppointmentCard key={apt.id} appointment={apt} />
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400">Nenhuma consulta agendada para hoje</p>
                <Link to={createPageUrl("Agenda")}>
                  <Button className="mt-4 bg-[#c9a55c]/20 text-[#c9a55c] hover:bg-[#c9a55c]/30">
                    Agendar Consulta
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Alerts & Quick Actions */}
        <div className="space-y-6">
          {/* Low Stock Alert */}
          {lowStockItems.length > 0 && (
            <Card className="bg-[#12121a] border-orange-500/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-light text-white flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-400" />
                  Estoque Baixo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {lowStockItems.slice(0, 3).map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-orange-500/10 rounded-lg border border-orange-500/20">
                      <div>
                        <p className="font-medium text-white">{item.name}</p>
                        <p className="text-xs text-gray-400">{item.brand}</p>
                      </div>
                      <Badge className="bg-orange-500/20 text-orange-400">
                        {item.current_stock} {item.unit}
                      </Badge>
                    </div>
                  ))}
                </div>
                <Link to={createPageUrl("Inventory")}>
                  <Button variant="outline" className="w-full mt-4 border-orange-500/30 text-orange-400 hover:bg-orange-500/10">
                    Gerenciar Estoque
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Recent Leads */}
          <Card className="bg-[#12121a] border-[#1e1e2a]">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-light text-white flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-[#c9a55c]" />
                  Leads Recentes
                </CardTitle>
                <Link to={createPageUrl("CRM")}>
                  <Button variant="ghost" size="sm" className="text-[#c9a55c] hover:bg-[#c9a55c]/10">
                    Ver CRM
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {leads.length > 0 ? (
                <div className="space-y-3">
                  {leads.slice(0, 4).map((lead) => (
                    <div key={lead.id} className="flex items-center justify-between p-3 bg-[#1a1a25] rounded-lg border border-[#1e1e2a]">
                      <div>
                        <p className="font-medium text-white">{lead.name}</p>
                        <p className="text-xs text-gray-400">{lead.interest?.join(", ") || "Interesse não definido"}</p>
                      </div>
                      <Badge className={
                        lead.priority === "vip" ? "bg-[#c9a55c]/20 text-[#c9a55c]" :
                        lead.priority === "high" ? "bg-red-500/20 text-red-400" :
                        "bg-gray-500/20 text-gray-400"
                      }>
                        {lead.priority === "vip" ? "VIP" : lead.pipeline_stage || "Novo"}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <MessageSquare className="h-12 w-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400">Nenhum lead cadastrado</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Performance Indicators */}
      <Card className="bg-[#12121a] border-[#1e1e2a]">
        <CardHeader>
          <CardTitle className="text-lg font-light text-white flex items-center gap-2">
            <Activity className="h-5 w-5 text-[#c9a55c]" />
            Indicadores de Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Taxa de Conversão</span>
                <span className="text-[#c9a55c]">72%</span>
              </div>
              <Progress value={72} className="h-2 bg-[#1e1e2a]" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Satisfação do Paciente</span>
                <span className="text-emerald-400">94%</span>
              </div>
              <Progress value={94} className="h-2 bg-[#1e1e2a]" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Meta Mensal</span>
                <span className="text-[#c9a55c]">85%</span>
              </div>
              <Progress value={85} className="h-2 bg-[#1e1e2a]" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}