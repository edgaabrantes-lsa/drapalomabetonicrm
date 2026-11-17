import React from "react";
import { format, parseISO } from "date-fns";

export const STATUS = {
  rascunho: { label: "Rascunho", color: "#9CA3AF" },
  em_avaliacao: { label: "Em avaliação", color: "#F59E0B" },
  finalizada: { label: "Finalizada", color: "#4ADE80" },
  retificada: { label: "Retificada", color: "#38BDF8" },
};

export const fmt = (d) => {
  if (!d) return "—";
  try { return format(parseISO(d.length > 10 ? d.slice(0, 10) : d), "dd/MM/yyyy"); } catch { return "—"; }
};

function Situacao({ ultima }) {
  const st = ultima ? (STATUS[ultima.status] || STATUS.rascunho) : null;
  if (!st) return <span style={{ fontSize: 11, color: "#555555" }}>—</span>;
  return (
    <span style={{ fontSize: 11, fontWeight: 500, color: st.color, backgroundColor: `${st.color}22`, padding: "3px 8px", borderRadius: 4 }}>
      {st.label}
    </span>
  );
}

function Acoes({ paciente, onAbrir }) {
  return (
    <>
      <button
        type="button"
        onClick={() => onAbrir(paciente)}
        style={{ background: "#C8A96A", color: "#000", border: "none", borderRadius: 5, fontSize: 11, fontWeight: 600, padding: "6px 12px", cursor: "pointer" }}
      >
        Nova anamnese
      </button>
      <button
        type="button"
        onClick={() => onAbrir(paciente)}
        style={{ background: "transparent", color: "#B0B0B0", border: "1px solid #2B2B2B", borderRadius: 5, fontSize: 11, padding: "6px 12px", cursor: "pointer" }}
      >
        Histórico
      </button>
    </>
  );
}

/* ── Cartões — celular: todos os dados visíveis sem rolagem lateral ── */
function Cartoes({ pacientes, ultimaPorPaciente, onAbrir }) {
  return (
    <div className="md:hidden">
      {pacientes.map((p) => {
        const ultima = ultimaPorPaciente[p.id];
        return (
          <div key={p.id} style={{ padding: "12px 14px", borderBottom: "1px solid #1E1E1E" }}>
            <div className="flex items-start justify-between gap-2 min-w-0">
              <p className="min-w-0 break-words" style={{ fontSize: 13, color: "#FFFFFF", fontWeight: 500 }}>
                {p.full_name}
              </p>
              <div className="flex-shrink-0"><Situacao ultima={ultima} /></div>
            </div>
            <div className="mt-1.5 space-y-0.5" style={{ fontSize: 12, color: "#B0B0B0" }}>
              <p style={{ fontSize: 12, color: "#B0B0B0", margin: 0 }}>
                <span style={{ color: "#666666" }}>Última anamnese: </span>
                {ultima ? fmt(ultima.data_avaliacao) : "Sem anamnese"}
              </p>
              <p className="break-words" style={{ fontSize: 12, color: "#B0B0B0", margin: 0 }}>
                <span style={{ color: "#666666" }}>Profissional: </span>
                {ultima?.profissional_nome || "—"}
              </p>
            </div>
            <div className="flex gap-2 mt-2.5">
              <Acoes paciente={p} onAbrir={onAbrir} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── Tabela — tablet/desktop ── */
function Tabela({ pacientes, ultimaPorPaciente, onAbrir }) {
  return (
    <div className="hidden md:block">
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ borderBottom: "1px solid #2B2B2B" }}>
            {["Paciente", "Última anamnese", "Situação", "Profissional", "Ações"].map((h) => (
              <th key={h} style={{ textAlign: "left", padding: "10px 14px", fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", color: "#666666", whiteSpace: "nowrap" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {pacientes.map((p) => {
            const ultima = ultimaPorPaciente[p.id];
            return (
              <tr key={p.id} style={{ borderBottom: "1px solid #1E1E1E" }} className="hover:bg-white/5">
                <td style={{ padding: "10px 14px", fontSize: 13, color: "#FFFFFF", fontWeight: 500 }}>{p.full_name}</td>
                <td style={{ padding: "10px 14px", fontSize: 12, color: "#B0B0B0" }}>{ultima ? fmt(ultima.data_avaliacao) : "Sem anamnese"}</td>
                <td style={{ padding: "10px 14px" }}><Situacao ultima={ultima} /></td>
                <td style={{ padding: "10px 14px", fontSize: 12, color: "#B0B0B0" }}>{ultima?.profissional_nome || "—"}</td>
                <td style={{ padding: "10px 14px" }}>
                  <div className="flex gap-2"><Acoes paciente={p} onAbrir={onAbrir} /></div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function AnamnesePacientesLista({ pacientes, ultimaPorPaciente, onAbrir }) {
  return (
    <>
      <Cartoes pacientes={pacientes} ultimaPorPaciente={ultimaPorPaciente} onAbrir={onAbrir} />
      <Tabela pacientes={pacientes} ultimaPorPaciente={ultimaPorPaciente} onAbrir={onAbrir} />
    </>
  );
}