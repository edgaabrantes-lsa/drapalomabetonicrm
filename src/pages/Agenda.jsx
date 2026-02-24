import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  format, parseISO, startOfWeek, endOfWeek, eachDayOfInterval,
  addDays, addWeeks, subWeeks, addMonths, subMonths,
  isSameDay, isToday, setHours, setMinutes,
  startOfMonth, endOfMonth, eachWeekOfInterval, getDay
} from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Plus, ChevronLeft, ChevronRight, Clock, User, Calendar as CalendarIcon,
  CheckCircle, List, Grid3X3, LayoutGrid, MoreHorizontal, MapPin, Sparkles
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const timeSlots = Array.from({ length: 24 }, (_, i) => {
  const hour = Math.floor(i / 2) + 8;
  const minutes = (i % 2) * 30;
  return `${hour.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
}).filter(t => parseInt(t.split(":")[0]) >= 8 && parseInt(t.split(":")[0]) < 20);

const statusConfig = {
  scheduled:   { label: "Agendado",      color: "bg-blue-500/20 text-blue-400",     dot: "bg-blue-500" },
  confirmed:   { label: "Confirmado",    color: "bg-emerald-500/20 text-emerald-400", dot: "bg-emerald-500" },
  in_progress: { label: "Em Andamento",  color: "bg-[#c9a55c]/20 text-[#c9a55c]",  dot: "bg-[#c9a55c]" },
  completed:   { label: "Concluído",     color: "bg-gray-500/20 text-gray-400",      dot: "bg-gray-500" },
  cancelled:   { label: "Cancelado",     color: "bg-red-500/20 text-red-400",        dot: "bg-red-500" },
  no_show:     { label: "Não Compareceu", color: "bg-orange-500/20 text-orange-400", dot: "bg-orange-500" }
};

const HOUR_HEIGHT = 64; // px per hour
const DAY_START = 8;
const DAY_END = 20;

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

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <Label className="text-gray-300">Paciente *</Label>
          <Select value={formData.patient_id} onValueChange={v => {
            const p = patients.find(x => x.id === v);
            setFormData(prev => ({ ...prev, patient_id: v, patient_name: p?.full_name || "" }));
          }}>
            <SelectTrigger className="bg-[#1a1a25] border-[#1e1e2a] text-white mt-1">
              <SelectValue placeholder="Selecione o paciente" />
            </SelectTrigger>
            <SelectContent className="bg-[#12121a] border-[#1e1e2a] max-h-52">
              {patients.map(p => <SelectItem key={p.id} value={p.id} className="text-white">{p.full_name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="col-span-2">
          <Label className="text-gray-300">Procedimento *</Label>
          <Select value={formData.procedure_id} onValueChange={v => {
            const proc = procedures.find(x => x.id === v);
            setFormData(prev => ({ ...prev, procedure_id: v, procedure_name: proc?.name || "", duration_minutes: proc?.duration_minutes || 60, price: proc?.price || 0 }));
          }}>
            <SelectTrigger className="bg-[#1a1a25] border-[#1e1e2a] text-white mt-1">
              <SelectValue placeholder="Selecione o procedimento" />
            </SelectTrigger>
            <SelectContent className="bg-[#12121a] border-[#1e1e2a] max-h-52">
              {procedures.map(p => <SelectItem key={p.id} value={p.id} className="text-white">{p.name} ({p.duration_minutes}min)</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-gray-300">Data *</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full mt-1 justify-start bg-[#1a1a25] border-[#1e1e2a] text-white hover:bg-[#1e1e2a]">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(selectedDate, "dd/MM/yyyy", { locale: ptBR })}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-[#12121a] border-[#1e1e2a]">
              <Calendar mode="single" selected={selectedDate} onSelect={d => d && setSelectedDate(d)} locale={ptBR} className="text-white" />
            </PopoverContent>
          </Popover>
        </div>
        <div>
          <Label className="text-gray-300">Horário *</Label>
          <Select value={selectedTime} onValueChange={setSelectedTime}>
            <SelectTrigger className="bg-[#1a1a25] border-[#1e1e2a] text-white mt-1"><SelectValue /></SelectTrigger>
            <SelectContent className="bg-[#12121a] border-[#1e1e2a] max-h-52">
              {timeSlots.map(t => <SelectItem key={t} value={t} className="text-white">{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-gray-300">Profissional</Label>
          <Select value={formData.professional_id} onValueChange={v => {
            const prof = professionals.find(x => x.id === v);
            setFormData(prev => ({ ...prev, professional_id: v, professional_name: prof?.name || "" }));
          }}>
            <SelectTrigger className="bg-[#1a1a25] border-[#1e1e2a] text-white mt-1">
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent className="bg-[#12121a] border-[#1e1e2a]">
              {professionals.map(p => <SelectItem key={p.id} value={p.id} className="text-white">{p.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-gray-300">Sala</Label>
          <Select value={formData.room_id} onValueChange={v => setFormData(prev => ({ ...prev, room_id: v }))}>
            <SelectTrigger className="bg-[#1a1a25] border-[#1e1e2a] text-white mt-1">
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent className="bg-[#12121a] border-[#1e1e2a]">
              {rooms.map(r => <SelectItem key={r.id} value={r.id} className="text-white">{r.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-gray-300">Duração (min)</Label>
          <Input type="number" value={formData.duration_minutes}
            onChange={e => setFormData(prev => ({ ...prev, duration_minutes: parseInt(e.target.value) }))}
            className="bg-[#1a1a25] border-[#1e1e2a] text-white mt-1" />
        </div>
        <div>
          <Label className="text-gray-300">Valor (R$)</Label>
          <Input type="number" value={formData.price}
            onChange={e => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) }))}
            className="bg-[#1a1a25] border-[#1e1e2a] text-white mt-1" />
        </div>
        <div className="col-span-2">
          <Label className="text-gray-300">Observações</Label>
          <Textarea value={formData.notes} onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            className="bg-[#1a1a25] border-[#1e1e2a] text-white mt-1" rows={2} />
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="ghost" onClick={onClose} className="text-gray-400">Cancelar</Button>
        <Button type="submit" className="bg-[#c9a55c] hover:bg-[#a17f3f] text-black">
          {appointment ? "Salvar" : "Agendar"}
        </Button>
      </div>
    </form>
  );
};

// ---- Day View with time grid ----
const DayView = ({ date, appointments, onClickAppointment, onClickSlot }) => {
  const hours = Array.from({ length: DAY_END - DAY_START }, (_, i) => DAY_START + i);
  const dayAppts = appointments
    .filter(a => a.start_time && isSameDay(parseISO(a.start_time), date))
    .sort((a, b) => new Date(a.start_time) - new Date(b.start_time));

  const getTopOffset = (appt) => {
    const start = parseISO(appt.start_time);
    const hourFraction = (start.getHours() - DAY_START) + start.getMinutes() / 60;
    return hourFraction * HOUR_HEIGHT;
  };

  const getHeight = (appt) => {
    const dur = appt.duration_minutes || 60;
    return Math.max((dur / 60) * HOUR_HEIGHT, 24);
  };

  return (
    <div className="flex overflow-auto max-h-[600px]">
      {/* Time Labels */}
      <div className="flex-shrink-0 w-16">
        {hours.map(h => (
          <div key={h} className="flex items-start justify-end pr-3 text-xs text-gray-600" style={{ height: HOUR_HEIGHT }}>
            {h}:00
          </div>
        ))}
      </div>
      {/* Grid */}
      <div className="flex-1 relative border-l border-[#1e1e2a]">
        {hours.map(h => (
          <div key={h} className="border-b border-[#1e1e2a]/50 cursor-pointer hover:bg-[#c9a55c]/5 transition-colors"
            style={{ height: HOUR_HEIGHT }}
            onClick={() => onClickSlot(date, h)}
          />
        ))}
        {/* Appointments overlaid */}
        {dayAppts.map(appt => {
          const cfg = statusConfig[appt.status] || statusConfig.scheduled;
          return (
            <div
              key={appt.id}
              onClick={e => { e.stopPropagation(); onClickAppointment(appt); }}
              className={`absolute left-1 right-1 rounded-lg px-2 py-1 cursor-pointer overflow-hidden ${cfg.color} border border-current/30 hover:brightness-110 transition-all`}
              style={{ top: getTopOffset(appt), height: getHeight(appt) }}
            >
              <p className="text-xs font-semibold truncate">{appt.patient_name}</p>
              <p className="text-xs opacity-70 truncate">{appt.procedure_name}</p>
              {getHeight(appt) > 50 && (
                <p className="text-xs opacity-60">
                  {format(parseISO(appt.start_time), "HH:mm")} • {appt.duration_minutes}min
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ---- Week View ----
const WeekView = ({ weekDays, appointments, onClickAppointment, onClickSlot }) => {
  const getAppointmentsForDay = (date) =>
    appointments.filter(a => a.start_time && isSameDay(parseISO(a.start_time), date));

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[700px]">
        {/* Day Headers */}
        <div className="grid border-b border-[#1e1e2a]" style={{ gridTemplateColumns: "4rem repeat(7, 1fr)" }}>
          <div />
          {weekDays.map(day => (
            <div key={day.toISOString()} className={cn(
              "p-3 text-center border-l border-[#1e1e2a]",
              isToday(day) && "bg-[#c9a55c]/10"
            )}>
              <p className="text-xs text-gray-500 uppercase">{format(day, "EEE", { locale: ptBR })}</p>
              <p className={cn("text-xl font-light mt-0.5", isToday(day) ? "text-[#c9a55c]" : "text-white")}>
                {format(day, "d")}
              </p>
            </div>
          ))}
        </div>
        {/* Time Grid */}
        <div className="flex overflow-auto max-h-[560px]">
          {/* Hours */}
          <div className="flex-shrink-0 w-16">
            {Array.from({ length: DAY_END - DAY_START }, (_, i) => DAY_START + i).map(h => (
              <div key={h} className="flex items-start justify-end pr-3 text-xs text-gray-600" style={{ height: HOUR_HEIGHT }}>
                {h}:00
              </div>
            ))}
          </div>
          {/* Day Columns */}
          {weekDays.map(day => {
            const dayAppts = getAppointmentsForDay(day)
              .sort((a, b) => new Date(a.start_time) - new Date(b.start_time));

            return (
              <div key={day.toISOString()} className={cn(
                "flex-1 relative border-l border-[#1e1e2a]",
                isToday(day) && "bg-[#c9a55c]/5"
              )}>
                {Array.from({ length: DAY_END - DAY_START }, (_, i) => i).map(i => (
                  <div key={i} className="border-b border-[#1e1e2a]/40 hover:bg-[#c9a55c]/5 cursor-pointer transition-colors"
                    style={{ height: HOUR_HEIGHT }}
                    onClick={() => onClickSlot(day, DAY_START + i)}
                  />
                ))}
                {dayAppts.map(appt => {
                  const start = parseISO(appt.start_time);
                  const hourFraction = (start.getHours() - DAY_START) + start.getMinutes() / 60;
                  const top = hourFraction * HOUR_HEIGHT;
                  const height = Math.max(((appt.duration_minutes || 60) / 60) * HOUR_HEIGHT, 24);
                  const cfg = statusConfig[appt.status] || statusConfig.scheduled;

                  return (
                    <div
                      key={appt.id}
                      onClick={e => { e.stopPropagation(); onClickAppointment(appt); }}
                      className={`absolute inset-x-0.5 rounded-md px-1.5 py-1 cursor-pointer overflow-hidden ${cfg.color} border border-current/20 hover:brightness-110 transition-all text-xs`}
                      style={{ top, height }}
                    >
                      <p className="font-semibold truncate">{appt.patient_name}</p>
                      {height > 32 && <p className="opacity-70 truncate">{appt.procedure_name}</p>}
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

// ---- Month View ----
const MonthView = ({ currentDate, appointments, onClickAppointment, onClickSlot }) => {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const calDays = eachDayOfInterval({ start: calStart, end: calEnd });

  const getApptsForDay = (date) =>
    appointments.filter(a => a.start_time && isSameDay(parseISO(a.start_time), date));

  return (
    <div>
      <div className="grid grid-cols-7 border-b border-[#1e1e2a] mb-1">
        {["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"].map(d => (
          <div key={d} className="p-3 text-center text-xs text-gray-500 uppercase font-medium">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {calDays.map(day => {
          const dayAppts = getApptsForDay(day);
          const isCurrentMonth = day.getMonth() === currentDate.getMonth();
          return (
            <div
              key={day.toISOString()}
              onClick={() => onClickSlot(day, 9)}
              className={cn(
                "min-h-[100px] p-2 border-b border-r border-[#1e1e2a] cursor-pointer hover:bg-[#c9a55c]/5 transition-colors",
                !isCurrentMonth && "opacity-30",
                isToday(day) && "bg-[#c9a55c]/10"
              )}
            >
              <p className={cn(
                "text-sm font-medium mb-1 w-6 h-6 flex items-center justify-center rounded-full",
                isToday(day) ? "bg-[#c9a55c] text-black" : "text-gray-400"
              )}>
                {format(day, "d")}
              </p>
              <div className="space-y-0.5">
                {dayAppts.slice(0, 2).map(appt => {
                  const cfg = statusConfig[appt.status] || statusConfig.scheduled;
                  return (
                    <div key={appt.id}
                      onClick={e => { e.stopPropagation(); onClickAppointment(appt); }}
                      className={`text-xs px-1.5 py-0.5 rounded truncate ${cfg.color}`}>
                      {format(parseISO(appt.start_time), "HH:mm")} {appt.patient_name}
                    </div>
                  );
                })}
                {dayAppts.length > 2 && (
                  <p className="text-xs text-gray-500">+{dayAppts.length - 2} mais</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ---- List View ----
const ListView = ({ appointments, onClickAppointment }) => {
  const sorted = [...appointments].sort((a, b) => new Date(a.start_time) - new Date(b.start_time));

  const grouped = sorted.reduce((acc, apt) => {
    if (!apt.start_time) return acc;
    const dateKey = format(parseISO(apt.start_time), "yyyy-MM-dd");
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(apt);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {Object.entries(grouped).map(([dateKey, appts]) => (
        <div key={dateKey}>
          <div className="flex items-center gap-3 mb-3">
            <div className={cn(
              "px-3 py-1 rounded-full text-sm font-medium",
              isToday(parseISO(dateKey)) ? "bg-[#c9a55c] text-black" : "bg-[#1a1a25] text-gray-300"
            )}>
              {format(parseISO(dateKey), "EEEE, d 'de' MMMM", { locale: ptBR })}
            </div>
            {isToday(parseISO(dateKey)) && (
              <Badge className="bg-[#c9a55c]/20 text-[#c9a55c]">Hoje</Badge>
            )}
          </div>
          <div className="space-y-2">
            {appts.map(appt => {
              const cfg = statusConfig[appt.status] || statusConfig.scheduled;
              return (
                <div key={appt.id} onClick={() => onClickAppointment(appt)}
                  className="flex items-center gap-4 p-4 bg-[#12121a] border border-[#1e1e2a] rounded-xl hover:border-[#c9a55c]/30 cursor-pointer transition-all">
                  <div className="text-center w-14 flex-shrink-0">
                    <p className="text-lg font-light text-white">
                      {format(parseISO(appt.start_time), "HH:mm")}
                    </p>
                    <p className="text-xs text-gray-500">{appt.duration_minutes}min</p>
                  </div>
                  <div className={`w-1 h-10 rounded-full ${cfg.dot}`} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white">{appt.patient_name}</p>
                    <p className="text-sm text-gray-400 truncate">{appt.procedure_name}</p>
                  </div>
                  {appt.professional_name && (
                    <p className="text-xs text-gray-500 hidden lg:block">{appt.professional_name}</p>
                  )}
                  <Badge className={cfg.color}>{cfg.label}</Badge>
                  <p className="text-sm text-[#c9a55c] hidden lg:block">
                    {appt.price > 0 ? `R$ ${appt.price.toLocaleString("pt-BR")}` : ""}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      ))}
      {Object.keys(grouped).length === 0 && (
        <div className="text-center py-16">
          <CalendarIcon className="h-12 w-12 text-gray-700 mx-auto mb-4" />
          <p className="text-gray-500">Nenhuma consulta agendada</p>
        </div>
      )}
    </div>
  );
};

// ---- Appointment Detail Modal ----
const AppointmentDetail = ({ appointment, onClose, onStatusChange, onEdit }) => {
  if (!appointment) return null;
  const cfg = statusConfig[appointment.status] || statusConfig.scheduled;

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-full bg-[#c9a55c]/20 flex items-center justify-center">
          <User className="h-6 w-6 text-[#c9a55c]" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-white">{appointment.patient_name}</h3>
          <p className="text-gray-400">{appointment.procedure_name}</p>
          <Badge className={`mt-1 ${cfg.color}`}>{cfg.label}</Badge>
        </div>
        <Button size="sm" variant="ghost" onClick={onEdit} className="text-[#c9a55c]">Editar</Button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 bg-[#1a1a25] rounded-xl">
          <p className="text-xs text-gray-500">Horário</p>
          <p className="text-white font-medium">
            {appointment.start_time && format(parseISO(appointment.start_time), "dd/MM/yyyy HH:mm")}
          </p>
        </div>
        <div className="p-3 bg-[#1a1a25] rounded-xl">
          <p className="text-xs text-gray-500">Duração</p>
          <p className="text-white font-medium">{appointment.duration_minutes} min</p>
        </div>
        {appointment.professional_name && (
          <div className="p-3 bg-[#1a1a25] rounded-xl">
            <p className="text-xs text-gray-500">Profissional</p>
            <p className="text-white font-medium">{appointment.professional_name}</p>
          </div>
        )}
        {appointment.price > 0 && (
          <div className="p-3 bg-[#c9a55c]/10 border border-[#c9a55c]/20 rounded-xl">
            <p className="text-xs text-gray-500">Valor</p>
            <p className="text-[#c9a55c] font-semibold">R$ {appointment.price.toLocaleString("pt-BR")}</p>
          </div>
        )}
      </div>

      {appointment.notes && (
        <div>
          <p className="text-xs text-gray-500 mb-1">Observações</p>
          <p className="text-gray-300 text-sm bg-[#1a1a25] p-3 rounded-xl">{appointment.notes}</p>
        </div>
      )}

      <div>
        <p className="text-xs text-gray-500 mb-2 uppercase tracking-wider">Atualizar status</p>
        <div className="grid grid-cols-3 gap-2">
          {["confirmed", "in_progress", "completed", "no_show", "cancelled"].map(status => {
            const s = statusConfig[status];
            return (
              <button key={status} onClick={() => onStatusChange(appointment.id, status)}
                className={`p-2 rounded-lg text-xs font-medium transition-all ${
                  appointment.status === status ? s.color : "bg-[#1a1a25] text-gray-500 hover:text-white"
                }`}>
                {s.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default function Agenda() {
  const queryClient = useQueryClient();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState("week");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState(null);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [prefilledTime, setPrefilledTime] = useState(null);

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const { data: appointments = [] } = useQuery({
    queryKey: ["appointments"],
    queryFn: () => base44.entities.Appointment.list("-start_time", 500),
  });
  const { data: patients = [] } = useQuery({
    queryKey: ["patients"],
    queryFn: () => base44.entities.Patient.list("-created_date", 1000),
  });
  const { data: procedures = [] } = useQuery({
    queryKey: ["procedures"],
    queryFn: () => base44.entities.Procedure.list(),
  });
  const { data: professionals = [] } = useQuery({
    queryKey: ["professionals"],
    queryFn: () => base44.entities.Professional.list(),
  });
  const { data: rooms = [] } = useQuery({
    queryKey: ["rooms"],
    queryFn: () => base44.entities.Room.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Appointment.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["appointments"] }); setIsFormOpen(false); setEditingAppointment(null); },
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Appointment.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["appointments"] }); setIsFormOpen(false); setEditingAppointment(null); setSelectedAppointment(null); },
  });

  const handleSave = (data) => {
    if (editingAppointment) {
      updateMutation.mutate({ id: editingAppointment.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleClickSlot = (date, hour) => {
    const slotDate = setHours(date, hour);
    setEditingAppointment(null);
    setPrefilledTime(slotDate);
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
    if (viewMode === "week") return `${format(weekStart, "d MMM", { locale: ptBR })} — ${format(weekEnd, "d MMM yyyy", { locale: ptBR })}`;
    if (viewMode === "month") return format(currentDate, "MMMM 'de' yyyy", { locale: ptBR });
    return "Lista de Consultas";
  };

  const prefilledAppt = prefilledTime ? {
    start_time: prefilledTime.toISOString()
  } : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif text-white flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-[#c9a55c]" />
            Agenda Dra. Paloma Betoni
          </h1>
          <p className="text-gray-400 capitalize">{getViewTitle()}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* View Mode */}
          <div className="flex bg-[#1a1a25] border border-[#1e1e2a] rounded-lg p-1">
            {[
              { id: "day",   icon: <Clock className="h-4 w-4" />, label: "Dia" },
              { id: "week",  icon: <Grid3X3 className="h-4 w-4" />, label: "Semana" },
              { id: "month", icon: <LayoutGrid className="h-4 w-4" />, label: "Mês" },
              { id: "list",  icon: <List className="h-4 w-4" />, label: "Lista" },
            ].map(v => (
              <button
                key={v.id}
                onClick={() => setViewMode(v.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  viewMode === v.id ? "bg-[#c9a55c]/20 text-[#c9a55c]" : "text-gray-500 hover:text-white"
                }`}
              >
                {v.icon}
                <span className="hidden sm:inline">{v.label}</span>
              </button>
            ))}
          </div>

          {/* Navigation */}
          {viewMode !== "list" && (
            <>
              <Button variant="outline" size="icon" onClick={() => handleNav(-1)}
                className="border-[#1e1e2a] text-gray-400 hover:text-white hover:bg-[#1a1a25]">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" onClick={() => setCurrentDate(new Date())}
                className="border-[#1e1e2a] text-gray-400 hover:text-white hover:bg-[#1a1a25] text-sm">
                Hoje
              </Button>
              <Button variant="outline" size="icon" onClick={() => handleNav(1)}
                className="border-[#1e1e2a] text-gray-400 hover:text-white hover:bg-[#1a1a25]">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </>
          )}

          <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#c9a55c] hover:bg-[#a17f3f] text-black">
                <Plus className="mr-2 h-4 w-4" /> Nova Consulta
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#12121a] border-[#1e1e2a] text-white max-w-lg">
              <DialogHeader>
                <DialogTitle className="text-xl font-serif">
                  {editingAppointment ? "Editar Consulta" : "Nova Consulta"}
                </DialogTitle>
              </DialogHeader>
              <AppointmentForm
                appointment={editingAppointment || prefilledAppt}
                patients={patients} procedures={procedures}
                professionals={professionals} rooms={rooms}
                onSave={handleSave}
                onClose={() => { setIsFormOpen(false); setEditingAppointment(null); setPrefilledTime(null); }}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Consultas Hoje", value: todayAppts.length, color: "text-white" },
          { label: "Confirmadas", value: todayAppts.filter(a => a.status === "confirmed").length, color: "text-emerald-400" },
          { label: "Em Andamento", value: todayAppts.filter(a => a.status === "in_progress").length, color: "text-[#c9a55c]" },
          { label: "Receita Hoje", value: `R$ ${todayRevenue.toLocaleString("pt-BR")}`, color: "text-[#c9a55c]" },
        ].map(stat => (
          <Card key={stat.label} className="bg-[#12121a] border-[#1e1e2a]">
            <CardContent className="p-4">
              <p className="text-xs text-gray-500">{stat.label}</p>
              <p className={`text-2xl font-light mt-1 ${stat.color}`}>{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Calendar Views */}
      <Card className="bg-[#12121a] border-[#1e1e2a] overflow-hidden">
        <CardContent className="p-0">
          {viewMode === "day" && (
            <DayView date={currentDate} appointments={appointments}
              onClickAppointment={setSelectedAppointment} onClickSlot={handleClickSlot} />
          )}
          {viewMode === "week" && (
            <WeekView weekDays={weekDays} appointments={appointments}
              onClickAppointment={setSelectedAppointment} onClickSlot={handleClickSlot} />
          )}
          {viewMode === "month" && (
            <MonthView currentDate={currentDate} appointments={appointments}
              onClickAppointment={setSelectedAppointment} onClickSlot={handleClickSlot} />
          )}
          {viewMode === "list" && (
            <div className="p-6">
              <ListView appointments={appointments} onClickAppointment={setSelectedAppointment} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Appointment Detail Dialog */}
      <Dialog open={!!selectedAppointment} onOpenChange={() => setSelectedAppointment(null)}>
        <DialogContent className="bg-[#12121a] border-[#1e1e2a] text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-serif">Detalhes da Consulta</DialogTitle>
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