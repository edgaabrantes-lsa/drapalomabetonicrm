import React, { useEffect, useState, useRef } from "react";
import { T, portalApi } from "./portalConfig";
import { Loader2, Camera, Image as ImageIcon, X, Upload } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function MinhaEvolucao({ token }) {
  const [images, setImages] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const fileRef = useRef(null);

  async function load() {
    setLoading(true);
    try {
      const d = await portalApi("evolucao", { token });
      setImages(d.images || []);
    } catch { setImages([]); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, [token]);

  return (
    <div className="px-5 py-6">
      <div className="mb-5">
        <p className="text-[11px] uppercase tracking-widest mb-1" style={{ color: T.dim }}>Sua trajetória</p>
        <h1 className="font-serif text-xl" style={{ color: T.text }}>Minha evolução</h1>
        <p className="text-sm mt-2 leading-relaxed" style={{ color: T.muted }}>
          Suas fotos de antes, depois e evolução, em uma linha do tempo da sua beleza natural.
        </p>
      </div>

      <button onClick={() => setShowUpload(true)}
        className="w-full flex items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-semibold mb-5"
        style={{ background: T.gold, color: "#0A0A0A" }}>
        <Camera className="h-4 w-4" /> Enviar foto de evolução
      </button>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-7 w-7 animate-spin" style={{ color: T.gold }} /></div>
      ) : images.length === 0 ? (
        <div className="rounded-2xl p-8 text-center" style={{ background: T.card, border: `1px solid ${T.border}` }}>
          <ImageIcon className="mx-auto mb-3" style={{ width: 28, height: 28, color: T.dim }} />
          <p className="text-sm" style={{ color: T.muted }}>Suas fotos de evolução aparecerão aqui.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {images.map(img => (
            <div key={img.id} className="rounded-2xl overflow-hidden" style={{ background: T.card, border: `1px solid ${T.border}` }}>
              <div className="aspect-square bg-black/30">
                <img src={img.file_url} alt={img.titulo || "Evolução"} className="w-full h-full object-cover" />
              </div>
              <div className="p-3">
                <p className="text-[10px] uppercase tracking-widest mb-1" style={{ color: T.gold }}>{catLabel(img.categoria)}</p>
                <p className="text-xs truncate" style={{ color: T.text }}>{img.titulo || "Evolução"}</p>
                <p className="text-[10px] mt-1" style={{ color: T.dim }}>
                  {img.data_upload && format(parseISO(img.data_upload), "dd/MM/yyyy", { locale: ptBR })}
                </p>
                {img.patient_note && <p className="text-xs mt-1 leading-relaxed" style={{ color: T.muted }}>{img.patient_note}</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      {showUpload && (
        <UploadModal token={token} onClose={() => setShowUpload(false)} onDone={load} />
      )}
    </div>
  );
}

function UploadModal({ token, onClose, onDone }) {
  const fileRef = useRef(null);
  const [preview, setPreview] = useState(null);
  const [file, setFile] = useState(null);
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  function handleFile(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  async function submit() {
    if (!file) { setErr("Selecione uma foto."); return; }
    setLoading(true); setErr("");
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result;
        const res = await portalApi("enviar_foto", {
          token,
          base64,
          file_name: file.name,
          file_type: file.type,
          titulo: titulo || "Foto de evolução",
          descricao,
          patient_note: descricao,
        });
        if (res.error) { setErr(res.error); setLoading(false); return; }
        onClose(); onDone();
      };
      reader.onerror = () => { setErr("Erro ao ler a imagem."); setLoading(false); };
      reader.readAsDataURL(file);
    } catch (e) {
      setErr(e.message); setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" style={{ background: "rgba(0,0,0,0.7)" }}>
      <div className="w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl p-5" style={{ background: T.card, border: `1px solid ${T.border}`, maxHeight: "90vh", overflowY: "auto" }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-serif text-lg" style={{ color: T.text }}>Enviar foto de evolução</h2>
          <button onClick={onClose} className="p-1" style={{ color: T.dim }}><X className="h-5 w-5" /></button>
        </div>

        <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
        {preview ? (
          <div className="rounded-2xl overflow-hidden mb-4" style={{ border: `1px solid ${T.border}` }}>
            <img src={preview} alt="preview" className="w-full max-h-64 object-cover" />
          </div>
        ) : (
          <button onClick={() => fileRef.current?.click()}
            className="w-full flex flex-col items-center justify-center gap-3 rounded-2xl py-10 mb-4"
            style={{ background: T.surface, border: `1px dashed ${T.border}` }}>
            <Upload style={{ width: 26, height: 26, color: T.gold }} />
            <p className="text-sm" style={{ color: T.muted }}>Toque para selecionar uma foto</p>
          </button>
        )}
        {file && (
          <button onClick={() => fileRef.current?.click()} className="text-xs mb-4" style={{ color: T.gold }}>Trocar foto</button>
        )}

        <div className="space-y-3">
          <input value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="Título (ex.: 30 dias)"
            className="w-full rounded-lg px-3 py-2.5 text-sm" style={{ background: T.surface, border: `1px solid ${T.border}`, color: T.text }} />
          <textarea value={descricao} onChange={e => setDescricao(e.target.value)} placeholder="Nota (opcional)"
            rows={2} className="w-full rounded-lg px-3 py-2.5 text-sm" style={{ background: T.surface, border: `1px solid ${T.border}`, color: T.text }} />
        </div>

        {err && <p className="text-sm mt-3" style={{ color: "#f87171" }}>{err}</p>}

        <button onClick={submit} disabled={loading || !file}
          className="w-full flex items-center justify-center gap-2 rounded-lg py-3 mt-4 text-sm font-semibold disabled:opacity-60"
          style={{ background: T.gold, color: "#0A0A0A" }}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enviar foto"}
        </button>
      </div>
    </div>
  );
}

function catLabel(c) {
  return { antes: "Antes", depois: "Depois", evolucao: "Evolução" }[c] || c;
}