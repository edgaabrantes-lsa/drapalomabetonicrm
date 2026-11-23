import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

// ─── Helpers ────────────────────────────────────────────────────────────────
function round3(n) {
  return Math.round(Number(n) * 1000) / 1000;
}

function loteVencido(dataStr) {
  if (!dataStr) return false;
  const d = new Date(String(dataStr) + 'T23:59:59');
  if (isNaN(d.getTime())) return false;
  return d.getTime() < Date.now();
}

function unidadeConsumo(supply) {
  return supply?.unidade_consumo || supply?.unit || 'un';
}

function conteudoPorUnidade(supply) {
  const c = Number(supply?.conteudo_por_unidade);
  return Number.isFinite(c) && c > 0 ? c : 1;
}

export default async function (req) {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth
    .me()
    .catch((e) => (e.status === 401 ? null : Promise.reject(e)));
  if (!user) return Response.json({ error: 'Não autenticado' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const {
    patient_id, patient_name, treatment_id, procedure_id, procedure_name,
    appointment_id, items, observacoes,
  } = body || {};

  if (!patient_id) return Response.json({ error: 'patient_id é obrigatório' }, { status: 400 });
  if (!Array.isArray(items) || items.length === 0) {
    return Response.json({ error: 'Informe ao menos um material utilizado' }, { status: 400 });
  }

  const service = base44.asServiceRole;

  // ── Idempotência: um procedimento não pode gerar duas baixas integrais ──
  if (treatment_id) {
    const jaRegistrado = await service.entities.ConsumoMaterial.filter({
      treatment_id,
      status: 'confirmado',
    });
    if (jaRegistrado && jaRegistrado.length > 0) {
      return Response.json(
        { error: 'O consumo deste procedimento já foi registrado. Use a correção/estorno para ajustes.', ja_registrado: true },
        { status: 409 },
      );
    }
  }

  // ── Validação completa antes de qualquer escrita ──
  const planejado = [];
  for (const it of items) {
    if (!it || !it.supply_id) {
      return Response.json({ error: 'Material inválido no registro de consumo' }, { status: 400 });
    }
    const qty = Number(it.quantity);
    if (!Number.isFinite(qty) || qty <= 0) {
      return Response.json({ error: 'Quantidade utilizada deve ser maior que zero' }, { status: 400 });
    }

    const supply = await service.entities.Supply
      .get(it.supply_id)
      .catch((e) => (e.status === 404 ? null : Promise.reject(e)));
    if (!supply) return Response.json({ error: 'Produto não encontrado no estoque' }, { status: 404 });

    const conteudo = conteudoPorUnidade(supply);
    const qtyEstoque = round3(qty / conteudo);
    const unidade = unidadeConsumo(supply);

    const lotes = (await service.entities.SupplyBatch.filter({ supply_id: supply.id })) || [];
    let batch = null;

    if (it.batch_id) {
      batch = lotes.find((b) => b.id === it.batch_id) || null;
      if (!batch) {
        batch = await service.entities.SupplyBatch
          .get(it.batch_id)
          .catch((e) => (e.status === 404 ? null : Promise.reject(e)));
      }
      if (!batch) return Response.json({ error: 'Lote selecionado não encontrado' }, { status: 404 });
      if (batch.supply_id !== supply.id) {
        return Response.json({ error: 'O lote selecionado não pertence a este produto' }, { status: 400 });
      }
      if (batch.status === 'expired' || loteVencido(batch.expiry_date)) {
        return Response.json(
          { error: `Lote ${batch.batch_number} está vencido e não pode ser utilizado` },
          { status: 400 },
        );
      }
      const rem = Number(batch.quantity_remaining ?? batch.quantity ?? 0);
      if (rem < qtyEstoque) {
        return Response.json(
          { error: `Saldo insuficiente no lote ${batch.batch_number}: disponível ${round3(rem * conteudo)} ${unidade}` },
          { status: 400 },
        );
      }
    } else {
      const temLoteAtivo = lotes.some((b) => b.status === 'active' && !loteVencido(b.expiry_date));
      if (temLoteAtivo) {
        return Response.json(
          { error: `Selecione o lote do produto ${supply.name} para registrar o consumo` },
          { status: 400 },
        );
      }
    }

    const estoque = Number(supply.current_stock || 0);
    if (estoque < qtyEstoque) {
      return Response.json(
        {
          error: `Estoque insuficiente de ${supply.name}: disponível ${round3(estoque * conteudo)} ${unidade}. Regularize o estoque antes de confirmar.`,
        },
        { status: 400 },
      );
    }

    planejado.push({ supply, batch, qty, qtyEstoque, unidade, conteudo });
  }

  // ── Execução com rollback: nunca confirmar baixa parcial ──
  const criados = { movimentos: [], consumos: [] };
  const originais = [];
  const consumos = [];

  try {
    for (const p of planejado) {
      const movimento = await service.entities.SupplyMovement.create({
        supply_id: p.supply.id,
        supply_name: p.supply.name,
        batch_id: p.batch?.id || '',
        batch_number: p.batch?.batch_number || '',
        movement_type: 'exit',
        quantity: p.qtyEstoque,
        unidade: p.unidade,
        quantidade_consumo: p.qty,
        patient_id,
        patient_name: patient_name || '',
        appointment_id: appointment_id || '',
        treatment_id: treatment_id || '',
        procedure_name: procedure_name || '',
        reason: 'Consumo em procedimento',
        performed_by: user.full_name || user.email || '',
      });
      criados.movimentos.push(movimento.id);

      const consumo = await service.entities.ConsumoMaterial.create({
        patient_id,
        patient_name: patient_name || '',
        treatment_id: treatment_id || '',
        procedure_id: procedure_id || '',
        procedure_name: procedure_name || '',
        appointment_id: appointment_id || '',
        profissional_id: user.id,
        profissional_nome: user.full_name || user.email || '',
        supply_id: p.supply.id,
        supply_name: p.supply.name,
        brand: p.supply.brand || '',
        batch_id: p.batch?.id || '',
        batch_number: p.batch?.batch_number || '',
        lote_nao_cadastrado: !p.batch,
        quantidade: p.qty,
        unidade: p.unidade,
        quantidade_estoque: p.qtyEstoque,
        data_consumo: new Date().toISOString().split('T')[0],
        movimento_id: movimento.id,
        status: 'confirmado',
        observacoes: observacoes || '',
      });
      criados.consumos.push(consumo.id);
      consumos.push({
        consumo_id: consumo.id,
        supply_id: p.supply.id,
        supply_name: p.supply.name,
        brand: p.supply.brand || '',
        batch_id: p.batch?.id || '',
        batch_number: p.batch?.batch_number || '',
        quantidade: p.qty,
        unidade: p.unidade,
        data: consumo.data_consumo,
        profissional: user.full_name || user.email || '',
        status: 'confirmado',
      });

      if (p.batch) {
        const remAtual = Number(p.batch.quantity_remaining ?? p.batch.quantity ?? 0);
        const novoRem = round3(Math.max(0, remAtual - p.qtyEstoque));
        originais.push({
          tipo: 'batch',
          id: p.batch.id,
          valor: { quantity_remaining: p.batch.quantity_remaining, status: p.batch.status },
        });
        await service.entities.SupplyBatch.update(p.batch.id, {
          quantity_remaining: novoRem,
          status: novoRem <= 0 ? 'depleted' : 'active',
        });
      }

      const estoqueAtual = Number(p.supply.current_stock || 0);
      const novoEstoque = round3(Math.max(0, estoqueAtual - p.qtyEstoque));
      originais.push({
        tipo: 'supply',
        id: p.supply.id,
        valor: { current_stock: p.supply.current_stock, status: p.supply.status },
      });
      await service.entities.Supply.update(p.supply.id, {
        current_stock: novoEstoque,
        status: novoEstoque <= 0 ? 'out_of_stock' : (p.supply.status === 'out_of_stock' ? 'active' : p.supply.status),
      });
    }

    if (treatment_id) {
      const tratamento = await service.entities.PatientTreatment
        .get(treatment_id)
        .catch((e) => (e.status === 404 ? null : Promise.reject(e)));
      if (tratamento) {
        const anteriores = Array.isArray(tratamento.materiais_utilizados)
          ? tratamento.materiais_utilizados.filter((m) => m.status !== 'estornado')
          : [];
        await service.entities.PatientTreatment.update(treatment_id, {
          consumo_confirmado: true,
          materiais_utilizados: [...anteriores, ...consumos],
        });
      }
    }
  } catch (err) {
    for (const id of criados.consumos) {
      await service.entities.ConsumoMaterial.delete(id).catch(() => {});
    }
    for (const id of criados.movimentos) {
      await service.entities.SupplyMovement.delete(id).catch(() => {});
    }
    for (const o of [...originais].reverse()) {
      if (o.tipo === 'batch') await service.entities.SupplyBatch.update(o.id, o.valor).catch(() => {});
      else await service.entities.Supply.update(o.id, o.valor).catch(() => {});
    }
    return Response.json(
      { error: 'Falha ao registrar o consumo. Nenhuma baixa foi confirmada: ' + err.message },
      { status: 500 },
    );
  }

  // ── Alertas de estoque mínimo ──
  const alertas = [];
  const vistos = new Set();
  for (const p of planejado) {
    if (vistos.has(p.supply.id)) continue;
    vistos.add(p.supply.id);
    const novo = round3(Number(p.supply.current_stock || 0) - p.qtyEstoque);
    const minimo = p.supply.minimum_stock;
    if (minimo !== null && minimo !== undefined && novo <= Number(minimo)) {
      alertas.push({
        supply_id: p.supply.id,
        supply_name: p.supply.name,
        restante: novo,
        unidade: p.supply.unit,
        minimo: Number(minimo),
      });
    }
  }

  return Response.json({ success: true, consumos, alertas });
}