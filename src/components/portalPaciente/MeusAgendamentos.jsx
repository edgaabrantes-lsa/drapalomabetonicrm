import React, { useEffect, useState, useMemo, useCallback } from "react";
import { T, portalApi, openWhatsapp } from "./portalConfig";
import { Loader2, Calendar, Clock, CheckCircle2, XCircle, ChevronLeft, ChevronRight, MessageCircle } from "lucide-react";
import { format, parseISO, startOfWeek, addDays, addWeeks, addMonths, isBefore } from "date-fns";
import { ptBR } from "date-fns/locale";

const TIPOS = [
  { key: "consulta", label: "Consulta" },
  { key: "retorno", label: "Retorno" },
  { key: "avaliacao", label: "Avaliação" },
  { key: "procedimento", label: "Procedimento" },
  { key: "manutencao", label: "Manutenção" },
];

const SLOT_MIN = 9;
const SLOT_MAX = 18;
const SLOT_DURATION = 60;

function daySlots(date) {
  const dow = date.getDay();
  const maxHour = dow === 6 ? 13 : SLOT_MAX;
  const slots = [];
  for (let h = SLOT_MIN; h < maxHour; h++) {
    const start = new Date(date);
    start.setHours(h, 0, 0, 0);
    const end = new Date(start.getTime() + SLOT_DURATION * 60000);
    slots.push({ start, end });
  }
  return slots;
}

function overlaps(aStart, aEnd, bStart, bEnd) {
  return new Date(aStart) < new Date(bEnd) && new Date(aEnd) > new Date(bStart);
}

export default function MeusAgendamentos({ token, whatsappNumber }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [busy, setBusy] = useState([]);
  const [googleConfigured, setGoogleConfigured] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [tipo, setTipo] = useState("avaliacao");
  const [procedure, setProcedure] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState("");
  const [done, setDone] = useState(false);

  const loadAppts = useCallback(async () => {
    setLoading(true);
    try {
      const d = await portalApi("agendamentos", { token });
      setData(d);
    } catch { setData({ appointments: [], procedures: [] }); }
    finally { setLoading(false); }
  }, [token]);

  const loadBusy = useCallback(async (ws) => {
    setLoadingSlots(true);
    const startISO = new Date(ws.getFullYear(), ws.getMonth(), ws.getDate(), 0, 0, 0, 0).toISOString();
    const we = addDays(ws, 7);
    const endISO = new Date(we.getFullYear(), we.getMonth(), we.getDate(), 0, 0, 0, 0).toISOString();
    try {
      const d = await portalApi("disponibilidade", { token, start_date: startISO, end_date: endISO });
      setBusy([...(d.busy || []), ...(d.google_busy || [])]);
      setGoogleConfigured(!!d.google_configured);
    } catch { setBusy([]); setGoogleConfigured(false); }
    finally { setLoadingSlots(false); }
  }, [token]);

  useEffect(() => { loadAppts(); }, [loadAppts]);
  useEffect(() => { loadBusy(weekStart); }, [weekStart, loadBusy]);

  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);
  const today = new Date();

  const isSlotBusy = (slot) => busy.some(b => overlaps(slot.start, slot.end, b.start, b.end));
  const isSlotPast = (slot) => slot.end <= today;
  const isDayPast = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59) < today;

  function canGoPrev() {
    const thisWeekStart = startOfWeek(today, { weekStartsOn: 1 });
    return !isBefore(addWeeks(weekStart, -1), thisWeekStart);
  }

  function goPrev() { if (canGoPrev()) setWeekStart(addWeeks(weekStart, -1)); }
  function goNext() { setWeekStart(addWeeks(weekStart, 1)); }
  function goNextMonth() { setWeekStart(startOfWeek(addMonths(weekStart, 1), { weekStartsOn: 1 })); }

  function selectDay(d) {
    if (isDayPast(d)) return;
    setSelectedDay(d);
    setSelectedSlot(null);
    setErr(""); setDone(false);
  }

  async function confirm() {
    setErr(""); setDone(false);
    if (!selectedSlot) { setErr("Escolha um horário disponível."); return; }
    if (!tipo) { setErr("Escolha o tipo de agendamento."); return; }
    const procName = tipo === "procedimento"
      ? (procedure || "Procedimento")
      : (TIPOS.find(t => t.key === tipo)?.label || "Agendamento");
    setSubmitting(true);
    try {
      const res = await portalApi("agendar", {
        token,
        procedure_name: procName,
        tipo,
        start_time: selectedSlot.start.toISOString(),
        duration_minutes: SLOT_DURATION,
      });
      if (res?.error) throw new Error(res.error);
      setDone(true);
      setSelectedSlot(null); setSelectedDay(null); setProcedure("");
      loadAppts();
      loadBusy(weekStart);
    } catch (e) { setErr(e.message || "Não foi possível agendar. Tente outro horário."); }
    finally { setSubmitting(false); }
  }

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-7 w-7 animate-spin" style={{ color: T.wine }} /></div>;

  const appts = (data?.appointments || []).filter(a => new Date(a.start_time) >= new Date(new Date().setHours(0, 0, 0, 0)) && a.status !== "cancelled");
  const weekEnd = addDays(weekStart, 6);

  return (
    <div className="px-5 py-6">
      <Header />

      {/* Próximos agendamentos */}
      {appts.length > 0 && (
        <div className="mb-6">
          <p className="text-[10px] uppercase mb-2" style={{ color: T.wine, letterSpacing: "0.14em", fontWeight: 600 }}>Próximos agendamentos</p>
          <div className="space-y-2.5">
            {appts.map(a => (
              <div key={a.id} className="rounded-xl p-4" style={{ background: T.card, border: `1px solid ${T.border}` }}>
                <div className="flex items-start justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: T.text }}>{a.procedure_name}</p>
                    <div className="flex items-center gap-2 mt-1.5 text-xs" style={{ color: T.muted }}>
                      <Calendar className="h-3.5 w-3.5" />
                      {format(parseISO(a.start_time), "dd 'de' MMMM', às' HH:mm", { locale: ptBR })}
                    </div>
                    {a.duration_minutes && (
                      <div className="flex items-center gap-2 mt-1 text-xs" style={{ color: T.dim }}>
                        <Clock className="h-3 w-3" /> {a.duration_minutes} min
                      </div>
                    )}
                  </div>
                  <ApptBadge status={a.status} />
                </div>
                <div className="flex gap-2 mt-3 pt-3 border-t" style={{ borderColor: T.border }}>
                  <button onClick={() => solicitar("remarcar", a.id, a.procedure_name, token)}
                    className="flex-1 text-center rounded-lg py-2.5 text-sm font-medium"
                    style={{ background: T.wineSoft, border: `1px solid ${T.wine}40`, color: T.wine }}>
                    Remarcar
                  </button>
                  <button onClick={() => solicitar("cancelar", a.id, a.procedure_name, token)}
                    className="flex-1 rounded-lg py-2.5 text-sm font-medium"
                    style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.25)", color: "#c0392b" }}>
                    Cancelar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Agenda semanal */}
      <div className="rounded-2xl p-4 mb-4" style={{ background: T.card, border: `1px solid ${T.border}` }}>
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] uppercase" style={{ color: T.wine, letterSpacing: "0.14em", fontWeight: 600 }}>Escolha um horário</p>
          {googleConfigured && (
            <span className="text-[10px] flex items-center gap-1" style={{ color: T.muted }}>
              <span style={{ width: 6, height: 6, borderRadius: 999, background: "#34d399", display: "inline-block" }} /> Agenda sincronizada
            </span>
          )}
        </div>

        <div className="flex items-center justify-between mb-4">
          <button onClick={goPrev} disabled={!canGoPrev()}
            className="flex items-center justify-center rounded-lg transition-opacity disabled:opacity-30"
            style={{ width: 36, height: 36, background: T.surface, border: `1px solid ${T.border}`, color: T.text }}>
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="text-center">
            <p className="text-sm font-medium" style={{ color: T.text }}>
              {format(weekStart, "dd 'de' MMM", { locale: ptBR })} — {format(weekEnd, "dd 'de' MMM 'de' yyyy", { locale: ptBR })}
            </p>
            <p className="text-[10px] uppercase" style={{ color: T.dim, letterSpacing: "0.1em" }}>Visão semanal</p>
          </div>
          <button onClick={goNext}
            className="flex items-center justify-center rounded-lg"
            style={{ width: 36, height: 36, background: T.surface, border: `1px solid ${T.border}`, color: T.text }}>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="flex gap-2 mb-3">
          <button onClick={goPrev} disabled={!canGoPrev()}
            className="flex-1 rounded-lg py-2 text-xs font-medium transition-opacity disabled:opacity-30"
            style={{ background: T.surface, border: `1px solid ${T.border}`, color: T.muted }}>
            Semana anterior
          </button>
          <button onClick={goNext}
            className="flex-1 rounded-lg py-2 text-xs font-medium"
            style={{ background: T.surface, border: `1px solid ${T.border}`, color: T.muted }}>
            Próxima semana
          </button>
          <button onClick={goNextMonth}
            className="flex-1 rounded-lg py-2 text-xs font-medium"
            style={{ background: T.wineSoft, border: `1px solid ${T.wine}40`, color: T.wine }}>
            Próximo mês
          </button>
        </div>

        {/* Dias — cards com rolagem horizontal no mobile */}
        <div className="flex gap-2 overflow-x-auto pb-2 portal-cat-scroll" style={{ scrollbarWidth: "thin" }}>
          {days.map((d) => {
            const past = isDayPast(d);
            const active = selectedDay && format(selectedDay, "yyyy-MM-dd") === format(d, "yyyy-MM-dd");
            const dow = d.getDay();
            const hasSlots = (dow === 0 ? false : true) && !past;
            return (
              <button key={format(d, "yyyy-MM-dd")} onClick={() => selectDay(d)} disabled={!hasSlots}
                className="flex-shrink-0 flex flex-col items-center justify-center rounded-xl transition-all disabled:opacity-40"
                style={{
                  width: 64, height: 78, padding: 8,
                  background: active ? T.wine : T.surface,
                  border: `1px solid ${active ? T.wine : T.border}`,
                  color: active ? T.offWhite : T.text,
                }}>
                <span className="text-[10px] uppercase" style={{ opacity: 0.8, letterSpacing: "0.08em" }}>{format(d, "EEE", { locale: ptBR })}</span>
                <span className="text-lg font-semibold" style={{ lineHeight: 1 }}>{format(d, "dd")}</span>
                <span className="text-[9px]" style={{ opacity: 0.7 }}>{past ? "—" : "ver"}</span>
              </button>
            );
          })}
        </div>

        {/* Slots do dia selecionado */}
        {selectedDay && (
          <div className="mt-4 pt-4 border-t" style={{ borderColor: T.border }}>
            <p className="text-xs mb-3" style={{ color: T.muted }}>
              {format(selectedDay, "EEEE, dd 'de' MMMM", { locale: ptBR })} · horários disponíveis
            </p>
            {loadingSlots ? (
              <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin" style={{ color: T.wine }} /></div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {daySlots(selectedDay).map((slot) => {
                  const busySlot = isSlotBusy(slot);
                  const past = isSlotPast(slot);
                  const unavailable = busySlot || past;
                  const activeSel = selectedSlot && format(selectedSlot.start, "HH:mm") === format(slot.start, "HH:mm") &&
                    format(selectedDay, "yyyy-MM-dd") === format(selectedSlot.start, "yyyy-MM-dd");
                  return (
                    <button key={format(slot.start, "HH:mm")} disabled={unavailable} onClick={() => { setSelectedSlot(slot); setErr(""); setDone(false); }}
                      className="rounded-lg py-2.5 text-sm font-medium transition-all disabled:cursor-not-allowed"
                      style={{
                        background: activeSel ? T.wine : unavailable ? T.surface : T.card,
                        border: `1px solid ${activeSel ? T.wine : unavailable ? T.border : T.borderStrong}`,
                        color: activeSel ? T.offWhite : unavailable ? T.dim : T.text,
                        textDecoration: unavailable ? "line-through" : "none",
                        opacity: unavailable ? 0.55 : 1,
                      }}>
                      {format(slot.start, "HH:mm")}
                    </button>
                  );
                })}
              </div>
            )}
            {daySlots(selectedDay).every(s => isSlotBusy(s) || isSlotPast(s)) && !loadingSlots && (
              <p className="text-xs mt-3 text-center" style={{ color: T.dim }}>Nenhum horário disponível neste dia.</p>
            )}
          </div>
        )}

        {/* Tipo + confirmação */}
        {selectedSlot && (
          <div className="mt-4 pt-4 border-t space-y-3" style={{ borderColor: T.border }}>
            <div>
              <label className="block text-[10px] uppercase mb-2" style={{ color: T.dim, letterSpacing: "0.12em" }}>Tipo de agendamento</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {TIPOS.map(t => (
                  <button key={t.key} onClick={() => setTipo(t.key)}
                    className="rounded-lg py-2.5 text-sm font-medium transition-all"
                    style={{
                      background: tipo === t.key ? T.wine : T.surface,
                      border: `1px solid ${tipo === t.key ? T.wine : T.border}`,
                      color: tipo === t.key ? T.offWhite : T.text,
                    }}>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {tipo === "procedimento" && (
              <div>
                <label className="block text-[10px] uppercase mb-2" style={{ color: T.dim, letterSpacing: "0.12em" }}>Procedimento</label>
                <select value={procedure} onChange={e => setProcedure(e.target.value)}
                  className="w-full rounded-lg px-3 py-2.5 text-sm"
                  style={{ background: T.surface, border: `1px solid ${T.border}`, color: T.text }}>
                  <option value="">Selecione...</option>
                  {(data?.procedures || []).map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                </select>
              </div>
            )}

            <div className="text-xs" style={{ color: T.muted }}>
              Horário selecionado: <span style={{ color: T.wine, fontWeight: 600 }}>
                {format(selectedSlot.start, "dd/MM 'às' HH:mm")}
              </span>
            </div>

            {err && <p className="text-sm" style={{ color: "#c0392b" }}>{err}</p>}
            {done && (
              <p className="text-sm flex items-center gap-2" style={{ color: "#2e7d57" }}>
                <CheckCircle2 className="h-4 w-4" /> Agendamento solicitado! Aguarde a confirmação da equipe.
              </p>
            )}

            <button onClick={confirm} disabled={submitting}
              className="w-full flex items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold disabled:opacity-60"
              style={{ background: T.wine, color: T.offWhite, border: "none" }}>
              {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Confirmando...</> : "Confirmar agendamento"}
            </button>
          </div>
        )}
      </div>

      {/* WhatsApp */}
      <button onClick={() => openWhatsapp(token, "agendamentos")}
        className="w-full flex items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-medium"
        style={{ background: T.wineSoft, border: `1px solid ${T.wine}40`, color: T.wine }}>
        <MessageCircle className="h-4 w-4" /> Tirar dúvida no WhatsApp
      </button>
    </div>
  );
}

async function solicitar(tipo, appointmentId, procName, token) {
  const motivo = tipo === "cancelar" ? "Cancelamento solicitado pela paciente" : "Remarcação solicitada pela paciente";
  if (!confirm(`Confirmar ${tipo === "cancelar" ? "cancelamento" : "remarcação"} de "${procName}"? Sua solicitação será enviada à equipe.`)) return;
  try {
    await portalApi(tipo, { token, appointment_id: appointmentId, motivo, procedimento_vinculado: procName });
    alert("Solicitação enviada. Nossa equipe entrará em contato.");
  } catch (e) { alert(e.message || "Não foi possível enviar a solicitação."); }
}

function Header() {
  return (
    <div className="mb-5">
      <p className="text-[11px] uppercase mb-1" style={{ color: T.dim, letterSpacing: "0.14em" }}>Sua agenda</p>
      <h1 className="text-xl" style={{ color: T.text, fontWeight: 600, letterSpacing: "-0.01em" }}>Meus agendamentos</h1>
      <p className="text-sm mt-2 leading-relaxed" style={{ color: T.muted }}>
        Veja dias e horários disponíveis e agende seu próximo cuidado.
      </p>
    </div>
  );
}

function ApptBadge({ status }) {
  const map = {
    scheduled: { label: "Agendado", color: T.wine },
    confirmed: { label: "Confirmado", color: "#2e7d57" },
    completed: { label: "Realizado", color: "#2e7d57" },
    cancelled: { label: "Cancelado", color: "#c0392b" },
    no_show: { label: "Faltou", color: T.dim },
  };
  const s = map[status] || map.scheduled;
  const Icon = status === "confirmed" || status === "completed" ? CheckCircle2 : status === "cancelled" ? XCircle : Calendar;
  return (
    <span className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full flex-shrink-0"
      style={{ background: `${s.color}14`, color: s.color, border: `1px solid ${s.color}30` }}>
      <Icon className="h-3 w-3" /> {s.label}
    </span>
  );
}