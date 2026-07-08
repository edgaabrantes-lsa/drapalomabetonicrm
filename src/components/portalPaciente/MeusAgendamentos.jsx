import React, { useEffect, useState } from "react";
import { T, portalApi, whatsappLink, WHATSAPP_MESSAGES } from "./portalConfig";
import { Loader2, Calendar, Clock, MessageCircle, CheckCircle2, XCircle, CalendarPlus } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function MeusAgendamentos({ token, whatsappNumber }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const d = await portalApi("agendamentos", { token });
      setData(d);
    } catch { setData({ appointments: [], procedures: [] }); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, [token]);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-7 w-7 animate-spin" style={{ color: T.gold }} /></div>;

  const appts = (data?.appointments || []).filter(a => new Date(a.start_time) >= new Date(new Date().setHours(0,0,0,0)) && a.status !== "cancelled");

  return (
    <div className="px-5 py-6">
      <Header />

      {/* Próximos agendamentos */}
      <div className="space-y-3 mb-6">
        {appts.length === 0 ? (
          <div className="rounded-2xl p-8 text-center" style={{ background: T.card, border: `1px solid ${T.border}` }}>
            <Calendar className="mx-auto mb-3" style={{ width: 28, height: 28, color: T.dim }} />
            <p className="text-sm" style={{ color: T.muted }}>Você não tem agendamentos próximos.</p>
          </div>
        ) : (
          appts.map(a => (
            <div key={a.id} className="rounded-2xl p-4" style={{ background: T.card, border: `1px solid ${T.border}` }}>
              <div className="flex items-start justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: T.text }}>{a.procedure_name}</p>
                  <div className="flex items-center gap-2 mt-1.5 text-xs" style={{ color: T.muted }}>
                    <Calendar className="h-3.5 w-3.5" />
                    {format(parseISO(a.start_time), "dd 'de' MMMM', às' HH:mm", { locale: ptBR })}
                  </div>
                  {a.duration_minutes && (
                    <div className="flex items-center gap-2 mt-1 text-xs" style={{ color: T.dim }}>
                      <Clock className="h-3 w-3" /> {a.duration_minutes} minutos
                    </div>
                  )}
                </div>
                <ApptBadge status={a.status} />
              </div>
              <div className="flex gap-2 mt-4 pt-3 border-t" style={{ borderColor: T.border }}>
                <a href={whatsappLink(whatsappNumber, WHATSAPP_MESSAGES.reagendar)} target="_blank" rel="noopener noreferrer"
                  className="flex-1 text-center rounded-lg py-2.5 text-sm font-medium"
                  style={{ background: T.goldSoft, border: `1px solid ${T.gold}40`, color: T.gold }}>
                  Remarcar
                </a>
                <button onClick={() => solicitar("cancelar", a.id, a.procedure_name, token)}
                  className="flex-1 rounded-lg py-2.5 text-sm font-medium"
                  style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", color: "#f87171" }}>
                  Cancelar
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Ações */}
      <button onClick={() => setShowForm(s => !s)}
        className="w-full flex items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-semibold mb-4"
        style={{ background: T.gold, color: "#0A0A0A" }}>
        <CalendarPlus className="h-4 w-4" /> Solicitar novo agendamento
      </button>

      {showForm && <NewAppointmentForm token={token} procedures={data?.procedures || []} onDone={load} whatsappNumber={whatsappNumber} />}

      <a href={whatsappLink(whatsappNumber, WHATSAPP_MESSAGES.agendar)} target="_blank" rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 rounded-2xl py-3 text-sm font-medium"
        style={{ background: T.goldSoft, border: `1px solid ${T.gold}40`, color: T.gold }}>
        <MessageCircle className="h-4 w-4" /> Tirar dúvida no WhatsApp
      </a>
    </div>
  );
}

async function solicitar(tipo, appointmentId, procName, token) {
  const motivo = tipo === "cancelar" ? "Cancelamento solicitado pela paciente" : "Remarcação solicitada pela paciente";
  if (!confirm(`Confirmar ${tipo === "cancelar" ? "cancelamento" : "remarcação"} de "${procName}"? Sua solicitação será enviada à equipe.`)) return;
  await portalApi(tipo, { token, appointment_id: appointmentId, motivo, procedimento_vinculado: procName });
  alert("Solicitação enviada. Nossa equipe entrará em contato.");
}

function NewAppointmentForm({ token, procedures, onDone, whatsappNumber }) {
  const [procedure_name, setProc] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  async function submit(e) {
    e.preventDefault();
    if (!procedure_name || !date || !time) { setErr("Preencha procedimento, data e horário."); return; }
    const start_time = new Date(`${date}T${time}`).toISOString();
    setLoading(true); setErr("");
    try {
      const res = await portalApi("agendar", { token, procedure_name, start_time, duration_minutes: 60 });
      if (res.error) throw new Error(res.error);
      alert("Agendamento solicitado com sucesso. Aguarde confirmação da equipe.");
      onDone();
    } catch (e) {
      setErr(e.message);
    } finally { setLoading(false); }
  }

  return (
    <form onSubmit={submit} className="rounded-2xl p-5 space-y-4 mb-4" style={{ background: T.card, border: `1px solid ${T.border}` }}>
      <div>
        <label className="block text-[11px] uppercase tracking-widest mb-2" style={{ color: T.dim }}>Procedimento</label>
        <select value={procedure_name} onChange={e => setProc(e.target.value)}
          className="w-full rounded-lg px-3 py-2.5 text-sm" style={{ background: T.surface, border: `1px solid ${T.border}`, color: T.text }}>
          <option value="">Selecione...</option>
          {procedures.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
          <option value="Avaliação">Avaliação</option>
          <option value="Retorno">Retorno</option>
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[11px] uppercase tracking-widest mb-2" style={{ color: T.dim }}>Data</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} min={new Date().toISOString().slice(0,10)}
            className="w-full rounded-lg px-3 py-2.5 text-sm" style={{ background: T.surface, border: `1px solid ${T.border}`, color: T.text }} />
        </div>
        <div>
          <label className="block text-[11px] uppercase tracking-widest mb-2" style={{ color: T.dim }}>Horário</label>
          <input type="time" value={time} onChange={e => setTime(e.target.value)}
            className="w-full rounded-lg px-3 py-2.5 text-sm" style={{ background: T.surface, border: `1px solid ${T.border}`, color: T.text }} />
        </div>
      </div>
      {err && <p className="text-sm" style={{ color: "#f87171" }}>{err}</p>}
      <div className="flex gap-2">
        <button type="submit" disabled={loading}
          className="flex-1 rounded-lg py-2.5 text-sm font-semibold" style={{ background: T.gold, color: "#0A0A0A" }}>
          {loading ? "Enviando..." : "Solicitar"}
        </button>
        <a href={whatsappLink(whatsappNumber, WHATSAPP_MESSAGES.agendar)} target="_blank" rel="noopener noreferrer"
          className="flex items-center justify-center rounded-lg px-4" style={{ background: T.goldSoft, border: `1px solid ${T.gold}40` }}>
          <MessageCircle className="h-4 w-4" style={{ color: T.gold }} />
        </a>
      </div>
    </form>
  );
}

function Header() {
  return (
    <div className="mb-5">
      <p className="text-[11px] uppercase tracking-widest mb-1" style={{ color: T.dim }}>Sua agenda</p>
      <h1 className="font-serif text-xl" style={{ color: T.text }}>Meus agendamentos</h1>
    </div>
  );
}

function ApptBadge({ status }) {
  const map = {
    scheduled: { label: "Agendado", color: T.gold, icon: Calendar },
    confirmed: { label: "Confirmado", color: "#34d399", icon: CheckCircle2 },
    completed: { label: "Realizado", color: "#34d399", icon: CheckCircle2 },
    cancelled: { label: "Cancelado", color: "#f87171", icon: XCircle },
    no_show: { label: "Faltou", color: T.dim, icon: XCircle },
  };
  const s = map[status] || map.scheduled;
  const Icon = s.icon;
  return <span className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full flex-shrink-0" style={{ background: `${s.color}15`, color: s.color, border: `1px solid ${s.color}30` }}><Icon className="h-3 w-3" /> {s.label}</span>;
}