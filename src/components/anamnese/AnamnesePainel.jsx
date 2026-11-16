import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { format, parseISO } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import AnamneseForm from "./AnamneseForm";

const STATUS = {
  rascunho: { label: "Rascunho", color: "#9CA3AF" },
  em_avaliacao: { label: "Em avaliação", color: "#F59E0B" },
  finalizada: { label: "Finalizada", color: "#4ADE80" },
  retificada: { label: "Retificada", color: "#38BDF8" },
};

const fmt = (d) => {
  if (!d) return "—";
  try { return format(parseISO(d.length > 10 ? d.slice(0, 10) : d), "dd/MM/yyyy"); } catch { return "—"; }
};

/** Lista + editor de anamneses de uma paciente (usado na página e no dossiê). */
export default function AnamnesePainel({ patient, currentUser, compacto = false }) {
  const [aberta, setAberta] = useState(null);
  const [nova, setNova] = useState(false);

  const { data: anamneses = [], isLoading } = useQuery({
    queryKey: ["anamneses", patient?.id],
    queryFn: () => base44.entities.Anamnese.filter({ patient_id: patient.id }, { sort: "-data_avaliacao", limit: 100 }),
    enabled: !!patient?.id,
  });

  const lista = Array.isArray(anamneses) ? anamneses : (anamneses.items || []);
  const fechar = () => { setAberta(null); setNova(false); };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <p style={{ fontSize: 12, color: "#B0B0B0" }}>
          {lista.length} avaliação(ões) registrada(s) para {patient?.full_name}
        </p>
        <button
          type="button"
          onClick={() => setNova(true)}
          style={{ background: "#C8A96A", color: "#000", border: "none", borderRadius: 6, fontSize: 12, fontWeight: 600, padding: "7px 16px", cursor: "pointer" }}
        >
          + Nova anamnese
        </button>
      </div>

      {isLoading ? (
        <div style={{ padding: 30, textAlign: "center" }}>
          <div className="inline-block w-5 h-5 border-2 border-[#2B2B2B] border-t-[#C8A96A] rounded-full animate-spin" />
        </div>
      ) : lista.length === 0 ? (
        <div style={{ backgroundColor: "#121212", border: "1px solid #2B2B2B", borderRadius: 8, padding: 28, textAlign: "center" }}>
          <p style={{ fontSize: 13, color: "#666666" }}>Nenhuma anamnese registrada</p>
          <p style={{ fontSize: 11, color: "#555555", marginTop: 4 }}>Crie a primeira avaliação clínica desta paciente.</p>
        </div>
      ) : (
        <div style={{ backgroundColor: "#121212", border: "1px solid #2B2B2B", borderRadius: 8, overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: compacto ? 420 : 620 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #2B2B2B" }}>
                {["Data", "Situação", "Profissional", "Versão", ""].map((h) => (
                  <th key={h} style={{ textAlign: "left", padding: "9px 12px", fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", color: "#666666" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {lista.map((a) => {
                const st = STATUS[a.status] || STATUS.rascunho;
                return (
                  <tr key={a.id} style={{ borderBottom: "1px solid #1E1E1E", cursor: "pointer" }} className="hover:bg-white/5" onClick={() => setAberta(a)}>
                    <td style={{ padding: "10px 12px", fontSize: 13, color: "#FFFFFF" }}>{fmt(a.data_avaliacao)}</td>
                    <td style={{ padding: "10px 12px" }}>
                      <span style={{ fontSize: 11, fontWeight: 500, color: st.color, backgroundColor: `${st.color}22`, padding: "3px 8px", borderRadius: 4 }}>{st.label}</span>
                    </td>
                    <td style={{ padding: "10px 12px", fontSize: 12, color: "#B0B0B0" }}>{a.profissional_nome || "—"}</td>
                    <td style={{ padding: "10px 12px", fontSize: 12, color: "#666666" }}>v{a.versao || 1}</td>
                    <td style={{ padding: "10px 12px", fontSize: 11, color: "#C8A96A" }}>Abrir</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={!!aberta || nova} onOpenChange={(o) => { if (!o) fechar(); }}>
        <DialogContent className="text-white max-w-4xl max-h-[92vh] overflow-y-auto" style={{ backgroundColor: "#1A1A1A", borderColor: "#2B2B2B" }}>
          <DialogHeader>
            <DialogTitle style={{ fontSize: 16, fontWeight: 600, color: "#FFFFFF" }}>
              {aberta ? `Anamnese — ${fmt(aberta.data_avaliacao)}` : "Nova anamnese"}
            </DialogTitle>
          </DialogHeader>
          <AnamneseForm
            patient={patient}
            anamnese={aberta}
            currentUser={currentUser}
            onClose={fechar}
            onSaved={() => {}}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}