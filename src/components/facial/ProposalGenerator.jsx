import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, Share2, CheckCircle, Clock, DollarSign, Calendar } from "lucide-react";

export default function ProposalGenerator({ patient, selectedProtocols, analysisData, onGenerate }) {
  const totalValue = selectedProtocols.reduce((sum, p) => sum + p.valor, 0);
  const packageDiscount = selectedProtocols.length > 1 ? totalValue * 0.15 : 0;
  const finalValue = totalValue - packageDiscount;

  const handleGenerate = () => {
    const proposalData = {
      patient,
      protocols: selectedProtocols,
      analysisData,
      totalValue,
      packageDiscount,
      finalValue,
      proposalNumber: `PROP-${Date.now()}`,
      generatedAt: new Date().toISOString(),
    };
    onGenerate?.(proposalData);
  };

  return (
    <Card className="bg-[#1a1a25] border-[#1e1e2a]">
      <CardContent className="p-6">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <FileText className="h-6 w-6 text-[#C5A059]" />
            <h3 className="text-xl font-serif text-white">Gerar Proposta Personalizada</h3>
          </div>
          <p className="text-sm text-gray-400">
            Crie uma proposta profissional com simulação visual, protocolos selecionados e condições especiais
          </p>
        </div>

        {/* Preview da Proposta */}
        <div className="bg-[#111620] border border-[#1e1e2a] rounded-lg p-4 mb-6">
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Paciente:</span>
              <span className="text-white font-medium">{patient?.name || "Não selecionado"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Protocolos:</span>
              <span className="text-white">{selectedProtocols.length} selecionados</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Análise Facial:</span>
              <span className="text-[#C5A059]">Incluída</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Simulação Visual:</span>
              <span className="text-[#C5A059]">Incluída</span>
            </div>
            <div className="border-t border-[#1e1e2a] pt-3 mt-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Investimento Total:</span>
                <div className="text-right">
                  <p className="text-2xl font-bold text-[#C5A059]">
                    R$ {finalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                  {packageDiscount > 0 && (
                    <p className="text-xs text-gray-500 line-through">
                      De R$ {totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Benefícios da Proposta */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <CheckCircle className="h-4 w-4 text-[#C5A059]" />
            <span>Design Premium</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <CheckCircle className="h-4 w-4 text-[#C5A059]" />
            <span>PDF Personalizado</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <CheckCircle className="h-4 w-4 text-[#C5A059]" />
            <span>Compartilhar WhatsApp</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <CheckCircle className="h-4 w-4 text-[#C5A059]" />
            <span>Assinatura Digital</span>
          </div>
        </div>

        {/* Ações */}
        <div className="flex gap-3">
          <Button
            onClick={handleGenerate}
            disabled={!patient || selectedProtocols.length === 0}
            className="flex-1 bg-[#C5A059] text-[#111620] hover:bg-[#D9BB82] font-semibold"
          >
            <FileText className="mr-2 h-4 w-4" />
            Gerar Plano Estético
          </Button>
          <Button
            variant="outline"
            className="border-[#1e1e2a] text-white hover:bg-[#1e1e2a]"
          >
            <Download className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="border-[#1e1e2a] text-white hover:bg-[#1e1e2a]"
          >
            <Share2 className="h-4 w-4" />
          </Button>
        </div>

        {/* Informações Adicionais */}
        <div className="mt-4 pt-4 border-t border-[#1e1e2a]">
          <div className="grid grid-cols-3 gap-4 text-xs text-gray-500">
            <div className="flex items-center gap-2">
              <Clock className="h-3 w-3" />
              <span>Validade: 7 dias</span>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="h-3 w-3" />
              <span>Parcelamento: até 12x</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-3 w-3" />
              <span>Agendamento imediato</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}