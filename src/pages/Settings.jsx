import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Settings as SettingsIcon,
  User,
  Users,
  Building,
  Palette,
  Bell,
  Shield,
  Plus,
  Edit,
  Trash2,
  Save
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const ProcedureForm = ({ procedure, onSave, onClose }) => {
  const [formData, setFormData] = useState(procedure || {
    name: "",
    category: "facial",
    description: "",
    duration_minutes: 60,
    price: 0,
    cost: 0,
    status: "active"
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label className="text-gray-300">Nome *</Label>
        <Input
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          className="bg-[#1a1a25] border-[#1e1e2a] text-white mt-1"
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-gray-300">Categoria</Label>
          <Select
            value={formData.category}
            onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
          >
            <SelectTrigger className="bg-[#1a1a25] border-[#1e1e2a] text-white mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#12121a] border-[#1e1e2a]">
              <SelectItem value="facial" className="text-white">Facial</SelectItem>
              <SelectItem value="corporal" className="text-white">Corporal</SelectItem>
              <SelectItem value="capilar" className="text-white">Capilar</SelectItem>
              <SelectItem value="injetaveis" className="text-white">Injetáveis</SelectItem>
              <SelectItem value="laser" className="text-white">Laser</SelectItem>
              <SelectItem value="outros" className="text-white">Outros</SelectItem>
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
          <Label className="text-gray-300">Preço (R$)</Label>
          <Input
            type="number"
            step="0.01"
            value={formData.price}
            onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) }))}
            className="bg-[#1a1a25] border-[#1e1e2a] text-white mt-1"
          />
        </div>
        <div>
          <Label className="text-gray-300">Custo (R$)</Label>
          <Input
            type="number"
            step="0.01"
            value={formData.cost}
            onChange={(e) => setFormData(prev => ({ ...prev, cost: parseFloat(e.target.value) }))}
            className="bg-[#1a1a25] border-[#1e1e2a] text-white mt-1"
          />
        </div>
      </div>
      <div>
        <Label className="text-gray-300">Descrição</Label>
        <Textarea
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          className="bg-[#1a1a25] border-[#1e1e2a] text-white mt-1"
          rows={2}
        />
      </div>
      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="ghost" onClick={onClose} className="text-gray-400">
          Cancelar
        </Button>
        <Button type="submit" className="bg-[#c9a55c] hover:bg-[#a17f3f] text-black">
          {procedure ? "Salvar" : "Criar"}
        </Button>
      </div>
    </form>
  );
};

const RoomForm = ({ room, onSave, onClose }) => {
  const [formData, setFormData] = useState(room || {
    name: "",
    description: "",
    color: "#c9a55c",
    status: "available"
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label className="text-gray-300">Nome da Sala *</Label>
        <Input
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          className="bg-[#1a1a25] border-[#1e1e2a] text-white mt-1"
          required
        />
      </div>
      <div>
        <Label className="text-gray-300">Descrição</Label>
        <Textarea
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          className="bg-[#1a1a25] border-[#1e1e2a] text-white mt-1"
          rows={2}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-gray-300">Cor</Label>
          <Input
            type="color"
            value={formData.color}
            onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
            className="bg-[#1a1a25] border-[#1e1e2a] h-10 mt-1"
          />
        </div>
        <div>
          <Label className="text-gray-300">Status</Label>
          <Select
            value={formData.status}
            onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
          >
            <SelectTrigger className="bg-[#1a1a25] border-[#1e1e2a] text-white mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#12121a] border-[#1e1e2a]">
              <SelectItem value="available" className="text-white">Disponível</SelectItem>
              <SelectItem value="occupied" className="text-white">Ocupada</SelectItem>
              <SelectItem value="maintenance" className="text-white">Manutenção</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="ghost" onClick={onClose} className="text-gray-400">
          Cancelar
        </Button>
        <Button type="submit" className="bg-[#c9a55c] hover:bg-[#a17f3f] text-black">
          {room ? "Salvar" : "Criar"}
        </Button>
      </div>
    </form>
  );
};

const ProfessionalForm = ({ professional, onSave, onClose }) => {
  const [formData, setFormData] = useState(professional || {
    name: "",
    email: "",
    phone: "",
    specialty: "",
    registration_number: "",
    color: "#c9a55c",
    status: "active"
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <Label className="text-gray-300">Nome *</Label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            className="bg-[#1a1a25] border-[#1e1e2a] text-white mt-1"
            required
          />
        </div>
        <div>
          <Label className="text-gray-300">E-mail *</Label>
          <Input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            className="bg-[#1a1a25] border-[#1e1e2a] text-white mt-1"
            required
          />
        </div>
        <div>
          <Label className="text-gray-300">Telefone</Label>
          <Input
            value={formData.phone}
            onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
            className="bg-[#1a1a25] border-[#1e1e2a] text-white mt-1"
          />
        </div>
        <div>
          <Label className="text-gray-300">Especialidade</Label>
          <Input
            value={formData.specialty}
            onChange={(e) => setFormData(prev => ({ ...prev, specialty: e.target.value }))}
            className="bg-[#1a1a25] border-[#1e1e2a] text-white mt-1"
          />
        </div>
        <div>
          <Label className="text-gray-300">CRM/Registro</Label>
          <Input
            value={formData.registration_number}
            onChange={(e) => setFormData(prev => ({ ...prev, registration_number: e.target.value }))}
            className="bg-[#1a1a25] border-[#1e1e2a] text-white mt-1"
          />
        </div>
        <div>
          <Label className="text-gray-300">Cor na Agenda</Label>
          <Input
            type="color"
            value={formData.color}
            onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
            className="bg-[#1a1a25] border-[#1e1e2a] h-10 mt-1"
          />
        </div>
        <div>
          <Label className="text-gray-300">Status</Label>
          <Select
            value={formData.status}
            onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
          >
            <SelectTrigger className="bg-[#1a1a25] border-[#1e1e2a] text-white mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#12121a] border-[#1e1e2a]">
              <SelectItem value="active" className="text-white">Ativo</SelectItem>
              <SelectItem value="inactive" className="text-white">Inativo</SelectItem>
              <SelectItem value="vacation" className="text-white">Férias</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="ghost" onClick={onClose} className="text-gray-400">
          Cancelar
        </Button>
        <Button type="submit" className="bg-[#c9a55c] hover:bg-[#a17f3f] text-black">
          {professional ? "Salvar" : "Criar"}
        </Button>
      </div>
    </form>
  );
};

export default function Settings() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("procedures");
  const [isProcedureFormOpen, setIsProcedureFormOpen] = useState(false);
  const [isRoomFormOpen, setIsRoomFormOpen] = useState(false);
  const [isProfessionalFormOpen, setIsProfessionalFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const { data: procedures = [] } = useQuery({
    queryKey: ["procedures"],
    queryFn: () => base44.entities.Procedure.list(),
  });

  const { data: rooms = [] } = useQuery({
    queryKey: ["rooms"],
    queryFn: () => base44.entities.Room.list(),
  });

  const { data: professionals = [] } = useQuery({
    queryKey: ["professionals"],
    queryFn: () => base44.entities.Professional.list(),
  });

  // Procedure mutations
  const createProcedureMutation = useMutation({
    mutationFn: (data) => base44.entities.Procedure.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["procedures"] });
      setIsProcedureFormOpen(false);
      setEditingItem(null);
    },
  });

  const updateProcedureMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Procedure.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["procedures"] });
      setIsProcedureFormOpen(false);
      setEditingItem(null);
    },
  });

  const deleteProcedureMutation = useMutation({
    mutationFn: (id) => base44.entities.Procedure.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["procedures"] }),
  });

  // Room mutations
  const createRoomMutation = useMutation({
    mutationFn: (data) => base44.entities.Room.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      setIsRoomFormOpen(false);
      setEditingItem(null);
    },
  });

  const updateRoomMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Room.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      setIsRoomFormOpen(false);
      setEditingItem(null);
    },
  });

  const deleteRoomMutation = useMutation({
    mutationFn: (id) => base44.entities.Room.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["rooms"] }),
  });

  // Professional mutations
  const createProfessionalMutation = useMutation({
    mutationFn: (data) => base44.entities.Professional.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["professionals"] });
      setIsProfessionalFormOpen(false);
      setEditingItem(null);
    },
  });

  const updateProfessionalMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Professional.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["professionals"] });
      setIsProfessionalFormOpen(false);
      setEditingItem(null);
    },
  });

  const deleteProfessionalMutation = useMutation({
    mutationFn: (id) => base44.entities.Professional.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["professionals"] }),
  });

  const categoryLabels = {
    facial: "Facial",
    corporal: "Corporal",
    capilar: "Capilar",
    injetaveis: "Injetáveis",
    laser: "Laser",
    outros: "Outros"
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-serif text-white">Configurações</h1>
        <p className="text-gray-400">Gerencie procedimentos, salas e equipe</p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-[#1a1a25] border border-[#1e1e2a]">
          <TabsTrigger value="procedures" className="data-[state=active]:bg-[#c9a55c]/20 data-[state=active]:text-[#c9a55c]">
            Procedimentos
          </TabsTrigger>
          <TabsTrigger value="rooms" className="data-[state=active]:bg-[#c9a55c]/20 data-[state=active]:text-[#c9a55c]">
            Salas
          </TabsTrigger>
          <TabsTrigger value="professionals" className="data-[state=active]:bg-[#c9a55c]/20 data-[state=active]:text-[#c9a55c]">
            Profissionais
          </TabsTrigger>
        </TabsList>

        {/* Procedures */}
        <TabsContent value="procedures" className="mt-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-medium text-white">Procedimentos Cadastrados</h2>
            <Dialog open={isProcedureFormOpen} onOpenChange={setIsProcedureFormOpen}>
              <DialogTrigger asChild>
                <Button className="bg-[#c9a55c] hover:bg-[#a17f3f] text-black">
                  <Plus className="mr-2 h-4 w-4" />
                  Novo Procedimento
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-[#12121a] border-[#1e1e2a] text-white max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-xl font-serif">
                    {editingItem ? "Editar Procedimento" : "Novo Procedimento"}
                  </DialogTitle>
                </DialogHeader>
                <ProcedureForm
                  procedure={editingItem}
                  onSave={(data) => {
                    if (editingItem) {
                      updateProcedureMutation.mutate({ id: editingItem.id, data });
                    } else {
                      createProcedureMutation.mutate(data);
                    }
                  }}
                  onClose={() => { setIsProcedureFormOpen(false); setEditingItem(null); }}
                />
              </DialogContent>
            </Dialog>
          </div>

          <Card className="bg-[#12121a] border-[#1e1e2a]">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#1e1e2a]">
                      <th className="text-left p-4 text-sm text-gray-400 font-medium">Nome</th>
                      <th className="text-left p-4 text-sm text-gray-400 font-medium">Categoria</th>
                      <th className="text-left p-4 text-sm text-gray-400 font-medium">Duração</th>
                      <th className="text-left p-4 text-sm text-gray-400 font-medium">Preço</th>
                      <th className="text-left p-4 text-sm text-gray-400 font-medium">Custo</th>
                      <th className="text-left p-4 text-sm text-gray-400 font-medium">Margem</th>
                      <th className="text-left p-4 text-sm text-gray-400 font-medium">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {procedures.map((proc) => {
                      const margin = proc.price > 0 ? ((proc.price - (proc.cost || 0)) / proc.price * 100) : 0;
                      return (
                        <tr key={proc.id} className="border-b border-[#1e1e2a] hover:bg-[#c9a55c]/5">
                          <td className="p-4 text-white">{proc.name}</td>
                          <td className="p-4">
                            <Badge variant="outline" className="border-[#1e1e2a] text-gray-400">
                              {categoryLabels[proc.category] || proc.category}
                            </Badge>
                          </td>
                          <td className="p-4 text-gray-400">{proc.duration_minutes} min</td>
                          <td className="p-4 text-[#c9a55c]">R$ {proc.price?.toLocaleString("pt-BR")}</td>
                          <td className="p-4 text-gray-400">R$ {proc.cost?.toLocaleString("pt-BR")}</td>
                          <td className="p-4">
                            <Badge className={margin >= 50 ? "bg-emerald-500/20 text-emerald-400" : margin >= 30 ? "bg-yellow-500/20 text-yellow-400" : "bg-red-500/20 text-red-400"}>
                              {margin.toFixed(0)}%
                            </Badge>
                          </td>
                          <td className="p-4">
                            <div className="flex gap-2">
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => { setEditingItem(proc); setIsProcedureFormOpen(true); }}
                                className="text-gray-400 hover:text-white"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => deleteProcedureMutation.mutate(proc.id)}
                                className="text-gray-400 hover:text-red-400"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Rooms */}
        <TabsContent value="rooms" className="mt-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-medium text-white">Salas Cadastradas</h2>
            <Dialog open={isRoomFormOpen} onOpenChange={setIsRoomFormOpen}>
              <DialogTrigger asChild>
                <Button className="bg-[#c9a55c] hover:bg-[#a17f3f] text-black">
                  <Plus className="mr-2 h-4 w-4" />
                  Nova Sala
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-[#12121a] border-[#1e1e2a] text-white max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-xl font-serif">
                    {editingItem ? "Editar Sala" : "Nova Sala"}
                  </DialogTitle>
                </DialogHeader>
                <RoomForm
                  room={editingItem}
                  onSave={(data) => {
                    if (editingItem) {
                      updateRoomMutation.mutate({ id: editingItem.id, data });
                    } else {
                      createRoomMutation.mutate(data);
                    }
                  }}
                  onClose={() => { setIsRoomFormOpen(false); setEditingItem(null); }}
                />
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rooms.map((room) => (
              <Card key={room.id} className="bg-[#12121a] border-[#1e1e2a]">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${room.color}20` }}
                      >
                        <Building className="h-5 w-5" style={{ color: room.color }} />
                      </div>
                      <div>
                        <h3 className="font-medium text-white">{room.name}</h3>
                        <Badge className={
                          room.status === "available" ? "bg-emerald-500/20 text-emerald-400" :
                          room.status === "occupied" ? "bg-yellow-500/20 text-yellow-400" :
                          "bg-red-500/20 text-red-400"
                        }>
                          {room.status === "available" ? "Disponível" :
                           room.status === "occupied" ? "Ocupada" : "Manutenção"}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => { setEditingItem(room); setIsRoomFormOpen(true); }}
                        className="text-gray-400 hover:text-white h-8 w-8"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => deleteRoomMutation.mutate(room.id)}
                        className="text-gray-400 hover:text-red-400 h-8 w-8"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  {room.description && (
                    <p className="text-sm text-gray-400">{room.description}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Professionals */}
        <TabsContent value="professionals" className="mt-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-medium text-white">Equipe</h2>
            <Dialog open={isProfessionalFormOpen} onOpenChange={setIsProfessionalFormOpen}>
              <DialogTrigger asChild>
                <Button className="bg-[#c9a55c] hover:bg-[#a17f3f] text-black">
                  <Plus className="mr-2 h-4 w-4" />
                  Novo Profissional
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-[#12121a] border-[#1e1e2a] text-white max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-xl font-serif">
                    {editingItem ? "Editar Profissional" : "Novo Profissional"}
                  </DialogTitle>
                </DialogHeader>
                <ProfessionalForm
                  professional={editingItem}
                  onSave={(data) => {
                    if (editingItem) {
                      updateProfessionalMutation.mutate({ id: editingItem.id, data });
                    } else {
                      createProfessionalMutation.mutate(data);
                    }
                  }}
                  onClose={() => { setIsProfessionalFormOpen(false); setEditingItem(null); }}
                />
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {professionals.map((prof) => (
              <Card key={prof.id} className="bg-[#12121a] border-[#1e1e2a]">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12 border-2" style={{ borderColor: prof.color }}>
                        <AvatarFallback className="bg-[#c9a55c]/20 text-[#c9a55c]">
                          {prof.name?.[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-medium text-white">{prof.name}</h3>
                        <p className="text-sm text-gray-400">{prof.specialty || "Especialidade"}</p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => { setEditingItem(prof); setIsProfessionalFormOpen(true); }}
                        className="text-gray-400 hover:text-white h-8 w-8"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => deleteProfessionalMutation.mutate(prof.id)}
                        className="text-gray-400 hover:text-red-400 h-8 w-8"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-1 text-sm">
                    <p className="text-gray-500">{prof.email}</p>
                    {prof.registration_number && (
                      <p className="text-gray-500">CRM: {prof.registration_number}</p>
                    )}
                  </div>
                  <Badge className={
                    prof.status === "active" ? "bg-emerald-500/20 text-emerald-400" :
                    prof.status === "vacation" ? "bg-blue-500/20 text-blue-400" :
                    "bg-gray-500/20 text-gray-400"
                  } style={{ marginTop: "0.5rem" }}>
                    {prof.status === "active" ? "Ativo" :
                     prof.status === "vacation" ? "Férias" : "Inativo"}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}