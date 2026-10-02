import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";

// ── Tokens LSA Dark (mesma identidade da Agenda) ──────────────
const T = {
  pearl: "#111620",
  white: "#171D29",
  onyx: "#E8EDF5",
  charcoal: "#8A95AA",
  subtle: "#252D3E",
  gold: "#C5A059",
};

const fmtNum = (n) => (n || 0).toLocaleString("pt-BR");
const fmtPct = (n) => `${(n || 0).toFixed(1)}%`;

export default function AnalyticsAgenda() {
  const [properties, setProperties] = useState([]);
  const [propertyId, setPropertyId] = useState("");
  const [days, setDays] = useState(30);
  const [data, setData] = useState(null);
  const [loadingProps, setLoadingProps] = useState(true);
  const [loadingReport, setLoadingReport] = useState(false);
  const [error, setError] = useState("");

  // Carrega propriedades disponíveis
  const loadProperties = useCallback(async () => {
    setLoadingProps(true);
    setError("");
    try {
      const res = await base44.functions.invoke("analyticsAgenda", { op: "properties" });
      setProperties(res.data.properties || []);
      if ((res.data.properties || []).length > 0) {
        setPropertyId(res.data.properties[0].property_id);
      }
    } catch (e) {
      setError(e.response?.data?.error || e.message || "Falha ao carregar propriedades");
    } finally {
      setLoadingProps(false);
    }
  }, []);

  // Carrega relatório
  const loadReport = useCallback(async () => {
    if (!propertyId) return;
    setLoadingReport(true);
    setError("");
    try {
      const res = await base44.functions.invoke("analyticsAgenda", {
        op: "report",
        property_id: propertyId,
        days,
      });
      setData(res.data);
    } catch (e) {
      setError(e.response?.data?.error || e.message || "Falha ao carregar relatório");
      setData(null);
    } finally {
      setLoadingReport(false);
    }
  }, [propertyId, days]);

  useEffect(() => { loadProperties(); }, [loadProperties]);
  useEffect(() => { if (propertyId) loadReport(); }, [loadReport]);

  const agendaPct = data && data.totals.pageviews > 0
    ? (data.agenda_totals.pageviews / data.totals.pageviews) * 100
    : 0;

  const top10 = data ? data.top_pages.slice(0, 10) : [];
  const chartData = top10.map((p) => ({
    name: p.page_path.length > 22 ? "…" + p.page_path.slice(-21) : p.page_path,
    full: p.page_path,
    pageviews: p.pageviews,
    isAgenda: /agenda/i.test(p.page_path),
  }));

  return (
    <div style={{ fontFamily: "Inter, sans-serif", maxWidth: 1200, minHeight: "80vh" }}>
      {/* ── Header ── */}
      <div style={{ marginBottom: 28, display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, fontWeight: 500, letterSpacing: "0.02em", color: T.onyx, margin: 0 }}>
            Analytics — Acessos à Agenda
          </h1>
          <p style={{ fontFamily: "Inter", fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: T.charcoal, marginTop: 6 }}>
            Páginas mais acessadas via Google Analytics
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          {/* Seletor de propriedade */}
          <select
            value={propertyId}
            onChange={(e) => setPropertyId(e.target.value)}
            disabled={loadingProps || properties.length === 0}
            style={{
              background: T.white, border: `1px solid ${T.subtle}`, borderRadius: 2,
              color: T.onyx, fontFamily: "Inter", fontSize: 12, padding: "8px 12px", minWidth: 220,
            }}
          >
            {loadingProps && <option>Carregando propriedades…</option>}
            {!loadingProps && properties.length === 0 && <option value="">Nenhuma propriedade encontrada</option>}
            {properties.map((p) => (
              <option key={p.property_id} value={p.property_id}>
                {p.display_name} ({p.account})
              </option>
            ))}
          </select>
          {/* Seletor de período */}
          <div style={{ display: "flex", border: `1px solid ${T.subtle}`, borderRadius: 2, overflow: "hidden" }}>
            {[7, 30, 90].map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                style={{
                  padding: "8px 14px", background: days === d ? T.gold : "transparent",
                  color: days === d ? "#000" : T.charcoal, border: "none", cursor: "pointer",
                  fontFamily: "Inter", fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase",
                  borderRight: `1px solid ${T.subtle}`,
                }}
              >
                {d} dias
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div style={{ background: "rgba(229,57,53,0.08)", border: "1px solid #E53935", borderRadius: 4, padding: "14px 18px", marginBottom: 24 }}>
          <p style={{ fontFamily: "Inter", fontSize: 12, color: "#E53935", margin: 0 }}>{error}</p>
        </div>
      )}

      {loadingReport && !data && (
        <div style={{ textAlign: "center", padding: "80px 0", color: T.charcoal }}>
          <div style={{ width: 28, height: 28, border: `2px solid ${T.subtle}`, borderTopColor: T.gold, borderRadius: "50%", margin: "0 auto 16px", animation: "spin 0.8s linear infinite" }} />
          <p style={{ fontFamily: "Inter", fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase" }}>Carregando relatório…</p>
        </div>
      )}

      {data && (
        <>
          {/* ── KPIs ── */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12, marginBottom: 28 }}>
            <KpiCard label="Total de Pageviews" value={fmtNum(data.totals.pageviews)} />
            <KpiCard label="Pageviews da Agenda" value={fmtNum(data.agenda_totals.pageviews)} gold />
            <KpiCard label="% Agenda sobre o total" value={fmtPct(agendaPct)} />
            <KpiCard label="Sessões (total)" value={fmtNum(data.totals.sessions)} />
            <KpiCard label="Usuários (total)" value={fmtNum(data.totals.users)} />
            <KpiCard label="Sessões na Agenda" value={fmtNum(data.agenda_totals.sessions)} />
          </div>

          {/* ── Gráfico Top 10 páginas ── */}
          <div style={{ background: T.white, border: `1px solid ${T.subtle}`, borderRadius: 4, padding: 24, marginBottom: 28, boxShadow: "0 4px 20px rgba(0,0,0,0.03)" }}>
            <p style={{ fontFamily: "Inter", fontSize: 9, letterSpacing: "0.15em", textTransform: "uppercase", color: T.charcoal, marginBottom: 4 }}>Top 10 páginas mais acessadas</p>
            <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, color: T.onyx, marginBottom: 20 }}>Últimos {days} dias</p>
            <div style={{ width: "100%", height: 320 }}>
              <ResponsiveContainer>
                <BarChart data={chartData} layout="vertical" margin={{ left: 8, right: 24, top: 4, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="2 2" stroke={T.subtle} horizontal={false} />
                  <XAxis type="number" tick={{ fill: T.charcoal, fontSize: 11, fontFamily: "Inter" }} axisLine={{ stroke: T.subtle }} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fill: T.charcoal, fontSize: 10, fontFamily: "Inter" }} axisLine={{ stroke: T.subtle }} tickLine={false} width={140} />
                  <Tooltip
                    cursor={{ fill: "rgba(197,160,89,0.05)" }}
                    contentStyle={{ background: T.pearl, border: `1px solid ${T.subtle}`, borderRadius: 4, fontFamily: "Inter", fontSize: 12, color: T.onyx }}
                    labelStyle={{ color: T.charcoal, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em" }}
                    formatter={(v, n, p) => [fmtNum(v), "Pageviews"]}
                    labelFormatter={(_, p) => p?.[0]?.payload?.full || ""}
                  />
                  <Bar dataKey="pageviews" radius={[0, 2, 2, 0]}>
                    {chartData.map((entry, i) => (
                      <Bar.Cell key={i} fill={entry.isAgenda ? T.gold : "#3A4458"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p style={{ fontFamily: "Inter", fontSize: 10, color: T.charcoal, marginTop: 12, letterSpacing: "0.08em" }}>
              <span style={{ display: "inline-block", width: 8, height: 8, background: T.gold, borderRadius: 2, marginRight: 6, verticalAlign: "middle" }} />
              páginas da Agenda &nbsp;&nbsp;
              <span style={{ display: "inline-block", width: 8, height: 8, background: "#3A4458", borderRadius: 2, marginRight: 6, verticalAlign: "middle" }} />
              demais páginas
            </p>
          </div>

          {/* ── Tabela: páginas da Agenda ── */}
          <div style={{ background: T.white, border: `1px solid ${T.subtle}`, borderRadius: 4, padding: 24, marginBottom: 28, boxShadow: "0 4px 20px rgba(0,0,0,0.03)" }}>
            <p style={{ fontFamily: "Inter", fontSize: 9, letterSpacing: "0.15em", textTransform: "uppercase", color: T.charcoal, marginBottom: 4 }}>Detalhamento da Agenda</p>
            <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, color: T.onyx, marginBottom: 16 }}>Páginas que contêm "Agenda"</p>
            {data.agenda_pages.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 0", color: T.charcoal }}>
                <p style={{ fontFamily: "Inter", fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase" }}>
                  Nenhum acesso à página /Agenda neste período
                </p>
              </div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${T.subtle}` }}>
                    <th style={thStyle}>Página</th>
                    <th style={{ ...thStyle, textAlign: "right" }}>Pageviews</th>
                    <th style={{ ...thStyle, textAlign: "right" }}>Sessões</th>
                    <th style={{ ...thStyle, textAlign: "right" }}>Usuários</th>
                  </tr>
                </thead>
                <tbody>
                  {data.agenda_pages.map((p, i) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${T.subtle}` }}>
                      <td style={tdStyle}><code style={{ fontFamily: "monospace", fontSize: 12, color: T.gold }}>{p.page_path}</code></td>
                      <td style={{ ...tdStyle, textAlign: "right", fontWeight: 500, color: T.onyx }}>{fmtNum(p.pageviews)}</td>
                      <td style={{ ...tdStyle, textAlign: "right" }}>{fmtNum(p.sessions)}</td>
                      <td style={{ ...tdStyle, textAlign: "right" }}>{fmtNum(p.users)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* ── Tabela: todas as páginas ── */}
          <div style={{ background: T.white, border: `1px solid ${T.subtle}`, borderRadius: 4, padding: 24, boxShadow: "0 4px 20px rgba(0,0,0,0.03)" }}>
            <p style={{ fontFamily: "Inter", fontSize: 9, letterSpacing: "0.15em", textTransform: "uppercase", color: T.charcoal, marginBottom: 4 }}>Todas as páginas</p>
            <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, color: T.onyx, marginBottom: 16 }}>Ranking completo — {data.top_pages.length} páginas</p>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${T.subtle}` }}>
                  <th style={{ ...thStyle, width: 40 }}>#</th>
                  <th style={thStyle}>Página</th>
                  <th style={{ ...thStyle, textAlign: "right" }}>Pageviews</th>
                  <th style={{ ...thStyle, textAlign: "right" }}>Sessões</th>
                  <th style={{ ...thStyle, textAlign: "right" }}>Usuários</th>
                </tr>
              </thead>
              <tbody>
                {data.top_pages.map((p, i) => {
                  const isAgenda = /agenda/i.test(p.page_path);
                  return (
                    <tr key={i} style={{ borderBottom: `1px solid ${T.subtle}`, background: isAgenda ? "rgba(197,160,89,0.04)" : "transparent" }}>
                      <td style={{ ...tdStyle, color: T.charcoal }}>{i + 1}</td>
                      <td style={tdStyle}>
                        <code style={{ fontFamily: "monospace", fontSize: 12, color: isAgenda ? T.gold : T.onyx }}>{p.page_path}</code>
                      </td>
                      <td style={{ ...tdStyle, textAlign: "right", fontWeight: 500, color: T.onyx }}>{fmtNum(p.pageviews)}</td>
                      <td style={{ ...tdStyle, textAlign: "right" }}>{fmtNum(p.sessions)}</td>
                      <td style={{ ...tdStyle, textAlign: "right" }}>{fmtNum(p.users)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

const thStyle = {
  fontFamily: "Inter", fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase",
  color: T.charcoal, padding: "10px 12px", textAlign: "left", fontWeight: 500,
};
const tdStyle = {
  fontFamily: "Inter", fontSize: 12, color: T.charcoal, padding: "12px",
};

function KpiCard({ label, value, gold }) {
  return (
    <div style={{
      background: T.white, border: `1px solid ${T.subtle}`,
      borderBottom: gold ? `2px solid ${T.gold}` : `1px solid ${T.subtle}`,
      borderRadius: 4, padding: "16px 20px", boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
    }}>
      <p style={{ fontFamily: "Inter", fontSize: 9, letterSpacing: "0.15em", textTransform: "uppercase", color: "#999", marginBottom: 8 }}>{label}</p>
      <p style={{ fontFamily: "Inter", fontSize: 22, fontWeight: 300, color: gold ? T.gold : T.onyx, margin: 0 }}>{value}</p>
    </div>
  );
}