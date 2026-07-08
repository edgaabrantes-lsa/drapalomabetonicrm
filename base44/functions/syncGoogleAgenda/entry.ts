import { createClientFromRequest } from "npm:@base44/sdk@0.8.31";

const CALENDAR_API = "https://www.googleapis.com/calendar/v3/calendars/primary/events";

function buildEventBody(appt) {
  return {
    summary: `${appt.procedure_name || "Agendamento"} — ${appt.patient_name || "Paciente"}`,
    description: [
      `Paciente: ${appt.patient_name || "—"}`,
      `Procedimento: ${appt.procedure_name || "—"}`,
      appt.professional_name ? `Profissional: ${appt.professional_name}` : null,
      appt.notes ? `\nObservações: ${appt.notes}` : null,
      `\nOrigem: CRM Clínico / Portal da Paciente`,
    ].filter(Boolean).join("\n"),
    start: {
      dateTime: appt.start_time,
      timeZone: "America/Sao_Paulo",
    },
    end: {
      dateTime: appt.end_time,
      timeZone: "America/Sao_Paulo",
    },
    attendees: appt.patient_email ? [{ email: appt.patient_email }] : undefined,
  };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));

    // ── Payload de automação de entidade (Appointment create/update) ──
    // Estrutura: { event: { type, entity_name, entity_id }, data, old_data, changed_fields }
    if (body.event && body.event.entity_name === "Appointment" && body.data) {
      const appt = body.data;
      const type = body.event.type;
      const changed = body.changed_fields || [];
      if (type === "create") {
        const { accessToken } = await base44.asServiceRole.connectors.getConnection("googlecalendar");
        const headers = { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" };
        if (!appt.google_event_id) {
          const res = await fetch(CALENDAR_API, { method: "POST", headers, body: JSON.stringify(buildEventBody(appt)) });
          if (res.ok) {
            const ev = await res.json();
            await base44.asServiceRole.entities.Appointment.update(appt.id, { google_event_id: ev.id });
          }
        }
        return Response.json({ ok: true, synced: true });
      }
      if (type === "update") {
        const { accessToken } = await base44.asServiceRole.connectors.getConnection("googlecalendar");
        const headers = { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" };
        // Se cancelado → remove evento do Google
        if (appt.status === "cancelled" && appt.google_event_id) {
          const res = await fetch(`${CALENDAR_API}/${encodeURIComponent(appt.google_event_id)}`, { method: "DELETE", headers });
          if (res.ok || res.status === 410) {
            await base44.asServiceRole.entities.Appointment.update(appt.id, { google_event_id: null });
          }
          return Response.json({ ok: true, cancelled: true });
        }
        // Se horário/procedimento mudou → atualiza evento
        if (changed.some(f => ["start_time", "end_time", "procedure_name", "patient_name", "notes", "professional_name"].includes(f))) {
          if (appt.google_event_id) {
            const res = await fetch(`${CALENDAR_API}/${encodeURIComponent(appt.google_event_id)}`, { method: "PUT", headers, body: JSON.stringify(buildEventBody(appt)) });
            if (!res.ok && res.status === 404) {
              // evento sumiu no Google — recria
              const createRes = await fetch(CALENDAR_API, { method: "POST", headers, body: JSON.stringify(buildEventBody(appt)) });
              if (createRes.ok) {
                const ev = await createRes.json();
                await base44.asServiceRole.entities.Appointment.update(appt.id, { google_event_id: ev.id });
              }
            }
          } else {
            const res = await fetch(CALENDAR_API, { method: "POST", headers, body: JSON.stringify(buildEventBody(appt)) });
            if (res.ok) {
              const ev = await res.json();
              await base44.asServiceRole.entities.Appointment.update(appt.id, { google_event_id: ev.id });
            }
          }
        }
        return Response.json({ ok: true, updated: true });
      }
    }

    const op = body.op;

    // "status" é usado pela tela de configurações (usuário logado) — exige auth.
    // create/update/cancel são acionados por automações e pelo portal (service role).
    if (op === "status") {
      const user = await base44.auth.me();
      if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Obter token OAuth do Google Agenda (conexão compartilhada da clínica)
    const { accessToken } = await base44.asServiceRole.connectors.getConnection("googlecalendar");
    const headers = {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    };

    // ── STATUS: verificar conexão listando próximos eventos ──
    if (op === "status") {
      const timeMin = new Date().toISOString();
      const url = `${CALENDAR_API}?maxResults=10&timeMin=${encodeURIComponent(timeMin)}&singleEvents=true&orderBy=startTime`;
      const res = await fetch(url, { headers });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        return Response.json({ connected: false, error: err.error?.message || "Falha ao acessar Google Agenda." }, { status: 502 });
      }
      const data = await res.json();
      return Response.json({
        connected: true,
        events: (data.items || []).map(e => ({
          id: e.id,
          summary: e.summary,
          start: e.start?.dateTime || e.start?.date,
          end: e.end?.dateTime || e.end?.date,
        })),
      });
    }

    // ── CREATE: criar evento no Google a partir de um Appointment ──
    if (op === "create") {
      const { appointment_id } = body;
      if (!appointment_id) return Response.json({ error: "appointment_id obrigatório." }, { status: 400 });
      const appt = await base44.asServiceRole.entities.Appointment.get(appointment_id);
      if (!appt) return Response.json({ error: "Agendamento não encontrado." }, { status: 404 });
      if (appt.google_event_id) return Response.json({ google_event_id: appt.google_event_id, already: true });

      const res = await fetch(CALENDAR_API, {
        method: "POST",
        headers,
        body: JSON.stringify(buildEventBody(appt)),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        return Response.json({ error: err.error?.message || "Falha ao criar evento no Google Agenda." }, { status: 502 });
      }
      const ev = await res.json();
      await base44.asServiceRole.entities.Appointment.update(appointment_id, { google_event_id: ev.id });
      return Response.json({ google_event_id: ev.id, html_link: ev.htmlLink });
    }

    // ── UPDATE: atualizar evento existente ──
    if (op === "update") {
      const { appointment_id } = body;
      if (!appointment_id) return Response.json({ error: "appointment_id obrigatório." }, { status: 400 });
      const appt = await base44.asServiceRole.entities.Appointment.get(appointment_id);
      if (!appt) return Response.json({ error: "Agendamento não encontrado." }, { status: 404 });
      if (!appt.google_event_id) {
        // Sem ID salvo: cria o evento
        const res = await fetch(CALENDAR_API, {
          method: "POST",
          headers,
          body: JSON.stringify(buildEventBody(appt)),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          return Response.json({ error: err.error?.message || "Falha ao criar evento." }, { status: 502 });
        }
        const ev = await res.json();
        await base44.asServiceRole.entities.Appointment.update(appointment_id, { google_event_id: ev.id });
        return Response.json({ google_event_id: ev.id, created: true });
      }
      const res = await fetch(`${CALENDAR_API}/${encodeURIComponent(appt.google_event_id)}`, {
        method: "PUT",
        headers,
        body: JSON.stringify(buildEventBody(appt)),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        return Response.json({ error: err.error?.message || "Falha ao atualizar evento." }, { status: 502 });
      }
      const ev = await res.json();
      return Response.json({ google_event_id: ev.id, updated: true });
    }

    // ── CANCEL: cancelar/excluir evento no Google ──
    if (op === "cancel") {
      const { appointment_id } = body;
      if (!appointment_id) return Response.json({ error: "appointment_id obrigatório." }, { status: 400 });
      const appt = await base44.asServiceRole.entities.Appointment.get(appointment_id);
      if (!appt) return Response.json({ error: "Agendamento não encontrado." }, { status: 404 });
      if (!appt.google_event_id) return Response.json({ ok: true, no_event: true });
      const res = await fetch(`${CALENDAR_API}/${encodeURIComponent(appt.google_event_id)}`, {
        method: "DELETE",
        headers,
      });
      if (!res.ok && res.status !== 410) {
        const err = await res.json().catch(() => ({}));
        return Response.json({ error: err.error?.message || "Falha ao cancelar evento." }, { status: 502 });
      }
      await base44.asServiceRole.entities.Appointment.update(appointment_id, { google_event_id: null });
      return Response.json({ ok: true, cancelled: true });
    }

    return Response.json({ error: "Operação inválida. Use: status, create, update, cancel." }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message || "Erro interno na sincronização." }, { status: 500 });
  }
});