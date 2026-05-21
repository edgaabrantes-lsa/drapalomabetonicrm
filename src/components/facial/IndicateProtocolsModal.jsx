import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CheckCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function IndicateProtocolsModal({ patientId, patientName, protocolosSugeridos, open, onOpenChange, onSuccess }) {
  const [isIndicating, setIsIndicating] = useState(false);
  const [selectedProtocolos, setSelectedProtocolos] = useState([]);

  const handleSelect = (protocolo) => {
    if (selectedProtocolos.find((p) => p.nome === protocolo.nome)) {
      setSelectedProtocolos(selectedProtocolos.filter((p) => p.nome !== protocolo.nome));
    } else {
      setSelectedProtocolos([...selectedProtocolos, protocolo]);
    }
  };

  const handleIndicate = async () => {
    if (selectedProtocolos.length === 0) {
      toast.warning("Selecione pelo menos um protocolo para indicar");
      return;
    }

    setIsIndicating(true);
    try {
      const response = await base44.functions.invoke("indicateProtocolsFromAnalysis", {
        patientId,
        patientName,
        protocolosSugeridos: selectedProtocolos,
      });

      if (response.data.success) {
        toast.success(response.data.message);
        onSuccess?.();
        onOpenChange(false);
        setSelectedProtocolos([]);
      }
    } catch (error) {
      toast.error("Erro ao indicar protocolos: " + (error.message || "Erro desconhecido"));
    } finally {
      setIsIndicating(false);
    }
  };

  const formatCurrency = (val) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#12121a] border-[#1e1e2a] text-white max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-serif">
            Indicar Protocolos para {patientName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-gray-400">
            Selecione os protocolos da análise facial que deseja indicar para este paciente:
          </p>

          <div className="space-y-3">
            {protocolosSugeridos.map((protocolo, idx) => {
              const isSelected = selectedProtocolos.find((p) => p.nome === protocolo.nome);
              return (
                <div
                  key={idx}
                  onClick={() => handleSelect(protocolo)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? "bg-[#c9a55c]/10 border-[#c9a55c]/50"
                      : "bg-[#1a1a25] border-[#1e1e2a] hover:border-[#c9a55c]/30"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-white mb-1">{protocolo.nome}</h4>
                      {protocolo.regioes?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {protocolo.regioes.slice(0, 5).map((r, i) => (
                            <Badge key={i} variant="outline" className="text-xs border-[#1e1e2a] text-gray-400">
                              {r}
                            </Badge>
                          ))}
                        </div>
                      )}
                      {protocolo.justificativa && (
                        <p className="text-xs text-gray-400">{protocolo.justificativa}</p>
                      )}
                    </div>
                    {isSelected && (
                      <CheckCircle className="h-5 w-5 text-[#c9a55c] flex-shrink-0 ml-3" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-[#1e1e2a]">
            <p className="text-sm text-gray-400">
              {selectedProtocolos.length} protocolo(s) selecionado(s)
            </p>
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  onOpenChange(false);
                  setSelectedProtocolos([]);
                }}
                disabled={isIndicating}
                style={{ borderColor: "#1e1e2a", color: "#E8EDF5" }}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleIndicate}
                disabled={selectedProtocolos.length === 0 || isIndicating}
                style={{ backgroundColor: "#C5A059", color: "#111620" }}
              >
                {isIndicating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {isIndicating ? "Indicando..." : "Indicar Tratamentos"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}