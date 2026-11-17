import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import AnamnesePainel from "@/components/anamnese/AnamnesePainel";
import AnamnesePacientesLista from "@/components/anamnese/AnamnesePacientesLista";
import { usePermissions } from "@/lib/PermissionsContext";

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

      <div style={{ backgroundColor: "#1A1A1A", border: "1px solid #2B2B2B", borderRadius: 8, overflow: "hidden" }}>
        {isLoading ? (
          <div style={{ padding: 40, textAlign: "center" }}>
            <div className="inline-block w-6 h-6 border-2 border-[#2B2B2B] border-t-[#C8A96A] rounded-full animate-spin" />
          </div>
        ) : filtrados.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center" }}>
            <p style={{ fontSize: 14, color: "#666666" }}>Nenhuma paciente encontrada</p>
          </div>
        ) : (
          <AnamnesePacientesLista
            pacientes={filtrados}
            ultimaPorPaciente={ultimaPorPaciente}
            onAbrir={setPaciente}
          />
        )}
      </div>

      <Dialog open={!!paciente} onOpenChange={(o) => { if (!o) setPaciente(null); }}>
        <DialogContent className="text-white w-[calc(100vw-16px)] max-w-5xl max-h-[92vh] overflow-y-auto overflow-x-hidden p-4 sm:p-6" style={{ backgroundColor: "#1A1A1A", borderColor: "#2B2B2B" }}>
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