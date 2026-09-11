import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const LGPD_VERSION = '1.0';
const VALIDADE_DIAS = 7;

function toArray(val) {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') return val.split(',').map(s => s.trim()).filter(Boolean);
  return [String(val)];
}

function agoraISO() {
  return new Date().toISOString();
}

function addHistorico(c, acao, usuario) {
  const hist = Array.isArray(c.historico) ? [...c.historico] : [];
  hist.push({ acao, data: agoraISO(), usuario: usuario || '' });
  return hist;
}

export default async function(req) {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS });
  try {
    const base44 = createClientFromRequest(req);
    let body = {};
    try { body = await req.json(); } catch { body = {}; }
    const action = body.action;
    const svc = base44.asServiceRole;

    // ── GERAR (autenticado) ──
    if (action === 'gerar') {
      const user = await base44.auth.me();
      if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401, headers: CORS });
      const patientId = body.patient_id;
      if (!patientId) return Response.json({ error: 'patient_id obrigatório' }, { status: 400, headers: CORS });

      let patient;
      try { patient = await svc.entities.Patient.get(patientId); } catch { patient = null; }

      // Invalida convites pendentes anteriores do mesmo paciente
      const pendentes = await svc.entities.SensorFlowConvite.filter({ patient_id: patientId, status: 'aguardando' });
      const nomeUser = user.full_name || user.email || 'Equipe';
      for (const c of pendentes) {
        await svc.entities.SensorFlowConvite.update(c.id, {
          status: 'cancelado',
          cancelado_por: nomeUser,
          data_cancelamento: agoraISO(),
          motivo_cancelamento: 'Novo convite gerado',
          historico: addHistorico(c, 'cancelado', nomeUser),
        });
      }

      const token = crypto.randomUUID() + '-' + crypto.randomUUID().slice(0, 8);
      const agora = new Date();
      const validade = new Date(agora.getTime() + VALIDADE_DIAS * 24 * 60 * 60 * 1000);
      const convite = await svc.entities.SensorFlowConvite.create({
        patient_id: patientId,
        patient_name: patient?.full_name || '',
        token,
        status: 'aguardando',
        gerado_por: nomeUser,
        gerado_por_id: user.id,
        data_criacao: agora.toISOString(),
        data_validade: validade.toISOString(),
        historico: [{ acao: 'gerado', data: agora.toISOString(), usuario: nomeUser }],
      });

      return Response.json({
        success: true,
        token,
        convite_id: convite.id,
        status: 'aguardando',
        data_validade: validade.toISOString(),
        data_criacao: agora.toISOString(),
      }, { headers: CORS });
    }

    // ── CANCELAR (autenticado) ──
    if (action === 'cancelar') {
      const user = await base44.auth.me();
      if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401, headers: CORS });
      const conviteId = body.convite_id;
      if (!conviteId) return Response.json({ error: 'convite_id obrigatório' }, { status: 400, headers: CORS });
      const c = await svc.entities.SensorFlowConvite.get(conviteId);
      const nomeUser = user.full_name || user.email || 'Equipe';
      await svc.entities.SensorFlowConvite.update(conviteId, {
        status: 'cancelado',
        cancelado_por: nomeUser,
        data_cancelamento: agoraISO(),
        motivo_cancelamento: body.motivo || 'Cancelado pela equipe',
        historico: addHistorico(c, 'cancelado', nomeUser),
      });
      return Response.json({ success: true }, { headers: CORS });
    }

    // ── LOG (autenticado) — copiar / enviar whatsapp / abrir ──
    if (action === 'log') {
      const user = await base44.auth.me();
      if (!user) return Response.json({ success: true }, { headers: CORS });
      const conviteId = body.convite_id;
      if (!conviteId) return Response.json({ success: true }, { headers: CORS });
      let c;
      try { c = await svc.entities.SensorFlowConvite.get(conviteId); } catch { c = null; }
      if (!c) return Response.json({ success: true }, { headers: CORS });
      const nomeUser = user.full_name || user.email || 'Equipe';
      await svc.entities.SensorFlowConvite.update(conviteId, {
        historico: addHistorico(c, body.acao || 'acao', nomeUser),
      });
      return Response.json({ success: true }, { headers: CORS });
    }

    // ── VALIDAR (público) ──
    if (action === 'validar') {
      const token = body.token;
      if (!token) return Response.json({ valido: false, motivo: 'invalido' }, { status: 400, headers: CORS });
      const convites = await svc.entities.SensorFlowConvite.filter({ token });
      if (!convites || convites.length === 0) return Response.json({ valido: false, motivo: 'invalido' }, { headers: CORS });
      const c = convites[0];
      // Verifica expiração automática
      let statusAtual = c.status;
      if (c.status === 'aguardando' && new Date(c.data_validade) < new Date()) {
        await svc.entities.SensorFlowConvite.update(c.id, {
          status: 'expirado',
          historico: addHistorico(c, 'expirado', ''),
        });
        statusAtual = 'expirado';
      }
      let paciente;
      try { paciente = await svc.entities.Patient.get(c.patient_id); } catch { paciente = null; }
      const primeiroNome = (paciente?.full_name || c.patient_name || '').split(' ')[0] || '';
      return Response.json({
        valido: statusAtual === 'aguardando',
        status: statusAtual,
        paciente_primeiro_nome: primeiroNome,
        convite_id: c.id,
      }, { headers: CORS });
    }

    // ── SUBMETER (público) ──
    if (action === 'submeter') {
      const token = body.token;
      if (!token) return Response.json({ error: 'token obrigatório' }, { status: 400, headers: CORS });
      const convites = await svc.entities.SensorFlowConvite.filter({ token });
      if (!convites || convites.length === 0) return Response.json({ error: 'invalid', motivo: 'invalido' }, { status: 400, headers: CORS });
      const c = convites[0];

      if (c.status === 'respondido') return Response.json({ error: 'already_used' }, { status: 400, headers: CORS });
      if (c.status === 'cancelado') return Response.json({ error: 'cancelled' }, { status: 400, headers: CORS });
      if (c.status === 'expirado' || new Date(c.data_validade) < new Date()) {
        if (c.status !== 'expirado') {
          await svc.entities.SensorFlowConvite.update(c.id, { status: 'expirado' });
        }
        return Response.json({ error: 'expired' }, { status: 400, headers: CORS });
      }
      if (!body.lgpd_consent) return Response.json({ error: 'lgpd_consent obrigatório' }, { status: 400, headers: CORS });

      let paciente;
      try { paciente = await svc.entities.Patient.get(c.patient_id); } catch { paciente = null; }
      const agora = new Date();

      // Cria novo PerfilSensorial vinculado ao convite (preserva histórico)
      const perfil = await svc.entities.PerfilSensorial.create({
        patient_id: c.patient_id,
        patient_name: paciente?.full_name || c.patient_name || '',
        convite_id: c.id,
        submission_id: crypto.randomUUID(),
        appointment_periods: toArray(body.appointment_periods),
        music_preferences: toArray(body.music_preferences),
        music_other: body.music_other || '',
        wants_music_choice: !!body.wants_music_choice,
        music_choice_song: body.music_choice_song || '',
        music_choice_artist: body.music_choice_artist || '',
        beverage_preferences: toArray(body.beverage_preferences),
        beverage_other: body.beverage_other || '',
        food_preferences: toArray(body.food_preferences),
        food_other: body.food_other || '',
        dietary_restrictions: toArray(body.dietary_restrictions),
        dietary_restrictions_detail: body.dietary_restrictions_detail || '',
        environment_preferences: toArray(body.environment_preferences),
        temperature_preference: body.temperature_preference || '',
        likes_aromas: !!body.likes_aromas,
        aroma_preferences: toArray(body.aroma_preferences),
        aroma_other: body.aroma_other || '',
        service_style: body.service_style || '',
        hospitality_summary: body.hospitality_summary || '',
        lgpd_consent: true,
        lgpd_consent_date: agora.toISOString(),
        lgpd_consent_version: LGPD_VERSION,
        form_source: 'SensorFlow_Convite',
        url_origem: body.url_origem || '',
        dispositivo: body.dispositivo || '',
        navegador: body.navegador || '',
        crm_status: 'respondido_convite',
      });

      await svc.entities.SensorFlowConvite.update(c.id, {
        status: 'respondido',
        data_conclusao: agora.toISOString(),
        data_preenchimento: agora.toISOString(),
        resposta_id: perfil.id,
        lgpd_consent: true,
        lgpd_consent_date: agora.toISOString(),
        lgpd_consent_version: LGPD_VERSION,
        dispositivo: body.dispositivo || '',
        navegador: body.navegador || '',
        url_origem: body.url_origem || '',
        historico: addHistorico(c, 'respondido', ''),
      });

      // ── ENVIO DE E-MAIL AUTOMÁTICO VIA GMAIL ──
      try {
        const DESTINATARIO = 'drapalomabetonipasta@gmail.com';
        const nomePaciente = paciente?.full_name || c.patient_name || 'Paciente';

        const fmtArr = (arr) => Array.isArray(arr) && arr.length > 0 ? arr.join(', ') : '—';
        const fmtBool = (v) => v ? 'Sim' : 'Não';

        const linhas = [
          { label: 'Nome', value: nomePaciente },
          { label: 'Telefone/WhatsApp', value: paciente?.phone || '—' },
          { label: 'E-mail', value: paciente?.email || '—' },
          { label: 'Períodos de Atendimento', value: fmtArr(perfil.appointment_periods) },
          { label: 'Preferência Musical', value: fmtArr(perfil.music_preferences) + (perfil.music_other ? ` (${perfil.music_other})` : '') },
          { label: 'Quer escolher música', value: fmtBool(perfil.wants_music_choice) },
          { label: 'Música escolhida', value: perfil.music_choice_song || '—' },
          { label: 'Cantor/Artista', value: perfil.music_choice_artist || '—' },
          { label: 'Preferência de Bebidas', value: fmtArr(perfil.beverage_preferences) + (perfil.beverage_other ? ` (${perfil.beverage_other})` : '') },
          { label: 'Preferência de Alimentos', value: fmtArr(perfil.food_preferences) + (perfil.food_other ? ` (${perfil.food_other})` : '') },
          { label: 'Restrições Alimentares', value: fmtArr(perfil.dietary_restrictions) + (perfil.dietary_restrictions_detail ? ` (${perfil.dietary_restrictions_detail})` : '') },
          { label: 'Temperatura', value: perfil.temperature_preference || '—' },
          { label: 'Gosta de Aromas', value: fmtBool(perfil.likes_aromas) },
          { label: 'Preferência de Aromas', value: fmtArr(perfil.aroma_preferences) + (perfil.aroma_other ? ` (${perfil.aroma_other})` : '') },
          { label: 'Estilo de Atendimento', value: perfil.service_style || '—' },
          { label: 'Consentimento LGPD', value: fmtBool(perfil.lgpd_consent) },
          { label: 'Dispositivo', value: perfil.dispositivo || '—' },
          { label: 'Navegador', value: (perfil.navegador || '—').substring(0, 80) },
          { label: 'Origem', value: perfil.url_origem || '—' },
        ];

        const dataHora = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
        const subject = `[Sensor Flow] Novo preenchimento — ${nomePaciente}`;

        const htmlBody = [
          '<div style="font-family: Arial, Helvetica, sans-serif; max-width: 640px; margin: 0 auto; background: #f9f9f7; padding: 24px;">',
          '  <div style="background: #ffffff; border: 1px solid #eeeeee; border-radius: 8px; padding: 32px;">',
          '    <h1 style="font-size: 22px; color: #121212; margin: 0 0 8px;">Novo Preenchimento do Sensor Flow</h1>',
          `    <p style="font-size: 13px; color: #757575; margin: 0 0 24px;">Recebido em ${dataHora}</p>`,
          '    <table style="width: 100%; border-collapse: collapse; font-size: 14px;">',
          ...linhas.map(l => `      <tr style="border-bottom: 1px solid #f0f0f0;"><td style="padding: 10px 0; width: 40%; color: #757575; font-weight: 500; vertical-align: top;">${l.label}</td><td style="padding: 10px 0; color: #121212; vertical-align: top;">${l.value}</td></tr>`),
          '    </table>',
          '    <p style="font-size: 11px; color: #999; margin-top: 24px;">Este e-mail foi enviado automaticamente pelo CRM Clínico Dra. Paloma Betoni.</p>',
          '  </div>',
          '</div>',
        ].join('\r\n');

        const textBody = `Novo Preenchimento do Sensor Flow\nRecebido em ${dataHora}\n\n` +
          linhas.map(l => `${l.label}: ${l.value}`).join('\n');

        const { accessToken } = await svc.connectors.getConnection('gmail');

        const boundary = 'sensorflow_' + crypto.randomUUID().replace(/-/g, '');
        const mimeMessage = [
          `To: ${DESTINATARIO}`,
          `Subject: =?utf-8?B?${utf8ToBase64(subject)}?=`,
          'MIME-Version: 1.0',
          `Content-Type: multipart/alternative; boundary="${boundary}"`,
          '',
          `--${boundary}`,
          'Content-Type: text/plain; charset=utf-8',
          'Content-Transfer-Encoding: base64',
          '',
          utf8ToBase64(textBody),
          `--${boundary}`,
          'Content-Type: text/html; charset=utf-8',
          'Content-Transfer-Encoding: base64',
          '',
          utf8ToBase64(htmlBody),
          `--${boundary}--`,
        ].join('\r\n');

        const rawMessage = b64urlEncode(mimeMessage);

        const sendRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ raw: rawMessage }),
        });

        if (!sendRes.ok) {
          const errText = await sendRes.text();
          console.warn('[SENSORFLOW] Gmail send error:', sendRes.status, errText);
        }
      } catch (emailError) {
        console.warn('[SENSORFLOW] Falha no envio de e-mail:', emailError.message);
      }

      return Response.json({ success: true, perfil_id: perfil.id }, { headers: CORS });
    }

    // ── HISTORICO (autenticado) ──
    if (action === 'historico') {
      const user = await base44.auth.me();
      if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401, headers: CORS });
      const patientId = body.patient_id;
      if (!patientId) return Response.json({ error: 'patient_id obrigatório' }, { status: 400, headers: CORS });
      const convites = await svc.entities.SensorFlowConvite.filter({ patient_id: patientId }, '-data_criacao', 100);
      // Último perfil sensorial respondido via convite
      const perfis = await svc.entities.PerfilSensorial.filter({ patient_id: patientId }, '-created_date', 50);
      return Response.json({ convites, perfis }, { headers: CORS });
    }

    return Response.json({ error: 'Ação desconhecida' }, { status: 400, headers: CORS });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500, headers: CORS });
  }
}

// ── Helpers para codificação MIME/Gmail ──
function utf8ToBase64(str) {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function b64urlEncode(str) {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}