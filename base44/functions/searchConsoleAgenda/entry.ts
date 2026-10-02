import { createClientFromRequest } from "npm:@base44/sdk@0.8.52";

const SITES_API = "https://www.googleapis.com/webmasters/v3/sites";
const QUERY_API = (siteUrl) =>
  `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`;

function dateStr(daysAgo) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().slice(0, 10);
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (user.role !== "admin")
      return Response.json({ error: "Acesso restrito a administradores" }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const { accessToken } = await base44.asServiceRole.connectors.getConnection("google_search_console");
    const headers = {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    };

    // ── Listar sites verificados no Search Console ──
    if (body.op === "sites") {
      const res = await fetch(SITES_API, { headers });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        return Response.json(
          { error: err.error?.message || "Falha ao listar sites do Search Console" },
          { status: 502 }
        );
      }
      const data = await res.json();
      const sites = (data.siteEntry || []).map((s) => ({
        site_url: s.siteUrl,
        permission_level: s.permissionLevel,
      }));
      return Response.json({ sites });
    }

    // ── Relatório: páginas mais acessadas (cliques) + destaque Agenda ──
    if (body.op === "report") {
      const siteUrl = body.site_url;
      if (!siteUrl)
        return Response.json({ error: "site_url obrigatório" }, { status: 400 });

      const days = Number(body.days) || 28;
      const startDate = dateStr(days);
      const endDate = dateStr(0);

      // Top páginas (todas)
      const topBody = {
        startDate,
        endDate,
        dimensions: ["page"],
        metrics: ["clicks", "impressions", "ctr", "position"],
        rowLimit: 1000,
      };
      const topRes = await fetch(QUERY_API(siteUrl), {
        method: "POST",
        headers,
        body: JSON.stringify(topBody),
      });
      if (!topRes.ok) {
        const err = await topRes.json().catch(() => ({}));
        return Response.json(
          { error: err.error?.message || "Falha ao buscar relatório de páginas" },
          { status: 502 }
        );
      }
      const topData = await topRes.json();
      const topPages = (topData.rows || []).map((r) => ({
        page: r.keys[0],
        clicks: r.clicks,
        impressions: r.impressions,
        ctr: r.ctr,
        position: r.position,
      }));

      // Páginas da Agenda (filtro page contém "agenda")
      const agendaBody = {
        startDate,
        endDate,
        dimensions: ["page"],
        dimensionFilterGroups: [
          {
            filters: [
              { dimension: "page", operator: "contains", expression: "agenda" },
            ],
          },
        ],
        metrics: ["clicks", "impressions", "ctr", "position"],
        rowLimit: 1000,
      };
      const agendaRes = await fetch(QUERY_API(siteUrl), {
        method: "POST",
        headers,
        body: JSON.stringify(agendaBody),
      });
      let agendaPages = [];
      if (agendaRes.ok) {
        const agendaData = await agendaRes.json();
        agendaPages = (agendaData.rows || []).map((r) => ({
          page: r.keys[0],
          clicks: r.clicks,
          impressions: r.impressions,
          ctr: r.ctr,
          position: r.position,
        }));
      }

      const totals = topPages.reduce(
        (acc, p) => ({
          clicks: acc.clicks + p.clicks,
          impressions: acc.impressions + p.impressions,
        }),
        { clicks: 0, impressions: 0 }
      );
      const agendaTotals = agendaPages.reduce(
        (acc, p) => ({
          clicks: acc.clicks + p.clicks,
          impressions: acc.impressions + p.impressions,
        }),
        { clicks: 0, impressions: 0 }
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
      { error: "Operação inválida. Use: sites | report" },
      { status: 400 }
    );
  } catch (error) {
    return Response.json(
      { error: error.message || "Erro interno na leitura do Search Console" },
      { status: 500 }
    );
  }
}