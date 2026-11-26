import { useEffect } from "react";
import { base44 } from "@/api/base44Client";

/**
 * Mantém a agenda sincronizada entre todos os logins.
 * A leitura autorizada passa pela função do backend, então os eventos em tempo real
 * são complementares: qualquer mudança recebida invalida o cache e a tela se atualiza.
 * A atualização periódica da consulta permanece como contingência.
 */
export default function useAgendaRealtime(queryClient) {
  useEffect(() => {
    const aoMudar = (chaves) => () => {
      chaves.forEach((queryKey) => queryClient.invalidateQueries({ queryKey }));
    };

    const inscricoes = [
      base44.entities.Appointment.subscribe(aoMudar([["appointments"], ["agenda-hoje"]])),
      base44.entities.BloqueioAgenda.subscribe(aoMudar([["bloqueios-agenda"]])),
    ];

    return () => {
      inscricoes.forEach((cancelar) => {
        if (typeof cancelar === "function") cancelar();
      });
    };
  }, [queryClient]);
}