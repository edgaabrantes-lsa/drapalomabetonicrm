import React, { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Download, Share2, Send, CheckCircle, Star, Calendar, DollarSign, FileText, X } from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { toast } from "sonner";

export default function ProposalPreview({ proposalData, onClose }) {
  const proposalRef = useRef(null);

  const handleDownloadPDF = async () => {
    try {
      const element = proposalRef.current;
      const canvas = await html2canvas(element, { 
        scale: 2,
        useCORS: true,
        backgroundColor: "#111620"
      });
      const imgData = canvas.toDataURL("image/png");
      
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
      });

      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
      pdf.save(`Proposta-${proposalData.patient.name}-${proposalData.proposalNumber}.pdf`);
      
      toast.success("PDF baixado com sucesso!");
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      toast.error("Erro ao gerar PDF");
    }
  };

  const handleShareWhatsApp = () => {
    const message = `Olá ${proposalData.patient.name}! ✨\n\nSua proposta estética personalizada está pronta!\n\n📋 Protocolos selecionados: ${proposalData.protocols.length}\n💎 Investimento: R$ ${proposalData.finalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n\nAgende sua avaliação com a Dra. Paloma Betoni!`;
    
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
  };

  const handleShareEmail = () => {
    const subject = `Sua Proposta Estética - Dra. Paloma Betoni`;
    const body = `Olá ${proposalData.patient.name},\n\nSua proposta estética personalizada foi criada com sucesso!\n\nProtocolos selecionados: ${proposalData.protocols.length}\nInvestimento total: R$ ${proposalData.finalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n\nEntre em contato para agendar sua avaliação.\n\nAtenciosamente,\nClínica Dra. Paloma Betoni`;
    
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm overflow-y-auto p-4">
      <div className="min-h-screen flex flex-col">
        {/* Header com Ações */}
        <div className="flex items-center justify-between py-4 px-6">
          <h2 className="text-xl font-serif text-white">Visualização da Proposta</h2>
          <div className="flex gap-3">
            <Button
              onClick={handleDownloadPDF}
              className="bg-[#C5A059] text-[#111620] hover:bg-[#D9BB82]"
            >
              <Download className="mr-2 h-4 w-4" />
              Baixar PDF
            </Button>
            <Button
              onClick={handleShareWhatsApp}
              variant="outline"
              className="border-[#25D366] text-[#25D366] hover:bg-[#25D366]/10"
            >
              <Share2 className="mr-2 h-4 w-4" />
              WhatsApp
            </Button>
            <Button
              onClick={handleShareEmail}
              variant="outline"
              className="border-[#C5A059]/30 text-[#C5A059] hover:bg-[#C5A059]/10"
            >
              <Send className="mr-2 h-4 w-4" />
              E-mail
            </Button>
            <Button
              onClick={onClose}
              variant="outline"
              className="border-[#1e1e2a] text-white hover:bg-[#1e1e2a]"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Proposta Visual */}
        <div className="flex-1 flex items-center justify-center py-8">
          <div 
            ref={proposalRef}
            className="w-full max-w-3xl bg-gradient-to-br from-[#111620] to-[#0d0d14] border border-[#1e1e2a] rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Cabeçalho da Clínica */}
            <div className="bg-gradient-to-r from-[#C5A059]/10 to-transparent border-b border-[#1e1e2a] p-8">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h1 className="text-2xl font-serif text-white mb-1">Clínica Dra. Paloma Betoni</h1>
                  <p className="text-sm text-gray-400">Harmonização Orofacial & Estética Avançada</p>
                </div>
                <Star className="h-8 w-8 text-[#C5A059]" />
              </div>
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <Badge className="bg-[#C5A059]/10 text-[#C5A059] border border-[#C5A059]/30">
                  Proposta #{proposalData.proposalNumber}
                </Badge>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {new Date(proposalData.generatedAt).toLocaleDateString('pt-BR')}
                </span>
              </div>
            </div>

            {/* Dados da Paciente */}
            <div className="p-8 border-b border-[#1e1e2a]">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Paciente
              </h3>
              <p className="text-xl font-serif text-white">{proposalData.patient.name}</p>
            </div>

            {/* Análise Facial */}
            {proposalData.analysisData && (
              <div className="p-8 border-b border-[#1e1e2a]">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
                  Análise Facial IA
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-[#1a1a25] border border-[#1e1e2a] rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Protocolo Principal</p>
                    <p className="text-sm font-medium text-[#C5A059]">
                      {proposalData.analysisData.main_protocol}
                    </p>
                  </div>
                  <div className="p-4 bg-[#1a1a25] border border-[#1e1e2a] rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Regiões Mapeadas</p>
                    <p className="text-sm font-medium text-white">
                      {proposalData.analysisData.regions?.length || 0} regiões
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Protocolos Selecionados */}
            <div className="p-8 border-b border-[#1e1e2a]">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
                Protocolos Selecionados
              </h3>
              <div className="space-y-3">
                {proposalData.protocols.map((protocol, index) => (
                  <div 
                    key={index}
                    className="flex items-center justify-between p-4 bg-[#1a1a25] border border-[#1e1e2a] rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-[#C5A059]" />
                      <div>
                        <p className="font-medium text-white">{protocol.nome}</p>
                        {protocol.descricao && (
                          <p className="text-xs text-gray-500">{protocol.descricao}</p>
                        )}
                      </div>
                    </div>
                    <p className="font-semibold text-[#C5A059]">
                      R$ {protocol.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Valores */}
            <div className="p-8 bg-gradient-to-r from-[#C5A059]/5 to-transparent">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
                Investimento
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Subtotal</span>
                  <span className="text-white">
                    R$ {proposalData.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                {proposalData.packageDiscount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Desconto do pacote</span>
                    <span className="text-[#C5A059]">
                      -R$ {proposalData.packageDiscount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                )}
                <div className="border-t border-[#1e1e2a] pt-3 mt-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-gray-400 mb-1">Valor Total</p>
                      <p className="text-3xl font-bold text-[#C5A059]">
                        R$ {proposalData.finalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    {proposalData.finalValue > 5000 && (
                      <div className="text-right">
                        <p className="text-xs text-gray-500">ou até 12x de</p>
                        <p className="text-lg font-semibold text-white">
                          R$ {(proposalData.finalValue / 12).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Benefícios */}
            <div className="p-8 border-t border-[#1e1e2a]">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
                Sua proposta inclui
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  "Acompanhamento personalizado",
                  "Sessões conforme protocolo",
                  "Produtos premium",
                  "Avaliação de resultados",
                  "Garantia de qualidade",
                  "Suporte pós-procedimento"
                ].map((benefit, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-[#C5A059]" />
                    <span className="text-sm text-white">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Rodapé */}
            <div className="p-8 bg-[#0d0d14] border-t border-[#1e1e2a]">
              <div className="text-center space-y-3">
                <p className="text-sm text-gray-400">
                  Proposta válida por 7 dias a partir da data de emissão
                </p>
                <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <DollarSign className="h-3 w-3" />
                    Parcelamento em até 12x
                  </span>
                  <span className="flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    Termo de consentimento incluso
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}