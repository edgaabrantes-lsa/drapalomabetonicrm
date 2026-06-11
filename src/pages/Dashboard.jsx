import React, { useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format, startOfMonth, endOfMonth, isToday, parseISO } from "date-fns";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import { T, S } from "@/lib/designTokens";

/* ── KPI Card ── */
const KpiCard = ({ title, value, subtitle, accent = false }) => (
  <div className="w-full min-w-0" style={{
    ...S.card,
    borderLeft: accent ? `2px solid ${T.gold}` : `1px solid ${T.border}`,
    borderRadius: 8,
  }}>
    <p className="text-[11px]" style={S.label}>{title}</p>
    <p className="text-[20px] md:text-[24px] font-semibold text-white mt-2">{value}</p>
    {subtitle && <p style={{ ...S.pageSubtitle, marginTop: 4 }}>{subtitle}</p>}
  </div>
);

/* ── Section block ── */
const Section = ({ title, children, action }) => (
  <div className="w-full min-w-0" style={S.card}>
    <div className="flex justify-between items-center mb-4">
      <p style={S.sectionTitle}>{title}</p>
      {action}
    </div>
    {children}
  </div>
);

/* ── Appointment row ── */
const AppRow = ({ apt }) => {
  let time = "—";
  try { time = format(parseISO(apt.start_time), "HH:mm"); } catch {}
  return (
    <div className="flex items-center gap-2 md:gap-4 py-2.5 border-b" style={{
      borderBottom: `1px solid ${T.borderLight}`,
    }}>
      <span className="text-[11px] md:text-[12px] flex-shrink-0 w-[40px] md:w-[45px]" style={{ ...S.label, letterSpacing: 0, textTransform: "none", color: T.textMuted }}>
        {time}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-medium text-white truncate">
          {apt.patient_name}
        </p>
        <p className="text-[11px] uppercase mt-0.5" style={{ ...S.label, marginTop: 2 }}>
          {apt.procedure_name || "—"}
        </p>
      </div>
      {apt.price > 0 && (
        <span className="text-[12px] md:text-[13px] font-medium text-white flex-shrink-0">
          R$ {apt.price.toLocaleString("pt-BR")}
        </span>
      )}
    </div>
  );
};

/* ── Chart tooltip ── */
const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 6, padding: "10px 14px" }}>
      <p style={{ ...S.label, marginBottom: 6 }}>{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ ...S.value, fontSize: 13, color: p.color }}>
          {p.name}: R$ {Number(p.value).toLocaleString("pt-BR")}
        </p>
      ))}
    </div>
  );
};

const PIE_COLORS = [T.gold, "#4A4A4A", "#666666", "#888888", "#AAAAAA"];

export default function Dashboard() {
  const today      = new Date();
  const monthStart = startOfMonth(today);
  const monthEnd   = endOfMonth(today);

  const { data: appointments = [] } = useQuery({ queryKey: ["appointments"], queryFn: () => base44.entities.Appointment.list("-start_time", 100) });
  const { data: patients = [] }     = useQuery({ queryKey: ["patients"],     queryFn: () => base44.entities.Patient.list("-created_date", 1000) });
  const { data: transactions = [] } = useQuery({ queryKey: ["transactions"], queryFn: () => base44.entities.Transaction.list("-created_date", 1000) });
  const { data: leads = [] }        = useQuery({ queryKey: ["leads"],        queryFn: () => base44.entities.Lead.list("-created_date", 100) });
  const { data: supplies = [] }     = useQuery({ queryKey: ["supplies"],     queryFn: () => base44.entities.Supply.list() });

  const todayApts   = appointments.filter(a => { try { return isToday(parseISO(a.start_time)); } catch { return false; } });
  const income      = transactions.filter(t => t.type === "income"  && t.status === "paid").reduce((s, t) => s + (t.amount || 0), 0);
  const expenses    = transactions.filter(t => t.type === "expense" && t.status === "paid").reduce((s, t) => s + (t.amount || 0), 0);
  const profit      = income - expenses;
  const margin      = income > 0 ? ((profit / income) * 100).toFixed(1) : "0.0";
  const lowStock    = supplies.filter(s => s.current_stock <= (s.minimum_stock || 5));
  const newLeads    = leads.filter(l => { try { const d = parseISO(l.created_date); return d >= monthStart && d <= monthEnd; } catch { return false; } });

  // Receita vs Despesas — últimos 6 meses a partir dos dados reais
  const revenueData = useMemo(() => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const label = d.toLocaleString("pt-BR", { month: "short" });
      const m = d.getMonth(); const y = d.getFullYear();
      const rec = transactions
        .filter(t => t.type === "income" && t.status === "paid" && t.payment_date && new Date(t.payment_date).getMonth() === m && new Date(t.payment_date).getFullYear() === y)
        .reduce((s, t) => s + (t.amount || 0), 0);
      const desp = transactions
        .filter(t => t.type === "expense" && t.status === "paid" && t.payment_date && new Date(t.payment_date).getMonth() === m && new Date(t.payment_date).getFullYear() === y)
        .reduce((s, t) => s + (t.amount || 0), 0);
      months.push({ mes: label, receita: rec, despesas: desp });
    }
    return months;
  }, [transactions, today]);

  // Procedimentos — distribuição real por categoria
  const procData = useMemo(() => {
    const counts = {};
    transactions.filter(t => t.type === "income" && t.category).forEach(t => {
      const k = t.category; counts[k] = (counts[k] || 0) + 1;
    });
    const total = Object.values(counts).reduce((s, v) => s + v, 0) || 1;
    const categoryLabels = { procedure: "Procedimento", protocol: "Protocolo", product: "Produto", other: "Outros" };
    return Object.entries(counts).slice(0, 5).map(([k, v]) => ({
      name: categoryLabels[k] || k,
      value: Math.round((v / total) * 100),
    }));
  }, [transactions]);

  // Indicadores reais
  const totalLeads = leads.length || 1;
  const convertedLeads = patients.filter(p => p.source !== undefined).length;
  const taxaConversao = Math.min(100, Math.round((convertedLeads / totalLeads) * 100));
  const paidTransactions = transactions.filter(t => t.status === "paid").length;
  const totalTransactions = transactions.length || 1;
  const taxaSucesso = Math.min(100, Math.round((paidTransactions / totalTransactions) * 100));
  const totalMonthIncome = transactions
    .filter(t => t.type === "income" && t.status === "paid" && t.payment_date && new Date(t.payment_date) >= monthStart && new Date(t.payment_date) <= monthEnd)
    .reduce((s, t) => s + (t.amount || 0), 0);
  const monthTarget = 50000;
  const metaMensal = Math.min(100, Math.round((totalMonthIncome / monthTarget) * 100));

  const indicators = [
    { label: "Taxa de Conversão",  value: taxaConversao },
    { label: "Taxa de Recebimento", value: taxaSucesso },
    { label: "Meta Mensal",         value: metaMensal },
  ];

  const fmt = (n) => `R$ ${n.toLocaleString("pt-BR")}`;

  return (
    <div className="w-full min-w-0" style={S.pageWrapper}>

      {/* ── Cabeçalho ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-6" style={{ marginBottom: 20 }}>
        <div className="min-w-0">
          <h1 className="text-2xl md:text-[24px] font-semibold tracking-tight text-white m-0">Dashboard</h1>
          <p style={{ ...S.pageSubtitle, marginTop: 4 }}>Visão geral de desempenho clínico e financeiro</p>
        </div>
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <Link to={createPageUrl("Agenda")} className="flex-1 md:flex-none" style={{ textDecoration: "none" }}>
            <button className="w-full md:w-auto text-[12px] md:text-[13px] px-3 md:px-4 py-2 h-[34px] md:h-[36px]" style={S.btnPrimary}>Nova Consulta</button>
          </Link>
          <Link to={createPageUrl("Patients")} className="flex-1 md:flex-none" style={{ textDecoration: "none" }}>
            <button className="w-full md:w-auto text-[12px] md:text-[13px] px-3 md:px-4 py-2 h-[34px] md:h-[36px]" style={S.btnGhost}>Novo Paciente</button>
          </Link>
        </div>
      </div>

      {/* ── KPIs ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
        <KpiCard title="Agenda Hoje" value={todayApts.length} subtitle="consultas marcadas" />
        <KpiCard title="Pacientes Ativos" value={patients.filter(p => p.status === "active").length} subtitle="cadastros no sistema" />
        <KpiCard title="Lucro Líquido" value={fmt(profit)} subtitle={`Receita: ${fmt(income)}`} accent />
        <KpiCard title="Margem" value={`${margin}%`} subtitle="margem líquida do período" />
        <KpiCard title="Leads do Mês" value={newLeads.length} subtitle="captados este mês" />
      </div>

      {/* ── Gráficos ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-4 mb-6">

        {/* Receita vs Despesas */}
        <div className="lg:col-span-2" style={S.card}>
          <p style={S.sectionTitle}>Receita vs Despesas</p>
          <p style={{ ...S.pageSubtitle, marginBottom: 16 }}>Últimos 6 meses</p>
          <div className="h-[200px] md:h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
                <defs>
                  <linearGradient id="gR" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={T.gold} stopOpacity={0.15} />
                    <stop offset="95%" stopColor={T.gold} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gD" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={T.textMuted} stopOpacity={0.1} />
                    <stop offset="95%" stopColor={T.textMuted} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="2 4" stroke={T.borderLight} vertical={false} />
                <XAxis dataKey="mes" tick={{ fontFamily: T.font, fontSize: 11, fill: T.textMuted }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontFamily: T.font, fontSize: 11, fill: T.textMuted }} axisLine={false} tickLine={false} tickFormatter={v => `${v/1000}k`} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="receita" name="Receita"  stroke={T.gold}      strokeWidth={1.5} fill="url(#gR)" />
                <Area type="monotone" dataKey="despesas" name="Despesas" stroke={T.textMuted} strokeWidth={1}   fill="url(#gD)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Procedimentos */}
        <div className="w-full min-w-0" style={S.card}>
          <p style={S.sectionTitle}>Procedimentos</p>
          <p style={{ ...S.pageSubtitle, marginBottom: 12 }}>Distribuição do período</p>
          <div className="h-[160px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={procData} cx="50%" cy="50%" innerRadius={44} outerRadius={68} paddingAngle={2} dataKey="value">
                  {procData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip
                  contentStyle={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 6, fontFamily: T.font, fontSize: 12 }}
                  formatter={v => [`${v}%`]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 flex flex-col gap-1.5">
            {procData.map((item, i) => (
              <div key={item.name} className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: PIE_COLORS[i] }} />
                  <span className="text-[12px] text-[#B0B0B0]">{item.name}</span>
                </div>
                <span className="text-[12px] font-medium text-white">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Linha inferior ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4 mb-6">

        {/* Agenda de hoje */}
        <Section
          title="Agenda de Hoje"
          action={
            <Link to={createPageUrl("Agenda")} style={{ textDecoration: "none" }}>
              <span className="text-[12px] text-[#666666] cursor-pointer">Ver agenda</span>
            </Link>
          }
        >
          <div className="max-h-[400px] overflow-y-auto">
            {todayApts.length > 0
              ? todayApts.slice(0, 6).map(a => <AppRow key={a.id} apt={a} />)
              : <p style={{ ...S.pageSubtitle, textAlign: "center", padding: "24px 0" }}>Nenhuma consulta hoje</p>
            }
          </div>
        </Section>

        {/* Leads + Estoque */}
        <div className="flex flex-col gap-3 md:gap-4">
          {lowStock.length > 0 && (
            <div className="w-full min-w-0" style={{ ...S.card, borderLeft: `2px solid ${T.danger}` }}>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[#EF4444] mb-3">Estoque Abaixo do Mínimo</p>
              {lowStock.slice(0, 3).map(item => (
                <div key={item.id} className="flex justify-between mb-1.5">
                  <span className="text-[13px] text-[#B0B0B0]">{item.name}</span>
                  <span className="text-[12px] text-[#EF4444]">{item.current_stock} {item.unit}</span>
                </div>
              ))}
            </div>
          )}

          <Section
            title="Leads Recentes"
            action={
              <Link to={createPageUrl("CRM")} style={{ textDecoration: "none" }}>
                <span className="text-[12px] text-[#666666] cursor-pointer">Ver CRM</span>
              </Link>
            }
          >
            {leads.slice(0, 4).map(lead => (
              <div key={lead.id} className="flex items-center gap-3 py-2.5 border-b" style={{ borderBottom: `1px solid ${T.borderLight}` }}>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-white truncate">{lead.name}</p>
                  <p className="text-[12px] text-[#666666] mt-0.5">
                    {lead.interest?.slice(0, 2).join(", ") || "Interesse a definir"}
                  </p>
                </div>
                {lead.priority === "vip" && (
                  <span className="text-[10px] font-semibold text-[#C8A96A] tracking-wider">VIP</span>
                )}
              </div>
            ))}
            {leads.length === 0 && <p style={{ ...S.pageSubtitle, textAlign: "center", padding: "24px 0" }}>Nenhum lead cadastrado</p>}
          </Section>
        </div>
      </div>

      {/* ── Indicadores ── */}
      <div className="w-full min-w-0" style={S.card}>
        <p style={{ ...S.sectionTitle, marginBottom: 20 }}>Indicadores de Performance</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {indicators.map(item => (
            <div key={item.label} className="w-full min-w-0">
              <div className="flex justify-between mb-2.5">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-[#666666]">{item.label}</span>
                <span className="text-[13px] font-medium text-white">{item.value}%</span>
              </div>
              <div className="h-0.5 bg-[#1E1E1E] rounded-full">
                <div className="h-0.5 rounded-full transition-all duration-500" style={{
                  width: `${item.value}%`,
                  backgroundColor: item.value >= 90 ? T.success : T.gold,
                }} />
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}