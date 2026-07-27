import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { T, S } from "@/lib/designTokens";
import {
  Sparkles, Link2, Copy, MessageCircle, ExternalLink, Ban, RefreshCw,
  CheckCircle2, Clock, XCircle, AlertTriangle, Send, ChevronDown, ChevronUp, FileText,
} from "lucide-react";

const STATUS_CONVITE = {
  aguardando: { label: "Aguardando resposta", color: T.gold, bg: T.goldSubtle, icon: Clock },
  respondido: { label: "Respondido", color: T.success, bg: T.successSubtle, icon: CheckCircle2 },
  expirado: { label: "Expirado", color: T.warning, bg: T.warningSubtle, icon: AlertTriangle },
  cancelado: { label: "Cancelado", color: T.danger, bg: T.dangerSubtle, icon: XCircle },
};

function fmtDate(dt) {
  if (!dt) return "—";
  try { return new Date(dt).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }); }
  catch { return dt; }
}

function Tag({ label }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", padding: "3px 10px", borderRadius: 20,
      backgroundColor: T.goldSubtle, border: `1px solid ${T.goldBorder}`, color: T.gold, fontSize: 12, fontWeight: 500,
    }}>{label}</span>
  );
}
function TagList({ items }) {
  if (!items || items.length === 0) return <p style={{ ...S.pageSubtitle, margin: 0, fontSize: 13 }}>—</p>;
  return <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>{items.map((i, k) => <Tag key={k} label={i} />)}</div>;
}

function PerfilResumo({ perfil }) {
  const [open, setOpen] = useState(false);
  if (!perfil) return null;
  return (
    <div style={{ backgroundColor: T.card, border: `1px solid ${T.border}`, borderRadius: 8, overflow: "hidden" }}>
      <button onClick={() => setOpen(o => !o)} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", background: "none", border: "none", cursor: "pointer" }}>
        <span style={{ ...S.label, color: T.gold, margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
          <Sparkles style={{ width: 14, height: 14 }} /> Resumo do Perfil Sensorial
        </span>
        {open ? <ChevronUp style={{ width: 15, height: 15, color: T.textMuted }} /> : <ChevronDown style={{ width: 15, height: 15, color: T.textMuted }} />}
      </button>
      {open && (
        <div style={{ padding: "0 18px 18px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
          <Bloco title="Horários"><TagList items={perfil.appointment_periods} /></Bloco>
          <Bloco title="Bebidas"><TagList items={perfil.beverage_preferences} /></Bloco>
          <Bloco title="Alimentação"><TagList items={perfil.food_preferences} /></Bloco>
          <Bloco title="Restrições"><TagList items={perfil.dietary_restrictions} /></Bloco>
          <Bloco title="Ambiente"><TagList items={perfil.environment_preferences} /></Bloco>
          <Bloco title="Aromas">
            <p style={{ fontSize: 12, color: T.textMuted, margin: 0 }}>Aprecia: {perfil.likes_aromas ? "Sim" : "Não"}</p>
            {perfil.likes_aromas && <div style={{ marginTop: 6 }}><TagList items={perfil.aroma_preferences} /></div>}
          </Bloco>
          <Bloco title="Temperatura"><p style={{ color: T.textPrimary, fontSize: 13, margin: 0 }}>{perfil.temperature_preference || "—"}</p></Bloco>
          <Bloco title="Atendimento"><p style={{ color: T.textPrimary, fontSize: 13, margin: 0 }}>{perfil.service_style || "—"}</p></Bloco>
        </div>
      )}
      {perfil.hospitality_summary && open && (
        <div style={{ margin: "0 18px 18px", padding: 12, backgroundColor: T.goldSubtle, border: `1px solid ${T.goldBorder}`, borderRadius: 6 }}>
          <p style={{ ...S.label, color: T.gold, marginBottom: 6 }}>Resumo de Hospitalidade</p>
          <p style={{ color: T.textPrimary, fontSize: 13, margin: 0, lineHeight: 1.6 }}>{perfil.hospitality_summary}</p>
        </div>
      )}
      {open && (
        <div style={{ padding: "0 18px 14px", fontSize: 11, color: T.textMuted }}>
          LGPD: {perfil.lgpd_consent ? "✓ Aceito" : "—"} · {perfil.lgpd_consent_date ? fmtDate(perfil.lgpd_consent_date) : ""} · v{perfil.lgpd_consent_version || "—"}
        </div>
      )}
    </div>
  );
}
function Bloco({ title, children }) {
  return (
    <div>
      <p style={{ ...S.label, fontSize: 11, marginBottom: 8 }}>{title}</p>
      {children}
    </div>
  );
}

export default function DossieSensorFlowTab({ patient, currentUser }) {
  const qc = useQueryClient();
  const [linkGerado, setLinkGerado] = useState(null); // { token, convite_id, data_validade }
  const [copiado, setCopiado] = useState(false);
  const [novoSolicitado, setNovoSolicitado] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["sensorflow", patient.id],
    queryFn: async () => {
      const res = await base44.functions.invoke("sensorflowConvite", { action: "historico", patient_id: patient.id });
      return res.data || res;
    },
    enabled: !!patient.id,
    refetchInterval: (query) => {
      const temAguardando = (query?.state?.data?.convites || []).some(c => c.status === "aguardando");
      return temAguardando ? 6000 : false;
    },
  });

  const convites = data?.convites || [];
  const perfis = data?.perfis || [];
  const perfilLatest = perfis[0];
  const conviteAtivo = convites.find(c => c.status === "aguardando");

  const gerarMutation = useMutation({
    mutationFn: () => base44.functions.invoke("sensorflowConvite", { action: "gerar", patient_id: patient.id }),
    onSuccess: (res) => {
      const d = res.data || res;
      setLinkGerado(d);
      setNovoSolicitado(false);
      qc.invalidateQueries(["sensorflow", patient.id]);
      qc.invalidateQueries(["perfilSensorial", patient.id]);
    },
  });

  const cancelarMutation = useMutation({
    mutationFn: (convite_id) => base44.functions.invoke("sensorflowConvite", { action: "cancelar", convite_id }),
    onSuccess: () => {
      setLinkGerado(null);
      qc.invalidateQueries(["sensorflow", patient.id]);
    },
  });

  function montarLink(token) {
    return `${window.location.origin}/sensorflow?t=${token}`;
  }

  function copiarLink() {
    const link = montarLink(linkGerado?.token || conviteAtivo?.token);
    navigator.clipboard?.writeText(link).then(() => {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    });
    if (linkGerado?.convite_id || conviteAtivo?.id) {
      base44.functions.invoke("sensorflowConvite", { action: "log", convite_id: linkGerado?.convite_id || conviteAtivo?.id, acao: "copiado" }).catch(() => {});
    }
  }

  function enviarWhatsApp() {
    const token = linkGerado?.token || conviteAtivo?.token;
    if (!token) return;
    const link = montarLink(token);
    const nome = patient.full_name?.split(" ")[0] || "paciente";
    const msg = `Olá, ${nome}. Para personalizarmos ainda mais a sua experiência e o seu atendimento, preparamos o Sensor Flow. Por favor, acesse o link abaixo e responda às perguntas:\n\n${link}\n\nAs suas respostas serão utilizadas para tornar sua experiência na clínica ainda mais personalizada.`;
    const phone = (patient.whatsapp || patient.phone || "").replace(/\D/g, "");
    const wa = phone ? `https://wa.me/${phone}?text=${encodeURIComponent(msg)}` : `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(wa, "_blank");
    if (linkGerado?.convite_id || conviteAtivo?.id) {
      base44.functions.invoke("sensorflowConvite", { action: "log", convite_id: linkGerado?.convite_id || conviteAtivo?.id, acao: "enviado_whatsapp" }).catch(() => {});
    }
  }

  function abrirFormulario() {
    const token = linkGerado?.token || conviteAtivo?.token;
    if (!token) return;
    window.open(montarLink(token), "_blank");
  }

  const tokenAtivo = linkGerado?.token || conviteAtivo?.token;
  const validadeAtiva = linkGerado?.data_validade || conviteAtivo?.data_validade;
  const geradoPor = linkGerado ? currentUser?.full_name : conviteAtivo?.gerado_por;

  if (isLoading) {
    return <div style={{ textAlign: "center", padding: "48px 0" }}><p style={S.pageSubtitle}>Carregando Sensor Flow...</p></div>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: "100%" }}>

      {/* ── Status / Geração de link ── */}
      {!tokenAtivo && (
        <div style={{ textAlign: "center", padding: "40px 24px", backgroundColor: T.card, border: `1px solid ${T.border}`, borderRadius: 8 }}>
          <Sparkles style={{ width: 30, height: 30, color: T.gold, margin: "0 auto 12px" }} />
          <p style={{ ...S.value, marginBottom: 6 }}>Sensor Flow</p>
          <p style={{ ...S.pageSubtitle, fontSize: 13, marginBottom: 18 }}>
            {perfilLatest
              ? "Este paciente já respondeu ao Sensor Flow. Você pode solicitar uma nova atualização."
              : "Este paciente ainda não respondeu ao Sensor Flow."}
          </p>
          <button
            onClick={() => gerarMutation.mutate()}
            disabled={gerarMutation.isPending}
            style={{ ...S.btnPrimary, opacity: gerarMutation.isPending ? 0.7 : 1 }}
          >
            <Link2 style={{ width: 14, height: 14 }} />
            {gerarMutation.isPending ? "Gerando..." : perfilLatest ? "Solicitar nova atualização" : "Gerar link do Sensor Flow"}
          </button>
        </div>
      )}

      {/* ── Link ativo ── */}
      {tokenAtivo && (
        <div style={{ backgroundColor: T.card, border: `1px solid ${T.goldBorder}`, borderRadius: 8, padding: 20 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
            <span style={{ ...S.badge(T.gold, T.goldSubtle), display: "flex", alignItems: "center", gap: 6 }}>
              <Clock style={{ width: 12, height: 12 }} /> Link ativo · Aguardando resposta
            </span>
            {validadeAtiva && (
              <span style={{ fontSize: 12, color: T.textMuted }}>Válido até: {fmtDate(validadeAtiva)}</span>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <input
              readOnly
              value={montarLink(tokenAtivo)}
              style={{ ...S.input, fontSize: 12, flex: 1 }}
              onFocus={e => e.target.select()}
            />
            <button onClick={copiarLink} style={{ ...S.btnGhost, height: 36, whiteSpace: "nowrap" }}>
              <Copy style={{ width: 13, height: 13 }} /> {copiado ? "Copiado!" : "Copiar"}
            </button>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            <button onClick={enviarWhatsApp} style={{ ...S.btnPrimary }}>
              <MessageCircle style={{ width: 14, height: 14 }} /> Enviar pelo WhatsApp
            </button>
            <button onClick={abrirFormulario} style={{ ...S.btnGhost, height: 36 }}>
              <ExternalLink style={{ width: 13, height: 13 }} /> Abrir formulário
            </button>
            <button
              onClick={() => cancelarMutation.mutate(linkGerado?.convite_id || conviteAtivo?.id)}
              disabled={cancelarMutation.isPending}
              style={{ ...S.btnGhost, height: 36, color: T.danger, borderColor: "rgba(239,68,68,0.3)" }}
            >
              <Ban style={{ width: 13, height: 13 }} /> Cancelar link
            </button>
            <button
              onClick={() => { gerarMutation.mutate(); setNovoSolicitado(true); }}
              disabled={gerarMutation.isPending}
              style={{ ...S.btnGhost, height: 36 }}
            >
              <RefreshCw style={{ width: 13, height: 13 }} /> Gerar novo link
            </button>
          </div>

          {geradoPor && (
            <p style={{ fontSize: 11, color: T.textMuted, marginTop: 12 }}>
              Gerado por: <span style={{ color: T.textSecondary }}>{geradoPor}</span>
              {novoSolicitado && " · novo convite solicitado"}
            </p>
          )}
        </div>
      )}

      {/* ── Perfil sensorial (se respondido) ── */}
      {perfilLatest ? (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 18px", backgroundColor: T.successSubtle, border: `1px solid ${T.border}`, borderRadius: 8 }}>
            <CheckCircle2 style={{ width: 16, height: 16, color: T.success, flexShrink: 0 }} />
            <div>
              <p style={{ ...S.value, fontSize: 13, margin: 0 }}>Sensor Flow respondido</p>
              <p style={{ fontSize: 12, color: T.textMuted, margin: 0 }}>
                Preenchido em {fmtDate(perfilLatest.lgpd_consent_date || perfilLatest.created_date)}
              </p>
            </div>
          </div>
          <PerfilResumo perfil={perfilLatest} />
        </>
      ) : (
        !tokenAtivo && (
          <div style={{ padding: "18px", backgroundColor: T.card, border: `1px solid ${T.border}`, borderRadius: 8 }}>
            <p style={{ ...S.pageSubtitle, fontSize: 13, display: "flex", alignItems: "center", gap: 8, margin: 0 }}>
              <FileText style={{ width: 14, height: 14 }} /> Nenhuma resposta registrada ainda.
            </p>
          </div>
        )
      )}

      {/* ── Histórico de convites ── */}
      {convites.length > 0 && (
        <div style={{ backgroundColor: T.card, border: `1px solid ${T.border}`, borderRadius: 8, overflow: "hidden" }}>
          <div style={{ padding: "12px 18px", borderBottom: `1px solid ${T.border}` }}>
            <p style={{ ...S.label, margin: 0 }}>Histórico de Convites</p>
          </div>
          <div>
            {convites.map((c, i) => {
              const st = STATUS_CONVITE[c.status] || STATUS_CONVITE.aguardando;
              const Icon = st.icon;
              return (
                <div key={c.id || i} style={{
                  display: "flex", alignItems: "center", gap: 12, padding: "12px 18px",
                  borderBottom: i < convites.length - 1 ? `1px solid ${T.borderLight}` : "none",
                }}>
                  <Icon style={{ width: 14, height: 14, color: st.color, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, color: T.textPrimary, margin: 0 }}>{st.label}</p>
                    <p style={{ fontSize: 11, color: T.textMuted, margin: "2px 0 0" }}>
                      Gerado por {c.gerado_por || "—"} em {fmtDate(c.data_criacao)}
                      {c.status === "respondido" && ` · respondido em ${fmtDate(c.data_preenchimento)}`}
                      {c.status === "cancelado" && ` · ${c.motivo_cancelamento || "cancelado"}`}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}