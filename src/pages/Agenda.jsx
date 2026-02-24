import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  format,
  parseISO,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addDays,
  addWeeks,
  subWeeks,
  isSameDay,
  isToday,
  setHours,
  setMinutes
} from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  Clock,
  User,
  MapPin,
  Calendar as CalendarIcon,
  CheckCircle,
  XCircle,
  AlertCircle,
  Filter,
  Search
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
}).filter(t => {
  const hour = parseInt(t.split(":")[0]);
  return hour >= 8 && hour < 20;
});

const statusConfig = {
  scheduled: { label: "Agendado", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  confirmed: { label: "Confirmado", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
  in_progress: { label: "Em Andamento", color: "bg-[#c9a55c]/20 text-[#c9a55c] border-[#c9a55c]/30" },
  completed: { label: "Concluído", color: "bg-gray-500/20 text-gray-400 border-gray-500/30" },
  cancelled: { label: "Cancelado", color: "bg-red-500/20 text-red-400 border-red-500/30" },
  no_show: { label: "Não Compareceu", color: "bg-orange-500/20 text-orange-400 border-orange-500/30" }
};

const AppointmentForm = ({ appointment, patients, procedures, professionals, rooms, onSave, onClose }) => {
  const [formData, setFormData] = useState(appointment || {
    patient_id: "",
    patient_name: "",
    professional_id: "",
    professional_name: "",
    room_id: "",
    procedure_id: "",
    procedure_name: "",
    start_time: "",
    duration_minutes: 60,
    status: "scheduled",
    notes: "",
    price: 0
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
    const endTime = addDays(startTime, 0);
    endTime.setMinutes(endTime.getMinutes() + (formData.duration_minutes || 60));

    onSave({
      ...formData,
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString()
    });
  };

  const handlePatientChange = (patientId) => {
    const patient = patients.find(p => p.id === patientId);
    setFormData(prev => ({
      ...prev,
      patient_id: patientId,
      patient_name: patient?.full_name || ""
    }));
  };

  const handleProcedureChange = (procedureId) => {
    const procedure = procedures.find(p => p.id === procedureId);
    setFormData(prev => ({
      ...prev,
      procedure_id: procedureId,
      procedure_name: procedure?.name || "",
      duration_minutes: procedure?.duration_minutes || 60,
      price: procedure?.price || 0
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <Label className="text-gray-300">Paciente *</Label>
          <Select
            value={formData.patient_id}
            onValueChange={handlePatientChange}
          >
            <SelectTrigger className="bg-[#1a1a25] border-[#1e1e2a] text-white mt-1">
              <SelectValue placeholder="Selecione o paciente" />
            </SelectTrigger>
            <SelectContent className="bg-[#12121a] border-[#1e1e2a] max-h-60">
              {patients.map((patient) => (
                <SelectItem key={patient.id} value={patient.id} className="text-white hover:bg-[#c9a55c]/10">
                  {patient.full_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="col-span-2">
          <Label className="text-gray-300">Procedimento *</Label>
          <Select
            value={formData.procedure_id}
            onValueChange={handleProcedureChange}
          >
            <SelectTrigger className="bg-[#1a1a25] border-[#1e1e2a] text-white mt-1">
              <SelectValue placeholder="Selecione o procedimento" />
            </SelectTrigger>
            <SelectContent className="bg-[#12121a] border-[#1e1e2a] max-h-60">
              {procedures.map((proc) => (
                <SelectItem key={proc.id} value={proc.id} className="text-white hover:bg-[#c9a55c]/10">
                  {proc.name} ({proc.duration_minutes}min)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-gray-300">Data *</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full mt-1 justify-start text-left bg-[#1a1a25] border-[#1e1e2a] text-white hover:bg-[#1e1e2a]"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(selectedDate, "dd/MM/yyyy", { locale: ptBR })}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-[#12121a] border-[#1e1e2a]">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                locale={ptBR}
                className="text-white"
              />
            </PopoverContent>
          </Popover>
        </div>

        <div>
          <Label className="text-gray-300">Horário *</Label>
          <Select value={selectedTime} onValueChange={setSelectedTime}>
            <SelectTrigger className="bg-[#1a1a25] border-[#1e1e2a] text-white mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#12121a] border-[#1e1e2a] max-h-60">
              {timeSlots.map((time) => (
                <SelectItem key={time} value={time} className="text-white hover:bg-[#c9a55c]/10">
                  {time}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-gray-300">Profissional</Label>
          <Select
            value={formData.professional_id}
            onValueChange={(value) => {
              const prof = professionals.find(p => p.id === value);
              setFormData(prev => ({
                ...prev,
                professional_id: value,
                professional_name: prof?.name || ""
              }));
            }}
          >
            <SelectTrigger className="bg-[#1a1a25] border-[#1e1e2a] text-white mt-1">
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent className="bg-[#12121a] border-[#1e1e2a]">
              {professionals.map((prof) => (
                <SelectItem key={prof.id} value={prof.id} className="text-white hover:bg-[#c9a55c]/10">
                  {prof.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-gray-300">Sala</Label>
          <Select
            value={formData.room_id}
            onValueChange={(value) => setFormData(prev => ({ ...prev, room_id: value }))}
          >
            <SelectTrigger className="bg-[#1a1a25] border-[#1e1e2a] text-white mt-1">
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent className="bg-[#12121a] border-[#1e1e2a]">
              {rooms.map((room) => (
                <SelectItem key={room.id} value={room.id} className="text-white hover:bg-[#c9a55c]/10">
                  {room.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-gray-300">Duração (min)</Label>
          <Input
            type="number"
            value={formData.duration_minutes}
            onChange={(e) => setFormData(prev => ({ ...prev, duration_minutes: parseInt(e.target.value) }))}
            className="bg-[#1a1a25] border-[#1e1e2a] text-white mt-1"
          />
        </div>

        <div>
          <Label className="text-gray-300">Valor (R$)</Label>
          <Input
            type="number"
            value={formData.price}
            onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) }))}
            className="bg-[#1a1a25] border-[#1e1e2a] text-white mt-1"
          />
        </div>

        <div className="col-span-2">
          <Label className="text-gray-300">Observações</Label>
          <Textarea
            value={formData.notes}
            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            className="bg-[#1a1a25] border-[#1e1e2a] text-white mt-1"
            rows={2}
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="ghost" onClick={onClose} className="text-gray-400">
          Cancelar
        </Button>
        <Button type="submit" className="bg-[#c9a55c] hover:bg-[#a17f3f] text-black">
          {appointment ? "Salvar" : "Agendar"}
        </Button>
      </div>
    </form>
  );
};

const AppointmentCard = ({ appointment, onClick }) => {
  const startTime = appointment.start_time ? parseISO(appointment.start_time) : null;
  
  return (
    <div
      onClick={onClick}
      className={cn(
        "p-3 rounded-lg border cursor-pointer transition-all hover:border-[#c9a55c]/30",
        "bg-[#1a1a25] border-[#1e1e2a]"
      )}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-[#c9a55c]" />
          <span className="text-white font-medium">
            {startTime ? format(startTime, "HH:mm") : "--:--"}
          </span>
        </div>
        <Badge className={statusConfig[appointment.status]?.color || statusConfig.scheduled.color}>
          {statusConfig[appointment.status]?.label || "Agendado"}
        </Badge>
      </div>
      <p className="text-white font-medium truncate">{appointment.patient_name}</p>
      <p className="text-sm text-gray-400 truncate">{appointment.procedure_name}</p>
      {appointment.professional_name && (
        <p className="text-xs text-gray-500 mt-1">Dr(a). {appointment.professional_name}</p>
      )}
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      setIsFormOpen(false);
      setEditingAppointment(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Appointment.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      setIsFormOpen(false);
      setEditingAppointment(null);
      setSelectedAppointment(null);
    },
  });

  const handleSave = (data) => {
    if (editingAppointment) {
      updateMutation.mutate({ id: editingAppointment.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const getAppointmentsForDay = (date) => {
    return appointments.filter(apt => {
      if (!apt.start_time) return false;
      return isSameDay(parseISO(apt.start_time), date);
    });
  };

  const todayAppointments = getAppointmentsForDay(new Date());
  const confirmedToday = todayAppointments.filter(a => a.status === "confirmed" || a.status === "in_progress").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif text-white">Agenda</h1>
          <p className="text-gray-400">
            {format(currentDate, "MMMM 'de' yyyy", { locale: ptBR })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentDate(prev => subWeeks(prev, 1))}
            className="border-[#1e1e2a] text-gray-400 hover:text-white hover:bg-[#1a1a25]"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            onClick={() => setCurrentDate(new Date())}
            className="border-[#1e1e2a] text-gray-400 hover:text-white hover:bg-[#1a1a25]"
          >
            Hoje
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentDate(prev => addWeeks(prev, 1))}
            className="border-[#1e1e2a] text-gray-400 hover:text-white hover:bg-[#1a1a25]"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#c9a55c] hover:bg-[#a17f3f] text-black">
                <Plus className="mr-2 h-4 w-4" />
                Nova Consulta
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#12121a] border-[#1e1e2a] text-white max-w-lg">
              <DialogHeader>
                <DialogTitle className="text-xl font-serif">
                  {editingAppointment ? "Editar Consulta" : "Nova Consulta"}
                </DialogTitle>
              </DialogHeader>
              <AppointmentForm
                appointment={editingAppointment}
                patients={patients}
                procedures={procedures}
                professionals={professionals}
                rooms={rooms}
                onSave={handleSave}
                onClose={() => { setIsFormOpen(false); setEditingAppointment(null); }}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Today Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-[#12121a] border-[#1e1e2a]">
          <CardContent className="p-4">
            <p className="text-xs text-gray-500">Consultas Hoje</p>
            <p className="text-2xl font-light text-white mt-1">{todayAppointments.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-[#12121a] border-[#1e1e2a]">
          <CardContent className="p-4">
            <p className="text-xs text-gray-500">Confirmadas</p>
            <p className="text-2xl font-light text-emerald-400 mt-1">{confirmedToday}</p>
          </CardContent>
        </Card>
        <Card className="bg-[#12121a] border-[#1e1e2a]">
          <CardContent className="p-4">
            <p className="text-xs text-gray-500">Aguardando</p>
            <p className="text-2xl font-light text-yellow-400 mt-1">
              {todayAppointments.filter(a => a.status === "scheduled").length}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-[#12121a] border-[#1e1e2a]">
          <CardContent className="p-4">
            <p className="text-xs text-gray-500">Receita Prevista</p>
            <p className="text-2xl font-light text-[#c9a55c] mt-1">
              R$ {todayAppointments.reduce((sum, a) => sum + (a.price || 0), 0).toLocaleString("pt-BR")}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Week View */}
      <Card className="bg-[#12121a] border-[#1e1e2a] overflow-hidden">
        <div className="grid grid-cols-7 border-b border-[#1e1e2a]">
          {weekDays.map((day) => (
            <div
              key={day.toISOString()}
              className={cn(
                "p-4 text-center border-r border-[#1e1e2a] last:border-r-0",
                isToday(day) && "bg-[#c9a55c]/10"
              )}
            >
              <p className="text-xs text-gray-500 uppercase">
                {format(day, "EEE", { locale: ptBR })}
              </p>
              <p className={cn(
                "text-lg font-light mt-1",
                isToday(day) ? "text-[#c9a55c]" : "text-white"
              )}>
                {format(day, "d")}
              </p>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 min-h-[400px]">
          {weekDays.map((day) => {
            const dayAppointments = getAppointmentsForDay(day);
            return (
              <div
                key={day.toISOString()}
                className={cn(
                  "p-2 border-r border-[#1e1e2a] last:border-r-0 space-y-2",
                  isToday(day) && "bg-[#c9a55c]/5"
                )}
              >
                {dayAppointments.map((apt) => (
                  <AppointmentCard
                    key={apt.id}
                    appointment={apt}
                    onClick={() => {
                      setEditingAppointment(apt);
                      setIsFormOpen(true);
                    }}
                  />
                ))}
                {dayAppointments.length === 0 && (
                  <div className="h-full flex items-center justify-center text-gray-600 text-sm">
                    —
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Appointment Details */}
      {selectedAppointment && (
        <Dialog open={!!selectedAppointment} onOpenChange={() => setSelectedAppointment(null)}>
          <DialogContent className="bg-[#12121a] border-[#1e1e2a] text-white max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl font-serif">Detalhes da Consulta</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-[#c9a55c]/20 flex items-center justify-center">
                  <User className="h-6 w-6 text-[#c9a55c]" />
                </div>
                <div>
                  <h3 className="font-medium text-white">{selectedAppointment.patient_name}</h3>
                  <p className="text-sm text-gray-400">{selectedAppointment.procedure_name}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-[#1a1a25] rounded-lg">
                  <p className="text-xs text-gray-500">Horário</p>
                  <p className="text-white">
                    {selectedAppointment.start_time && format(parseISO(selectedAppointment.start_time), "HH:mm")}
                  </p>
                </div>
                <div className="p-3 bg-[#1a1a25] rounded-lg">
                  <p className="text-xs text-gray-500">Duração</p>
                  <p className="text-white">{selectedAppointment.duration_minutes} min</p>
                </div>
              </div>

              <div className="flex gap-2">
                {["confirmed", "in_progress", "completed", "cancelled"].map((status) => (
                  <Button
                    key={status}
                    size="sm"
                    variant="outline"
                    onClick={() => updateMutation.mutate({ 
                      id: selectedAppointment.id, 
                      data: { status } 
                    })}
                    className={cn(
                      "border-[#1e1e2a] text-gray-400",
                      selectedAppointment.status === status && statusConfig[status]?.color
                    )}
                  >
                    {statusConfig[status]?.label}
                  </Button>
                ))}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}