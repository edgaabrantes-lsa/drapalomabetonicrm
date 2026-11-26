import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useTheme } from "@/lib/theme";

/* ── Configuração do formulário Sensor Flow ── */
const PASSOS = [
  { titulo: "Suas preferências", campos: [
    { key: "beverage_preferences", label: "Qual bebida você gostaria de tomar?", tipo: "singleArray", opcional: true, opcoes: ["Cappuccino", "Café com leite", "Café", "Chá de camomila", "Chá de erva-doce"] },
    { key: "music_style", label: "Qual estilo musical você gosta ou gostaria de ouvir?", tipo: "text", placeholder: "Ex.: MPB, jazz, música clássica" },
    { key: "music_choice_song", label: "Tem alguma música de que gosta muito? (opcional)", tipo: "text", placeholder: "Nome da música" },
    { key: "music_choice_artist", label: "Cantor, cantora ou banda (opcional)", tipo: "text", placeholder: "Nome do artista" },
    { key: "temperature_preference", label: "Qual temperatura do ar-condicionado você prefere?", tipo: "single", opcoes: ["Frio", "Ambiente", "Ameno"] },
  ]},
  { titulo: "Consentimento & Envio", campos: [] },
];

const T = {
  bg: "var(--color-bg-primary)",
  bg2: "var(--color-card)",
  card: "var(--color-card)",
  border: "var(--color-border)",
  text: "var(--color-text-primary)",
  textMuted: "var(--color-text-muted)",
  brand: "var(--color-brand)",
  brandHover: "var(--color-brand-hover)",
  accent: "var(--color-accent)",
  accentSubtle: "var(--color-accent-subtle)",
  accentBorder: "var(--color-accent-border)",
  font: "'Inter', -apple-system, BlinkMacSystemFont, system-ui, sans-serif",
};

export default function SensorFlowForm() {
  const [token, setToken] = useState(null);
  const [estado, setEstado] = useState("carregando"); // carregando | valido | respondido | expirado | cancelado | invalido
  const [primeiroNome, setPrimeiroNome] = useState("");
  const [conviteId, setConviteId] = useState(null);
  const [passo, setPasso] = useState(0);
  const [form, setForm] = useState({
    beverage_preferences: [], music_style: "", music_choice_song: "", music_choice_artist: "", temperature_preference: "", lgpd_consent: false,
  });
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get("t");
    if (!t) {
      setEstado("invalido");
      return;
    }
    setToken(t);
    validar(t);
  }, []);

  async function validar(t) {
    try {
      const res = await base44.functions.invoke("sensorflowConvite", { action: "validar", token: t });
      const data = res.data || res;
      setConviteId(data.convite_id);
      setPrimeiroNome(data.paciente_primeiro_nome || "");
      if (data.valido) setEstado("valido");
      else if (data.status === "respondido") setEstado("respondido");
      else if (data.status === "expirado") setEstado("expirado");
      else if (data.status === "cancelado") setEstado("cancelado");
      else setEstado("invalido");
    } catch {
      setEstado("invalido");
    }
  }

  function toggleMulti(key, valor) {
    setForm(f => {
      const arr = f[key] || [];
      return { ...f, [key]: arr.includes(valor) ? arr.filter(v => v !== valor) : [...arr, valor] };
    });
  }
  function setSingle(key, valor) {
    setForm(f => ({ ...f, [key]: valor }));
  }
  function toggleBool(key) {
    setForm(f => ({ ...f, [key]: !f[key] }));
  }

  function campoPreenchido(campo) {
    if (campo.cond && !campo.cond(form)) return true;
    if (campo.opcional || campo.tipo === "text") return true; // preferências opcionais
    const v = form[campo.key];
    if (campo.tipo === "multi") return Array.isArray(v) && v.length > 0;
    if (campo.tipo === "single") return !!v;
    if (campo.tipo === "bool") return v === true || v === false;
    return !!v;
  }

  function passoValido() {
    if (passo === PASSOS.length - 1) return form.lgpd_consent;
    return PASSOS[passo].campos.every(campoPreenchido);
  }

  function proximo() {
    if (!passoValido()) return;
    setPasso(p => Math.min(p + 1, PASSOS.length - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function voltar() {
    setPasso(p => Math.max(p - 1, 0));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function enviar() {
    if (!form.lgpd_consent) return;
    setEnviando(true);
    setErro("");
    try {
      const dispositivo = /Mobi|Android/i.test(navigator.userAgent) ? "Mobile" : "Desktop";
      await base44.functions.invoke("sensorflowConvite", {
        action: "submeter",
        token,
        form_version: "sensorflow_simplificado_v1",
        beverage_preferences: form.beverage_preferences,
        music_preferences: form.music_style.trim() ? [form.music_style.trim()] : [],
        wants_music_choice: !!(form.music_choice_song.trim() || form.music_choice_artist.trim()),
        music_choice_song: form.music_choice_song.trim(),
        music_choice_artist: form.music_choice_artist.trim(),
        temperature_preference: form.temperature_preference,
        lgpd_consent: form.lgpd_consent,
        url_origem: window.location.origin + window.location.pathname,
        dispositivo,
        navegador: navigator.userAgent.slice(0, 120),
      });
      setEstado("respondido");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      const msg = e?.response?.data?.error || e?.message || "Erro ao enviar";
      if (msg === "already_used") setEstado("respondido");
      else if (msg === "expired") setEstado("expirado");
      else if (msg === "cancelled") setEstado("cancelado");
      else setErro("Não foi possível enviar. Tente novamente em instantes.");
    } finally {
      setEnviando(false);
    }
  }

  /* ── Telas de estado ── */
  if (estado === "carregando") {
    return (
      <Shell>
        <p style={styles.muted}>Verificando seu acesso...</p>
      </Shell>
    );
  }
  if (estado === "invalido") {
    return (
      <Shell>
        <h1 style={styles.h1}>Link inválido</h1>
        <p style={styles.muted}>Este link não é válido. Entre em contato com a clínica para solicitar um novo acesso.</p>
      </Shell>
    );
  }
  if (estado === "respondido") {
    return (
      <Shell>
        <div style={styles.successIcon}>✓</div>
        <h1 style={styles.h1}>Sensor Flow concluído com sucesso</h1>
        <p style={styles.muted}>
          Suas preferências foram registradas e serão utilizadas para personalizar ainda mais a sua experiência na clínica.
        </p>
      </Shell>
    );
  }
  if (estado === "expirado") {
    return (
      <Shell>
        <h1 style={styles.h1}>Link expirado</h1>
        <p style={styles.muted}>Este link expirou. Entre em contato com a clínica para solicitar um novo acesso.</p>
      </Shell>
    );
  }
  if (estado === "cancelado") {
    return (
      <Shell>
        <h1 style={styles.h1}>Acesso indisponível</h1>
        <p style={styles.muted}>Este acesso não está mais disponível. Entre em contato com a clínica.</p>
      </Shell>
    );
  }

  /* ── Formulário ativo ── */
  const passoAtual = PASSOS[passo];
  const progresso = Math.round(((passo + 1) / PASSOS.length) * 100);

  return (
    <Shell>
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <p style={styles.brand}>PALOMA BETONI · CLÍNICA</p>
        <h1 style={styles.h1}>Sensor Flow</h1>
        {passo === 0 && <div style={{ marginTop: 16 }}>
          <h2 style={styles.h2}>{primeiroNome ? primeiroNome + ", seja bem-vindo(a) ao nosso padrão de atendimento." : "Seja bem-vindo(a) ao nosso padrão de atendimento."}</h2>
          <p style={styles.muted}>Queremos conhecer você um pouco melhor para receber e cuidar de você da maneira que merece.</p>
        </div>}
      </div>

      {/* Barra de progresso */}
      <div style={styles.progressWrap}>
        <div style={{ ...styles.progressBar, width: `${progresso}%` }} />
      </div>
      <p style={{ ...styles.muted, fontSize: 12, textAlign: "center", margin: "8px 0 24px" }}>
        Passo {passo + 1} de {PASSOS.length} · {progresso}%
      </p>

      {passo < PASSOS.length - 1 && (
        <div style={styles.card}>
          <h2 style={styles.h2}>{passoAtual.titulo}</h2>
          {passoAtual.campos.map((campo) => {
            if (campo.cond && !campo.cond(form)) return null;
            return <Campo key={campo.key} campo={campo} form={form} toggleMulti={toggleMulti} setSingle={setSingle} toggleBool={toggleBool} />;
          })}
        </div>
      )}

      {passo === PASSOS.length - 1 && (
        <div style={styles.card}>
          <h2 style={styles.h2}>{passoAtual.titulo}</h2>
          <p style={styles.muted}>
            Para utilizarmos suas preferências e tornarmos sua experiência ainda mais personalizada, precisamos do seu consentimento conforme a LGPD.
          </p>
          <label style={styles.consentWrap}>
            <input
              type="checkbox"
              checked={form.lgpd_consent}
              onChange={() => toggleBool("lgpd_consent")}
              style={styles.checkbox}
            />
            <span style={styles.consentText}>
              Autorizo a utilização das minhas preferências sensoriais pela clínica Paloma Betoni, conforme a Lei Geral de Proteção de Dados (LGPD), exclusivamente para personalizar o meu atendimento.
            </span>
          </label>
        </div>
      )}

      {erro && <p style={styles.erro}>{erro}</p>}

      <div style={styles.nav}>
        {passo > 0 && (
          <button onClick={voltar} style={styles.btnGhost}>Voltar</button>
        )}
        {passo < PASSOS.length - 1 ? (
          <button onClick={proximo} disabled={!passoValido()} style={{ ...styles.btnPrimary, opacity: passoValido() ? 1 : 0.4 }}>
            Avançar
          </button>
        ) : (
          <button onClick={enviar} disabled={!form.lgpd_consent || enviando} style={{ ...styles.btnPrimary, opacity: form.lgpd_consent && !enviando ? 1 : 0.5 }}>
            {enviando ? "Enviando..." : "Concluir Sensor Flow"}
          </button>
        )}
      </div>
    </Shell>
  );
}

function Campo({ campo, form, toggleMulti, setSingle, toggleBool }) {
  const v = form[campo.key];
  if (campo.tipo === "text") {
    return (
      <div style={{ marginBottom: 20 }}>
        <p style={styles.label}>{campo.label}</p>
        <input
          type="text"
          value={v || ""}
          onChange={(e) => setSingle(campo.key, e.target.value)}
          placeholder={campo.placeholder || ""}
          maxLength={160}
          aria-label={campo.label}
          style={styles.textInput}
        />
      </div>
    );
  }
  if (campo.tipo === "bool") {
    return (
      <div style={{ marginBottom: 20 }}>
        <p style={styles.label}>{campo.label}</p>
        <div style={styles.optionRow}>
          <button onClick={() => toggleBool(campo.key)} style={v === true ? styles.optionActive : styles.option}>Sim</button>
          <button onClick={() => setSingle(campo.key, false)} style={v === false ? styles.optionActive : styles.option}>Não</button>
        </div>
      </div>
    );
  }
  if (campo.tipo === "singleArray") {
    return <div style={{ marginBottom: 20 }}>
      <p style={styles.label}>{campo.label}</p>
      <div style={styles.optionWrap}>{campo.opcoes.map(op => <button key={op} type="button" aria-pressed={(v || []).includes(op)} onClick={() => setSingle(campo.key, (v || []).includes(op) ? [] : [op])} style={(v || []).includes(op) ? styles.optionActive : styles.option}>{op}</button>)}</div>
      <p style={{ ...styles.muted, fontSize: 12, marginTop: 8 }}>Se não quiser bebida, deixe sem seleção.</p>
    </div>;
  }
  if (campo.tipo === "single") {
    return (
      <div style={{ marginBottom: 20 }}>
        <p style={styles.label}>{campo.label}</p>
        <div style={styles.optionWrap}>
          {campo.opcoes.map(op => (
            <button key={op} onClick={() => setSingle(campo.key, op)} style={v === op ? styles.optionActive : styles.option}>{op}</button>
          ))}
        </div>
      </div>
    );
  }
  // multi
  const arr = v || [];
  return (
    <div style={{ marginBottom: 20 }}>
      <p style={styles.label}>{campo.label}</p>
      <div style={styles.optionWrap}>
        {campo.opcoes.map(op => (
          <button key={op} onClick={() => toggleMulti(campo.key, op)} style={arr.includes(op) ? styles.optionActive : styles.option}>{op}</button>
        ))}
      </div>
    </div>
  );
}

function Shell({ children }) {
  const { theme, toggleTheme } = useTheme();
  return (
    <div style={{ backgroundColor: T.bg, minHeight: "100vh", fontFamily: T.font, color: T.text }}>
      {/* Faixa da marca */}
      <div style={{ backgroundColor: "var(--sidebar-bg)", padding: "18px max(20px, 4vw)" }}>
        <div style={{ maxWidth: 560, margin: "0 auto", position: "relative", display: "flex", alignItems: "center", justifyContent: "center", minHeight: 56 }}>
          <img
            src="https://media.base44.com/images/public/699dbefdfbf6a591f90b6e3b/87c946eb1_ChatGPT_Image_8_de_mai_de_2026__14_52_26-removebg-preview.png"
            alt="Paloma Betoni"
            style={{ height: 64, objectFit: "contain" }}
          />
          <button
            type="button"
            onClick={toggleTheme}
            style={styles.themeBtn}
            aria-label="Alternar modo diurno e noturno"
          >
            {theme === "light" ? "☀ Diurno" : "☾ Noturno"}
          </button>
        </div>
      </div>

      <div style={{ padding: "max(20px, 4vw)" }}>
        <div style={{ maxWidth: 560, margin: "0 auto" }}>
          {children}
        </div>
      </div>
    </div>
  );
}

const styles = {
  brand: { fontFamily: T.font, fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", color: T.accent, margin: 0 },
  h1: { fontFamily: T.font, fontSize: 26, fontWeight: 600, color: T.text, margin: "6px 0 4px", letterSpacing: "-0.02em" },
  h2: { fontFamily: T.font, fontSize: 17, fontWeight: 600, color: T.text, margin: "0 0 16px", letterSpacing: "-0.01em" },
  muted: { fontFamily: T.font, fontSize: 14, color: T.textMuted, lineHeight: 1.6, margin: 0 },
  card: { backgroundColor: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 24, marginBottom: 16 },
  label: { fontFamily: T.font, fontSize: 12, fontWeight: 600, color: T.textMuted, marginBottom: 10, letterSpacing: "0.04em" },
  optionWrap: { display: "flex", flexWrap: "wrap", gap: 8 },
  optionRow: { display: "flex", gap: 8 },
  textInput: {
    fontFamily: T.font, fontSize: 14, color: T.text,
    backgroundColor: T.bg2, border: `1px solid ${T.border}`, borderRadius: 8,
    padding: "11px 14px", width: "100%", boxSizing: "border-box", outline: "none",
  },
  option: {
    fontFamily: T.font, fontSize: 13, fontWeight: 500, color: T.textMuted,
    backgroundColor: T.bg2, border: `1px solid ${T.border}`, borderRadius: 999,
    padding: "9px 16px", cursor: "pointer", transition: "all 0.15s",
  },
  optionActive: {
    fontFamily: T.font, fontSize: 13, fontWeight: 600, color: "#FFFFFF",
    backgroundColor: T.brand, border: `1px solid ${T.brand}`, borderRadius: 999,
    padding: "9px 16px", cursor: "pointer",
  },
  progressWrap: { height: 6, backgroundColor: T.border, borderRadius: 999, overflow: "hidden" },
  progressBar: { height: "100%", backgroundColor: T.brand, borderRadius: 999, transition: "width 0.3s" },
  consentWrap: { display: "flex", gap: 12, alignItems: "flex-start", cursor: "pointer", marginTop: 8 },
  checkbox: { width: 20, height: 20, marginTop: 2, accentColor: T.brand, flexShrink: 0 },
  consentText: { fontFamily: T.font, fontSize: 13, color: T.textMuted, lineHeight: 1.6 },
  nav: { display: "flex", justifyContent: "space-between", gap: 12, marginTop: 8 },
  btnPrimary: {
    backgroundColor: T.brand, color: "#FFFFFF", border: "none", borderRadius: 999,
    fontFamily: T.font, fontSize: 14, fontWeight: 600, padding: "12px 28px", cursor: "pointer",
    marginLeft: "auto",
  },
  btnGhost: {
    backgroundColor: "transparent", color: T.textMuted, border: `1px solid ${T.border}`, borderRadius: 999,
    fontFamily: T.font, fontSize: 14, fontWeight: 500, padding: "12px 22px", cursor: "pointer",
  },
  successIcon: {
    width: 64, height: 64, borderRadius: "50%", backgroundColor: T.accentSubtle,
    border: `1px solid ${T.accentBorder}`, color: T.accent, fontSize: 32, fontWeight: 700,
    display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px",
  },
  erro: { color: "#EF4444", fontSize: 13, fontFamily: T.font, marginTop: 12, textAlign: "center" },
  themeBtn: {
    position: "absolute", right: 0, top: "50%", transform: "translateY(-50%)",
    backgroundColor: "rgba(255,255,255,0.14)", border: "1px solid rgba(255,255,255,0.3)",
    color: "rgba(255,255,255,1)", borderRadius: 999, fontFamily: T.font, fontSize: 11, fontWeight: 500,
    padding: "6px 12px", cursor: "pointer", letterSpacing: "0.04em", whiteSpace: "nowrap",
  },
};