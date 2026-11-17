import React from "react";
import { format, parseISO, isSameDay, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { T, statusDot } from "@/lib/agendaTokens";

/* Visão semanal no celular — dias empilhados, sem rolagem lateral */
export default function SemanaMobile({ weekDays, appointments, onClickAppointment, onClickSlot }) {
  return (
    <div>
      {weekDays.map((day) => {
        const dayAppts = appointments
          .filter((a) => a.start_time && isSameDay(parseISO(a.start_time), day))
          .sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
        const hoje = isToday(day);

        return (
          <div key={day.toISOString()} style={{ borderBottom: `1px solid ${T.subtle}` }}>
            <button
              type="button"
              onClick={() => onClickSlot(day, 9)}
              style={{
                width: "100%", display: "flex", alignItems: "baseline", gap: 8,
                padding: "10px 12px", background: hoje ? "rgba(197,160,89,0.06)" : "transparent",
                border: "none", cursor: "pointer", textAlign: "left",
              }}
            >
              <span style={{
                fontFamily: "Inter", fontSize: 10, letterSpacing: "0.1em",
                textTransform: "uppercase", color: hoje ? T.gold : T.charcoal, fontWeight: hoje ? 600 : 400,
              }}>
                {format(day, "EEE", { locale: ptBR })}
              </span>
              <span style={{
                fontFamily: "Inter",
                fontSize: 16, fontWeight: 400, color: hoje ? T.gold : T.onyx,
              }}>
                {format(day, "d 'de' MMM", { locale: ptBR })}
              </span>
              <span style={{ marginLeft: "auto", fontFamily: "Inter", fontSize: 10, color: T.charcoal }}>
                {dayAppts.length > 0 ? `${dayAppts.length} ag.` : ""}
              </span>
            </button>

            <div style={{ padding: "0 12px 10px" }}>
              {dayAppts.length === 0 ? (
                <p style={{ fontFamily: "Inter", fontSize: 11, color: "#4B5468", margin: 0 }}>
                  Sem agendamentos
                </p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {dayAppts.map((appt) => {
                    const cfg = statusDot[appt.status] || statusDot.scheduled;
                    return (
                      <button
                        key={appt.id}
                        type="button"
                        onClick={() => onClickAppointment(appt)}
                        style={{
                          display: "flex", alignItems: "center", gap: 8, width: "100%", textAlign: "left",
                          background: T.pearl, border: `1px solid ${T.subtle}`,
                          borderLeft: `3px solid ${cfg.dot}`, borderRadius: 3,
                          padding: "8px 10px", cursor: "pointer",
                        }}
                      >
                        <span style={{ fontFamily: "Inter", fontSize: 11, color: "#BCBCBC", flexShrink: 0 }}>
                          {format(parseISO(appt.start_time), "HH:mm")}
                        </span>
                        <span style={{ flex: 1, minWidth: 0 }}>
                          <span style={{
                            display: "block", fontFamily: "Inter", fontWeight: 500,
                            fontSize: 13, color: T.onyx, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                          }}>
                            {appt.patient_name}
                          </span>
                          <span style={{
                            display: "block", fontFamily: "Inter", fontSize: 9, letterSpacing: "0.06em",
                            textTransform: "uppercase", color: T.charcoal,
                            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                          }}>
                            {appt.procedure_name}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}