import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Download, Trash2, Eye, MessageSquare, Sparkles,
  Calendar, User, CheckCircle, AlertCircle, Loader2
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const statusConfig = {
  pending: { label: "Pendente", color: "bg-gray-500/20 text-gray-400" },
  processing: { label: "Processando", color: "bg-blue-500/20 text-blue-400" },
  completed: { label: "Concluído", color: "bg-emerald-500/20 text-emerald-400" },
  failed: { label: "Falhou", color: "bg-red-500/20 text-red-400" }
};

const T = {
  pearl: "#111620",
  white: "#171D29",
  onyx: "#E8EDF5",
  charcoal: "#8A95AA",
  subtle: "#252D3E",
  gold: "#C5A059",
};

export default function FullFaceSimulations() {
  const queryClient = useQueryClient();
  const [selectedSimulation, setSelectedSimulation] = useState(null);
  const [simulationToDelete, setSimulationToDelete] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: () => base44.auth.me(),
  });

  const { data: simulations = [], isLoading } = useQuery({
    queryKey: ["full-face-simulations"],
    queryFn: () => base44.entities.FullFaceSimulation.list("-created_date", 500),
  });

  const { data: patients = [] } = useQuery({
    queryKey: ["patients"],
    queryFn: () => base44.entities.Patient.list("-created_date", 1000),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.FullFaceSimulation.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["full-face-simulations"] });
      setSimulationToDelete(null);
    },
  });

  React.useEffect(() => {
    if (user?.role === "admin") {
      setIsAdmin(true);
    }
  }, [user]);

  const getPatient = (patientId) => patients.find(p => p.id === patientId);

  const handleDownload = async (imageUrl, filename) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Erro ao baixar imagem:", error);
    }
  };

  const handleWhatsApp = (simulation) => {
    const patient = getPatient(simulation.patient_id);
    const phone = patient?.whatsapp || patient?.phone;
    if (!phone) return;

    const message = `Olá ${patient?.full_name || "paciente"}! Segue sua simulação de harmonização facial full face. Esta é uma previsão visual do resultado que podemos alcançar. Agende sua avaliação!`;
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/${phone.replace(/\D/g, "")}?text=${encodedMessage}`, "_blank");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-serif text-white">Simulações Full Face</h1>
        <p className="text-gray-400">Histórico de simulações faciais geradas por IA</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-[#12121a] border-[#1e1e2a]">
          <CardContent className="p-4">
            <p className="text-xs text-gray-500">Total</p>
            <p className="text-2xl font-light text-white mt-1">{simulations.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-[#12121a] border-[#1e1e2a]">
          <CardContent className="p-4">
            <p className="text-xs text-gray-500">Concluídas</p>
            <p className="text-2xl font-light text-emerald-400 mt-1">
              {simulations.filter(s => s.status === "completed").length}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-[#12121a] border-[#1e1e2a]">
          <CardContent className="p-4">
            <p className="text-xs text-gray-500">Processando</p>
            <p className="text-2xl font-light text-blue-400 mt-1">
              {simulations.filter(s => s.status === "processing").length}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-[#12121a] border-[#1e1e2a]">
          <CardContent className="p-4">
            <p className="text-xs text-gray-500">Falharam</p>
            <p className="text-2xl font-light text-red-400 mt-1">
              {simulations.filter(s => s.status === "failed").length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Simulations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {simulations.map((simulation) => {
          const patient = getPatient(simulation.patient_id);
          const status = statusConfig[simulation.status] || statusConfig.pending;

          return (
            <Card
              key={simulation.id}
              className="bg-[#12121a] border-[#1e1e2a] hover:border-[#c9a55c]/30 transition-all cursor-pointer"
              onClick={() => setSelectedSimulation(simulation)}
            >
              <CardContent className="p-0">
                {/* Imagem */}
                <div className="aspect-square relative overflow-hidden rounded-t-lg">
                  {simulation.generated_image_url ? (
                    <img
                      src={simulation.generated_image_url}
                      alt="Simulação"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-[#1a1a25]">
                      {simulation.status === "processing" ? (
                        <Loader2 className="h-8 w-8 animate-spin text-[#c9a55c]" />
                      ) : (
                        <AlertCircle className="h-8 w-8 text-gray-500" />
                      )}
                    </div>
                  )}
                  
                  {/* Status Badge */}
                  <div className="absolute top-3 right-3">
                    <Badge className={status.color}>
                      {status.label}
                    </Badge>
                  </div>
                </div>

                {/* Info */}
                <div className="p-4 space-y-3">
                  <div>
                    <h3 className="font-medium text-white truncate">
                      {patient?.full_name || "Paciente"}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {simulation.created_date && format(parseISO(simulation.created_date), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <User className="h-3 w-3" />
                    <span className="truncate">{simulation.user_email || "—"}</span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <Calendar className="h-3 w-3" />
                    <span>
                      {simulation.source_type === "front_camera" && "Câmera Frontal"}
                      {simulation.source_type === "back_camera" && "Câmera Traseira"}
                      {simulation.source_type === "webcam" && "Webcam"}
                      {simulation.source_type === "upload" && "Upload"}
                    </span>
                  </div>

                  {simulation.consent_lgpd && (
                    <div className="flex items-center gap-2 text-xs text-emerald-400">
                      <CheckCircle className="h-3 w-3" />
                      <span>Consentimento LGPD confirmado</span>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-2 border-t border-[#1e1e2a]">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedSimulation(simulation);
                      }}
                      className="flex-1 border-[#c9a55c]/30 text-[#c9a55c] hover:bg-[#c9a55c]/10 h-8"
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      Ver
                    </Button>
                    {simulation.generated_image_url && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownload(simulation.generated_image_url, `simulacao_${patient?.full_name || "paciente"}.png`);
                        }}
                        className="flex-1 border-[#c9a55c]/30 text-[#c9a55c] hover:bg-[#c9a55c]/10 h-8"
                      >
                        <Download className="h-3 w-3 mr-1" />
                        Baixar
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {simulations.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <Sparkles className="h-12 w-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">Nenhuma simulação gerada ainda</p>
        </div>
      )}

      {/* Detail Dialog */}
      {selectedSimulation && (
        <Dialog open={!!selectedSimulation} onOpenChange={() => setSelectedSimulation(null)}>
          <DialogContent className="bg-[#12121a] border-[#1e1e2a] text-white max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-serif">
                Simulação Full Face - {getPatient(selectedSimulation.patient_id)?.full_name}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-6">
              {/* Imagem Grande */}
              {selectedSimulation.generated_image_url && (
                <div className="rounded-lg overflow-hidden">
                  <img
                    src={selectedSimulation.generated_image_url}
                    alt="Simulação"
                    className="w-full h-auto"
                  />
                </div>
              )}

              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-[#1a1a25] rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">Paciente</p>
                  <p className="text-sm text-white font-medium">
                    {getPatient(selectedSimulation.patient_id)?.full_name || "—"}
                  </p>
                </div>
                <div className="p-3 bg-[#1a1a25] rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">Data</p>
                  <p className="text-sm text-white font-medium">
                    {selectedSimulation.created_date && format(parseISO(selectedSimulation.created_date), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                  </p>
                </div>
                <div className="p-3 bg-[#1a1a25] rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">Origem</p>
                  <p className="text-sm text-white font-medium">
                    {selectedSimulation.source_type === "front_camera" && "Câmera Frontal"}
                    {selectedSimulation.source_type === "back_camera" && "Câmera Traseira"}
                    {selectedSimulation.source_type === "webcam" && "Webcam"}
                    {selectedSimulation.source_type === "upload" && "Upload"}
                  </p>
                </div>
                <div className="p-3 bg-[#1a1a25] rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">Status</p>
                  <Badge className={statusConfig[selectedSimulation.status]?.color}>
                    {statusConfig[selectedSimulation.status]?.label}
                  </Badge>
                </div>
              </div>

              {/* Relatório Técnico */}
              {selectedSimulation.technical_report && (
                <div className="p-4 bg-[#1a1a25] rounded-lg">
                  <p className="text-xs text-gray-500 mb-2">Relatório Técnico</p>
                  <p className="text-sm text-gray-300">{selectedSimulation.technical_report}</p>
                </div>
              )}

              {/* Aviso Legal */}
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-xs text-gray-400">
                  <strong className="text-red-400">Aviso Legal:</strong> Imagem meramente ilustrativa, criada por inteligência artificial para apoio visual em consulta. O resultado real depende de avaliação profissional, anatomia individual, técnica utilizada e resposta biológica da paciente.
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-[#1e1e2a]">
                {selectedSimulation.generated_image_url && (
                  <>
                    <Button
                      onClick={() => handleDownload(selectedSimulation.generated_image_url, `simulacao.png`)}
                      className="bg-[#c9a55c] hover:bg-[#a17f3f] text-black"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Baixar Imagem
                    </Button>
                    <Button
                      onClick={() => handleWhatsApp(selectedSimulation)}
                      variant="outline"
                      className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                    >
                      <MessageSquare className="mr-2 h-4 w-4" />
                      Enviar WhatsApp
                    </Button>
                  </>
                )}
                {isAdmin && (
                  <Button
                    onClick={() => setSimulationToDelete(selectedSimulation)}
                    variant="destructive"
                    className="ml-auto"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Excluir
                  </Button>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!simulationToDelete} onOpenChange={() => setSimulationToDelete(null)}>
        <AlertDialogContent className="bg-[#12121a] border-[#1e1e2a]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Excluir Simulação?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              Esta ação não pode ser desfeita. A simulação será permanentemente excluída do sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-gray-400">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate(simulationToDelete.id)}
              className="bg-red-600 hover:bg-red-700"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}