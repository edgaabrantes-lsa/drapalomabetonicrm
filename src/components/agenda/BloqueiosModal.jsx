import React, { useState } from "react";
import { parseISO, isBefore, startOfDay } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { T } from "@/lib/agendaTokens";
import { periodoBloqueio, rotuloHorario } from "@/lib/agendaBloqueios";
import BloqueioForm from "@/components/agenda/BloqueioForm";

export default function BloqueiosModal({ open, onOpenChange, bloqueios = [], professionals = [], onSave, onDelete }) {
  const [showForm, setShowForm] = useState(false);

  const hoje = startOfDay(new Date());
  const ordenados = [...bloqueios].sort((a, b) => String(a.data_inicio).localeCompare(String(b.data_inicio)));
  const vigentes = ordenados.filter((b) => !isBefore(parseISO(b.data_fim || b.data_inicio), hoje));
  const encerrados = ordenados.filter((b) => isBefore(parseISO(b.data_fim || b.data_inicio), hoje));

  const fechar = (v) => {
    onOpenChange(v);
    if (!v) setShowForm(false);
  };

  const renderItem = (b) => (
    <div
      key={b.id}
      style={{
        background: T.pearl,
        border: `1px solid ${T.subtle}`,
        borderLeft: `2px solid ${T.gold}`,
        borderRadius: 2,
        padding: "10px 12px",
        display: "flex",
        alignItems: "flex-start",
        gap: 10,
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontFamily: "Inter", fontSize: 13, fontWeight: 500, color: T.onyx, margin: 0 }}>
          {periodoBloqueio(b)} · {rotuloHorario(b)}
        </p>
        <p style={{ fontFamily: "Inter", fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", color: T.charcoal, margin: "4px 0 0" }}>
          {b.professional_name || "Toda a clínica"}
          {b.motivo ? ` — ${b.motivo}` : ""}
        </p>
      </div>
      <button
        type="button"
        onClick={() => { if (window.confirm("Remover este bloqueio da agenda?")) onDelete(b.id); }}
        style={{
          background: "none",
          border: "1px solid #E53935",
          borderRadius: 2,
          color: "#E53935",
          cursor: "pointer",
          fontFamily: "Inter",
          fontSize: 9,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          padding: "5px 10px",
          flexShrink: 0,
        }}
      >
        Remover
      </button>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={fechar}>
      <DialogContent className="w-[calc(100vw-16px)] sm:w-full" style={{ maxWidth: 520, maxHeight: "90vh", overflow: "hidden", display: "flex", flexDirection: "column" }}>
        <DialogHeader>
          <DialogTitle style={{ fontFamily: "Inter", fontSize: 22, fontWeight: 600, color: T.onyx }}>
            {showForm ? "Nova Indisponibilidade" : "Indisponibilidade da Agenda"}
          </DialogTitle>
        </DialogHeader>

        <div style={{ overflowY: "auto", flex: 1, paddingRight: 2 }}>
          {showForm ? (
            <BloqueioForm
              professionals={professionals}
              onSave={onSave}
              onCancel={() => setShowForm(false)}
            />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <button
                type="button"
                onClick={() => setShowForm(true)}
                style={{
                  background: T.gold,
                  color: "#000",
                  border: "none",
                  borderRadius: 2,
                  fontFamily: "Inter",
                  fontSize: 10,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  padding: "10px 20px",
                  cursor: "pointer",
                  width: "100%",
                }}
              >
                + Adicionar indisponibilidade
              </button>

              <div>
                <p style={{ fontFamily: "Inter", fontSize: 9, letterSpacing: "0.15em", textTransform: "uppercase", color: T.charcoal, marginBottom: 8 }}>
                  Próximos bloqueios
                </p>
                {vigentes.length === 0 ? (
                  <p style={{ fontFamily: "Inter", fontSize: 12, color: T.charcoal }}>
                    Nenhum bloqueio cadastrado.
                  </p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {vigentes.map(renderItem)}
                  </div>
                )}
              </div>

              {encerrados.length > 0 && (
                <div>
                  <p style={{ fontFamily: "Inter", fontSize: 9, letterSpacing: "0.15em", textTransform: "uppercase", color: T.charcoal, marginBottom: 8 }}>
                    Encerrados
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, opacity: 0.6 }}>
                    {encerrados.map(renderItem)}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}