import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, CheckCircle, Clock, XCircle, Calendar, DollarSign } from "lucide-react";

export default function PatientTreatmentPanel({ patientId, patientName }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedProtocolo, setSelectedProtocolo] = useState(null);
  const queryClient = useQueryClient();

  const { data: tratamentos } = useQuery({
    queryKey: ["patient-treatments", patientId],
    queryFn: () => base44.entities.PatientTreatment.filter({ patient_id: patientId }),
    enabled: !!patientId,
  });

  const { data: protocolos } = useQuery({
    queryKey: ["protocolos-premium-all"],
    queryFn: () => base44.entities.ProtocoloPremium.filter({ status: "ativo" }),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.PatientTreatment.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patient-treatments"] });
      setDialogOpen(false);
      setSelectedProtocolo(null);
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.PatientTreatment.update(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patient-treatments"] });
    },
  });

  const formatCurrency = (val) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);

  const getStatusIcon = (status) => {
    switch (status) {
      case "indicado":
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case "agendado":
        return <Calendar className="w-4 h-4 text-blue-500" />;
      case "realizado":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "cancelado":
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "indicado":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "agendado":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "realizado":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "cancelado":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      default:
        return "bg-gray-500/20 text-gray-400";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-serif" style={{ color: "#F0F4FA" }}>Tratamentos e Protocolos</h3>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button
              size="sm"
              className="gap-2"
              style={{ backgroundColor: "#C5A059", color: "#111620" }}
            >
              <Plus className="w-4 h-4" /> Indicar Tratamento
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl" style={{ backgroundColor: "#171D29", borderColor: "#252D3E", color: "#E8EDF5" }}>
            <DialogHeader>
              <DialogTitle style={{ color: "#F0F4FA" }}>Indicar Novo Tratamento</DialogTitle>
            </DialogHeader>
            <TreatmentForm
              patientId={patientId}
              patientName={patientName}
              protocolos={protocolos || []}
              selectedProtocolo={selectedProtocolo}
              setSelectedProtocolo={setSelectedProtocolo}
              onSubmit={(data) => createMutation.mutate(data)}
              onCancel={() => {
                setDialogOpen(false);
                setSelectedProtocolo(null);
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {tratamentos?.length === 0 ? (
        <p className="text-sm" style={{ color: "#8A95AA" }}>Nenhum tratamento indicado para este paciente.</p>
      ) : (
        <div className="grid gap-3">
          {tratamentos?.map((tratamento) => (
            <Card key={tratamento.id} className="border" style={{ backgroundColor: "#1A2030", borderColor: "#252D3E" }}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={getStatusColor(tratamento.status)}>
                        {getStatusIcon(tratamento.status)}
                        <span className="ml-1 capitalize">{tratamento.status}</span>
                      </Badge>
                      <Badge variant="outline" style={{ borderColor: "#252D3E", color: "#8A95AA" }}>
                        {tratamento.tipo === "protocolo" ? "Protocolo" : "Avulso"}
                      </Badge>
                    </div>
                    <h4 className="font-semibold mb-1" style={{ color: "#F0F4FA" }}>{tratamento.protocolo_nome}</h4>
                    <p className="text-sm mb-2" style={{ color: "#C8D0DF" }}>
                      {tratamento.regioes_tratadas?.length > 0 && (
                        <span>Regiões: {tratamento.regioes_tratadas.join(", ")} | </span>
                      )}
                      {tratamento.data_indicacao && (
                        <span>Indicado em: {new Date(tratamento.data_indicacao).toLocaleDateString("pt-BR")}</span>
                      )}
                    </p>
                    {tratamento.valor && (
                      <p className="text-sm font-medium" style={{ color: "#C5A059" }}>
                        <DollarSign className="w-3 h-3 inline" />
                        {formatCurrency(tratamento.valor)}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {tratamento.status === "indicado" && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateStatusMutation.mutate({ id: tratamento.id, status: "agendado" })}
                          style={{ borderColor: "#252D3E", color: "#E8EDF5" }}
                        >
                          Agendar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateStatusMutation.mutate({ id: tratamento.id, status: "cancelado" })}
                          style={{ borderColor: "#252D3E", color: "#F87171" }}
                        >
                          Cancelar
                        </Button>
                      </>
                    )}
                    {tratamento.status === "agendado" && (
                      <Button
                        size="sm"
                        onClick={() => updateStatusMutation.mutate({ id: tratamento.id, status: "realizado" })}
                        style={{ backgroundColor: "#10B981", color: "#fff" }}
                      >
                        Concluir
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function TreatmentForm({ patientId, patientName, protocolos, selectedProtocolo, setSelectedProtocolo, onSubmit, onCancel }) {
  const formatCurrency = (val) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);

  const [formData, setFormData] = useState({
    patient_id: patientId,
    patient_name: patientName,
    protocolo_id: "",
    protocolo_nome: "",
    categoria: "avulso",
    tipo: "avulso",
    status: "indicado",
    data_indicacao: new Date().toISOString().split("T")[0],
    valor: 0,
    regioes_tratadas: [],
    observacoes: "",
  });

  const handleProtocoloSelect = (protocoloId) => {
    const protocolo = protocolos.find((p) => p.id === protocoloId);
    if (protocolo) {
      setSelectedProtocolo(protocolo);
      setFormData({
        ...formData,
        protocolo_id: protocolo.id,
        protocolo_nome: protocolo.nome,
        categoria: protocolo.categoria,
        valor: protocolo.valor_por_ml ? protocolo.valor_min : protocolo.valor_min,
        regioes_tratadas: protocolo.regioes || [],
      });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm mb-2 block" style={{ color: "#B0BBCF" }}>Selecionar Protocolo</label>
        <Select value={formData.protocolo_id} onValueChange={handleProtocoloSelect}>
          <SelectTrigger style={{ backgroundColor: "#1A2030", borderColor: "#252D3E", color: "#E8EDF5" }}>
            <SelectValue placeholder="Escolha um protocolo..." />
          </SelectTrigger>
          <SelectContent style={{ backgroundColor: "#1A2030", borderColor: "#252D3E" }}>
            {protocolos.map((p) => (
              <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedProtocolo && (
        <div className="p-3 rounded border" style={{ backgroundColor: "#171D29", borderColor: "#252D3E" }}>
          <p className="text-sm font-medium mb-1" style={{ color: "#F0F4FA" }}>{selectedProtocolo.nome}</p>
          <p className="text-xs mb-2" style={{ color: "#C8D0DF" }}>{selectedProtocolo.objetivo}</p>
          <p className="text-sm" style={{ color: "#C5A059" }}>
            Valor: {selectedProtocolo.valor_por_ml ? `${formatCurrency(selectedProtocolo.valor_min)}/ml` : formatCurrency(selectedProtocolo.valor_min)}
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm mb-2 block" style={{ color: "#B0BBCF" }}>Valor (R$)</label>
          <Input
            type="number"
            value={formData.valor}
            onChange={(e) => setFormData({ ...formData, valor: Number(e.target.value) })}
            style={{ backgroundColor: "#1A2030", borderColor: "#252D3E", color: "#E8EDF5" }}
          />
        </div>
        <div>
          <label className="text-sm mb-2 block" style={{ color: "#B0BBCF" }}>Data de Indicação</label>
          <Input
            type="date"
            value={formData.data_indicacao}
            onChange={(e) => setFormData({ ...formData, data_indicacao: e.target.value })}
            style={{ backgroundColor: "#1A2030", borderColor: "#252D3E", color: "#E8EDF5" }}
          />
        </div>
      </div>

      <div>
        <label className="text-sm mb-2 block" style={{ color: "#B0BBCF" }}>Observações</label>
        <Input
          value={formData.observacoes}
          onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
          style={{ backgroundColor: "#1A2030", borderColor: "#252D3E", color: "#E8EDF5" }}
        />
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} style={{ borderColor: "#252D3E", color: "#E8EDF5" }}>
          Cancelar
        </Button>
        <Button type="submit" style={{ backgroundColor: "#C5A059", color: "#111620" }}>
          Indicar Tratamento
        </Button>
      </div>
    </form>
  );
}