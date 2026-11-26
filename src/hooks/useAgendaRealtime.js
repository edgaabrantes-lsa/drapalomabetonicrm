import { useEffect } from "react";
import { base44 } from "@/api/base44Client";

/**
 * Mantém a agenda sincronizada entre todos os logins.
 * Qualquer agendamento ou indisponibilidade criado, editado ou excluído por outra
 * pessoa invalida as consultas e a tela se atualiza sozinha, sem recarregar a página.
 */
export default function useAgendaRealtime(queryClient) {
  useEffect(() => {
    const aoMudar = (chaves) => () => {
      chaves.forEach((queryKey) => queryClient.invalidateQueries({ queryKey }));
    };

    const inscricoes = [
      base44.entities.Appointment.subscribe(aoMudar([["appointments"]])),
      base44.entities.BloqueioAgenda.subscribe(aoMudar([["bloqueios-agenda"]])),
    ];

    return () => {
      inscricoes.forEach((cancelar) => {
        if (typeof cancelar === "function") cancelar();
      });
    };
  }, [queryClient]);
}