import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

const TIPO_COLORS = {
  cadastro: "bg-blue-500/20 text-blue-400",
  edicao: "bg-yellow-500/20 text-yellow-400",
  prontuario: "bg-green-500/20 text-green-400",
  imagem: "bg-purple-500/20 text-purple-400",
  documento: "bg-orange-500/20 text-orange-400",
  financeiro: "bg-emerald-500/20 text-emerald-400",
  contrato: "bg-cyan-500/20 text-cyan-400",
  acesso: "bg-gray-500/20 text-gray-400",
  exclusao: "bg-red-500/20 text-red-400",
  permissao: "bg-pink-500/20 text-pink-400",
  outro: "bg-gray-500/20 text-gray-400"
};

export default function DossieLogHistorico({ patient }) {
  const { data: logs = [] } = useQuery({
    queryKey: ["dossie-logs", patient.id],
    queryFn: () => base44.entities.DossieLog.filter({ patient_id: patient.id }, "-data_hora", 200)
  });

  return (
    <div className="space-y-2">
      <p className="text-xs text-[#8A95AA] mb-4">{logs.length} registros no histórico</p>

      {logs.length === 0 && (
        <div className="text-center py-10 text-[#4A5568] text-sm">Nenhum log registrado ainda</div>
      )}

      {logs.map((log) => (
        <div key={log.id} className="border border-[#252D3E] rounded-md bg-[#0F1521] px-4 py-3 flex items-start gap-3">
          <div className="w-1.5 h-1.5 rounded-full bg-[#C5A059] mt-1.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className={`text-xs ${TIPO_COLORS[log.tipo]}`}>{log.tipo}</Badge>
              <span className="text-sm text-white">{log.acao}</span>
            </div>
            {log.descricao && <p className="text-xs text-[#8A95AA] mt-0.5">{log.descricao}</p>}
            <div className="flex items-center gap-3 mt-1 text-xs text-[#4A5568]">
              <span>{log.usuario}</span>
              {log.data_hora && <span>{format(parseISO(log.data_hora), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}