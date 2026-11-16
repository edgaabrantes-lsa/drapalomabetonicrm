import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { format, parseISO } from "date-fns";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import AnamnesePainel from "@/components/anamnese/AnamnesePainel";
import { usePermissions } from "@/lib/PermissionsContext";

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

export default function AnamnesePacientes() {
  const { hasAction } = usePermissions();
  const [busca, setBusca] = useState("");
  const [paciente, setPaciente] = useState(null);

  const { data: pacientesResp, isLoading } = useQuery({
    queryKey: ["patients", "anamnese"],
    queryFn: () => base44.entities.Patient.list({ sort: "full_name", limit: 500 }),
  });
  const pacientes = pacientesResp?.items || pacientesResp || [];

  const { data: anamnesesResp } = useQuery({
    queryKey: ["anamneses", "todas"],
    queryFn: () => base44.entities.Anamnese.list({ sort: "-data_avaliacao", limit: 500 }),
  });
  const anamneses = anamnesesResp?.items || anamnesesResp || [];

  const { data: user } = useQuery({ queryKey: ["me"], queryFn: () => base44.auth.me() });

  const ultimaPorPaciente = useMemo(() => {
    const mapa = {};
    anamneses.forEach((a) => {
      if (!a.patient_id) return;
      if (!mapa[a.patient_id] || (a.data_avaliacao || "") > (mapa[a.patient_id].data_avaliacao || "")) {
        mapa[a.patient_id] = a;
      }
    });
    return mapa;
  }, [anamneses]);

  if (!hasAction("ver_anamnese")) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <h2 style={{ fontSize: 18, color: "#FFFFFF", fontWeight: 500 }}>Acesso Restrito</h2>
          <p style={{ fontSize: 13, color: "#666666", marginTop: 8, maxWidth: 340 }}>
            A anamnese contém dados clínicos sensíveis e está disponível apenas para profissionais autorizados.
          </p>
        </div>
      </div>
    );
  }

  const filtrados = pacientes.filter((p) =>
    !busca.trim() || (p.full_name || "").toLowerCase().includes(busca.trim().toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 style={{ fontSize: 24, fontWeight: 600, letterSpacing: "-0.02em", color: "#FFFFFF", margin: 0 }}>
          Anamnese de Pacientes
        </h1>
        <p style={{ fontSize: 13, color: "#666666", marginTop: 4 }}>
          Avaliação clínica e planejamento estético com mapa facial editável
        </p>
      </div>

      <Input
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        placeholder="Buscar paciente por nome..."
        className="bg-[#121212] border-[#2B2B2B] text-white"
        style={{ height: 38, fontSize: 13, maxWidth: 380 }}
      />

      <div style={{ backgroundColor: "#1A1A1A", border: "1px solid #2B2B2B", borderRadius: 8, overflowX: "auto" }}>
        {isLoading ? (
          <div style={{ padding: 40, textAlign: "center" }}>
            <div className="inline-block w-6 h-6 border-2 border-[#2B2B2B] border-t-[#C8A96A] rounded-full animate-spin" />
          </div>
        ) : filtrados.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center" }}>
            <p style={{ fontSize: 14, color: "#666666" }}>Nenhuma paciente encontrada</p>
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 760 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #2B2B2B" }}>
                {["Paciente", "Última anamnese", "Situação", "Profissional", "Ações"].map((h) => (
                  <th key={h} style={{ textAlign: "left", padding: "10px 14px", fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", color: "#666666", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtrados.map((p) => {
                const ultima = ultimaPorPaciente[p.id];
                const st = ultima ? (STATUS[ultima.status] || STATUS.rascunho) : null;
                return (
                  <tr key={p.id} style={{ borderBottom: "1px solid #1E1E1E" }} className="hover:bg-white/5">
                    <td style={{ padding: "10px 14px", fontSize: 13, color: "#FFFFFF", fontWeight: 500 }}>{p.full_name}</td>
                    <td style={{ padding: "10px 14px", fontSize: 12, color: "#B0B0B0" }}>{ultima ? fmt(ultima.data_avaliacao) : "Sem anamnese"}</td>
                    <td style={{ padding: "10px 14px" }}>
                      {st ? (
                        <span style={{ fontSize: 11, fontWeight: 500, color: st.color, backgroundColor: `${st.color}22`, padding: "3px 8px", borderRadius: 4 }}>{st.label}</span>
                      ) : (
                        <span style={{ fontSize: 11, color: "#555555" }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: "10px 14px", fontSize: 12, color: "#B0B0B0" }}>{ultima?.profissional_nome || "—"}</td>
                    <td style={{ padding: "10px 14px" }}>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setPaciente(p)}
                          style={{ background: "#C8A96A", color: "#000", border: "none", borderRadius: 5, fontSize: 11, fontWeight: 600, padding: "5px 12px", cursor: "pointer" }}
                        >
                          Nova anamnese
                        </button>
                        <button
                          type="button"
                          onClick={() => setPaciente(p)}
                          style={{ background: "transparent", color: "#B0B0B0", border: "1px solid #2B2B2B", borderRadius: 5, fontSize: 11, padding: "5px 12px", cursor: "pointer" }}
                        >
                          Histórico
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <Dialog open={!!paciente} onOpenChange={(o) => { if (!o) setPaciente(null); }}>
        <DialogContent className="text-white max-w-5xl max-h-[92vh] overflow-y-auto" style={{ backgroundColor: "#1A1A1A", borderColor: "#2B2B2B" }}>
          <DialogHeader>
            <DialogTitle style={{ fontSize: 16, fontWeight: 600, color: "#FFFFFF" }}>
              Anamnese — {paciente?.full_name}
            </DialogTitle>
          </DialogHeader>
          {paciente && <AnamnesePainel patient={paciente} currentUser={user} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}