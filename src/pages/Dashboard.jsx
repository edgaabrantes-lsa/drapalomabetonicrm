import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format, startOfMonth, endOfMonth, isToday, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Users, Calendar, DollarSign, TrendingUp, TrendingDown,
  Clock, ArrowRight, Package, AlertTriangle, MessageSquare, Activity
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Cell,
  PieChart, Pie
} from "recharts";

// ── Tokens LSA ──────────────────────────────────────────────
const T = {
  pearl: "#F9F9F7",
  white: "#FFFFFF",
  onyx: "#121212",
  charcoal: "#757575",
  subtle: "#EEEEEE",
  gold: "#C5A059",
};

// ── KPI Card ────────────────────────────────────────────────
const StatCard = ({ title, value, subtitle, trend, trendValue, highlight = false }) => (
  <div style={{
    background: T.white,
    border: `1px solid ${highlight ? T.gold : T.subtle}`,
    borderBottom: `2px solid ${highlight ? T.gold : T.subtle}`,
    borderRadius: 4,
    padding: "28px 24px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
  }}>
    <p style={{
      fontFamily: "Inter, sans-serif",
      fontSize: 10,
      letterSpacing: "0.18em",
      textTransform: "uppercase",
      color: "#999",
      marginBottom: 12,
    }}>{title}</p>
    <p style={{
      fontFamily: "Inter, sans-serif",
      fontSize: 28,
      fontWeight: 300,
      color: T.onyx,
      lineHeight: 1.1,
    }}>{value}</p>
    {subtitle && (
      <p style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: T.charcoal, marginTop: 6 }}>
        {subtitle}
      </p>
    )}
    {trend && (
      <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 8 }}>
        {trend === "up"
          ? <TrendingUp size={11} color="#4CAF50" />
          : <TrendingDown size={11} color="#E53935" />}
        <span style={{ fontSize: 11, color: trend === "up" ? "#4CAF50" : "#E53935" }}>{trendValue}</span>
      </div>
    )}
  </div>
);

// ── Appointment Row (Dashboard mini-list) ───────────────────
const statusDot = {
  confirmed: T.onyx,
  scheduled: T.gold,
  in_progress: T.gold,
  completed: "#CCCCCC",
  cancelled: "#E53935",
  no_show: "#E53935",
};

const AppointmentRow = ({ appointment }) => (
  <div style={{
    display: "flex", alignItems: "center", gap: 16,
    padding: "14px 0",
    borderBottom: `1px solid ${T.subtle}`,
  }}>
    <span style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: "#BCBCBC", width: 40, flexShrink: 0 }}>
      {format(parseISO(appointment.start_time), "HH:mm")}
    </span>
    <span style={{
      width: 6, height: 6, borderRadius: "50%", flexShrink: 0,
      backgroundColor: statusDot[appointment.status] || T.gold,
    }} />
    <div style={{ flex: 1, minWidth: 0 }}>
      <p style={{
        fontFamily: "'Playfair Display', serif",
        fontStyle: "italic",
        fontSize: 15,
        color: T.onyx,
        whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
      }}>{appointment.patient_name}</p>
      <p style={{
        fontFamily: "Inter, sans-serif", fontSize: 10,
        letterSpacing: "0.1em", textTransform: "uppercase",
        color: T.charcoal, marginTop: 2,
      }}>{appointment.procedure_name}</p>
    </div>
    {appointment.price > 0 && (
      <span style={{ fontFamily: "Inter, sans-serif", fontSize: 13, fontWeight: 500, color: T.onyx, flexShrink: 0 }}>
        R$ {appointment.price.toLocaleString("pt-BR")}
      </span>
    )}
  </div>
);

const SectionTitle = ({ children, subtitle }) => (
  <div style={{ marginBottom: 20 }}>
    <h2 style={{
      fontFamily: "'Playfair Display', serif",
      fontSize: 20, fontWeight: 500,
      letterSpacing: "0.03em", color: T.onyx, margin: 0,
    }}>{children}</h2>
    {subtitle && <p style={{
      fontFamily: "Inter, sans-serif", fontSize: 10,
      letterSpacing: "0.12em", textTransform: "uppercase",
      color: T.charcoal, marginTop: 4,
    }}>{subtitle}</p>}
  </div>
);

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

  const todayAppointments = appointments.filter(a => {
    try { return isToday(parseISO(a.start_time)); } catch { return false; }
  });

  const monthlyIncome = transactions
    .filter(t => t.type === "income" && t.status === "paid")
    .reduce((sum, t) => sum + (t.amount || 0), 0);
  const monthlyExpenses = transactions
    .filter(t => t.type === "expense" && t.status === "paid")
    .reduce((sum, t) => sum + (t.amount || 0), 0);
  const netProfit = monthlyIncome - monthlyExpenses;
  const margin = monthlyIncome > 0 ? ((netProfit / monthlyIncome) * 100).toFixed(1) : "0.0";

  const lowStockItems = supplies.filter(s => s.current_stock <= (s.minimum_stock || 5));
  const newLeads = leads.filter(l => {
    try {
      const d = parseISO(l.created_date);
      return d >= monthStart && d <= monthEnd;
    } catch { return false; }
  });

  const revenueData = [
    { name: "Jan", receita: 45000, despesas: 32000 },
    { name: "Fev", receita: 52000, despesas: 28000 },
    { name: "Mar", receita: 48000, despesas: 35000 },
    { name: "Abr", receita: 61000, despesas: 30000 },
    { name: "Mai", receita: 55000, despesas: 33000 },
    { name: "Jun", receita: 67000, despesas: 29000 },
  ];

  const procedureData = [
    { name: "Botox", value: 35 },
    { name: "Preenchimento", value: 25 },
    { name: "Skinbooster", value: 20 },
    { name: "Bioestimuladores", value: 15 },
    { name: "Outros", value: 5 },
  ];
  const pieColors = ["#121212", "#333", "#555", "#888", "#BBBBB"];

  return (
    <div style={{ fontFamily: "Inter, sans-serif", maxWidth: 1400 }}>

      {/* ── Header ──────────────────────────────────────── */}
      <div style={{ marginBottom: 40, display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 32, fontWeight: 500,
            letterSpacing: "0.02em", color: T.onyx,
            margin: 0,
          }}>Performance Clínica</h1>
          <p style={{
            fontFamily: "Inter, sans-serif", fontSize: 12,
            letterSpacing: "0.12em", textTransform: "uppercase",
            color: T.charcoal, marginTop: 6,
          }}>Visão geral de margem e saúde de caixa</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <Link to={createPageUrl("Agenda")}>
            <button style={{
              background: T.onyx, color: "#fff",
              border: "none", borderRadius: 2,
              fontFamily: "Inter, sans-serif", fontSize: 10,
              letterSpacing: "0.12em", textTransform: "uppercase",
              padding: "11px 22px", cursor: "pointer",
            }}>
              Nova Consulta
            </button>
          </Link>
          <Link to={createPageUrl("Patients")}>
            <button style={{
              background: "transparent", color: T.onyx,
              border: `1px solid ${T.onyx}`, borderRadius: 2,
              fontFamily: "Inter, sans-serif", fontSize: 10,
              letterSpacing: "0.12em", textTransform: "uppercase",
              padding: "10px 22px", cursor: "pointer",
            }}>
              Novo Paciente
            </button>
          </Link>
        </div>
      </div>

      {/* ── KPIs ────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginBottom: 40 }}>
        <StatCard
          title="Agenda Hoje"
          value={todayAppointments.length}
          subtitle="consultas agendadas"
          trend="up" trendValue="+2 vs ontem"
        />
        <StatCard
          title="Pacientes Ativos"
          value={patients.filter(p => p.status === "active").length}
          subtitle="cadastros no sistema"
          trend="up" trendValue="+5% este mês"
        />
        <StatCard
          title="Lucro Líquido"
          value={`R$ ${netProfit.toLocaleString("pt-BR")}`}
          subtitle={`Receita: R$ ${monthlyIncome.toLocaleString("pt-BR")}`}
          trend={netProfit >= 0 ? "up" : "down"}
          trendValue={`Margem: ${margin}%`}
          highlight
        />
        <StatCard
          title="Margem Média por Cadeira"
          value={`${margin}%`}
          subtitle="margem líquida mensal"
          trend={parseFloat(margin) >= 30 ? "up" : "down"}
          trendValue={parseFloat(margin) >= 30 ? "Meta atingida" : "Abaixo da meta"}
        />
        <StatCard
          title="Leads Novos"
          value={newLeads.length}
          subtitle="captados este mês"
          trend="up" trendValue="+12% vs mês anterior"
        />
      </div>

      {/* ── Charts Row ──────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16, marginBottom: 40 }}>

        {/* Receita vs Despesas */}
        <div style={{ background: T.white, border: `1px solid ${T.subtle}`, borderRadius: 4, padding: 28, boxShadow: "0 4px 20px rgba(0,0,0,0.03)" }}>
          <SectionTitle subtitle="Últimos 6 meses">Receita vs Despesas</SectionTitle>
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="gReceita" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={T.onyx} stopOpacity={0.08} />
                    <stop offset="95%" stopColor={T.onyx} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gDespesas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#888" stopOpacity={0.06} />
                    <stop offset="95%" stopColor="#888" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={T.subtle} />
                <XAxis dataKey="name" tick={{ fontFamily: "Inter", fontSize: 10, fill: T.charcoal }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontFamily: "Inter", fontSize: 10, fill: T.charcoal }} axisLine={false} tickLine={false} tickFormatter={v => `R$${v / 1000}k`} />
                <Tooltip
                  contentStyle={{ background: T.white, border: `1px solid ${T.subtle}`, borderRadius: 4, fontFamily: "Inter", fontSize: 11 }}
                  formatter={v => [`R$ ${v.toLocaleString("pt-BR")}`, ""]}
                />
                <Area type="monotone" dataKey="receita" stroke={T.onyx} strokeWidth={1.5} fillOpacity={1} fill="url(#gReceita)" name="Receita" />
                <Area type="monotone" dataKey="despesas" stroke="#888" strokeWidth={1} fillOpacity={1} fill="url(#gDespesas)" name="Despesas" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Procedimentos Donut */}
        <div style={{ background: T.white, border: `1px solid ${T.subtle}`, borderRadius: 4, padding: 28, boxShadow: "0 4px 20px rgba(0,0,0,0.03)" }}>
          <SectionTitle subtitle="Distribuição">Procedimentos</SectionTitle>
          <div style={{ height: 180 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={procedureData} cx="50%" cy="50%" innerRadius={48} outerRadius={75} paddingAngle={2} dataKey="value">
                  {procedureData.map((_, i) => (
                    <Cell key={i} fill={pieColors[i % pieColors.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: T.white, border: `1px solid ${T.subtle}`, borderRadius: 4, fontFamily: "Inter", fontSize: 11 }} formatter={v => [`${v}%`, ""]} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ marginTop: 12 }}>
            {procedureData.map((item, i) => (
              <div key={item.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: pieColors[i], display: "inline-block" }} />
                  <span style={{ fontFamily: "Inter", fontSize: 11, color: T.charcoal }}>{item.name}</span>
                </div>
                <span style={{ fontFamily: "Inter", fontSize: 11, color: T.onyx, fontWeight: 500 }}>{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Bottom Row ──────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 40 }}>

        {/* Agenda de Hoje */}
        <div style={{ background: T.white, border: `1px solid ${T.subtle}`, borderRadius: 4, padding: 28, boxShadow: "0 4px 20px rgba(0,0,0,0.03)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
            <SectionTitle subtitle="Lista de hoje">Agenda de Hoje</SectionTitle>
            <Link to={createPageUrl("Agenda")}>
              <button style={{
                background: "none", border: "none", cursor: "pointer",
                fontFamily: "Inter", fontSize: 10,
                letterSpacing: "0.1em", textTransform: "uppercase",
                color: T.charcoal, display: "flex", alignItems: "center", gap: 4,
              }}>
                Ver tudo <ArrowRight size={11} />
              </button>
            </Link>
          </div>
          {todayAppointments.length > 0 ? (
            todayAppointments.slice(0, 6).map(apt => <AppointmentRow key={apt.id} appointment={apt} />)
          ) : (
            <div style={{ textAlign: "center", padding: "40px 0", color: T.charcoal }}>
              <Calendar size={28} style={{ margin: "0 auto 12px", opacity: 0.3 }} />
              <p style={{ fontFamily: "Inter", fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                Nenhuma consulta hoje
              </p>
            </div>
          )}
        </div>

        {/* Leads + Alertas */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {lowStockItems.length > 0 && (
            <div style={{
              background: T.white, border: `1px solid #FFCDD2`,
              borderLeft: "3px solid #E53935", borderRadius: 4,
              padding: 20, boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
            }}>
              <p style={{ fontFamily: "Inter", fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: "#E53935", marginBottom: 12 }}>
                Estoque crítico
              </p>
              {lowStockItems.slice(0, 3).map(item => (
                <div key={item.id} style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ fontFamily: "Inter", fontSize: 12, color: T.onyx }}>{item.name}</span>
                  <span style={{ fontFamily: "Inter", fontSize: 11, color: "#E53935" }}>{item.current_stock} {item.unit}</span>
                </div>
              ))}
            </div>
          )}

          <div style={{ background: T.white, border: `1px solid ${T.subtle}`, borderRadius: 4, padding: 24, boxShadow: "0 4px 20px rgba(0,0,0,0.03)", flex: 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
              <SectionTitle subtitle="Este mês">Leads Recentes</SectionTitle>
              <Link to={createPageUrl("CRM")}>
                <button style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "Inter", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: T.charcoal }}>
                  CRM →
                </button>
              </Link>
            </div>
            {leads.slice(0, 4).map(lead => (
              <div key={lead.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: `1px solid ${T.subtle}` }}>
                <span style={{
                  width: 6, height: 6, borderRadius: "50%", flexShrink: 0,
                  background: lead.priority === "vip" ? T.gold : lead.priority === "high" ? "#E53935" : "#DDD",
                }} />
                <div style={{ flex: 1 }}>
                  <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 13, color: T.onyx }}>{lead.name}</p>
                  <p style={{ fontFamily: "Inter", fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", color: T.charcoal }}>
                    {lead.interest?.slice(0, 2).join(", ") || "interesse a definir"}
                  </p>
                </div>
                {lead.priority === "vip" && (
                  <span style={{ fontFamily: "Inter", fontSize: 9, letterSpacing: "0.15em", textTransform: "uppercase", color: T.gold }}>VIP</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Performance Indicators ───────────────────────── */}
      <div style={{ background: T.white, border: `1px solid ${T.subtle}`, borderRadius: 4, padding: 28, boxShadow: "0 4px 20px rgba(0,0,0,0.03)" }}>
        <SectionTitle subtitle="Métricas de qualidade">Indicadores de Performance</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 32 }}>
          {[
            { label: "Taxa de Conversão", value: 72 },
            { label: "Satisfação do Paciente", value: 94 },
            { label: "Meta Mensal", value: 85 },
          ].map(item => (
            <div key={item.label}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontFamily: "Inter", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: T.charcoal }}>
                  {item.label}
                </span>
                <span style={{ fontFamily: "Inter", fontSize: 13, fontWeight: 500, color: T.onyx }}>{item.value}%</span>
              </div>
              <div style={{ height: 2, background: T.subtle, borderRadius: 1 }}>
                <div style={{ height: 2, width: `${item.value}%`, background: item.value >= 90 ? T.onyx : T.gold, borderRadius: 1 }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}