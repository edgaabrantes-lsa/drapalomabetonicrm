import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { T } from "@/components/portalPaciente/portalConfig";
import { Loader2, Link2, Search, Copy, Check, Users } from "lucide-react";

const ORIGIN = typeof window !== "undefined" ? window.location.origin : "";

export default function PortalAdmin() {
  const [search, setSearch] = useState("");
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(null);
  const [links, setLinks] = useState({});

  async function buscar() {
    if (!search.trim()) return;
    setLoading(true);
    try {
      const list = await base44.entities.Patient.list("-created_date", 50);
      const q = search.toLowerCase();
      setPatients(list.filter(p =>
        (p.full_name || "").toLowerCase().includes(q) ||
        (p.phone || "").includes(search) ||
        (p.email || "").toLowerCase().includes(q)
      ));
    } catch {}
    setLoading(false);
  }

  async function gerar(patient) {
    setGenerating(patient.id);
    try {
      const res = await base44.functions.invoke("portalPaciente", { action: "gerar_link", patient_id: patient.id, expires_in_days: 365 });
      const url = `${ORIGIN}/portal-paciente?t=${res.data.access_token}`;
      setLinks(l => ({ ...l, [patient.id]: url }));
    } catch (e) {
      alert(e.response?.data?.error || e.message || "Erro ao gerar link");
    } finally { setGenerating(null); }
  }

  function copiar(url) {
    navigator.clipboard.writeText(url);
    setCopied(url);
    setTimeout(() => setCopied(null), 1500);
  }
  const [copied, setCopied] = useState(null);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[11px] uppercase tracking-widest mb-1" style={{ color: "#666" }}>Administrativo</p>
        <h1 className="text-2xl font-semibold" style={{ color: "#FFFFFF" }}>Portal da Paciente — Links de acesso</h1>
        <p className="text-sm mt-1" style={{ color: "#B0B0B0" }}>
          Gere links individuais e seguros da Jornada da Beleza Natural para suas pacientes.
        </p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "#555" }} />
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          onKeyDown={e => e.key === "Enter" && buscar()}
          placeholder="Buscar por nome, telefone ou e-mail..."
          className="w-full rounded-md pl-10 pr-4 py-2.5 text-sm"
          style={{ background: "#121212", border: "1px solid #2B2B2B", color: "#FFFFFF" }}
        />
      </div>
      <button onClick={buscar} className="rounded-md px-4 py-2 text-sm font-medium" style={{ background: "#C8A96A", color: "#0A0A0A" }}>
        Buscar pacientes
      </button>

      {loading && <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" style={{ color: "#C8A96A" }} /></div>}

      {!loading && patients.length > 0 && (
        <div className="space-y-2">
          {patients.map(p => (
            <div key={p.id} className="rounded-lg p-4" style={{ background: "#1A1A1A", border: "1px solid #2B2B2B" }}>
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: "#FFFFFF" }}>{p.full_name}</p>
                  <p className="text-xs mt-0.5" style={{ color: "#666" }}>{p.phone || p.email || "—"}</p>
                </div>
                <button onClick={() => gerar(p)} disabled={generating === p.id}
                  className="flex items-center gap-1.5 rounded-md px-3 py-2 text-xs font-medium disabled:opacity-60 flex-shrink-0"
                  style={{ background: "#C8A96A", color: "#0A0A0A" }}>
                  {generating === p.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <><Link2 className="h-3.5 w-3.5" /> Gerar link</>}
                </button>
              </div>
              {links[p.id] && (
                <div className="mt-3 flex items-center gap-2 rounded-md p-2.5" style={{ background: "#121212", border: "1px solid #2B2B2B" }}>
                  <input readOnly value={links[p.id]} className="flex-1 bg-transparent text-xs outline-none" style={{ color: "#C8A96A" }} />
                  <button onClick={() => copiar(links[p.id])} className="flex-shrink-0 p-1.5 rounded" style={{ background: "#2B2B2B" }}>
                    {copied === links[p.id] ? <Check className="h-3.5 w-3.5" style={{ color: "#34d399" }} /> : <Copy className="h-3.5 w-3.5" style={{ color: "#B0B0B0" }} />}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {!loading && patients.length === 0 && search && (
        <div className="text-center py-12">
          <Users className="mx-auto mb-3" style={{ width: 32, height: 32, color: "#374151" }} />
          <p className="text-sm" style={{ color: "#666" }}>Busque uma paciente para gerar o link.</p>
        </div>
      )}
    </div>
  );
}