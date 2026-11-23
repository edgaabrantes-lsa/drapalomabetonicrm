import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

function round3(n) {
  return Math.round(Number(n) * 1000) / 1000;
}

export default async function (req) {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth
    .me()
    .catch((e) => (e.status === 401 ? null : Promise.reject(e)));
  if (!user) return Response.json({ error: 'Não autenticado' }, { status: 401 });
  if (user.role !== 'admin') {
    return Response.json({ error: 'Apenas usuários autorizados podem corrigir baixas de estoque' }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const { consumo_id, motivo, devolver_ao_estoque } = body || {};

  if (!consumo_id) return Response.json({ error: 'consumo_id é obrigatório' }, { status: 400 });
  if (!motivo || !String(motivo).trim()) {
    return Response.json({ error: 'Informe o motivo da correção' }, { status: 400 });
  }

  const service = base44.asServiceRole;
  const consumo = await service.entities.ConsumoMaterial
    .get(consumo_id)
    .catch((e) => (e.status === 404 ? null : Promise.reject(e)));
  if (!consumo) return Response.json({ error: 'Registro de consumo não encontrado' }, { status: 404 });
  if (consumo.status !== 'confirmado') {
    return Response.json({ error: 'Este consumo já foi estornado' }, { status: 400 });
  }

  const qtyEstoque = Number(consumo.quantidade_estoque || 0);

  // Movimentação compensatória auditável
  const movimento = await service.entities.SupplyMovement.create({
    supply_id: consumo.supply_id,
    supply_name: consumo.supply_name,
    batch_id: consumo.batch_id || '',
    batch_number: consumo.batch_number || '',
    movement_type: 'adjustment',
    quantity: qtyEstoque,
    unidade: consumo.unidade || '',
    quantidade_consumo: consumo.quantidade,
    patient_id: consumo.patient_id,
    patient_name: consumo.patient_name,
    treatment_id: consumo.treatment_id || '',
    consumo_id: consumo.id,
    procedure_name: consumo.procedure_name || '',
    reason: 'Estorno de consumo — ' + String(motivo).trim(),
    performed_by: user.full_name || user.email || '',
  });

  // Devolução física ao estoque exige decisão explícita de conferência
  if (devolver_ao_estoque) {
    if (consumo.batch_id) {
      const batch = await service.entities.SupplyBatch
        .get(consumo.batch_id)
        .catch((e) => (e.status === 404 ? null : Promise.reject(e)));
      if (batch) {
        const total = Number(batch.quantity || 0);
        const novo = round3(Number(batch.quantity_remaining || 0) + qtyEstoque);
        await service.entities.SupplyBatch.update(batch.id, {
          quantity_remaining: total > 0 ? Math.min(novo, total) : novo,
          status: 'active',
        });
      }
    }
    const supply = await service.entities.Supply
      .get(consumo.supply_id)
      .catch((e) => (e.status === 404 ? null : Promise.reject(e)));
    if (supply) {
      const novo = round3(Number(supply.current_stock || 0) + qtyEstoque);
      await service.entities.Supply.update(supply.id, {
        current_stock: novo,
        status: supply.status === 'out_of_stock' && novo > 0 ? 'active' : supply.status,
      });
    }
  }

  await service.entities.ConsumoMaterial.update(consumo.id, {
    status: 'estornado',
    estorno_motivo: String(motivo).trim(),
    estorno_por: user.full_name || user.email || '',
    estorno_em: new Date().toISOString(),
  });

  // Atualiza o histórico do procedimento (mantendo os demais materiais)
  if (consumo.treatment_id) {
    const doTratamento = await service.entities.ConsumoMaterial.filter({
      treatment_id: consumo.treatment_id,
    });
    const confirmados = (doTratamento || []).filter((c) => c.status === 'confirmado');
    const historico = (doTratamento || []).map((c) => ({
      consumo_id: c.id,
      supply_id: c.supply_id,
      supply_name: c.supply_name,
      brand: c.brand || '',
      batch_id: c.batch_id || '',
      batch_number: c.batch_number || '',
      quantidade: c.quantidade,
      unidade: c.unidade,
      data: c.data_consumo,
      profissional: c.profissional_nome || '',
      status: c.status,
    }));
    await service.entities.PatientTreatment.update(consumo.treatment_id, {
      materiais_utilizados: historico,
      consumo_confirmado: confirmados.length > 0,
    });
  }

  return Response.json({
    success: true,
    movimento_id: movimento.id,
    devolvido_ao_estoque: !!devolver_ao_estoque,
  });
}