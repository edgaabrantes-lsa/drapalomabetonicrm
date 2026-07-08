import { createClientFromRequest } from "npm:@base44/sdk@0.8.31";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const action = body.action;
    const token = (body.token || "").trim();

    // ── ADMIN: gerar link de acesso ──────────────────────────
    if (action === "gerar_link") {
      const user = await base44.auth.me();
      if (!user || user.role !== "admin") {
        return Response.json({ error: "Apenas administradores podem gerar links." }, { status: 403 });
      }
      const { patient_id, expires_in_days } = body;
      if (!patient_id) return Response.json({ error: "patient_id obrigatório." }, { status: 400 });
      const patient = await base44.asServiceRole.entities.Patient.get(patient_id);
      if (!patient) return Response.json({ error: "Paciente não encontrado." }, { status: 404 });
      const accessToken = crypto.randomUUID();
      const expires = new Date();
      expires.setDate(expires.getDate() + (expires_in_days || 365));
      await base44.asServiceRole.entities.PatientPortalAccess.create({
        patient_id: patient.id,
        patient_name: patient.full_name,
        patient_email: patient.email,
        patient_phone: patient.phone || patient.whatsapp,
        access_token: accessToken,
        status: "ativo",
        expires_at: expires.toISOString(),
        created_by: user.email || user.full_name,
      });
      return Response.json({ access_token: accessToken, patient_name: patient.full_name });
    }

    // ── ADMIN: listar fotos de evolução de uma paciente ─────
    if (action === "admin_fotos") {
      const user = await base44.auth.me();
      if (!user || user.role !== "admin") return Response.json({ error: "Acesso restrito a administradores." }, { status: 403 });
      const { patient_id } = body;
      if (!patient_id) return Response.json({ error: "patient_id obrigatório." }, { status: 400 });
      const imgs = await base44.asServiceRole.entities.DossieImagem.filter({ patient_id }, "-data_upload");
      const ev = imgs.filter(i => i.deleted !== true && ["antes", "depois", "evolucao", "analise_facial"].includes(i.categoria));
      return Response.json({ images: ev });
    }

    // ── ADMIN: exclusão lógica de foto ─────────────────────
    if (action === "admin_excluir_foto") {
      const user = await base44.auth.me();
      if (!user || user.role !== "admin") return Response.json({ error: "Acesso restrito a administradores." }, { status: 403 });
      const { imagem_id, motivo } = body;
      if (!imagem_id) return Response.json({ error: "imagem_id obrigatório." }, { status: 400 });
      const img = await base44.asServiceRole.entities.DossieImagem.get(imagem_id);
      if (!img) return Response.json({ error: "Imagem não encontrada." }, { status: 404 });
      await base44.asServiceRole.entities.DossieImagem.update(imagem_id, {
        deleted: true,
        deleted_at: new Date().toISOString(),
        deleted_by: user.email || user.full_name,
        deletion_reason: motivo || "Exclusão administrativa",
        portal_visible: false,
      });
      try {
        await base44.asServiceRole.entities.DossieLog.create({
          patient_id: img.patient_id,
          patient_name: img.patient_name,
          acao: "exclusao_foto_portal",
          tipo: "imagem",
          usuario: user.email || user.full_name,
          descricao: `Exclusão lógica de foto (${img.categoria})${motivo ? ": " + motivo : ""}.`,
          data_hora: new Date().toISOString(),
        });
      } catch (_) {}
      try {
        await base44.asServiceRole.entities.AuditLog.create({
          action: "delete",
          entity_type: "DossieImagem",
          entity_id: imagem_id,
          user_email: user.email || user.full_name,
          user_role: user.role || "admin",
          details: { motivo: motivo || "Exclusão administrativa de foto do portal", paciente_id: img.patient_id, exclusao_logica: true },
        });
      } catch (_) {}
      return Response.json({ ok: true });
    }

    // ── Validar token e resolver paciente ───────────────────
    async function resolvePatient() {
      if (!token) return { error: "Token de acesso ausente.", status: 401 };
      const access = await base44.asServiceRole.entities.PatientPortalAccess.filter({ access_token: token }, "-created_date", 1);
      if (!access || access.length === 0) return { error: "Token inválido.", status: 401 };
      const a = access[0];
      if (a.status !== "ativo") return { error: "Acesso expirado ou revogado.", status: 403 };
      if (a.expires_at && new Date(a.expires_at) < new Date()) return { error: "Acesso expirado.", status: 403 };
      const patient = await base44.asServiceRole.entities.Patient.get(a.patient_id);
      if (!patient) return { error: "Paciente não encontrado.", status: 404 };
      return { a, patient };
    }

    async function logEvent(patient, acao, tipo, descricao) {
      try {
        await base44.asServiceRole.entities.DossieLog.create({
          patient_id: patient.id,
          patient_name: patient.full_name,
          acao, tipo, usuario: "Portal da Paciente", descricao,
          data_hora: new Date().toISOString(),
        });
      } catch (_) {}
    }

    // ── VALIDATE ─────────────────────────────────────────────
    if (action === "validate") {
      const r = await resolvePatient();
      if (r.error) return Response.json({ error: r.error }, { status: r.status });
      const { a, patient } = r;
      await base44.asServiceRole.entities.PatientPortalAccess.update(a.id, { last_access_at: new Date().toISOString() });
      await logEvent(patient, "acesso_portal", "acesso", "Paciente acessou o Portal da Paciente.");
      let clinic = {};
      try {
        const cs = await base44.asServiceRole.entities.ClinicSettings.list();
        if (cs && cs.length > 0) clinic = { whatsapp: cs[0].whatsapp || cs[0].phone, clinic_name: cs[0].clinic_name };
      } catch (_) {}
      return Response.json({
        patient: { id: patient.id, full_name: patient.full_name, photo_url: patient.photo_url },
        clinic,
      });
    }

    // ── Todas as ações seguintes exigem token válido ─────────
    const r = await resolvePatient();
    if (r.error) return Response.json({ error: r.error }, { status: r.status });
    const { patient } = r;
    const pid = patient.id;

    // ── HOME ────────────────────────────────────────────────
    if (action === "home") {
      return Response.json({
        patient: { id: patient.id, full_name: patient.full_name, photo_url: patient.photo_url },
      });
    }

    // ── PLANO ───────────────────────────────────────────────
    if (action === "plano") {
      const treatments = await base44.asServiceRole.entities.PatientTreatment.filter({ patient_id: pid }, "portal_order");
      const visible = treatments.filter(t => t.portal_visible === true);
      return Response.json({ treatments: visible, all_count: treatments.length });
    }

    // ── AGENDAMENTOS ────────────────────────────────────────
    if (action === "agendamentos") {
      const appts = await base44.asServiceRole.entities.Appointment.filter({ patient_id: pid }, "start_time");
      const procedures = await base44.asServiceRole.entities.Procedure.filter({ status: "active" });
      return Response.json({ appointments: appts, procedures });
    }

    if (action === "agendar") {
      const { procedure_name, start_time, duration_minutes, notes, procedure_id } = body;
      if (!procedure_name || !start_time) return Response.json({ error: "Procedimento e horário são obrigatórios." }, { status: 400 });
      const start = new Date(start_time);
      const dur = duration_minutes || 60;
      const end = new Date(start.getTime() + dur * 60000);
      const conflict = await base44.asServiceRole.entities.Appointment.filter({
        professional_id: body.professional_id || { $exists: false },
        status: { $in: ["scheduled", "confirmed", "in_progress"] },
        start_time: { $lt: end.toISOString() },
        end_time: { $gt: start.toISOString() },
      });
      if (conflict && conflict.length > 0) {
        return Response.json({ error: "Horário indisponível. Escolha outro horário." }, { status: 409 });
      }
      const appt = await base44.asServiceRole.entities.Appointment.create({
        patient_id: pid,
        patient_name: patient.full_name,
        procedure_id: procedure_id || null,
        procedure_name,
        start_time: start.toISOString(),
        end_time: end.toISOString(),
        duration_minutes: dur,
        status: "scheduled",
        notes: notes || "Agendado via Portal da Paciente",
      });
      // Sincroniza com Google Agenda (ignora erro — não bloqueia o agendamento)
      try {
        await base44.asServiceRole.functions.invoke("syncGoogleAgenda", { op: "create", appointment_id: appt.id });
      } catch (_) {}
      await logEvent(patient, "solicitacao_agendamento", "documento", `Novo agendamento: ${procedure_name} em ${start.toLocaleString("pt-BR")}.`);
      return Response.json({ appointment: appt });
    }

    if (action === "remarcar" || action === "cancelar") {
      const { appointment_id, motivo, procedimento_vinculado } = body;
      const tipo = action === "remarcar" ? "remarcacao" : "cancelamento";
      await base44.asServiceRole.entities.SolicitacaoCancelamento.create({
        patient_id: pid,
        patient_name: patient.full_name,
        tipo,
        motivo: motivo || "Solicitado pela paciente via Portal.",
        status: "pendente",
        solicitado_por: "paciente",
        procedimento_vinculado: procedimento_vinculado || null,
        observacoes: "Origem: Portal da Paciente",
      });
      await base44.asServiceRole.entities.DossieObservacao.create({
        patient_id: pid,
        patient_name: patient.full_name,
        observacao: `Solicitação de ${tipo} via Portal da Paciente. Motivo: ${motivo || "Não informado"}.`,
        categoria: "pos_venda",
        prioridade: "media",
        usuario: "Portal da Paciente",
        data_hora: new Date().toISOString(),
      });
      await logEvent(patient, `solicitacao_${tipo}`, "documento", `Solicitação de ${tipo} registrada.`);
      return Response.json({ ok: true });
    }

    // ── EVOLUÇÃO (fotos simples — retrocompatibilidade) ─────
    if (action === "evolucao") {
      const imgs = await base44.asServiceRole.entities.DossieImagem.filter({ patient_id: pid }, "-data_upload");
      const visible = imgs.filter(i =>
        i.portal_visible === true && i.deleted !== true &&
        ["antes", "depois", "evolucao", "analise_facial"].includes(i.categoria)
      );
      return Response.json({ images: visible });
    }

    // ── EVOLUÇÃO COMPLETA (linha do tempo da jornada) ──────
    if (action === "evolucao_full") {
      const [imgs, tratamentos, protocolos, appts, simulacoes, evolucoes, intakes, prontuarios] = await Promise.all([
        base44.asServiceRole.entities.DossieImagem.filter({ patient_id: pid }, "-data_upload"),
        base44.asServiceRole.entities.PatientTreatment.filter({ patient_id: pid }, "portal_order"),
        base44.asServiceRole.entities.PatientProtocol.filter({ patient_id: pid }, "-start_date"),
        base44.asServiceRole.entities.Appointment.filter({ patient_id: pid }, "start_time"),
        base44.asServiceRole.entities.FullFaceSimulation.filter({ patient_id: pid }, "-created_date"),
        base44.asServiceRole.entities.DossieEvolucao.filter({ patient_id: pid }, "-data_registro"),
        base44.asServiceRole.entities.IntakeScreening.filter({ patient_id: pid }, "-created_date"),
        base44.asServiceRole.entities.MedicalRecord.filter({ patient_id: pid }, "-record_date"),
      ]);

      const fotos = imgs.filter(i =>
        i.deleted !== true && i.portal_visible === true &&
        ["antes", "depois", "evolucao", "analise_facial"].includes(i.categoria)
      ).map(i => ({
        id: i.id, file_url: i.file_url, categoria: i.categoria,
        portal_category: i.portal_category || i.categoria,
        titulo: i.titulo, procedimento_vinculado: i.procedimento_vinculado,
        patient_note: i.patient_note, data_upload: i.data_upload, uploaded_by: i.uploaded_by,
      }));

      const sims = simulacoes.filter(s => s.status === "completed" && s.aprovada_dossie !== false && s.status !== "removido").map(s => ({
        id: s.id, original_image_url: s.original_image_url, generated_image_url: s.generated_image_url,
        created_date: s.created_date, protocol_type: s.protocol_type, intensity: s.intensity,
        patient_name: s.patient_name,
      }));

      const fotosAnalise = imgs.filter(i =>
        i.deleted !== true && i.portal_visible === true && i.categoria === "analise_facial"
      ).map(i => ({ id: i.id, file_url: i.file_url, titulo: i.titulo, data_upload: i.data_upload }));

      // Queixa/expectativa inicial
      let queixa = null;
      const intake = intakes[0];
      const evol = evolucoes[0];
      const pront = prontuarios[0];
      if (intake?.ai_output?.queixa_principal) queixa = { texto: intake.ai_output.queixa_principal, origem: "triagem" };
      else if (evol?.queixa_principal) queixa = { texto: evol.queixa_principal, origem: "avaliacao" };
      else if (pront?.chief_complaint) queixa = { texto: pront.chief_complaint, origem: "prontuario" };
      const expectativa = evol?.expectativa || null;

      // Procedimentos visíveis no portal
      const procsVisible = tratamentos.filter(t => t.portal_visible === true).map(t => ({
        id: t.id, nome: t.protocolo_nome, categoria: t.categoria, tipo: t.tipo, status: t.status,
        data_indicacao: t.data_indicacao, data_realizacao: t.data_realizacao,
        patient_friendly_description: t.patient_friendly_description,
        next_step_label: t.next_step_label, next_step_date: t.next_step_date,
      }));

      const procsProtocolos = protocolos.filter(p => p.status !== "cancelled").map(p => ({
        id: p.id, nome: p.protocol_name, status: p.status, start_date: p.start_date,
        expected_end_date: p.expected_end_date,
        sessions_completed: p.sessions_completed, total_sessions: p.total_sessions,
      }));

      const agendamentos = appts.filter(a => a.status !== "cancelled").map(a => ({
        id: a.id, procedure_name: a.procedure_name, start_time: a.start_time,
        end_time: a.end_time, status: a.status, professional_name: a.professional_name,
      }));

      return Response.json({
        entrada: {
          created_date: patient.created_date,
          source: patient.source,
          interest: patient.interest,
          notes: patient.notes || null,
        },
        queixa,
        expectativa,
        avaliacao: {
          intake_registrado: !!intake,
          avaliacao_realizada: !!evol || !!pront,
          procedimento_interesse: patient.interest || null,
        },
        simulacoes: sims,
        analise_facial: fotosAnalise,
        procedimentos: procsVisible,
        protocolos: procsProtocolos,
        agendamentos,
        fotos,
      });
    }

    // ── FALAR COM A EQUIPE (registro na área Minha Evolução) ─
    if (action === "falar_evolucao") {
      await base44.asServiceRole.entities.DossieObservacao.create({
        patient_id: pid,
        patient_name: patient.full_name,
        observacao: "Paciente clicou em WhatsApp na área Minha Evolução.",
        categoria: "pos_venda",
        prioridade: "media",
        usuario: "Portal da Paciente",
        data_hora: new Date().toISOString(),
      });
      await logEvent(patient, "contato_whatsapp_evolucao", "atendimento", "Paciente solicitou falar com a equipe pela aba Minha Evolução.");
      return Response.json({ ok: true });
    }

    if (action === "enviar_foto") {
      const { base64, file_name, file_type, titulo, descricao, procedimento_vinculado, patient_note } = body;
      if (!base64 || !file_name) return Response.json({ error: "Imagem e nome são obrigatórios." }, { status: 400 });
      // Limite de 8 MB no base64
      if (base64.length > 11 * 1024 * 1024) {
        return Response.json({ error: "Arquivo muito grande. Envie uma imagem de até 8 MB." }, { status: 413 });
      }
      const dataUrl = base64.startsWith("data:") ? base64 : `data:${file_type || "image/jpeg"};base64,${base64}`;
      const bin = atob(dataUrl.split(",")[1]);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      const file = new File([bytes], file_name, { type: file_type || "image/jpeg" });
      let file_url;
      try {
        const upload = await base44.asServiceRole.integrations.Core.UploadFile({ file });
        file_url = upload?.file_url;
      } catch (upErr) {
        return Response.json({ error: "Não foi possível enviar sua foto agora. Tente novamente ou fale com a equipe pelo WhatsApp." }, { status: 500 });
      }
      if (!file_url) {
        return Response.json({ error: "Não foi possível enviar sua foto agora. Tente novamente ou fale com a equipe pelo WhatsApp." }, { status: 500 });
      }
      const img = await base44.asServiceRole.entities.DossieImagem.create({
        patient_id: pid,
        patient_name: patient.full_name,
        categoria: "evolucao",
        titulo: titulo || "Foto de evolução enviada pela paciente",
        descricao: descricao || "",
        procedimento_vinculado: procedimento_vinculado || null,
        file_url,
        file_name,
        file_type: file_type || "image/jpeg",
        data_upload: new Date().toISOString(),
        uploaded_by: "Paciente",
        portal_visible: true,
        portal_category: "evolucao",
        patient_note: patient_note || "",
      });
      await logEvent(patient, "envio_foto_evolucao", "imagem", "Paciente enviou uma foto de evolução via Portal.");
      return Response.json({ image: img });
    }

    // ── TERMOS ──────────────────────────────────────────────
    if (action === "termos") {
      const docs = await base44.asServiceRole.entities.DossieDocumento.filter({ patient_id: pid });
      const visible = docs.filter(d => d.portal_visible === true || d.requires_patient_action === true);
      return Response.json({ documents: visible });
    }

    if (action === "assinar_termo") {
      const { documento_id } = body;
      if (!documento_id) return Response.json({ error: "Documento obrigatório." }, { status: 400 });
      const doc = await base44.asServiceRole.entities.DossieDocumento.get(documento_id);
      if (!doc || doc.patient_id !== pid) return Response.json({ error: "Documento não encontrado." }, { status: 404 });
      const sig = await base44.asServiceRole.entities.AssinaturaEletronica.create({
        patient_id: pid,
        patient_name: patient.full_name,
        documento_id: doc.id,
        documento_nome: doc.nome,
        documento_tipo: doc.tipo,
        documento_versao: doc.versao || "1.0",
        assinante_nome: patient.full_name,
        assinante_tipo: "paciente",
        declarou_leitura: true,
        concordou_termos: true,
        data_assinatura: new Date().toISOString(),
        status: "assinado",
        metodo_assinatura: "aceite_digital",
        user_agent: req.headers.get("user-agent") || "",
        dispositivo: (req.headers.get("user-agent") || "").includes("Mobile") ? "mobile" : "desktop",
      });
      await base44.asServiceRole.entities.DossieDocumento.update(documento_id, {
        status: "assinado_internamente",
        assinatura_id: sig.id,
        data_assinatura: new Date().toISOString(),
        origem_assinatura: "aceite_digital_portal",
      });
      await logEvent(patient, "aceite_termo_portal", "contrato", `Paciente aceitou digitalmente: ${doc.nome}.`);
      return Response.json({ signature: sig });
    }

    // ── CLUBE ───────────────────────────────────────────────
    if (action === "clube") {
      const clubs = await base44.asServiceRole.entities.PatientClub.filter({ patient_id: pid });
      const visible = clubs.filter(c => c.portal_visible !== false && c.status !== "encerrado");
      return Response.json({ clubs: visible });
    }

    // ── CONTEÚDOS (auto-seed se vazio) ──────────────────────
    if (action === "conteudos") {
      let contents = await base44.asServiceRole.entities.PortalContent.filter({ status: "ativo" }, "order");
      if (!contents || contents.length === 0) {
        const seeds = [
          { title: "O que significa uma beleza natural e equilibrada", category: "Beleza natural", description: "Entenda o conceito de beleza como equilíbrio, proporção e individualidade.", content: "A beleza natural não está em seguir padrões, mas em realçar o que já é seu. Quando cuidamos da pele, do contorno e da harmonia facial com leveza, o resultado é uma aparência descansada, viva e coerente com a sua identidade. O equilíbrio é o princípio que guia cada decisão estética: nada em excesso, nada em falta. A beleza mora no equilíbrio.", order: 1 },
          { title: "Harmonização facial não é transformação: é planejamento", category: "Harmonização facial", description: "O objetivo da harmonização é realçar, não transformar.", content: "A harmonização facial parte de um planejamento cuidadoso. Avaliamos proporções, simetria e o seu desejo para construir um plano gradual. Cada etapa é pensada para respeitar a sua fisionomia e o tempo do seu organismo. O resultado é uma evolução sutil, percebida por você e por quem convive com você — sem perder a naturalidade.", order: 1 },
          { title: "Quando a toxina botulínica é indicada", category: "Toxina botulínica", description: "Entenda em quais situações a toxina botulínica é uma boa escolha.", content: "A toxina botulínica atua suavizando linhas de expressão dinâmicas, como as da testa e ao redor dos olhos. É indicada quando o movimento muscular gera rugas que incomodam. O resultado aparece de forma gradual e temporária, permitindo ajustes ao longo do tempo. A indicação é sempre personalizada, após avaliação clínica.", order: 1 },
          { title: "Preenchimento facial com naturalidade e proporção", category: "Preenchimentos", description: "Como o preenchimento restaura volume sem perder a identidade.", content: "O preenchimento devolve volume e contorno onde o tempo e a genética criaram sulcos ou perda de sustentação. A chave está na proporção: usamos a quantidade certa, no lugar certo, para evitar resultados artificiais. O movimento trabalha por etapas, respeitando a sua anatomia e o tempo de assentamento do produto.", order: 1 },
          { title: "Bioestimuladores e o cuidado com a qualidade da pele", category: "Bioestimuladores", description: "Bioestimuladores agem na firmeza e na espessura da pele.", content: "Os bioestimuladores incentivam a produção de colágeno, melhorando a firmeza e a qualidade da pele ao longo das semanas. Não é um efeito imediato: é um investimento gradual na estrutura da sua pele. O acompanhamento define o número de sessões e o intervalo ideal para o seu caso.", order: 1 },
          { title: "Por que a qualidade da pele muda o resultado estético", category: "Skin Quality", description: "A pele é a base de qualquer resultado facial harmonioso.", content: "Antes de pensar em volume ou contorno, cuidamos da pele. Uma pele saudável reflete a luz de forma natural e valoriza qualquer procedimento. Avaliamos hidratação, textura, manchas e firmeza para construir uma base sólida. Skin Quality é o cuidado que sustenta todos os outros resultados.", order: 1 },
          { title: "Como se preparar para um procedimento estético", category: "Cuidados antes e depois", description: "Pequenos cuidados antes potencializam o resultado.", content: "Antes de um procedimento, evite anti-inflamatórios e álcool, mantenha a pele limpa e hidratada e siga as orientações enviadas pela equipe. Depois, respeite o tempo de recuperação, evite calor intenso e exercícios no primeiro dia. Cada procedimento tem um protocolo específico — a equipe detalhará os cuidados para a sua etapa.", order: 1 },
          { title: "Mitos comuns sobre harmonização facial", category: "Mitos e verdades", description: "Esclarecemos dúvidas frequentes com clareza.", content: "Existe a ideia de que harmonização sempre muda o rosto — na verdade, o objetivo é equilibrar, não transformar. Outro mito é que os resultados são permanentes; a maioria dos procedimentos é temporária e ajustável. E não é necessário fazer tudo de uma vez: o planejamento é gradual e respeita o seu tempo.", order: 1 },
          { title: "Por que a manutenção faz parte da jornada estética", category: "Manutenção dos resultados", description: "O resultado é construído e mantido ao longo do tempo.", content: "Os resultados estéticos não são definitivos porque a pele e o organismo continuam envelhecendo naturalmente. A manutenção garante que o equilíbrio conquistado se mantenha. Definimos juntos o ritmo ideal de retorno, com sessões de reforço e cuidados contínuos. Manter é parte da jornada — não um recomeço.", order: 1 },
        ];
        await base44.asServiceRole.entities.PortalContent.bulkCreate(seeds.map(s => ({ ...s, status: "ativo" })));
        contents = await base44.asServiceRole.entities.PortalContent.filter({ status: "ativo" }, "order");
      }
      return Response.json({ contents });
    }

    // ── CUIDADOS (procedure) ────────────────────────────────
    if (action === "cuidados") {
      const { procedure_id } = body;
      if (!procedure_id) return Response.json({ procedure: null });
      const proc = await base44.asServiceRole.entities.Procedure.get(procedure_id);
      return Response.json({ procedure: proc });
    }

    // ── FALAR COM A EQUIPE ──────────────────────────────────
    if (action === "falar") {
      const { motivo } = body;
      await base44.asServiceRole.entities.DossieObservacao.create({
        patient_id: pid,
        patient_name: patient.full_name,
        observacao: `Contato solicitado via Portal. Motivo: ${motivo || "Não informado"}. Origem: Portal da Paciente.`,
        categoria: "pos_venda",
        prioridade: "media",
        usuario: "Portal da Paciente",
        data_hora: new Date().toISOString(),
      });
      await logEvent(patient, "contato_whatsapp_portal", "atendimento", `Paciente solicitou contato: ${motivo}.`);
      return Response.json({ ok: true });
    }

    return Response.json({ error: "Ação inválida." }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message || "Erro interno do portal." }, { status: 500 });
  }
});