import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";

/* ── Configuração do formulário Sensor Flow ── */
const PASSOS = [
  {
    titulo: "Horários & Experiência Musical",
    campos: [
      { key: "appointment_periods", label: "Qual é o seu horário preferido para atendimento?", tipo: "single", opcoes: ["Manhã", "Tarde", "Noite"] },
      { key: "music_preferences", label: "Que estilo musical você gosta de ouvir?", tipo: "multi", opcoes: ["Jazz", "Música clássica", "Instrumental", "Lounge", "MPB", "Bossa nova", "Pop nacional", "Pop internacional", "Country", "Sertanejo", "Forró", "Forró brega", "Forró pé de serra", "Piseiro", "Música gospel cristã", "Rock", "R&B", "Soul", "Eletrônica leve", "Outro"] },
      { key: "music_other", label: "Qual estilo musical você prefere?", tipo: "text", cond: (f) => (f.music_preferences || []).includes("Outro") },
      { key: "wants_music_choice", label: "Você deseja escolher uma música e um cantor para ouvir durante o atendimento?", tipo: "bool" },
      { key: "music_choice_song", label: "Qual música você gostaria de ouvir?", tipo: "text", cond: (f) => f.wants_music_choice === true },
      { key: "music_choice_artist", label: "Qual cantor, cantora ou banda você prefere?", tipo: "text", cond: (f) => f.wants_music_choice === true },
    ],
  },
  {
    titulo: "Bebidas & Alimentação",
    campos: [
      { key: "beverage_preferences", label: "Quais bebidas você prefere?", tipo: "multi", opcoes: ["Café", "Chá", "Água com gás", "Água sem gás", "Suco", "Refrigerante normal", "Refrigerante zero", "Vinho", "Champanhe", "Prosecco", "Nenhuma bebida", "Outra"] },
      { key: "beverage_other", label: "Qual bebida você prefere?", tipo: "text", cond: (f) => (f.beverage_preferences || []).includes("Outra") },
      { key: "food_preferences", label: "Quais alimentos você prefere?", tipo: "multi", opcoes: ["Frutas", "Chocolate", "Castanhas", "Croissant", "Pão de queijo", "Bolo de baunilha", "Bolo de chocolate", "Bolo de cenoura", "Bolo de laranja", "Nenhum alimento", "Outro"] },
      { key: "food_other", label: "Qual alimento você prefere?", tipo: "text", cond: (f) => (f.food_preferences || []).includes("Outro") },
      { key: "dietary_restrictions", label: "Você possui alguma restrição alimentar ou condição que exija cuidados especiais?", tipo: "multi", opcoes: ["Vegetariano", "Vegano", "Sem glúten", "Intolerância à lactose", "Diabetes", "Hipertensão", "Alergias alimentares", "Outras alergias ou intolerâncias", "Não possuo restrições"] },
      { key: "dietary_restrictions_detail", label: "Informe quais alergias, intolerâncias ou restrições você possui.", tipo: "text", cond: (f) => { const a = f.dietary_restrictions || []; return a.includes("Alergias alimentares") || a.includes("Outras alergias ou intolerâncias"); } },
    ],
  },
  {
    titulo: "Ambiente, Aromas & Atendimento",
    campos: [
      { key: "temperature_preference", label: "Qual temperatura você prefere no ambiente?", tipo: "single", opcoes: ["Fresco", "Frio", "Aquecido"] },
      { key: "likes_aromas", label: "Você aprecia aromas durante o atendimento?", tipo: "bool" },
      { key: "aroma_preferences", label: "Quais aromas você prefere?", tipo: "multi", opcoes: ["Lavanda", "Baunilha", "Capim-limão", "Bambu", "Chá branco", "Algodão", "Flor de cerejeira", "Alecrim", "Eucalipto", "Outro"], cond: (f) => f.likes_aromas === true },
      { key: "aroma_other", label: "Qual aroma você prefere?", tipo: "text", cond: (f) => f.likes_aromas === true && (f.aroma_preferences || []).includes("Outro") },
      { key: "service_style", label: "Qual estilo de atendimento você prefere?", tipo: "single", opcoes: ["Atendimento mais discreto e reservado", "Atendimento mais próximo e acolhedor", "Conversa leve durante o atendimento", "Silêncio e foco no procedimento"] },
    ],
  },
  {
    titulo: "Consentimento & Envio",
    campos: [],
  },
];

const T = {
  bg: "#0A0A0A",
  bg2: "#121212",
  card: "#1A1A1A",
  border: "#2B2B2B",
  text: "#FFFFFF",
  textMuted: "#8A8A8A",
  gold: "#C8A96A",
  goldHover: "#D4BC88",
  goldSubtle: "rgba(200,169,106,0.08)",
  goldBorder: "rgba(200,169,106,0.2)",
  font: "'Inter', -apple-system, BlinkMacSystemFont, system-ui, sans-serif",
};

export default function SensorFlowForm() {
  const [token, setToken] = useState(null);
  const [estado, setEstado] = useState("carregando"); // carregando | valido | respondido | expirado | cancelado | invalido
  const [primeiroNome, setPrimeiroNome] = useState("");
  const [conviteId, setConviteId] = useState(null);
  const [passo, setPasso] = useState(0);
  const [form, setForm] = useState({
    appointment_periods: "",
    music_preferences: [],
    music_other: "",
    wants_music_choice: false,
    music_choice_song: "",
    music_choice_artist: "",
    beverage_preferences: [],
    beverage_other: "",
    food_preferences: [],
    food_other: "",
    dietary_restrictions: [],
    dietary_restrictions_detail: "",
    environment_preferences: [],
    temperature_preference: "",
    likes_aromas: false,
    aroma_preferences: [],
    aroma_other: "",
    service_style: "",
    lgpd_consent: false,
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
    if (campo.tipo === "text") return true; // campos de texto são opcionais
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
        ...form,
        url_origem: window.location.href,
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
        {primeiroNome && <p style={styles.muted}>Olá, {primeiroNome}. Vamos personalizar a sua experiência.</p>}
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
  return (
    <div style={{ backgroundColor: T.bg, minHeight: "100vh", fontFamily: T.font, color: T.text, padding: "max(20px, 4vw)" }}>
      <div style={{ maxWidth: 560, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <img
            src="https://media.base44.com/images/public/699dbefdfbf6a591f90b6e3b/87c946eb1_ChatGPT_Image_8_de_mai_de_2026__14_52_26-removebg-preview.png"
            alt="Paloma Betoni"
            style={{ height: 80, objectFit: "contain", margin: "0 auto" }}
          />
        </div>
        {children}
      </div>
    </div>
  );
}

const styles = {
  brand: { fontFamily: T.font, fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", color: T.gold, margin: 0 },
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
    fontFamily: T.font, fontSize: 13, fontWeight: 600, color: "#000",
    backgroundColor: T.gold, border: `1px solid ${T.gold}`, borderRadius: 999,
    padding: "9px 16px", cursor: "pointer",
  },
  progressWrap: { height: 6, backgroundColor: T.bg2, borderRadius: 999, overflow: "hidden", border: `1px solid ${T.border}` },
  progressBar: { height: "100%", backgroundColor: T.gold, borderRadius: 999, transition: "width 0.3s" },
  consentWrap: { display: "flex", gap: 12, alignItems: "flex-start", cursor: "pointer", marginTop: 8 },
  checkbox: { width: 20, height: 20, marginTop: 2, accentColor: T.gold, flexShrink: 0 },
  consentText: { fontFamily: T.font, fontSize: 13, color: T.textMuted, lineHeight: 1.6 },
  nav: { display: "flex", justifyContent: "space-between", gap: 12, marginTop: 8 },
  btnPrimary: {
    backgroundColor: T.gold, color: "#000", border: "none", borderRadius: 8,
    fontFamily: T.font, fontSize: 14, fontWeight: 600, padding: "12px 24px", cursor: "pointer",
    marginLeft: "auto",
  },
  btnGhost: {
    backgroundColor: "transparent", color: T.textMuted, border: `1px solid ${T.border}`, borderRadius: 8,
    fontFamily: T.font, fontSize: 14, fontWeight: 500, padding: "12px 20px", cursor: "pointer",
  },
  successIcon: {
    width: 64, height: 64, borderRadius: "50%", backgroundColor: T.goldSubtle,
    border: `1px solid ${T.goldBorder}`, color: T.gold, fontSize: 32, fontWeight: 700,
    display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px",
  },
  erro: { color: "#EF4444", fontSize: 13, fontFamily: T.font, marginTop: 12, textAlign: "center" },
};