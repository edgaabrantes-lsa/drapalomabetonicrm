import React, { useState } from "react";
import { T, portalApi } from "./portalConfig";
import { Loader2, ArrowRight, Lock } from "lucide-react";

export default function PortalAccess({ onAuthenticated }) {
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    if (!token.trim()) { setError("Informe seu código de acesso."); return; }
    setLoading(true); setError("");
    try {
      const data = await portalApi("validate", { token: token.trim() });
      if (data.error) throw new Error(data.error);
      onAuthenticated(token.trim(), data);
    } catch (err) {
      setError(err.message || "Não foi possível validar seu acesso.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ background: T.bg }}>
      <div className="w-full max-w-md text-center">
        {/* Marca */}
        <div className="mb-10">
          <div className="inline-flex items-center justify-center rounded-full mb-6"
            style={{ width: 72, height: 72, background: T.goldSoft, border: `1px solid ${T.gold}40` }}>
            <span className="font-serif text-2xl" style={{ color: T.gold }}>P</span>
          </div>
          <h1 className="font-serif text-2xl mb-3" style={{ color: T.text, letterSpacing: "0.04em" }}>
            Bem-vinda à sua<br />Jornada da Beleza Natural
          </h1>
          <p className="text-sm leading-relaxed" style={{ color: T.muted }}>
            Um espaço exclusivo para acompanhar seu tratamento, seus cuidados e sua evolução com todo o acolhimento que você merece.
          </p>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          <div>
            <label className="block text-[11px] uppercase tracking-widest mb-2" style={{ color: T.dim }}>
              Código de acesso
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2" style={{ width: 15, height: 15, color: T.dim }} />
              <input
                type="text"
                value={token}
                onChange={e => setToken(e.target.value)}
                placeholder="Cole aqui seu link ou código"
                autoFocus
                className="w-full rounded-lg pl-10 pr-4 py-3 text-sm"
                style={{ background: T.surface, border: `1px solid ${T.border}`, color: T.text }}
              />
            </div>
            <p className="mt-2 text-xs" style={{ color: T.dim }}>
              Use o código recebido pela nossa equipe. Seu acesso é pessoal e intransferível.
            </p>
          </div>

          {error && (
            <div className="rounded-lg px-4 py-3 text-sm" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", color: "#f87171" }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-lg py-3 text-sm font-semibold transition-opacity disabled:opacity-60"
            style={{ background: T.gold, color: "#0A0A0A" }}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Entrar na minha jornada <ArrowRight className="h-4 w-4" /></>}
          </button>
        </form>

        <p className="mt-10 text-xs leading-relaxed" style={{ color: T.dim }}>
          Não recebeu seu código? Entre em contato com a clínica e solicite seu acesso à Jornada da Beleza Natural.
        </p>
      </div>
    </div>
  );
}