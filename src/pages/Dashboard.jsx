import React from "react";
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
  <div style={{
    ...S.card,
    borderLeft: accent ? `2px solid ${T.gold}` : `1px solid ${T.border}`,
    borderRadius: 8,
  }}>
    <p style={S.label}>{title}</p>
    <p style={{ ...S.valueLg, marginTop: 10, fontSize: 24 }}>{value}</p>
    {subtitle && <p style={{ ...S.pageSubtitle, marginTop: 6 }}>{subtitle}</p>}
  </div>
);

/* ── Section block ── */
const Section = ({ title, children, action }) => (
  <div style={S.card}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
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
    <div style={{
      display: "flex", alignItems: "center", gap: 16,
      padding: "11px 0",
      borderBottom: `1px solid ${T.borderLight}`,
    }}>
      <span style={{ ...S.label, width: 36, flexShrink: 0, letterSpacing: 0, fontSize: 12, textTransform: "none", color: T.textMuted }}>
        {time}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ ...S.value, fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {apt.patient_name}
        </p>
        <p style={{ ...S.label, marginTop: 2, textTransform: "uppercase" }}>
          {apt.procedure_name || "—"}
        </p>
      </div>
      {apt.price > 0 && (
        <span style={{ ...S.value, fontSize: 13, flexShrink: 0 }}>
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

  const revenueData = [
    { mes: "Jan", receita: 45000, despesas: 32000 },
    { mes: "Fev", receita: 52000, despesas: 28000 },
    { mes: "Mar", receita: 48000, despesas: 35000 },
    { mes: "Abr", receita: 61000, despesas: 30000 },
    { mes: "Mai", receita: 55000, despesas: 33000 },
    { mes: "Jun", receita: 67000, despesas: 29000 },
  ];

  const procData = [
    { name: "Toxina",         value: 35 },
    { name: "Preenchimento",  value: 25 },
    { name: "Skinbooster",    value: 20 },
    { name: "Bioestimulador", value: 15 },
    { name: "Outros",         value: 5  },
  ];

  const indicators = [
    { label: "Taxa de Conversão",    value: 72 },
    { label: "Satisfação",           value: 94 },
    { label: "Meta Mensal",          value: 85 },
  ];

  const fmt = (n) => `R$ ${n.toLocaleString("pt-BR")}`;

  return (
    <div style={S.pageWrapper}>

      {/* ── Cabeçalho ── */}
      <div style={S.pageHeader}>
        <div>
          <h1 style={S.pageTitle}>Dashboard</h1>
          <p style={S.pageSubtitle}>Visão geral de desempenho clínico e financeiro</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Link to={createPageUrl("Agenda")} style={{ textDecoration: "none" }}>
            <button style={S.btnPrimary}>Nova Consulta</button>
          </Link>
          <Link to={createPageUrl("Patients")} style={{ textDecoration: "none" }}>
            <button style={S.btnGhost}>Novo Paciente</button>
          </Link>
        </div>
      </div>

      {/* ── KPIs ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, marginBottom: 24 }}>
        <KpiCard title="Agenda Hoje" value={todayApts.length} subtitle="consultas marcadas" />
        <KpiCard title="Pacientes Ativos" value={patients.filter(p => p.status === "active").length} subtitle="cadastros no sistema" />
        <KpiCard title="Lucro Líquido" value={fmt(profit)} subtitle={`Receita: ${fmt(income)}`} accent />
        <KpiCard title="Margem" value={`${margin}%`} subtitle="margem líquida do período" />
        <KpiCard title="Leads do Mês" value={newLeads.length} subtitle="captados este mês" />
      </div>

      {/* ── Gráficos ── */}
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,2fr) minmax(0,1fr)", gap: 12, marginBottom: 24 }}>

        {/* Receita vs Despesas */}
        <div style={S.card}>
          <p style={S.sectionTitle}>Receita vs Despesas</p>
          <p style={{ ...S.pageSubtitle, marginBottom: 20 }}>Últimos 6 meses</p>
          <div style={{ height: 240 }}>
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
        <div style={S.card}>
          <p style={S.sectionTitle}>Procedimentos</p>
          <p style={{ ...S.pageSubtitle, marginBottom: 12 }}>Distribuição do período</p>
          <div style={{ height: 160 }}>
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
          <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 6 }}>
            {procData.map((item, i) => (
              <div key={item.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: PIE_COLORS[i], flexShrink: 0 }} />
                  <span style={{ fontFamily: T.font, fontSize: 12, color: T.textSecondary }}>{item.name}</span>
                </div>
                <span style={{ fontFamily: T.font, fontSize: 12, fontWeight: 500, color: T.textPrimary }}>{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Linha inferior ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>

        {/* Agenda de hoje */}
        <Section
          title="Agenda de Hoje"
          action={
            <Link to={createPageUrl("Agenda")} style={{ textDecoration: "none" }}>
              <span style={{ fontFamily: T.font, fontSize: 12, color: T.textMuted, cursor: "pointer" }}>Ver agenda</span>
            </Link>
          }
        >
          {todayApts.length > 0
            ? todayApts.slice(0, 6).map(a => <AppRow key={a.id} apt={a} />)
            : <p style={{ ...S.pageSubtitle, textAlign: "center", padding: "32px 0" }}>Nenhuma consulta hoje</p>
          }
        </Section>

        {/* Leads + Estoque */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {lowStock.length > 0 && (
            <div style={{ ...S.card, borderLeft: `2px solid ${T.danger}` }}>
              <p style={{ ...S.label, color: T.danger, marginBottom: 12 }}>Estoque Abaixo do Mínimo</p>
              {lowStock.slice(0, 3).map(item => (
                <div key={item.id} style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontFamily: T.font, fontSize: 13, color: T.textSecondary }}>{item.name}</span>
                  <span style={{ fontFamily: T.font, fontSize: 12, color: T.danger }}>{item.current_stock} {item.unit}</span>
                </div>
              ))}
            </div>
          )}

          <Section
            title="Leads Recentes"
            action={
              <Link to={createPageUrl("CRM")} style={{ textDecoration: "none" }}>
                <span style={{ fontFamily: T.font, fontSize: 12, color: T.textMuted, cursor: "pointer" }}>Ver CRM</span>
              </Link>
            }
          >
            {leads.slice(0, 4).map(lead => (
              <div key={lead.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: `1px solid ${T.borderLight}` }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ ...S.value, fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{lead.name}</p>
                  <p style={{ ...S.label, marginTop: 2, textTransform: "none", letterSpacing: 0, fontSize: 12 }}>
                    {lead.interest?.slice(0, 2).join(", ") || "Interesse a definir"}
                  </p>
                </div>
                {lead.priority === "vip" && (
                  <span style={{ fontFamily: T.font, fontSize: 10, fontWeight: 600, color: T.gold, letterSpacing: "0.08em" }}>VIP</span>
                )}
              </div>
            ))}
            {leads.length === 0 && <p style={{ ...S.pageSubtitle, textAlign: "center", padding: "24px 0" }}>Nenhum lead cadastrado</p>}
          </Section>
        </div>
      </div>

      {/* ── Indicadores ── */}
      <div style={S.card}>
        <p style={{ ...S.sectionTitle, marginBottom: 24 }}>Indicadores de Performance</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 32 }}>
          {indicators.map(item => (
            <div key={item.label}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                <span style={S.label}>{item.label}</span>
                <span style={{ ...S.value, fontSize: 13 }}>{item.value}%</span>
              </div>
              <div style={{ height: 2, backgroundColor: T.borderLight, borderRadius: 1 }}>
                <div style={{
                  height: 2,
                  width: `${item.value}%`,
                  backgroundColor: item.value >= 90 ? T.success : T.gold,
                  borderRadius: 1,
                  transition: "width 0.6s ease",
                }} />
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}