import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

/**
 * LSA - Luxure Sales Academy | SISTEMA DRA. PALOMA
 * Módulo: Auditoria Financeira e DRE por Procedimento
 * Camada: 1.2 Lógica (Backend) + 1.5 Inteligência (IA)
 *
 * FLUXO LSA:
 * 1. Cálculo determinístico de custos (matemática pura, sem IA)
 * 2. IA interpreta resultado e gera insight estratégico
 * 3. Retorno blindado com alertas automáticos
 */

const AI_ANALYST_PROMPT = (data) => `
Você é o Consultor Financeiro Estratégico da Clínica Dra. Paloma Betoni.
Analise os dados abaixo e entregue UM insight direto de no máximo 2 frases.
Foco: o que a doutora deve fazer para melhorar a rentabilidade.

Dados do procedimento:
- Procedimento: ${data.procedure_name}
- Receita: R$ ${data.revenue.toFixed(2)}
- Custo total: R$ ${data.total_cost.toFixed(2)}
- Lucro líquido: R$ ${data.net_profit.toFixed(2)}
- Margem: ${data.margin_percent}%
- Tempo de cadeira: ${data.chair_time_min} minutos
- Custo alocado fixo: R$ ${data.fixed_cost_allocated.toFixed(2)}
- Alertas: ${data.low_margin ? 'MARGEM BAIXA' : ''} ${data.high_time_cost ? 'TEMPO DE CADEIRA ALTO' : ''}

Responda APENAS com o insight em texto simples. Sem formatação.
`;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // 1. AUTENTICAÇÃO
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Não autorizado.' }, { status: 401 });
    }
    if (user.role !== 'admin') {
      return Response.json({ error: 'Acesso restrito a administradores.' }, { status: 403 });
    }

    const body = await req.json();
    const {
      procedure_id,
      procedure_name,
      sale_price,
      material_costs,
      labor_cost,
      chair_time_min,
      fixed_cost_min
    } = body;

    // VALIDAÇÃO DE ENTRADA
    const fields = { sale_price, material_costs, labor_cost, chair_time_min, fixed_cost_min };
    for (const [key, val] of Object.entries(fields)) {
      if (val === undefined || val === null || isNaN(Number(val))) {
        return Response.json({ error: `Campo obrigatório ausente ou inválido: ${key}` }, { status: 400 });
      }
    }

    // 2. CÁLCULO DE REGRA FIXA - BACKEND (Regra 1.2: Matemática não é IA)
    const sp = Number(sale_price);
    const mc = Number(material_costs);
    const lc = Number(labor_cost);
    const ctm = Number(chair_time_min);
    const fcm = Number(fixed_cost_min);

    const total_variable_costs = mc + lc;
    const total_fixed_allocated = ctm * fcm;
    const total_cost = total_variable_costs + total_fixed_allocated;
    const net_profit = sp - total_cost;
    const margin_percent = sp > 0 ? ((net_profit / sp) * 100) : 0;

    const alerts = {
      low_margin: margin_percent < 30,
      high_time_cost: total_fixed_allocated > sp * 0.2
    };

    // 3. CAMADA DE INTELIGÊNCIA — IA interpreta, nunca calcula (Regra 1.5 / Regra 9)
    let lsa_strategic_insight = '';
    try {
      const aiResult = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: AI_ANALYST_PROMPT({
          procedure_name: procedure_name || procedure_id || 'Procedimento',
          revenue: sp,
          total_cost,
          net_profit,
          margin_percent: margin_percent.toFixed(2),
          chair_time_min: ctm,
          fixed_cost_allocated: total_fixed_allocated,
          low_margin: alerts.low_margin,
          high_time_cost: alerts.high_time_cost
        })
      });
      lsa_strategic_insight = typeof aiResult === 'string' ? aiResult.trim() : '';
    } catch (_) {
      lsa_strategic_insight = 'Insight indisponível no momento. Verifique os alertas manuais.';
    }

    // 4. REGISTRO DE AUDITORIA (Regra 3)
    await base44.asServiceRole.entities.AuditLog.create({
      action: 'read',
      entity_type: 'FinancialAudit',
      entity_id: procedure_id || 'unknown',
      user_email: user.email,
      user_role: user.role,
      details: {
        audit_id: `AUD-${Date.now()}`,
        procedure_name: procedure_name || procedure_id,
        margin_percent: margin_percent.toFixed(2),
        net_profit: net_profit.toFixed(2),
        low_margin: alerts.low_margin
      }
    });

    // 5. RETORNO BLINDADO (Regra 7 e 11)
    return Response.json({
      status: 'success',
      audit_id: `AUD-${Date.now()}`,
      metrics: {
        revenue: sp,
        total_variable_costs,
        total_fixed_allocated,
        total_costs: total_cost,
        profit: net_profit,
        margin_index: `${margin_percent.toFixed(2)}%`,
        margin_value: margin_percent
      },
      alerts,
      lsa_strategic_insight
    });

  } catch (error) {
    console.error('ERRO_AUDIT_PALOMA:', error.message);
    return Response.json({
      error: 'Erro na auditoria financeira.',
      code: 'FINANCIAL_AUDIT_ERROR'
    }, { status: 500 });
  }
});