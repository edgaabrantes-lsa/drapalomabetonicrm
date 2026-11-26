import React from "react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { T, statusDot } from "@/lib/agendaTokens";

/* Lista completa dos agendamentos de um dia (visão mensal mobile) */
export default function DiaAgendamentosSheet({ dia, itens = [], onClose, onClickAppointment }) {
  return (
    <Dialog open={!!dia} onOpenChange={(aberto) => { if (!aberto) onClose(); }}>
      <DialogContent
        className="w-[calc(100vw-16px)] sm:w-full"
        style={{ maxWidth: 440, maxHeight: "80vh", overflowY: "auto" }}
      >
        <DialogHeader>
          <DialogTitle style={{ fontFamily: "Inter", fontSize: 18, fontWeight: 600, color: T.onyx }}>
            {dia ? format(dia, "d 'de' MMMM", { locale: ptBR }) : ""}
          </DialogTitle>
        </DialogHeader>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {itens.map((appt) => {
            const cfg = statusDot[appt.status] || statusDot.scheduled;
            return (
              <button
                key={appt.id}
                type="button"
                onClick={() => { onClickAppointment(appt); onClose(); }}
                style={{
                  display: "flex", alignItems: "flex-start", gap: 10, width: "100%",
                  textAlign: "left", background: T.pearl, cursor: "pointer",
                  border: `1px solid ${T.subtle}`, borderLeft: `3px solid ${cfg.dot}`,
                  borderRadius: 4, padding: "10px 12px",
                }}
              >
                <span style={{ fontFamily: "Inter", fontSize: 12, color: "#BCBCBC", flexShrink: 0 }}>
                  {format(parseISO(appt.start_time), "HH:mm")}
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{
                    display: "block", fontFamily: "Inter", fontWeight: 500,
                    fontSize: 13, color: T.onyx, overflowWrap: "anywhere",
                  }}>
                    {appt.patient_name || "Paciente"}
                  </span>
                  <span style={{
                    display: "block", fontFamily: "Inter", fontSize: 9, letterSpacing: "0.06em",
                    textTransform: "uppercase", color: T.charcoal, marginTop: 2,
                  }}>
                    {cfg.label}{appt.procedure_name ? ` · ${appt.procedure_name}` : ""}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}