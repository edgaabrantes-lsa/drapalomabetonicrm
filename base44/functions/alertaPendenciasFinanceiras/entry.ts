import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

function fmtBRL(n) {
  return `R$ ${(n || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtDate(d) {
  if (!d) return "—";
  try { return new Date(d).toLocaleDateString("pt-BR"); } catch { return "—"; }
}

export default async function(req) {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });
  try {
    const base44 = createClientFromRequest(req);
    const svc = base44.asServiceRole;

    // Guard: bloqueia invocação direta por não-admin (agendada não tem usuário)
    try {
      const user = await base44.auth.me();
      if (user && user.role !== "admin") {
        return Response.json({ error: "Forbidden" }, { status: 403, headers: CORS });
      }
    } catch { /* invocação agendada — sem usuário */ }

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const daqui7 = new Date(hoje);
    daqui7.setDate(daqui7.getDate() + 7);

    // ── Lançamentos DRE (despesas pendentes/vencidas) ──
    const lancamentos = await svc.entities.DRELancamento.list("-data_vencimento", 500);
    const lancDespesas = lancamentos.filter(l =>
      l.tipo !== "receita" && l.status !== "pago" && l.status !== "cancelado"
    );

    // ── Transações de despesa pendentes/vencidas ──
    const transactions = await svc.entities.Transaction.list("-created_date", 1000);
    const txDespesas = transactions.filter(t =>
      t.type === "expense" && t.status !== "paid" && t.status !== "cancelled"
    );

    const vencidos = [];
    const proximos = [];
    const pendentes = [];

    const classificar = (item, fonte, descKey, valKey, vencKey) => {
      const entry = {
        fonte,
        desc: item[descKey] || "Sem descrição",
        valor: item[valKey] || 0,
        venc: item[vencKey],
        status: item.status,
      };
      if (!item[vencKey]) { pendentes.push(entry); return; }
      const d = new Date(item[vencKey]);
      if (d < hoje) vencidos.push(entry);
      else if (d <= daqui7) proximos.push(entry);
      else pendentes.push(entry);
    };

    lancDespesas.forEach(l => classificar(l, "DRE", "descricao", "valor", "data_vencimento"));
    txDespesas.forEach(t => classificar(t, "Financeiro", "description", "amount", "due_date"));

    const totalVencidos = vencidos.reduce((s, i) => s + (i.valor || 0), 0);
    const totalProximos = proximos.reduce((s, i) => s + (i.valor || 0), 0);
    const totalPendentes = pendentes.reduce((s, i) => s + (i.valor || 0), 0);

    // Sem pendências — não envia
    if (vencidos.length === 0 && proximos.length === 0 && pendentes.length === 0) {
      return Response.json({
        success: true,
        message: "Nenhuma pendência financeira encontrada",
        enviados: 0,
      }, { headers: CORS });
    }

    // ── Buscar administradores ──
    const users = await svc.entities.User.list();
    const admins = users.filter(u => u.role === "admin" && u.email);

    if (admins.length === 0) {
      return Response.json({
        success: false,
        error: "Nenhum administrador encontrado para notificar",
        resumo: { vencidos: vencidos.length, proximos: proximos.length, pendentes: pendentes.length },
      }, { headers: CORS });
    }

    // ── Montar email ──
    const linhas = [];
    linhas.push(`<h2 style="font-family:Inter,Arial,sans-serif;color:#0A0A0A">Alerta de Pendências Financeiras</h2>`);
    linhas.push(`<p style="font-family:Inter,Arial,sans-serif;color:#333">Resumo diário das pendências financeiras da clínica — <b>${hoje.toLocaleDateString("pt-BR")}</b>.</p>`);

    if (vencidos.length > 0) {
      linhas.push(`<h3 style="font-family:Inter,Arial,sans-serif;color:#EF4444">⚠ Vencidos (${vencidos.length}) — ${fmtBRL(totalVencidos)}</h3><ul style="font-family:Inter,Arial,sans-serif">`);
      vencidos.forEach(i => linhas.push(`<li><b>${i.desc}</b> — ${fmtBRL(i.valor)} — Venc: ${fmtDate(i.venc)} <i style="color:#999">(${i.fonte})</i></li>`));
      linhas.push(`</ul>`);
    }
    if (proximos.length > 0) {
      linhas.push(`<h3 style="font-family:Inter,Arial,sans-serif;color:#F59E0B">⏰ Vencem nos próximos 7 dias (${proximos.length}) — ${fmtBRL(totalProximos)}</h3><ul style="font-family:Inter,Arial,sans-serif">`);
      proximos.forEach(i => linhas.push(`<li><b>${i.desc}</b> — ${fmtBRL(i.valor)} — Venc: ${fmtDate(i.venc)} <i style="color:#999">(${i.fonte})</i></li>`));
      linhas.push(`</ul>`);
    }
    if (pendentes.length > 0) {
      linhas.push(`<h3 style="font-family:Inter,Arial,sans-serif;color:#666">📋 Pendentes (${pendentes.length}) — ${fmtBRL(totalPendentes)}</h3><ul style="font-family:Inter,Arial,sans-serif">`);
      pendentes.forEach(i => linhas.push(`<li><b>${i.desc}</b> — ${fmtBRL(i.valor)} — Venc: ${fmtDate(i.venc)} <i style="color:#999">(${i.fonte})</i></li>`));
      linhas.push(`</ul>`);
    }

    linhas.push(`<hr style="border:none;border-top:1px solid #eee"><p style="font-family:Inter,Arial,sans-serif;color:#888;font-size:12px">Relatório automático gerado pelo CRM Clínico Master 2.0.</p>`);

    const subject = `Alerta Financeiro: ${vencidos.length} vencido(s), ${proximos.length} próximo(s) — ${hoje.toLocaleDateString("pt-BR")}`;
    const body = linhas.join("\n");

    // ── Enviar para cada admin ──
    let enviados = 0;
    const erros = [];
    for (const admin of admins) {
      try {
        await svc.integrations.Core.SendEmail({ to: admin.email, subject, body });
        enviados++;
      } catch (e) {
        erros.push({ email: admin.email, erro: e.message });
      }
    }

    return Response.json({
      success: true,
      resumo: {
        vencidos: vencidos.length,
        proximos: proximos.length,
        pendentes: pendentes.length,
        totalVencidos,
        totalProximos,
        totalPendentes,
      },
      adminsNotificados: enviados,
      totalAdmins: admins.length,
      erros,
    }, { headers: CORS });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500, headers: CORS });
  }
}