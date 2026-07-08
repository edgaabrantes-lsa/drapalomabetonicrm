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

    // ── EVOLUÇÃO ────────────────────────────────────────────
    if (action === "evolucao") {
      const imgs = await base44.asServiceRole.entities.DossieImagem.filter({ patient_id: pid }, "-data_upload");
      const visible = imgs.filter(i =>
        i.portal_visible === true && ["antes", "depois", "evolucao"].includes(i.categoria)
      );
      return Response.json({ images: visible });
    }

    if (action === "enviar_foto") {
      const { base64, file_name, file_type, titulo, descricao, procedimento_vinculado, patient_note } = body;
      if (!base64 || !file_name) return Response.json({ error: "Imagem e nome são obrigatórios." }, { status: 400 });
      const dataUrl = base64.startsWith("data:") ? base64 : `data:${file_type || "image/jpeg"};base64,${base64}`;
      const bin = atob(dataUrl.split(",")[1]);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      const blob = new Blob([bytes], { type: file_type || "image/jpeg" });
      const upload = await base44.asServiceRole.integrations.Core.UploadFile({ file: blob });
      const file_url = upload.file_url;
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

    // ── CONTEÚDOS ────────────────────────────────────────────
    if (action === "conteudos") {
      const contents = await base44.asServiceRole.entities.PortalContent.filter({ status: "ativo" }, "order");
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