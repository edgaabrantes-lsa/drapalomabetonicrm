import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  format, parseISO, startOfWeek, endOfWeek, eachDayOfInterval,
  addDays, addWeeks, subWeeks, addMonths, subMonths,
  isSameDay, isToday, setHours, setMinutes,
  startOfMonth, endOfMonth, eachDayOfInterval as eachDay
} from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Plus, ChevronLeft, ChevronRight, Clock, User,
  Calendar as CalendarIcon, List, Grid3X3, LayoutGrid
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

// ── Tokens LSA Dark ──────────────────────────────────────────────
const T = {
  pearl: "#111620",
  white: "#171D29",
  onyx: "#E8EDF5",
  charcoal: "#8A95AA",
  subtle: "#252D3E",
  gold: "#C5A059",
};

// Status config LSA — dots only, no big badges
const statusDot = {
  scheduled:   { dot: T.gold,    label: "Agendado" },
  confirmed:   { dot: T.onyx,    label: "Confirmado" },
  in_progress: { dot: T.gold,    label: "Em Andamento" },
  completed:   { dot: "#CCCCCC", label: "Concluído" },
  cancelled:   { dot: "#E53935", label: "Cancelado" },
  no_show:     { dot: "#E53935", label: "Não Compareceu" },
};

const HOUR_HEIGHT = 64;
const DAY_START = 8;
const DAY_END = 20;

const timeSlots = Array.from({ length: (DAY_END - DAY_START) * 2 }, (_, i) => {
  const hour = DAY_START + Math.floor(i / 2);
  const mins = (i % 2) * 30;
  return `${String(hour).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
});

// ── Appointment Form ─────────────────────────────────────────
const AppointmentForm = ({ appointment, patients, procedures, professionals, rooms, onSave, onClose }) => {
  const [formData, setFormData] = useState(appointment || {
    patient_id: "", patient_name: "", professional_id: "", professional_name: "",
    room_id: "", procedure_id: "", procedure_name: "",
    start_time: "", duration_minutes: 60, status: "scheduled", notes: "", price: 0
  });
  const [selectedDate, setSelectedDate] = useState(
    appointment?.start_time ? parseISO(appointment.start_time) : new Date()
  );
  const [selectedTime, setSelectedTime] = useState(
    appointment?.start_time ? format(parseISO(appointment.start_time), "HH:mm") : "09:00"
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    const [hours, minutes] = selectedTime.split(":").map(Number);
    const startTime = setMinutes(setHours(selectedDate, hours), minutes);
    const endTime = new Date(startTime.getTime() + (formData.duration_minutes || 60) * 60000);
    onSave({ ...formData, start_time: startTime.toISOString(), end_time: endTime.toISOString() });
  };

  const inputStyle = {
    background: T.pearl, border: `1px solid ${T.subtle}`,
    borderRadius: 2, color: T.onyx, fontFamily: "Inter",
    fontSize: 13, padding: "8px 12px", width: "100%",
  };
  const labelStyle = {
    fontFamily: "Inter", fontSize: 10, letterSpacing: "0.12em",
    textTransform: "uppercase", color: T.charcoal, display: "block", marginBottom: 6,
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label style={labelStyle}>Paciente *</label>
          <Select value={formData.patient_id} onValueChange={v => {
            const p = patients.find(x => x.id === v);
            setFormData(prev => ({ ...prev, patient_id: v, patient_name: p?.full_name || "" }));
          }}>
            <SelectTrigger style={{ ...inputStyle, height: 38 }}>
              <SelectValue placeholder="Selecione o paciente" />
            </SelectTrigger>
            <SelectContent>
              {patients.map(p => <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="col-span-2">
          <label style={labelStyle}>Procedimento *</label>
          <Select value={formData.procedure_id} onValueChange={v => {
            const proc = procedures.find(x => x.id === v);
            setFormData(prev => ({ ...prev, procedure_id: v, procedure_name: proc?.name || "", duration_minutes: proc?.duration_minutes || 60, price: proc?.price || 0 }));
          }}>
            <SelectTrigger style={{ ...inputStyle, height: 38 }}>
              <SelectValue placeholder="Selecione o procedimento" />
            </SelectTrigger>
            <SelectContent>
              {procedures.map(p => <SelectItem key={p.id} value={p.id}>{p.name} ({p.duration_minutes}min)</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label style={labelStyle}>Data *</label>
          <Popover>
            <PopoverTrigger asChild>
              <button type="button" style={{ ...inputStyle, display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                <CalendarIcon size={14} color={T.charcoal} />
                {format(selectedDate, "dd/MM/yyyy")}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar mode="single" selected={selectedDate} onSelect={d => d && setSelectedDate(d)} locale={ptBR} />
            </PopoverContent>
          </Popover>
        </div>
        <div>
          <label style={labelStyle}>Horário *</label>
          <Select value={selectedTime} onValueChange={setSelectedTime}>
            <SelectTrigger style={{ ...inputStyle, height: 38 }}><SelectValue /></SelectTrigger>
            <SelectContent className="max-h-52">
              {timeSlots.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label style={labelStyle}>Profissional</label>
          <Select value={formData.professional_id} onValueChange={v => {
            const prof = professionals.find(x => x.id === v);
            setFormData(prev => ({ ...prev, professional_id: v, professional_name: prof?.name || "" }));
          }}>
            <SelectTrigger style={{ ...inputStyle, height: 38 }}>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              {professionals.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label style={labelStyle}>Sala</label>
          <Select value={formData.room_id} onValueChange={v => setFormData(prev => ({ ...prev, room_id: v }))}>
            <SelectTrigger style={{ ...inputStyle, height: 38 }}>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              {rooms.map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label style={labelStyle}>Duração (min)</label>
          <input type="number" value={formData.duration_minutes}
            onChange={e => setFormData(prev => ({ ...prev, duration_minutes: parseInt(e.target.value) }))}
            style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Valor (R$)</label>
          <input type="number" value={formData.price}
            onChange={e => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) }))}
            style={inputStyle} />
        </div>
        <div className="col-span-2">
          <label style={labelStyle}>Observações</label>
          <textarea value={formData.notes}
            onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            rows={2} style={{ ...inputStyle, resize: "vertical" }} />
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, paddingTop: 8 }}>
        <button type="button" onClick={onClose} style={{
          background: "none", border: `1px solid ${T.subtle}`, borderRadius: 2,
          fontFamily: "Inter", fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase",
          color: T.charcoal, padding: "10px 20px", cursor: "pointer",
        }}>Cancelar</button>
        <button type="submit" style={{
          background: T.onyx, color: "#fff", border: "none", borderRadius: 2,
          fontFamily: "Inter", fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase",
          padding: "10px 20px", cursor: "pointer",
        }}>
          {appointment?.id ? "Salvar Alterações" : "Confirmar Agendamento"}
        </button>
      </div>
    </form>
  );
};

// ── Day View ─────────────────────────────────────────────────
const DayView = ({ date, appointments, onClickAppointment, onClickSlot }) => {
  const hours = Array.from({ length: DAY_END - DAY_START }, (_, i) => DAY_START + i);
  const dayAppts = appointments
    .filter(a => a.start_time && isSameDay(parseISO(a.start_time), date))
    .sort((a, b) => new Date(a.start_time) - new Date(b.start_time));

  return (
    <div style={{ display: "flex", overflow: "auto", maxHeight: 600 }}>
      {/* Time axis */}
      <div style={{ width: 56, flexShrink: 0 }}>
        {hours.map(h => (
          <div key={h} style={{ height: HOUR_HEIGHT, display: "flex", alignItems: "flex-start", justifyContent: "flex-end", paddingRight: 12, paddingTop: 4 }}>
            <span style={{ fontFamily: "Inter", fontSize: 11, color: "#BCBCBC" }}>{h}:00</span>
          </div>
        ))}
      </div>
      {/* Grid */}
      <div style={{ flex: 1, position: "relative", borderLeft: `0.5px solid ${T.subtle}` }}>
        {hours.map(h => (
          <div key={h} onClick={() => onClickSlot(date, h)}
            style={{ height: HOUR_HEIGHT, borderBottom: `1px solid ${T.subtle}`, cursor: "pointer" }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(197,160,89,0.03)"}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
          />
        ))}
        {dayAppts.map(appt => {
          const start = parseISO(appt.start_time);
          const top = ((start.getHours() - DAY_START) + start.getMinutes() / 60) * HOUR_HEIGHT;
          const height = Math.max(((appt.duration_minutes || 60) / 60) * HOUR_HEIGHT, 28);
          const cfg = statusDot[appt.status] || statusDot.scheduled;
          return (
            <div key={appt.id} onClick={e => { e.stopPropagation(); onClickAppointment(appt); }}
              style={{
                position: "absolute", left: 4, right: 4,
                top, height, borderRadius: 2,
                background: T.white, borderLeft: `3px solid ${cfg.dot}`,
                border: `1px solid ${T.subtle}`, borderLeftColor: cfg.dot,
                padding: "4px 8px", cursor: "pointer",
                boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
              }}>
              <p style={{ fontFamily: "'Playfair Display', serif", fontStyle: "italic", fontSize: 12, color: T.onyx, margin: 0 }}>
                {appt.patient_name}
              </p>
              {height > 40 && (
                <p style={{ fontFamily: "Inter", fontSize: 9, letterSpacing: "0.08em", textTransform: "uppercase", color: T.charcoal, margin: "2px 0 0" }}>
                  {appt.procedure_name}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ── Week View ─────────────────────────────────────────────────
const WeekView = ({ weekDays, appointments, onClickAppointment, onClickSlot }) => {
  const hours = Array.from({ length: DAY_END - DAY_START }, (_, i) => DAY_START + i);

  return (
    <div style={{ overflowX: "auto" }}>
      <div style={{ minWidth: 700 }}>
        {/* Header */}
        <div style={{ display: "grid", gridTemplateColumns: "56px repeat(7, 1fr)", borderBottom: `1px solid ${T.subtle}` }}>
          <div />
          {weekDays.map(day => (
            <div key={day.toISOString()} style={{
              padding: "12px 8px", textAlign: "center",
              borderLeft: `1px solid ${T.subtle}`,
              background: isToday(day) ? "rgba(197,160,89,0.05)" : "transparent",
            }}>
              <p style={{ fontFamily: "Inter", fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", color: T.charcoal }}>
                {format(day, "EEE", { locale: ptBR })}
              </p>
              <p style={{
                fontFamily: isToday(day) ? "'Playfair Display', serif" : "Inter",
                fontSize: isToday(day) ? 20 : 18, fontWeight: 300,
                color: isToday(day) ? T.gold : T.onyx, marginTop: 2,
              }}>
                {format(day, "d")}
              </p>
              <p style={{ fontFamily: "Inter", fontSize: 9, color: T.charcoal, marginTop: 1 }}>
                {format(day, "MMM", { locale: ptBR })}
              </p>
            </div>
          ))}
        </div>
        {/* Time grid */}
        <div style={{ display: "flex", overflow: "auto", maxHeight: 560 }}>
          <div style={{ width: 56, flexShrink: 0 }}>
            {hours.map(h => (
              <div key={h} style={{ height: HOUR_HEIGHT, display: "flex", alignItems: "flex-start", justifyContent: "flex-end", paddingRight: 10, paddingTop: 4 }}>
                <span style={{ fontFamily: "Inter", fontSize: 11, color: "#BCBCBC" }}>{h}:00</span>
              </div>
            ))}
          </div>
          {weekDays.map(day => {
            const dayAppts = appointments
              .filter(a => a.start_time && isSameDay(parseISO(a.start_time), day))
              .sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
            return (
              <div key={day.toISOString()} style={{
                flex: 1, position: "relative",
                borderLeft: `0.5px solid ${T.subtle}`,
                background: isToday(day) ? "rgba(197,160,89,0.02)" : "transparent",
              }}>
                {hours.map(h => (
                  <div key={h} onClick={() => onClickSlot(day, h)}
                    style={{ height: HOUR_HEIGHT, borderBottom: `1px solid ${T.subtle}`, cursor: "pointer" }} />
                ))}
                {dayAppts.map(appt => {
                  const start = parseISO(appt.start_time);
                  const top = ((start.getHours() - DAY_START) + start.getMinutes() / 60) * HOUR_HEIGHT;
                  const height = Math.max(((appt.duration_minutes || 60) / 60) * HOUR_HEIGHT, 24);
                  const cfg = statusDot[appt.status] || statusDot.scheduled;
                  return (
                    <div key={appt.id} onClick={e => { e.stopPropagation(); onClickAppointment(appt); }}
                      style={{
                        position: "absolute", left: 2, right: 2, top, height,
                        background: T.white, borderLeft: `2px solid ${cfg.dot}`,
                        border: `1px solid ${T.subtle}`, borderLeftColor: cfg.dot,
                        borderRadius: 2, padding: "3px 6px", cursor: "pointer",
                        overflow: "hidden",
                      }}>
                      <p style={{ fontFamily: "'Playfair Display', serif", fontStyle: "italic", fontSize: 11, color: T.onyx, margin: 0 }}>
                        {appt.patient_name}
                      </p>
                      {height > 36 && (
                        <p style={{ fontFamily: "Inter", fontSize: 8, letterSpacing: "0.06em", textTransform: "uppercase", color: T.charcoal }}>
                          {appt.procedure_name}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ── Month View ────────────────────────────────────────────────
const MonthView = ({ currentDate, appointments, onClickAppointment, onClickSlot }) => {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const calDays = eachDayOfInterval({ start: calStart, end: calEnd });

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", borderBottom: `1px solid ${T.subtle}` }}>
        {["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"].map(d => (
          <div key={d} style={{ padding: "10px 0", textAlign: "center", fontFamily: "Inter", fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", color: T.charcoal }}>
            {d}
          </div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)" }}>
        {calDays.map(day => {
          const dayAppts = appointments.filter(a => a.start_time && isSameDay(parseISO(a.start_time), day));
          const isCurrentMonth = day.getMonth() === currentDate.getMonth();
          return (
            <div key={day.toISOString()} onClick={() => onClickSlot(day, 9)}
              style={{
                minHeight: 90, padding: 8,
                borderBottom: `1px solid ${T.subtle}`, borderRight: `1px solid ${T.subtle}`,
                cursor: "pointer",
                background: isToday(day) ? "rgba(197,160,89,0.04)" : "transparent",
                opacity: isCurrentMonth ? 1 : 0.3,
              }}>
              <p style={{
                fontFamily: isToday(day) ? "'Playfair Display', serif" : "Inter",
                fontSize: 12, fontWeight: isToday(day) ? 500 : 300,
                color: isToday(day) ? T.gold : T.onyx, marginBottom: 4,
              }}>
                {format(day, "d")}
              </p>
              {dayAppts.slice(0, 2).map(appt => {
                const cfg = statusDot[appt.status] || statusDot.scheduled;
                return (
                  <div key={appt.id} onClick={e => { e.stopPropagation(); onClickAppointment(appt); }}
                    style={{
                      display: "flex", alignItems: "center", gap: 4,
                      marginBottom: 2, cursor: "pointer",
                    }}>
                    <span style={{ width: 4, height: 4, borderRadius: "50%", background: cfg.dot, flexShrink: 0 }} />
                    <span style={{ fontFamily: "Inter", fontSize: 9, color: T.charcoal, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {format(parseISO(appt.start_time), "HH:mm")} {appt.patient_name}
                    </span>
                  </div>
                );
              })}
              {dayAppts.length > 2 && (
                <p style={{ fontFamily: "Inter", fontSize: 9, color: T.charcoal }}>+{dayAppts.length - 2}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ── List View — "The Exclusive Timeline" ─────────────────────
const ListView = ({ appointments, onClickAppointment }) => {
  const sorted = [...appointments].sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
  const grouped = sorted.reduce((acc, apt) => {
    if (!apt.start_time) return acc;
    const key = format(parseISO(apt.start_time), "yyyy-MM-dd");
    if (!acc[key]) acc[key] = [];
    acc[key].push(apt);
    return acc;
  }, {});

  if (Object.keys(grouped).length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "60px 0", color: T.charcoal }}>
        <CalendarIcon size={32} style={{ margin: "0 auto 16px", opacity: 0.2 }} />
        <p style={{ fontFamily: "Inter", fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase" }}>
          Nenhuma consulta agendada
        </p>
      </div>
    );
  }

  return (
    <div>
      {Object.entries(grouped).map(([dateKey, appts]) => (
        <div key={dateKey} style={{ marginBottom: 32 }}>
          {/* Date heading */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <p style={{
              fontFamily: isToday(parseISO(dateKey)) ? "'Playfair Display', serif" : "Inter",
              fontSize: isToday(parseISO(dateKey)) ? 16 : 11,
              fontStyle: isToday(parseISO(dateKey)) ? "normal" : "normal",
              letterSpacing: isToday(parseISO(dateKey)) ? "0.02em" : "0.12em",
              textTransform: isToday(parseISO(dateKey)) ? "none" : "uppercase",
              color: isToday(parseISO(dateKey)) ? T.onyx : T.charcoal,
              fontWeight: 400,
            }}>
              {isToday(parseISO(dateKey)) ? "Hoje" : format(parseISO(dateKey), "EEEE, d 'de' MMMM", { locale: ptBR })}
            </p>
            {isToday(parseISO(dateKey)) && (
              <span style={{
                fontFamily: "Inter", fontSize: 9, letterSpacing: "0.15em",
                textTransform: "uppercase", color: T.gold,
              }}>
                {format(parseISO(dateKey), "d 'de' MMMM", { locale: ptBR })}
              </span>
            )}
          </div>

          {/* Timeline */}
          <div style={{ display: "flex", gap: 0 }}>
            {/* Vertical line */}
            <div style={{ width: 56, flexShrink: 0, position: "relative" }}>
              <div style={{ position: "absolute", left: 28, top: 0, bottom: 0, width: "0.5px", background: T.subtle }} />
            </div>
            {/* Cards */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
              {appts.map(appt => {
                const cfg = statusDot[appt.status] || statusDot.scheduled;
                return (
                  <div key={appt.id} style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
                    {/* Time to the left of the line */}
                    <div style={{ width: 56, flexShrink: 0, textAlign: "right", paddingRight: 16, paddingTop: 14 }}>
                      <span style={{ fontFamily: "Inter", fontSize: 11, color: "#BCBCBC" }}>
                        {format(parseISO(appt.start_time), "HH:mm")}
                      </span>
                    </div>
                    {/* "Invite" card */}
                    <div onClick={() => onClickAppointment(appt)}
                      style={{
                        flex: 1, background: T.white,
                        border: `1px solid ${T.subtle}`, borderRadius: 4,
                        padding: "16px 20px", cursor: "pointer",
                        boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
                        transition: "box-shadow 0.2s",
                        display: "flex", alignItems: "center", gap: 16,
                      }}
                      onMouseEnter={e => e.currentTarget.style.boxShadow = "0 8px 32px rgba(0,0,0,0.06)"}
                      onMouseLeave={e => e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.03)"}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{
                          fontFamily: "'Playfair Display', serif",
                          fontStyle: "italic",
                          fontSize: 18, color: T.onyx,
                          margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                        }}>
                          {appt.patient_name}
                        </p>
                        <p style={{
                          fontFamily: "Inter", fontSize: 10,
                          letterSpacing: "0.1em", textTransform: "uppercase",
                          color: T.charcoal, marginTop: 4,
                        }}>
                          {appt.procedure_name}{appt.professional_name ? ` — ${appt.professional_name}` : ""}
                        </p>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 16, flexShrink: 0 }}>
                        {appt.duration_minutes && (
                          <span style={{ fontFamily: "Inter", fontSize: 10, color: T.charcoal }}>
                            {appt.duration_minutes}min
                          </span>
                        )}
                        {appt.price > 0 && (
                          <span style={{ fontFamily: "Inter", fontSize: 13, fontWeight: 500, color: T.onyx }}>
                            R$ {appt.price.toLocaleString("pt-BR")}
                          </span>
                        )}
                        {/* Status dot */}
                        <span style={{
                          width: 8, height: 8, borderRadius: "50%",
                          background: cfg.dot, flexShrink: 0,
                        }} title={cfg.label} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// ── Appointment Detail ────────────────────────────────────────
const AppointmentDetail = ({ appointment, onClose, onStatusChange, onEdit }) => {
  if (!appointment) return null;
  const cfg = statusDot[appointment.status] || statusDot.scheduled;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 16, marginBottom: 24 }}>
        <div style={{ width: 44, height: 44, borderRadius: 2, background: T.pearl, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <User size={18} color={T.charcoal} />
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontFamily: "'Playfair Display', serif", fontStyle: "italic", fontSize: 20, color: T.onyx, margin: 0 }}>
            {appointment.patient_name}
          </p>
          <p style={{ fontFamily: "Inter", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: T.charcoal, marginTop: 4 }}>
            {appointment.procedure_name}
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: cfg.dot }} />
            <span style={{ fontFamily: "Inter", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: T.charcoal }}>
              {cfg.label}
            </span>
          </div>
        </div>
        <button onClick={onEdit} style={{
          background: "none", border: `1px solid ${T.subtle}`, borderRadius: 2,
          fontFamily: "Inter", fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase",
          color: T.charcoal, padding: "6px 14px", cursor: "pointer",
        }}>Editar</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
        {[
          { label: "Horário", value: appointment.start_time && format(parseISO(appointment.start_time), "dd/MM/yyyy HH:mm") },
          { label: "Duração", value: `${appointment.duration_minutes} min` },
          appointment.professional_name && { label: "Profissional", value: appointment.professional_name },
          appointment.price > 0 && { label: "Valor", value: `R$ ${appointment.price?.toLocaleString("pt-BR")}`, gold: true },
        ].filter(Boolean).map(item => (
          <div key={item.label} style={{
            background: T.pearl, borderRadius: 2, padding: "12px 14px",
            borderBottom: item.gold ? `2px solid ${T.gold}` : `1px solid ${T.subtle}`,
          }}>
            <p style={{ fontFamily: "Inter", fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", color: T.charcoal, marginBottom: 6 }}>
              {item.label}
            </p>
            <p style={{ fontFamily: "Inter", fontSize: 13, fontWeight: 500, color: item.gold ? T.gold : T.onyx }}>
              {item.value}
            </p>
          </div>
        ))}
      </div>

      {appointment.notes && (
        <div style={{ background: T.pearl, borderRadius: 2, padding: "12px 14px", marginBottom: 20 }}>
          <p style={{ fontFamily: "Inter", fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", color: T.charcoal, marginBottom: 6 }}>Observações</p>
          <p style={{ fontFamily: "Inter", fontSize: 12, color: T.onyx }}>{appointment.notes}</p>
        </div>
      )}

      <div>
        <p style={{ fontFamily: "Inter", fontSize: 9, letterSpacing: "0.15em", textTransform: "uppercase", color: T.charcoal, marginBottom: 10 }}>
          Atualizar Status
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>
          {["confirmed", "in_progress", "completed", "no_show", "cancelled"].map(status => {
            const s = statusDot[status];
            const isActive = appointment.status === status;
            return (
              <button key={status} onClick={() => onStatusChange(appointment.id, status)}
                style={{
                  background: isActive ? T.onyx : T.pearl,
                  color: isActive ? "#fff" : T.charcoal,
                  border: `1px solid ${isActive ? T.onyx : T.subtle}`,
                  borderRadius: 2, padding: "8px 4px", cursor: "pointer",
                  fontFamily: "Inter", fontSize: 9,
                  letterSpacing: "0.1em", textTransform: "uppercase",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                }}>
                <span style={{ width: 5, height: 5, borderRadius: "50%", background: s.dot, flexShrink: 0 }} />
                {s.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ── Main Page ─────────────────────────────────────────────────
export default function Agenda() {
  const queryClient = useQueryClient();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState("list");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState(null);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [prefilledTime, setPrefilledTime] = useState(null);

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const { data: appointments = [] } = useQuery({ queryKey: ["appointments"], queryFn: () => base44.entities.Appointment.list("-start_time", 500) });
  const { data: patients = [] } = useQuery({ queryKey: ["patients"], queryFn: () => base44.entities.Patient.list("-created_date", 1000) });
  const { data: procedures = [] } = useQuery({ queryKey: ["procedures"], queryFn: () => base44.entities.Procedure.list() });
  const { data: professionals = [] } = useQuery({ queryKey: ["professionals"], queryFn: () => base44.entities.Professional.list() });
  const { data: rooms = [] } = useQuery({ queryKey: ["rooms"], queryFn: () => base44.entities.Room.list() });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Appointment.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["appointments"] }); setIsFormOpen(false); setEditingAppointment(null); },
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Appointment.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["appointments"] }); setIsFormOpen(false); setEditingAppointment(null); setSelectedAppointment(null); },
  });

  const handleSave = (data) => {
    if (editingAppointment) updateMutation.mutate({ id: editingAppointment.id, data });
    else createMutation.mutate(data);
  };

  const handleClickSlot = (date, hour) => {
    setEditingAppointment(null);
    setPrefilledTime(setHours(date, hour));
    setIsFormOpen(true);
  };

  const handleNav = (dir) => {
    if (viewMode === "day") setCurrentDate(d => addDays(d, dir));
    else if (viewMode === "week") setCurrentDate(d => dir === 1 ? addWeeks(d, 1) : subWeeks(d, 1));
    else setCurrentDate(d => dir === 1 ? addMonths(d, 1) : subMonths(d, 1));
  };

  const todayAppts = appointments.filter(a => a.start_time && isToday(parseISO(a.start_time)));
  const todayRevenue = todayAppts.reduce((sum, a) => sum + (a.price || 0), 0);

  const getViewTitle = () => {
    if (viewMode === "day") return format(currentDate, "d 'de' MMMM 'de' yyyy", { locale: ptBR });
    if (viewMode === "week") return `${format(weekStart, "d 'de' MMMM", { locale: ptBR })} — ${format(weekEnd, "d 'de' MMMM 'de' yyyy", { locale: ptBR })}`;
    if (viewMode === "month") return format(currentDate, "MMMM 'de' yyyy", { locale: ptBR });
    return "Todos os agendamentos";
  };

  const views = [
    { id: "day", icon: <Clock size={14} />, label: "Dia" },
    { id: "week", icon: <Grid3X3 size={14} />, label: "Semana" },
    { id: "month", icon: <LayoutGrid size={14} />, label: "Mês" },
    { id: "list", icon: <List size={14} />, label: "Lista" },
  ];

  return (
    <div style={{ fontFamily: "Inter, sans-serif", maxWidth: 1400, position: "relative", minHeight: "80vh" }}>

      {/* ── Header ───────────────────────────────────────── */}
      <div style={{ marginBottom: 32, display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, fontWeight: 500, letterSpacing: "0.02em", color: T.onyx, margin: 0 }}>
            Agenda Clínica
          </h1>
          <p style={{ fontFamily: "Inter", fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: T.charcoal, marginTop: 6 }}>
            {getViewTitle()}
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          {/* View toggle */}
          <div style={{ display: "flex", border: `1px solid ${T.subtle}`, borderRadius: 2, overflow: "hidden" }}>
            {views.map(v => (
              <button key={v.id} onClick={() => setViewMode(v.id)}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "7px 14px", background: viewMode === v.id ? T.onyx : "transparent",
                  color: viewMode === v.id ? "#fff" : T.charcoal,
                  border: "none", cursor: "pointer",
                  fontFamily: "Inter", fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase",
                  borderRight: `1px solid ${T.subtle}`,
                }}>
                {v.icon} <span>{v.label}</span>
              </button>
            ))}
          </div>
          {/* Navigation */}
          {viewMode !== "list" && (
            <div style={{ display: "flex", gap: 6 }}>
              <button onClick={() => handleNav(-1)} style={{ border: `1px solid ${T.subtle}`, background: "transparent", borderRadius: 2, padding: "7px 10px", cursor: "pointer", color: T.onyx }}>
                <ChevronLeft size={14} />
              </button>
              <button onClick={() => setCurrentDate(new Date())} style={{
                border: `1px solid ${T.subtle}`, background: "transparent", borderRadius: 2,
                padding: "7px 16px", cursor: "pointer", fontFamily: "Inter", fontSize: 9,
                letterSpacing: "0.1em", textTransform: "uppercase", color: T.onyx,
              }}>Hoje</button>
              <button onClick={() => handleNav(1)} style={{ border: `1px solid ${T.subtle}`, background: "transparent", borderRadius: 2, padding: "7px 10px", cursor: "pointer", color: T.onyx }}>
                <ChevronRight size={14} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Mini KPIs ──────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
        {[
          { label: "Consultas Hoje", value: todayAppts.length },
          { label: "Confirmadas", value: todayAppts.filter(a => a.status === "confirmed").length },
          { label: "Em Andamento", value: todayAppts.filter(a => a.status === "in_progress").length },
          { label: "Receita Hoje", value: `R$ ${todayRevenue.toLocaleString("pt-BR")}`, gold: true },
        ].map(stat => (
          <div key={stat.label} style={{
            background: T.white, border: `1px solid ${T.subtle}`,
            borderBottom: stat.gold ? `2px solid ${T.gold}` : `1px solid ${T.subtle}`,
            borderRadius: 4, padding: "16px 20px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
          }}>
            <p style={{ fontFamily: "Inter", fontSize: 9, letterSpacing: "0.15em", textTransform: "uppercase", color: "#999", marginBottom: 8 }}>
              {stat.label}
            </p>
            <p style={{ fontFamily: "Inter", fontSize: 22, fontWeight: 300, color: stat.gold ? T.gold : T.onyx }}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* ── Calendar ──────────────────────────────────── */}
      <div style={{ background: T.white, border: `1px solid ${T.subtle}`, borderRadius: 4, overflow: "hidden", boxShadow: "0 4px 20px rgba(0,0,0,0.03)" }}>
        {viewMode === "day" && <DayView date={currentDate} appointments={appointments} onClickAppointment={setSelectedAppointment} onClickSlot={handleClickSlot} />}
        {viewMode === "week" && <WeekView weekDays={weekDays} appointments={appointments} onClickAppointment={setSelectedAppointment} onClickSlot={handleClickSlot} />}
        {viewMode === "month" && <MonthView currentDate={currentDate} appointments={appointments} onClickAppointment={setSelectedAppointment} onClickSlot={handleClickSlot} />}
        {viewMode === "list" && <div style={{ padding: "28px 32px" }}><ListView appointments={appointments} onClickAppointment={setSelectedAppointment} /></div>}
      </div>

      {/* ── FAB: Novo Agendamento ─────────────────────── */}
      <button
        onClick={() => { setEditingAppointment(null); setPrefilledTime(null); setIsFormOpen(true); }}
        style={{
          position: "fixed", bottom: 32, right: 32,
          width: 52, height: 52,
          background: T.onyx, color: "#fff",
          border: "none", borderRadius: 4,
          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 8px 32px rgba(0,0,0,0.16)",
          zIndex: 100,
        }}
        title="Novo Agendamento"
      >
        <Plus size={20} strokeWidth={1.5} />
      </button>

      {/* ── Form Dialog ──────────────────────────────── */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent style={{ maxWidth: 520 }}>
          <DialogHeader>
            <DialogTitle style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 500, color: T.onyx }}>
              {editingAppointment ? "Editar Consulta" : "Nova Consulta"}
            </DialogTitle>
          </DialogHeader>
          <AppointmentForm
            appointment={editingAppointment || (prefilledTime ? { start_time: prefilledTime.toISOString() } : null)}
            patients={patients} procedures={procedures}
            professionals={professionals} rooms={rooms}
            onSave={handleSave}
            onClose={() => { setIsFormOpen(false); setEditingAppointment(null); setPrefilledTime(null); }}
          />
        </DialogContent>
      </Dialog>

      {/* ── Detail Dialog ─────────────────────────────── */}
      <Dialog open={!!selectedAppointment} onOpenChange={() => setSelectedAppointment(null)}>
        <DialogContent style={{ maxWidth: 440 }}>
          <DialogHeader>
            <DialogTitle style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 500, color: T.onyx }}>
              Detalhes da Consulta
            </DialogTitle>
          </DialogHeader>
          <AppointmentDetail
            appointment={selectedAppointment}
            onClose={() => setSelectedAppointment(null)}
            onStatusChange={(id, status) => {
              const apt = appointments.find(a => a.id === id);
              updateMutation.mutate({ id, data: { ...apt, status } });
            }}
            onEdit={() => {
              setEditingAppointment(selectedAppointment);
              setSelectedAppointment(null);
              setIsFormOpen(true);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}