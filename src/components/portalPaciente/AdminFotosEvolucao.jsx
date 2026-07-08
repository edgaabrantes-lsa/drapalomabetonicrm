import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Search, Trash2, X, AlertTriangle } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function AdminFotosEvolucao() {
  const [search, setSearch] = useState("");
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [images, setImages] = useState([]);
  const [loadingImgs, setLoadingImgs] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

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

  async function abrir(p) {
    setSelectedPatient(p);
    setLoadingImgs(true);
    try {
      const res = await base44.functions.invoke("portalPaciente", { action: "admin_fotos", patient_id: p.id });
      setImages(res.data?.images || []);
    } catch { setImages([]); }
    setLoadingImgs(false);
  }

  async function excluir() {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await base44.functions.invoke("portalPaciente", {
        action: "admin_excluir_foto",
        imagem_id: toDelete.id,
        motivo: "Exclusão administrativa (Portal da Paciente)",
      });
      setImages(prev => prev.filter(i => i.id !== toDelete.id));
      setToDelete(null);
    } catch (e) {
      alert(e.response?.data?.error || e.message || "Erro ao excluir");
    } finally { setDeleting(false); }
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-[11px] uppercase tracking-widest mb-1" style={{ color: "#666" }}>Moderação</p>
        <h2 className="text-xl font-semibold" style={{ color: "#FFFFFF" }}>Fotos da evolução</h2>
        <p className="text-sm mt-1" style={{ color: "#B0B0B0" }}>
          Gerencie as fotos de evolução enviadas pelas pacientes. A exclusão é lógica (a foto é ocultada do portal, mas mantida para auditoria).
        </p>
      </div>

      {!selectedPatient && (
        <>
          <div className="flex gap-2">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "#555" }} />
              <input
                value={search} onChange={e => setSearch(e.target.value)}
                onKeyDown={e => e.key === "Enter" && buscar()}
                placeholder="Buscar paciente..."
                className="w-full rounded-md pl-10 pr-4 py-2.5 text-sm"
                style={{ background: "#121212", border: "1px solid #2B2B2B", color: "#FFFFFF" }}
              />
            </div>
            <button onClick={buscar} className="rounded-md px-4 py-2 text-sm font-medium" style={{ background: "#C8A96A", color: "#0A0A0A" }}>Buscar</button>
          </div>

          {loading && <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" style={{ color: "#C8A96A" }} /></div>}

          {!loading && patients.length > 0 && (
            <div className="space-y-2">
              {patients.map(p => (
                <button key={p.id} onClick={() => abrir(p)}
                  className="w-full text-left rounded-lg p-4 transition-colors hover:border-[#3A3A3A]"
                  style={{ background: "#1A1A1A", border: "1px solid #2B2B2B" }}>
                  <p className="text-sm font-medium" style={{ color: "#FFFFFF" }}>{p.full_name}</p>
                  <p className="text-xs mt-0.5" style={{ color: "#666" }}>{p.phone || p.email || "—"}</p>
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {selectedPatient && (
        <>
          <button onClick={() => { setSelectedPatient(null); setImages([]); }}
            className="flex items-center gap-1.5 text-sm" style={{ color: "#B0B0B0" }}>
            <X className="h-4 w-4" /> Voltar
          </button>
          <p className="text-base font-medium" style={{ color: "#FFFFFF" }}>{selectedPatient.full_name}</p>

          {loadingImgs ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" style={{ color: "#C8A96A" }} /></div>
          ) : images.length === 0 ? (
            <p className="text-sm py-8 text-center" style={{ color: "#666" }}>Nenhuma foto de evolução/antes/depois/análise para esta paciente.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {images.map(img => (
                <div key={img.id} className="rounded-lg overflow-hidden relative group" style={{ background: "#1A1A1A", border: "1px solid #2B2B2B" }}>
                  <div className="aspect-square bg-black/30">
                    <img src={img.file_url} alt={img.titulo || ""} className="w-full h-full object-cover" />
                  </div>
                  <div className="p-2.5">
                    <p className="text-[10px] uppercase mb-0.5" style={{ color: "#C8A96A" }}>{img.categoria}</p>
                    <p className="text-xs truncate" style={{ color: "#FFFFFF" }}>{img.titulo || "—"}</p>
                    <p className="text-[10px] mt-0.5" style={{ color: "#666" }}>
                      {img.data_upload && format(parseISO(img.data_upload), "dd/MM/yyyy", { locale: ptBR })}
                    </p>
                  </div>
                  <button onClick={() => setToDelete(img)}
                    className="absolute top-2 right-2 rounded-md p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ background: "rgba(0,0,0,0.7)", border: "1px solid #f8717155" }} title="Excluir (ocultar do portal)">
                    <Trash2 className="h-3.5 w-3.5" style={{ color: "#f87171" }} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {toDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.75)" }}>
          <div className="w-full max-w-sm rounded-2xl p-5" style={{ background: "#1A1A1A", border: "1px solid #2B2B2B" }}>
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-5 w-5" style={{ color: "#f87171" }} />
              <h3 className="text-base font-semibold" style={{ color: "#FFFFFF" }}>Excluir foto</h3>
            </div>
            <p className="text-sm leading-relaxed mb-4" style={{ color: "#B0B0B0" }}>
              Esta foto será ocultada do Portal da Paciente e da linha do tempo da evolução. A exclusão é lógica — o registro é mantido para auditoria.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setToDelete(null)} disabled={deleting}
                className="flex-1 rounded-md py-2.5 text-sm" style={{ background: "#121212", border: "1px solid #2B2B2B", color: "#B0B0B0" }}>
                Cancelar
              </button>
              <button onClick={excluir} disabled={deleting}
                className="flex-1 rounded-md py-2.5 text-sm font-medium" style={{ background: "#f87171", color: "#FFFFFF" }}>
                {deleting ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : "Excluir"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}