import React, { useEffect, useState, useRef, useCallback } from "react";
import { T, portalApi, openWhatsapp } from "./portalConfig";
import { Loader2, Camera, X, Upload, MessageCircle, ImageOff, Sparkles, Eye, ClipboardList, Stethoscope, CalendarDays, ArrowRight } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function MinhaEvolucao({ token, whatsappNumber }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await portalApi("evolucao_full", { token });
      setData(d);
    } catch { setData({}); }
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const falarEquipe = () => openWhatsapp(token, "evolucao");

  if (loading) {
    return <div className="px-5 py-20 flex justify-center"><Loader2 className="h-7 w-7 animate-spin" style={{ color: T.gold }} /></div>;
  }

  const temSimulacao = data?.simulacoes?.length > 0;
  const temAnalise = data?.analise_facial?.length > 0;
  const temProcs = data?.procedimentos?.length > 0 || data?.protocolos?.length > 0;
  const temAgenda = data?.agendamentos?.length > 0;
  const temFotos = data?.fotos?.length > 0;
  const temQueixa = !!data?.queixa?.texto;

  return (
    <div className="px-5 py-6">
      <SectionHeader kicker="Sua trajetória" title="Minha evolução"
        desc="Uma linha do tempo da sua jornada estética, com seus registros reais organizados por etapa." />

      {/* Resumo da jornada */}
      <ResumoJornada entrada={data?.entrada} avaliacao={data?.avaliacao} />

      {/* Queixa ou objetivo inicial */}
      <Section title="Queixa ou objetivo inicial" icon={ClipboardList} empty={!temQueixa}
        emptyText={temQueixa ? null : "Sua queixa e objetivo iniciais serão exibidos aqui quando registrados pela equipe."}>
        {temQueixa && (
          <div className="rounded-2xl p-4" style={{ background: T.card, border: `1px solid ${T.border}` }}>
            <p className="text-sm leading-relaxed" style={{ color: T.text }}>{data.queixa.texto}</p>
            <p className="text-[10px] uppercase mt-2" style={{ color: T.dim, letterSpacing: "0.12em" }}>
              Registrado em {data.queixa.origem === "triagem" ? "triagem inicial" : data.queixa.origem === "avaliacao" ? "avaliação" : "prontuário"}
            </p>
            {data.expectativa && (
              <p className="text-xs mt-2 leading-relaxed" style={{ color: T.muted }}>
                <span style={{ color: T.gold }}>Expectativa: </span>{data.expectativa}
              </p>
            )}
          </div>
        )}
      </Section>

      {/* Simulação do antes e depois */}
      <Section title="Simulação do antes e depois" icon={Sparkles} empty={!temSimulacao}
        emptyText={temSimulacao ? null : "Você ainda não possui simulação registrada. Caso seja gerada, ela aparecerá aqui."}>
        {temSimulacao && (
          <div className="space-y-3">
            {data.simulacoes.map(s => (
              <div key={s.id} className="rounded-2xl overflow-hidden" style={{ background: T.card, border: `1px solid ${T.border}` }}>
                <div className="grid grid-cols-2">
                  <div className="aspect-square bg-black/30 relative">
                    <img src={s.original_image_url} alt="Original" className="w-full h-full object-cover" />
                    <span className="absolute bottom-2 left-2 text-[10px] px-2 py-0.5 rounded" style={{ background: "rgba(0,0,0,0.6)", color: T.text }}>Antes</span>
                  </div>
                  <div className="aspect-square bg-black/30 relative">
                    <img src={s.generated_image_url} alt="Simulação" className="w-full h-full object-cover" />
                    <span className="absolute bottom-2 left-2 text-[10px] px-2 py-0.5 rounded" style={{ background: "rgba(0,0,0,0.6)", color: T.gold }}>Simulação</span>
                  </div>
                </div>
                <div className="p-3">
                  <p className="text-[10px] uppercase mb-1" style={{ color: T.gold, letterSpacing: "0.12em" }}>Simulação{intensityLabel(s.intensity)}</p>
                  <p className="text-xs" style={{ color: T.muted }}>
                    {s.created_date ? format(parseISO(s.created_date), "dd/MM/yyyy", { locale: ptBR }) : ""}
                  </p>
                </div>
              </div>
            ))}
            {!temProcs && (
              <p className="text-xs leading-relaxed px-1" style={{ color: T.dim }}>
                Você possui uma simulação registrada. Assim que seu tratamento avançar, sua evolução será acompanhada nesta área.
              </p>
            )}
          </div>
        )}
      </Section>

      {/* Análise facial */}
      <Section title="Análise facial" icon={Eye} empty={!temAnalise}
        emptyText={temAnalise ? null : "Registros de análise facial aparecerão aqui quando liberados pela equipe."}>
        {temAnalise && (
          <div className="grid grid-cols-2 gap-3">
            {data.analise_facial.map(a => (
              <div key={a.id} className="rounded-2xl overflow-hidden" style={{ background: T.card, border: `1px solid ${T.border}` }}>
                <div className="aspect-square bg-black/30">
                  <img src={a.file_url} alt={a.titulo || "Análise facial"} className="w-full h-full object-cover" />
                </div>
                <div className="p-3">
                  <p className="text-xs truncate" style={{ color: T.text, fontWeight: 500 }}>{a.titulo || "Análise facial"}</p>
                  <p className="text-[10px] mt-1" style={{ color: T.dim }}>{a.data_upload && format(parseISO(a.data_upload), "dd/MM/yyyy", { locale: ptBR })}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* Procedimentos e plano */}
      <Section title="Procedimentos e plano" icon={Stethoscope} empty={!temProcs && !temAgenda}
        emptyText={(!temProcs && !temAgenda) ? "Seu plano de tratamento ainda está sendo preparado pela equipe." : null}>
        <div className="space-y-2">
          {data?.procedimentos?.map(p => (
            <div key={p.id} className="rounded-2xl p-4" style={{ background: T.card, border: `1px solid ${T.border}` }}>
              <div className="flex items-center justify-between gap-2 mb-1">
                <p className="text-sm" style={{ color: T.text, fontWeight: 500 }}>{p.nome || "Procedimento"}</p>
                <StatusBadge status={p.status} />
              </div>
              {p.patient_friendly_description && <p className="text-xs leading-relaxed" style={{ color: T.muted }}>{p.patient_friendly_description}</p>}
              {p.next_step_label && (
                <p className="text-xs mt-2 flex items-center gap-1" style={{ color: T.gold }}>
                  <ArrowRight className="h-3 w-3" /> {p.next_step_label}
                  {p.next_step_date && <span style={{ color: T.dim }}>· {format(parseISO(p.next_step_date), "dd/MM/yyyy", { locale: ptBR })}</span>}
                </p>
              )}
            </div>
          ))}
          {data?.protocolos?.map(p => (
            <div key={p.id} className="rounded-2xl p-4" style={{ background: T.card, border: `1px solid ${T.border}` }}>
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm" style={{ color: T.text, fontWeight: 500 }}>{p.nome || "Protocolo"}</p>
                <StatusBadge status={p.status} />
              </div>
              <p className="text-xs mt-1" style={{ color: T.dim }}>
                Sessões: {p.sessions_completed || 0}{p.total_sessions ? `/${p.total_sessions}` : ""}
                {p.start_date && ` · Início ${format(parseISO(p.start_date), "dd/MM/yyyy", { locale: ptBR })}`}
              </p>
            </div>
          ))}
          {temAgenda && (
            <div className="rounded-2xl p-4" style={{ background: T.card, border: `1px solid ${T.border}` }}>
              <p className="text-[10px] uppercase mb-2 flex items-center gap-1" style={{ color: T.gold, letterSpacing: "0.12em" }}>
                <CalendarDays className="h-3 w-3" /> Próximos agendamentos
              </p>
              <div className="space-y-1.5">
                {data.agendamentos.slice(0, 5).map(a => (
                  <div key={a.id} className="flex items-center justify-between text-xs">
                    <span style={{ color: T.text }}>{a.procedure_name}</span>
                    <span style={{ color: T.dim }}>{a.start_time && format(parseISO(a.start_time), "dd/MM/yyyy HH:mm", { locale: ptBR })}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        {!temProcs && temAgenda && (
          <p className="text-xs leading-relaxed px-1 mt-2" style={{ color: T.dim }}>Você ainda não possui agendamentos ativos nesta jornada.</p>
        )}
      </Section>

      {/* Fotos de evolução */}
      <Section title="Fotos de evolução" icon={Camera} empty={!temFotos}
        emptyText={temFotos ? null : "Sua evolução aparecerá aqui conforme seus registros forem adicionados pela clínica ou enviados por você."}>
        {temFotos && (
          <div className="grid grid-cols-2 gap-3">
            {data.fotos.map(img => (
              <div key={img.id} className="rounded-2xl overflow-hidden" style={{ background: T.card, border: `1px solid ${T.border}` }}>
                <div className="aspect-square bg-black/30">
                  <img src={img.file_url} alt={img.titulo || "Evolução"} className="w-full h-full object-cover" />
                </div>
                <div className="p-3">
                  <p className="text-[10px] uppercase mb-1" style={{ color: T.gold, letterSpacing: "0.12em" }}>{catLabel(img.categoria)}</p>
                  <p className="text-xs truncate" style={{ color: T.text, fontWeight: 500 }}>{img.titulo || "Evolução"}</p>
                  <p className="text-[10px] mt-1" style={{ color: T.dim }}>
                    {img.data_upload && format(parseISO(img.data_upload), "dd/MM/yyyy", { locale: ptBR })}
                  </p>
                  {img.patient_note && <p className="text-xs mt-1 leading-relaxed" style={{ color: T.muted }}>{img.patient_note}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* Enviar nova foto */}
      <button onClick={() => setShowUpload(true)}
        className="w-full flex items-center justify-center gap-2 rounded-2xl py-3.5 text-sm mb-3"
        style={{ background: T.gold, color: T.offWhite, fontWeight: 600 }}>
        <Camera className="h-4 w-4" /> Enviar nova foto
      </button>

      {/* Falar com a equipe */}
      <button onClick={falarEquipe}
        className="w-full flex items-center justify-center gap-2 rounded-2xl py-3.5 text-sm"
        style={{ background: T.surface, color: T.gold, border: `1px solid ${T.gold}40`, fontWeight: 500 }}>
        <MessageCircle className="h-4 w-4" /> Falar com a equipe
      </button>

      {showUpload && <UploadModal token={token} onClose={() => setShowUpload(false)} onDone={load} />}
    </div>
  );
}

function SectionHeader({ kicker, title, desc }) {
  return (
    <div className="mb-6">
      <p className="text-[11px] uppercase mb-1" style={{ color: T.dim, letterSpacing: "0.12em" }}>{kicker}</p>
      <h1 className="text-xl" style={{ color: T.text, fontWeight: 600, letterSpacing: "-0.01em" }}>{title}</h1>
      <p className="text-sm mt-2 leading-relaxed" style={{ color: T.muted }}>{desc}</p>
    </div>
  );
}

function Section({ title, icon: Icon, empty, emptyText, children }) {
  return (
    <div className="mb-6">
      <p className="text-[10px] uppercase mb-2 flex items-center gap-1.5" style={{ color: T.gold, letterSpacing: "0.12em", fontWeight: 600 }}>
        {Icon && <Icon className="h-3 w-3" />} {title}
      </p>
      {empty && emptyText ? (
        <div className="rounded-2xl p-5 text-center" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
          <ImageOff className="mx-auto mb-2" style={{ width: 22, height: 22, color: T.dim }} />
          <p className="text-sm leading-relaxed" style={{ color: T.muted }}>{emptyText}</p>
        </div>
      ) : children}
    </div>
  );
}

function ResumoJornada({ entrada, avaliacao }) {
  if (!entrada?.created_date && !avaliacao) return null;
  return (
    <div className="mb-6 rounded-2xl p-4" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
      <p className="text-[10px] uppercase mb-2" style={{ color: T.gold, letterSpacing: "0.12em", fontWeight: 600 }}>Resumo da jornada</p>
      <div className="grid grid-cols-2 gap-3 text-xs">
        {entrada?.created_date && (
          <div>
            <p style={{ color: T.dim }}>Entrada</p>
            <p style={{ color: T.text, fontWeight: 500 }}>{format(parseISO(entrada.created_date), "dd/MM/yyyy", { locale: ptBR })}</p>
          </div>
        )}
        {entrada?.source && (
          <div>
            <p style={{ color: T.dim }}>Origem</p>
            <p style={{ color: T.text, fontWeight: 500, textTransform: "capitalize" }}>{entrada.source}</p>
          </div>
        )}
        {avaliacao?.avaliacao_realizada && (
          <div>
            <p style={{ color: T.dim }}>Avaliação</p>
            <p style={{ color: T.text, fontWeight: 500 }}>Realizada</p>
          </div>
        )}
        {avaliacao?.procedimento_interesse && (
          <div>
            <p style={{ color: T.dim }}>Interesse</p>
            <p style={{ color: T.text, fontWeight: 500 }} className="truncate">{avaliacao.procedimento_interesse}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    indicado: { label: "Indicado", color: T.dim },
    agendado: { label: "Agendado", color: T.gold },
    realizado: { label: "Realizado", color: "#34d399" },
    cancelado: { label: "Cancelado", color: "#f87171" },
    active: { label: "Ativo", color: "#34d399" },
    completed: { label: "Concluído", color: "#34d399" },
    paused: { label: "Pausado", color: T.gold },
    scheduled: { label: "Agendado", color: T.gold },
    confirmed: { label: "Confirmado", color: "#34d399" },
  };
  const m = map[status] || { label: status || "—", color: T.muted };
  return <span className="text-[10px] px-2 py-0.5 rounded" style={{ color: m.color, background: `${m.color}18`, fontWeight: 500 }}>{m.label}</span>;
}

function intensityLabel(i) {
  if (i === 1) return " · suave";
  if (i === 3) return " · mais evidente";
  if (i === 2) return " · moderada";
  return "";
}

function catLabel(c) {
  return { antes: "Antes", depois: "Depois", evolucao: "Evolução", analise_facial: "Análise facial" }[c] || c;
}

const MAX_SIZE = 8 * 1024 * 1024;
const ACCEPTED = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/heic"];

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
    if (f.size > MAX_SIZE) {
      setErr("Arquivo muito grande. Envie uma imagem de até 8 MB.");
      return;
    }
    setErr("");
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  async function submit() {
    if (!file) { setErr("Selecione uma foto."); return; }
    if (loading) return; // evita clique duplo
    setLoading(true); setErr("");
    try {
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error("Erro ao ler a imagem."));
        reader.readAsDataURL(file);
      });
      const res = await portalApi("enviar_foto", {
        token, base64,
        file_name: file.name,
        file_type: file.type || "image/jpeg",
        titulo: titulo || "Foto de evolução",
        descricao,
        patient_note: descricao,
      });
      if (res?.error) { setErr(res.error); setLoading(false); return; }
      setTitulo(""); setDescricao(""); setFile(null); setPreview(null);
      onClose(); onDone();
    } catch (e) {
      setErr(e.message || "Não foi possível enviar sua foto agora. Tente novamente ou fale com a equipe pelo WhatsApp.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" style={{ background: "rgba(0,0,0,0.7)" }}>
      <div className="w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl p-5" style={{ background: T.card, border: `1px solid ${T.border}`, maxHeight: "90vh", overflowY: "auto" }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg" style={{ color: T.text, fontWeight: 600, letterSpacing: "-0.01em" }}>Enviar foto de evolução</h2>
          <button onClick={onClose} disabled={loading} className="p-1" style={{ color: T.dim }}><X className="h-5 w-5" /></button>
        </div>

        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/heic" onChange={handleFile} className="hidden" />
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
            <p className="text-[10px]" style={{ color: T.dim }}>JPG, PNG, WEBP · até 8 MB</p>
          </button>
        )}
        {file && (
          <button onClick={() => fileRef.current?.click()} disabled={loading} className="text-xs mb-4" style={{ color: T.gold }}>Trocar foto</button>
        )}

        <div className="space-y-3">
          <input value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="Título (ex.: 30 dias)" disabled={loading}
            className="w-full rounded-lg px-3 py-2.5 text-sm" style={{ background: T.surface, border: `1px solid ${T.border}`, color: T.text }} />
          <textarea value={descricao} onChange={e => setDescricao(e.target.value)} placeholder="Nota (opcional)" rows={2} disabled={loading}
            className="w-full rounded-lg px-3 py-2.5 text-sm" style={{ background: T.surface, border: `1px solid ${T.border}`, color: T.text }} />
        </div>

        {err && <p className="text-sm mt-3 leading-relaxed" style={{ color: "#f87171" }}>{err}</p>}

        <button onClick={submit} disabled={loading || !file}
          className="w-full flex items-center justify-center gap-2 rounded-lg py-3 mt-4 text-sm disabled:opacity-60"
          style={{ background: T.gold, color: T.offWhite, fontWeight: 600 }}>
          {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Enviando...</> : "Enviar foto"}
        </button>
      </div>
    </div>
  );
}