import { createClientFromRequest } from "npm:@base44/sdk@0.8.52";

const ADMIN_API = "https://analyticsadmin.googleapis.com/v1beta/accountSummaries";
const DATA_API = (propertyId) =>
  `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`;

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (user.role !== "admin")
      return Response.json({ error: "Acesso restrito a administradores" }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const { accessToken } = await base44.asServiceRole.connectors.getConnection("google_analytics");
    const headers = {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    };

    // ── Listar propriedades GA4 disponíveis na conta conectada ──
    if (body.op === "properties") {
      const res = await fetch(ADMIN_API, { headers });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        return Response.json(
          { error: err.error?.message || "Falha ao listar propriedades do Google Analytics" },
          { status: 502 }
        );
      }
      const data = await res.json();
      const properties = [];
      for (const acc of data.accountSummaries || []) {
        for (const prop of acc.propertySummaries || []) {
          properties.push({
            property_id: prop.property.replace("properties/", ""),
            display_name: prop.displayName,
            account: acc.displayName,
          });
        }
      }
      return Response.json({ properties });
    }

    // ── Relatório: páginas mais acessadas + destaque para /Agenda ──
    if (body.op === "report") {
      const propertyId = body.property_id;
      if (!propertyId)
        return Response.json({ error: "property_id obrigatório" }, { status: 400 });

      const days = Number(body.days) || 30;
      const startDate = `${days}daysAgo`;
      const endDate = "today";

      // Top páginas (todas)
      const topPagesBody = {
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: "pagePath" }],
        metrics: [{ name: "screenPageViews" }, { name: "sessions" }, { name: "totalUsers" }],
        orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
        limit: 50,
      };
      const topRes = await fetch(DATA_API(propertyId), {
        method: "POST",
        headers,
        body: JSON.stringify(topPagesBody),
      });
      if (!topRes.ok) {
        const err = await topRes.json().catch(() => ({}));
        return Response.json(
          { error: err.error?.message || "Falha ao buscar relatório de páginas" },
          { status: 502 }
        );
      }
      const topData = await topRes.json();
      const topPages = (topData.rows || []).map((row) => ({
        page_path: row.dimensionValues[0].value,
        pageviews: parseInt(row.metricValues[0].value, 10),
        sessions: parseInt(row.metricValues[1].value, 10),
        users: parseInt(row.metricValues[2].value, 10),
      }));

      // Páginas da Agenda (filtro pagePath contém "Agenda")
      const agendaBody = {
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: "pagePath" }],
        metrics: [
          { name: "screenPageViews" },
          { name: "sessions" },
          { name: "totalUsers" },
        ],
        dimensionFilter: {
          filter: {
            fieldName: "pagePath",
            stringFilter: { matchType: "CONTAINS", value: "Agenda" },
          },
        },
        orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
        limit: 50,
      };
      const agendaRes = await fetch(DATA_API(propertyId), {
        method: "POST",
        headers,
        body: JSON.stringify(agendaBody),
      });
      let agendaPages = [];
      if (agendaRes.ok) {
        const agendaData = await agendaRes.json();
        agendaPages = (agendaData.rows || []).map((row) => ({
          page_path: row.dimensionValues[0].value,
          pageviews: parseInt(row.metricValues[0].value, 10),
          sessions: parseInt(row.metricValues[1].value, 10),
          users: parseInt(row.metricValues[2].value, 10),
        }));
      }

      const totals = topPages.reduce(
        (acc, p) => ({
          pageviews: acc.pageviews + p.pageviews,
          sessions: acc.sessions + p.sessions,
          users: acc.users + p.users,
        }),
        { pageviews: 0, sessions: 0, users: 0 }
      );
      const agendaTotals = agendaPages.reduce(
        (acc, p) => ({
          pageviews: acc.pageviews + p.pageviews,
          sessions: acc.sessions + p.sessions,
          users: acc.users + p.users,
        }),
        { pageviews: 0, sessions: 0, users: 0 }
      );

      return Response.json({
        top_pages: topPages,
        agenda_pages: agendaPages,
        totals,
        agenda_totals: agendaTotals,
        date_range: { start: startDate, end: endDate, days },
      });
    }

    return Response.json(
      { error: "Operação inválida. Use: properties | report" },
      { status: 400 }
    );
  } catch (error) {
    return Response.json(
      { error: error.message || "Erro interno na leitura do Google Analytics" },
      { status: 500 }
    );
  }
}