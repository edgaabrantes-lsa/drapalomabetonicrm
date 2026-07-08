import React, { useEffect, useState } from "react";
import { T, portalApi } from "./portalConfig";
import { Loader2, FileText, CheckCircle2, Lock, ChevronRight, X } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function TermosConsentimentos({ token }) {
  const [docs, setDocs] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  async function load() {
    setLoading(true);
    try {
      const d = await portalApi("termos", { token });
      setDocs(d.documents || []);
    } catch { setDocs([]); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, [token]);

  if (loading) return <div className="px-5 py-20 flex justify-center"><Loader2 className="h-7 w-7 animate-spin" style={{ color: T.gold }} /></div>;

  return (
    <div className="px-5 py-6">
      <div className="mb-5">
        <p className="text-[11px] uppercase tracking-widest mb-1" style={{ color: T.dim }}>Documentação</p>
        <h1 className="font-serif text-xl" style={{ color: T.text }}>Termos e consentimentos</h1>
        <p className="text-sm mt-2 leading-relaxed" style={{ color: T.muted }}>
          Revise e, quando aplicável, aceite digitalmente seus termos com segurança.
        </p>
      </div>

      {docs.length === 0 ? (
        <div className="rounded-2xl p-8 text-center" style={{ background: T.card, border: `1px solid ${T.border}` }}>
          <FileText className="mx-auto mb-3" style={{ width: 28, height: 28, color: T.dim }} />
          <p className="text-sm" style={{ color: T.muted }}>Nenhum termo pendente no momento.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {docs.map(d => {
            const signed = ["assinado_internamente", "aprovado", "assinado_pelo_kit"].includes(d.status);
            const pending = d.requires_patient_action && !signed;
            return (
              <button key={d.id} onClick={() => setSelected(d)}
                className="w-full flex items-center justify-between rounded-2xl p-4 text-left transition-all hover:scale-[1.01]"
                style={{ background: T.card, border: `1px solid ${pending ? `${T.gold}60` : T.border}` }}>
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex items-center justify-center rounded-xl flex-shrink-0"
                    style={{ width: 40, height: 40, background: signed ? "rgba(52,211,153,0.1)" : T.goldSoft, border: `1px solid ${signed ? "#34d39930" : `${T.gold}30`}` }}>
                    {signed ? <CheckCircle2 style={{ width: 18, height: 18, color: "#34d399" }} /> : <FileText style={{ width: 18, height: 18, color: T.gold }} />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: T.text }}>{d.nome}</p>
                    <p className="text-xs mt-0.5" style={{ color: signed ? "#34d399" : pending ? T.gold : T.dim }}>
                      {signed ? "Aceito" : pending ? "Aguardando seu aceite" : "Disponível"}
                    </p>
                  </div>
                </div>
                <ChevronRight className="flex-shrink-0" style={{ width: 18, height: 18, color: T.dim }} />
              </button>
            );
          })}
        </div>
      )}

      {selected && <DocModal doc={selected} token={token} onClose={() => setSelected(null)} onDone={load} />}
    </div>
  );
}

function DocModal({ doc, token, onClose, onDone }) {
  const [loading, setLoading] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [done, setDone] = useState(false);
  const signed = ["assinado_internamente", "aprovado", "assinado_pelo_kit"].includes(doc.status);

  async function sign() {
    if (!accepted) return;
    setLoading(true);
    try {
      const res = await portalApi("assinar_termo", { token, documento_id: doc.id });
      if (res.error) throw new Error(res.error);
      setDone(true);
      setTimeout(() => { onClose(); onDone(); }, 1200);
    } catch (e) {
      alert(e.message);
    } finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" style={{ background: "rgba(0,0,0,0.75)" }}>
      <div className="w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl p-5" style={{ background: T.card, border: `1px solid ${T.border}`, maxHeight: "90vh", overflowY: "auto" }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-serif text-lg pr-4" style={{ color: T.text }}>{doc.nome}</h2>
          <button onClick={onClose} className="p-1 flex-shrink-0" style={{ color: T.dim }}><X className="h-5 w-5" /></button>
        </div>

        <p className="text-[10px] uppercase tracking-widest mb-1" style={{ color: T.dim }}>{tipoLabel(doc.tipo)} · Versão {doc.versao || "1.0"}</p>

        {doc.file_url ? (
          <a href={doc.file_url} target="_blank" rel="noopener noreferrer"
            className="block w-full rounded-xl p-4 mb-4" style={{ background: T.goldSoft, border: `1px solid ${T.gold}40` }}>
            <p className="text-sm font-medium" style={{ color: T.gold }}>Abrir documento</p>
            <p className="text-xs mt-1" style={{ color: T.muted }}>Toque para ler o conteúdo completo.</p>
          </a>
        ) : (
          <div className="rounded-xl p-4 mb-4 text-center" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
            <Lock className="mx-auto mb-2" style={{ width: 22, height: 22, color: T.dim }} />
            <p className="text-xs" style={{ color: T.muted }}>Documento disponível para aceite digital.</p>
          </div>
        )}

        {signed ? (
          <div className="rounded-xl p-4 text-center" style={{ background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.25)" }}>
            <CheckCircle2 className="mx-auto mb-2" style={{ width: 26, height: 26, color: "#34d399" }} />
            <p className="text-sm" style={{ color: "#34d399" }}>Você já aceitou este termo.</p>
            {doc.data_assinatura && <p className="text-xs mt-1" style={{ color: T.muted }}>{format(parseISO(doc.data_assinatura), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</p>}
          </div>
        ) : done ? (
          <div className="rounded-xl p-4 text-center" style={{ background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.25)" }}>
            <CheckCircle2 className="mx-auto mb-2" style={{ width: 26, height: 26, color: "#34d399" }} />
            <p className="text-sm" style={{ color: "#34d399" }}>Termo aceito com sucesso.</p>
          </div>
        ) : (
          <>
            <label className="flex items-start gap-3 mb-4 cursor-pointer">
              <input type="checkbox" checked={accepted} onChange={e => setAccepted(e.target.checked)} className="mt-1" />
              <span className="text-sm leading-relaxed" style={{ color: T.muted }}>
                Declaro que li o documento acima e concordo com seus termos, prestando meu consentimento de forma livre e esclarecida.
              </span>
            </label>
            <button onClick={sign} disabled={!accepted || loading}
              className="w-full rounded-lg py-3 text-sm font-semibold disabled:opacity-50"
              style={{ background: T.gold, color: "#0A0A0A" }}>
              {loading ? "Processando..." : "Aceitar digitalmente"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function tipoLabel(t) {
  const map = {
    consentimento: "Termo de Consentimento",
    consentimento_toxina: "Consentimento — Toxina",
    consentimento_preenchimento: "Consentimento — Preenchimento",
    consentimento_bioestimulador: "Consentimento — Bioestimulador",
    consentimento_fios: "Consentimento — Fios",
    consentimento_pele: "Consentimento — Pele",
    consentimento_full_face: "Consentimento — Full Face",
    termo_lgpd: "Termo LGPD",
    uso_imagem: "Termo de Uso de Imagem",
    contrato_mestre: "Contrato",
  };
  return map[t] || t || "Documento";
}