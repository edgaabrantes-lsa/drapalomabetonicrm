import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Star, Clock, TrendingUp } from "lucide-react";

export default function ProtocolSelectionPanel({ protocolosSugeridos, onSelectionChange }) {
  const [selectedProtocols, setSelectedProtocols] = useState([]);

  const handleToggle = (protocolo) => {
    const newSelection = selectedProtocols.find(p => p.id === protocolo.id)
      ? selectedProtocols.filter(p => p.id !== protocolo.id)
      : [...selectedProtocols, protocolo];
    
    setSelectedProtocols(newSelection);
    onSelectionChange?.(newSelection);
  };

  const totalValue = selectedProtocols.reduce((sum, p) => sum + p.valor, 0);
  const packageDiscount = selectedProtocols.length > 1 ? totalValue * 0.15 : 0;
  const finalValue = totalValue - packageDiscount;

  return (
    <div className="space-y-6">
      {/* Score Facial */}
      <Card className="bg-[#1a1a25] border-[#1e1e2a]">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-serif text-white mb-1">Score Facial</h3>
              <p className="text-sm text-gray-400">Análise de harmonização</p>
            </div>
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-[#C5A059]" />
              <span className="text-2xl font-bold text-[#C5A059]">8.5/10</span>
            </div>
          </div>
          <div className="flex gap-4">
            <Badge className="bg-[#C5A059]/10 text-[#C5A059] border border-[#C5A059]/30">
              <TrendingUp className="h-3 w-3 mr-1" />
              Potencial de Melhoria: 35%
            </Badge>
            <Badge className="bg-[#C5A059]/10 text-[#C5A059] border border-[#C5A059]/30">
              <Clock className="h-3 w-3 mr-1" />
              Tempo Estimado: 3-4 sessões
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Protocolo Principal */}
      {protocolosSugeridos.principal && (
        <div>
          <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Protocolo Principal Recomendado
          </h4>
          <Card 
            className={`cursor-pointer transition-all border-2 ${
              selectedProtocols.find(p => p.id === protocolosSugeridos.principal.id)
                ? "bg-[#c9a55c]/10 border-[#c9a55c]"
                : "bg-[#1a1a25] border-[#1e1e2a] hover:border-[#c9a55c]/30"
            }`}
          >
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <Checkbox
                    checked={!!selectedProtocols.find(p => p.id === protocolosSugeridos.principal.id)}
                    onCheckedChange={() => handleToggle(protocolosSugeridos.principal)}
                    className="border-[#C5A059] data-[state=checked]:bg-[#C5A059]"
                  />
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className="bg-[#C5A059] text-[#111620] font-semibold">
                        PRINCIPAL
                      </Badge>
                      <h3 className="text-lg font-semibold text-white">
                        {protocolosSugeridos.principal.nome}
                      </h3>
                    </div>
                    <p className="text-sm text-gray-400 mb-3">
                      {protocolosSugeridos.principal.descricao}
                    </p>
                    <div className="flex gap-4 text-sm">
                      <span className="text-gray-400">
                        <span className="text-gray-500">Sessões:</span> {protocolosSugeridos.principal.sessoes}
                      </span>
                      <span className="text-gray-400">
                        <span className="text-gray-500">Duração:</span> {protocolosSugeridos.principal.duracao}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-[#C5A059]">
                    R$ {protocolosSugeridos.principal.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                  {protocolosSugeridos.principal.valorPorSessao && (
                    <p className="text-xs text-gray-500">
                      ou {protocolosSugeridos.principal.valorPorSessao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/sessão
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Protocolos Complementares */}
      {protocolosSugeridos.complementares?.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Protocolos Complementares
          </h4>
          <div className="space-y-3">
            {protocolosSugeridos.complementares.map((protocolo) => (
              <Card
                key={protocolo.id}
                className={`cursor-pointer transition-all ${
                  selectedProtocols.find(p => p.id === protocolo.id)
                    ? "bg-[#c9a55c]/10 border-[#c9a55c]/50"
                    : "bg-[#1a1a25] border-[#1e1e2a] hover:border-[#c9a55c]/30"
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={!!selectedProtocols.find(p => p.id === protocolo.id)}
                        onCheckedChange={() => handleToggle(protocolo)}
                        className="border-[#C5A059] data-[state=checked]:bg-[#C5A059]"
                      />
                      <div>
                        <h5 className="font-medium text-white">{protocolo.nome}</h5>
                        <p className="text-xs text-gray-400">{protocolo.descricao}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-[#C5A059]">
                        R$ {protocolo.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Resumo do Pacote */}
      {selectedProtocols.length > 0 && (
        <Card className="bg-gradient-to-r from-[#1a1a25] to-[#1e1e2a] border-[#C5A059]/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-lg font-semibold text-white mb-2">
                  Pacote Personalizado
                </h4>
                <div className="space-y-1 text-sm text-gray-400">
                  <p>
                    <span className="text-gray-500">Protocolos:</span> {selectedProtocols.length} selecionados
                  </p>
                  <p>
                    <span className="text-gray-500">Subtotal:</span> R$ {totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                  {packageDiscount > 0 && (
                    <p className="text-[#C5A059]">
                      <span className="text-gray-500">Desconto do pacote (15%):</span> -R$ {packageDiscount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  )}
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-400">Valor Final</p>
                <p className="text-3xl font-bold text-[#C5A059]">
                  R$ {finalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                {finalValue > 5000 && (
                  <p className="text-xs text-gray-500 mt-1">
                    ou 12x de {(finalValue / 12).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}