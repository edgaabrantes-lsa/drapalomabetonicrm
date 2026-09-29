import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Converte a data ISO do agendamento para YYYY-MM-DD (formato date do schema)
function toDateOnly(isoStr) {
  if (!isoStr) return null;
  try {
    const d = new Date(isoStr);
    // Ajusta para o fuso de Brasília (-3h) antes de extrair a data
    const br = new Date(d.getTime() - 3 * 60 * 60 * 1000);
    return br.toISOString().split("T")[0];
  } catch { return null; }
}

export default async function(req) {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });
  try {
    const base44 = createClientFromRequest(req);
    const svc = base44.asServiceRole;

    // Guard: bloqueia invocação direta por não-admin (workflow não tem usuário)
    try {
      const user = await base44.auth.me();
      if (user && user.role !== "admin") {
        return Response.json({ error: "Forbidden" }, { status: 403, headers: CORS });
      }
    } catch { /* invocação via workflow — sem usuário */ }

    const body = await req.json().catch(() => ({}));
    const appointmentId = body.appointment_id;

    if (!appointmentId) {
      return Response.json({ error: "appointment_id é obrigatório" }, { status: 400, headers: CORS });
    }

    // 1. Buscar o agendamento
    const appt = await svc.entities.Appointment.get(appointmentId);
    if (!appt) {
      return Response.json({ error: "Agendamento não encontrado", appointment_id: appointmentId }, { status: 404, headers: CORS });
    }

    // 2. Validações: só cria se tem preço > 0 e não está cancelado
    const price = Number(appt.price) || 0;
    if (price <= 0) {
      return Response.json({ success: true, action: "skip_no_price", appointment_id: appointmentId, message: "Agendamento sem preço — nada a sincronizar" }, { headers: CORS });
    }
    if (appt.status === "cancelled" || appt.status === "no_show") {
      return Response.json({ success: true, action: "skip_cancelled", appointment_id: appointmentId, status: appt.status }, { headers: CORS });
    }

    // 3. Verificar se já existe DossieFinanceiro vinculado a este agendamento (idempotência)
    const existing = await svc.entities.DossieFinanceiro.filter({ appointment_id: appointmentId });
    if (existing && existing.length > 0) {
      const reg = existing[0];
      // Se o preço mudou no agendamento, atualiza o valor_total
      if (Math.abs((Number(reg.valor_total) || 0) - price) > 0.01) {
        await svc.entities.DossieFinanceiro.update(reg.id, { valor_total: price });
        return Response.json({ success: true, action: "updated", appointment_id: appointmentId, dossie_id: reg.id, old_value: reg.valor_total, new_value: price }, { headers: CORS });
      }
      return Response.json({ success: true, action: "exists", appointment_id: appointmentId, dossie_id: reg.id }, { headers: CORS });
    }

    // 4. Criar o registro financeiro
    const dataVenc = toDateOnly(appt.start_time) || new Date().toISOString().split("T")[0];
    const novo = await svc.entities.DossieFinanceiro.create({
      patient_id: appt.patient_id || null,
      patient_name: appt.patient_name || "Paciente",
      appointment_id: appointmentId,
      procedimento: appt.procedure_name || "Procedimento",
      valor_total: price,
      num_parcelas: 1,
      status_financeiro: "pendente",
      data_vencimento: dataVenc,
      observacoes: `Lançado automaticamente via agendamento (${dataVenc}). Procedimento: ${appt.procedure_name || "—"}.`,
    });

    return Response.json({
      success: true,
      action: "created",
      appointment_id: appointmentId,
      dossie_id: novo.id,
      patient_name: appt.patient_name,
      procedimento: appt.procedure_name,
      valor_total: price,
      data_vencimento: dataVenc,
    }, { headers: CORS });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500, headers: CORS });
  }
}