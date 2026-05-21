import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { patientId, patientName, protocolosSugeridos } = await req.json();

    if (!protocolosSugeridos || !Array.isArray(protocolosSugeridos)) {
      return Response.json({ error: 'Protocolos sugeridos é obrigatório' }, { status: 400 });
    }

    // Buscar todos os protocolos ativos
    const protocolosDisponiveis = await base44.entities.ProtocoloPremium.filter({ status: "ativo" });

    // Criar tratamentos indicados para cada protocolo sugerido
    const tratamentosCriados = [];

    for (const protocoloSugerido of protocolosSugeridos) {
      const protocoloEncontrado = protocolosDisponiveis.find(
        (p) => p.nome.toLowerCase() === protocoloSugerido.nome.toLowerCase()
      );

      if (protocoloEncontrado) {
        const tratamento = await base44.entities.PatientTreatment.create({
          patient_id: patientId,
          patient_name: patientName,
          protocolo_id: protocoloEncontrado.id,
          protocolo_nome: protocoloSugerido.nome,
          categoria: protocoloEncontrado.categoria,
          tipo: "indicado",
          status: "indicado",
          data_indicacao: new Date().toISOString().split("T")[0],
          valor: protocoloEncontrado.valor_por_ml ? protocoloEncontrado.valor_min : protocoloEncontrado.valor_min,
          regioes_tratadas: protocoloSugerido.regioes || protocoloEncontrado.regioes || [],
          observacoes: protocoloSugerido.justificativa || "Indicado via análise facial IA",
        });
        tratamentosCriados.push(tratamento);
      }
    }

    return Response.json({ 
      success: true, 
      tratamentos: tratamentosCriados,
      message: `${tratamentosCriados.length} tratamento(s) indicado(s) com sucesso!`
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});