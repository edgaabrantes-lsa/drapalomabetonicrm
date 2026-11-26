import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

/**
 * Autorização da agenda da clínica.
 * A entidade Appointment restringe leitura por profissional/autoria/admin, o que impede
 * a recepção de ver a agenda compartilhada. Aqui a autorização é feita pelo usuário
 * autenticado + perfil efetivo do ClinicUser (ativo), antes de qualquer acesso privilegiado.
 */

const PERFIS_AGENDA = ['super_admin', 'gestor', 'recepcao', 'profissional', 'profissional_clinico_premium'];
const PERFIS_EXCLUSAO = ['super_admin'];
const STATUS_VALIDOS = ['scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show'];

const CAMPOS_AGENDAMENTO = [
  'patient_id',
  'patient_name',
  'professional_id',
  'professional_name',
  'room_id',
  'procedure_id',
  'procedure_name',
  'protocol_id',
  'session_number',
  'start_time',
  'end_time',
  'duration_minutes',
  'status',
  'notes',
  'price',
  'is_vip',
  'confirmation_sent',
  'confirmation_date',
  'reminder_sent',
  'google_event_id',
];

const CAMPOS_BLOQUEIO = [
  'professional_id',
  'professional_name',
  'data_inicio',
  'data_fim',
  'dia_inteiro',
  'hora_inicio',
  'hora_fim',
  'motivo',
  'ativo',
];

function extrair(dados, campos) {
  const saida = {};
  if (!dados) return saida;
  campos.forEach((campo) => {
    if (dados[campo] !== undefined) saida[campo] = dados[campo];
  });
  return saida;
}

function pagina(resultado) {
  if (Array.isArray(resultado)) return { items: resultado, next_cursor: null };
  return { items: resultado?.items || [], next_cursor: resultado?.next_cursor || null };
}

async function resolverAcesso(base44, user) {
  const registro = pagina(
    await base44.asServiceRole.entities.ClinicUser.filter({ email: user.email }).catch(() => []),
  ).items;
  const clinicUser = registro[0] || null;

  // Cadastro explicitamente bloqueado não acessa a agenda, mesmo sendo admin.
  if (clinicUser?.status === 'bloqueado') return null;

  if (user.role === 'admin') return { perfil: 'super_admin', clinicUser };

  // Demais perfis precisam de vínculo ativo com a clínica.
  if (!clinicUser || clinicUser.status !== 'ativo') return null;

  return { perfil: clinicUser.perfil, clinicUser };
}

async function nomesDePacientes(base44, itens) {
  const faltando = [...new Set(
    itens.filter((i) => !i.patient_name && i.patient_id).map((i) => i.patient_id),
  )];
  if (!faltando.length) return {};

  const encontrados = pagina(
    await base44.asServiceRole.entities.Patient.filter({ id: { $in: faltando } }),
  ).items;

  const mapa = {};
  encontrados.forEach((p) => {
    mapa[p.id] = p.full_name || '';
  });
  return mapa;
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);

    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'É necessário estar autenticado.' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { action } = body;
    if (!action) return Response.json({ error: 'action é obrigatório' }, { status: 400 });

    const acesso = await resolverAcesso(base44, user);
    if (!acesso || !PERFIS_AGENDA.includes(acesso.perfil)) {
      return Response.json(
        { error: 'Seu perfil não tem permissão para acessar a agenda da clínica.' },
        { status: 403 },
      );
    }

    const podeEditar = PERFIS_AGENDA.includes(acesso.perfil);
    const podeExcluir = PERFIS_EXCLUSAO.includes(acesso.perfil);

    if (action === 'list') {
      const { start, end } = body;
      if (!start || !end) return Response.json({ error: 'Informe o período consultado.' }, { status: 400 });

      const opcoes = { sort: 'start_time', limit: Math.min(Number(body.limit) || 200, 500) };
      if (body.cursor) opcoes.cursor = body.cursor;

      const resultado = pagina(
        await base44.asServiceRole.entities.Appointment.filter(
          { start_time: { $gte: start, $lte: end } },
          opcoes,
        ),
      );

      const nomes = await nomesDePacientes(base44, resultado.items);

      const items = resultado.items.map((registro) => {
        const item = extrair(registro, CAMPOS_AGENDAMENTO);
        item.id = registro.id;
        item.created_by_id = registro.created_by_id;
        item.patient_name = registro.patient_name || nomes[registro.patient_id] || '';
        return item;
      });

      return Response.json({ items, next_cursor: resultado.next_cursor, has_more: !!resultado.next_cursor });
    }

    if (action === 'create') {
      if (!podeEditar) return Response.json({ error: 'Seu perfil não pode criar agendamentos.' }, { status: 403 });

      const dados = extrair(body.data, CAMPOS_AGENDAMENTO);
      if (!dados.patient_id || !dados.start_time) {
        return Response.json({ error: 'Paciente e horário são obrigatórios.' }, { status: 400 });
      }
      if (dados.status && !STATUS_VALIDOS.includes(dados.status)) {
        return Response.json({ error: 'Status inválido.' }, { status: 400 });
      }
      if (!dados.patient_name && dados.patient_id) {
        const paciente = await base44.asServiceRole.entities.Patient.get(dados.patient_id)
          .catch((e) => (e.status === 404 ? null : Promise.reject(e)));
        dados.patient_name = paciente?.full_name || '';
      }

      const criado = await base44.asServiceRole.entities.Appointment.create(dados);
      return Response.json({ item: criado });
    }

    if (action === 'update') {
      if (!podeEditar) return Response.json({ error: 'Seu perfil não pode editar agendamentos.' }, { status: 403 });
      if (!body.id) return Response.json({ error: 'Informe o agendamento.' }, { status: 400 });

      const existente = await base44.asServiceRole.entities.Appointment.get(body.id)
        .catch((e) => (e.status === 404 ? null : Promise.reject(e)));
      if (!existente) return Response.json({ error: 'Agendamento não encontrado.' }, { status: 404 });

      const dados = extrair(body.data, CAMPOS_AGENDAMENTO);
      if (dados.status && !STATUS_VALIDOS.includes(dados.status)) {
        return Response.json({ error: 'Status inválido.' }, { status: 400 });
      }

      const atualizado = await base44.asServiceRole.entities.Appointment.update(body.id, dados);
      return Response.json({ item: atualizado });
    }

    if (action === 'delete') {
      if (!podeExcluir) {
        return Response.json(
          { error: 'Seu perfil não pode excluir agendamentos. Use o cancelamento para manter o histórico.' },
          { status: 403 },
        );
      }
      if (!body.id) return Response.json({ error: 'Informe o agendamento.' }, { status: 400 });

      await base44.asServiceRole.entities.Appointment.delete(body.id);
      return Response.json({ ok: true });
    }

    if (action === 'listBloqueios') {
      const { end } = body;
      const resultado = pagina(
        await base44.asServiceRole.entities.BloqueioAgenda.filter(
          end ? { data_inicio: { $lte: end } } : {},
          { sort: '-data_inicio', limit: 500 },
        ),
      );
      return Response.json({ items: resultado.items });
    }

    if (action === 'createBloqueio') {
      if (!podeEditar) return Response.json({ error: 'Seu perfil não pode bloquear horários.' }, { status: 403 });
      const dados = extrair(body.data, CAMPOS_BLOQUEIO);
      if (!dados.data_inicio) return Response.json({ error: 'Informe a data do bloqueio.' }, { status: 400 });

      const criado = await base44.asServiceRole.entities.BloqueioAgenda.create(dados);
      return Response.json({ item: criado });
    }

    if (action === 'deleteBloqueio') {
      if (!podeEditar) return Response.json({ error: 'Seu perfil não pode liberar horários.' }, { status: 403 });
      if (!body.id) return Response.json({ error: 'Informe o bloqueio.' }, { status: 400 });

      await base44.asServiceRole.entities.BloqueioAgenda.delete(body.id);
      return Response.json({ ok: true });
    }

    return Response.json({ error: 'Ação não suportada.' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}