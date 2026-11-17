import React, { useEffect, useState } from "react";
import { CORES, ESPESSURAS, REGIOES_FACE, NOME_TIPO } from "@/lib/mapaFacial";

const rotulo = { fontSize: 10, textTransform: "uppercase", letterSpacing: "0.07em", color: "#7A7A7A", display: "block", marginBottom: 3 };
const campo = {
  width: "100%",
  background: "#0E0E0E",
  border: "1px solid #2B2B2B",
  borderRadius: 5,
  color: "#FFFFFF",
  fontSize: 12,
  padding: "6px 8px",
};

function Botao({ children, onClick, variante = "ghost", disabled }) {
  const paleta = {
    primario: { background: "#C8A96A", color: "#0A0A0A", border: "1px solid #C8A96A" },
    perigo: { background: "transparent", color: "#EF4444", border: "1px solid rgba(239,68,68,0.35)" },
    ghost: { background: "transparent", color: "#B0B0B0", border: "1px solid #2B2B2B" },
  }[variante];
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        ...paleta,
        fontSize: 11,
        fontWeight: 600,
        padding: "6px 12px",
        borderRadius: 5,
        cursor: disabled ? "default" : "pointer",
        opacity: disabled ? 0.45 : 1,
      }}
    >
      {children}
    </button>
  );
}

/**
 * Caixa de observação de UMA marcação.
 * Desktop/tablet: cartão próximo ao objeto. Celular: painel inferior.
 */
export default function MapaObservacaoPopover({ objeto, procedimentos = [], somenteLeitura, onSalvar, onExcluir, onFechar, ancora }) {
  const original = {
    procedimento: objeto?.procedimento || "",
    regiao: objeto?.regiao || "",
    observacao: objeto?.observacao || "",
    cor: objeto?.cor || "#C8A96A",
    espessura: objeto?.espessura || 4,
    texto: objeto?.texto || "",
  };
  const [draft, setDraft] = useState(original);
  const [compacto, setCompacto] = useState(() => (typeof window !== "undefined" ? window.innerWidth < 768 : false));

  useEffect(() => {
    const aoRedimensionar = () => setCompacto(window.innerWidth < 768);
    window.addEventListener("resize", aoRedimensionar);
    return () => window.removeEventListener("resize", aoRedimensionar);
  }, []);

  const alterado = JSON.stringify(draft) !== JSON.stringify(original);
  const editar = (patch) => setDraft((d) => ({ ...d, ...patch }));

  const fechar = () => {
    if (alterado && !window.confirm("Descartar as alterações desta marcação?")) return;
    onFechar();
  };

  const salvar = () => {
    onSalvar({ ...draft, observacao: draft.observacao.trim() });
  };

  const conteudo = (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", color: "#C8A96A", fontWeight: 600 }}>
          Marcação · {NOME_TIPO[objeto?.tipo] || objeto?.tipo}
        </p>
        <button type="button" onClick={fechar} style={{ background: "transparent", border: "none", color: "#666666", fontSize: 16, lineHeight: 1, cursor: "pointer", padding: "0 4px" }}>
          ×
        </button>
      </div>

      {somenteLeitura ? (
        <div className="space-y-2">
          <div>
            <span style={rotulo}>Procedimento</span>
            <p style={{ fontSize: 12, color: "#FFFFFF" }}>{objeto?.procedimento || "—"}</p>
          </div>
          <div>
            <span style={rotulo}>Região</span>
            <p style={{ fontSize: 12, color: "#FFFFFF" }}>{objeto?.regiao || "—"}</p>
          </div>
          <div>
            <span style={rotulo}>Observação</span>
            <p style={{ fontSize: 12, color: "#B0B0B0", whiteSpace: "pre-wrap" }}>{objeto?.observacao || "—"}</p>
          </div>
          {objeto?.tipo === "texto" && (
            <div>
              <span style={rotulo}>Texto</span>
              <p style={{ fontSize: 12, color: "#FFFFFF" }}>{objeto?.texto || "—"}</p>
            </div>
          )}
          <div className="flex justify-end pt-1">
            <Botao onClick={fechar}>Fechar</Botao>
          </div>
        </div>
      ) : (
        <>
          <div>
            <span style={rotulo}>Procedimento</span>
            <select value={draft.procedimento} onChange={(e) => editar({ procedimento: e.target.value })} style={campo}>
              <option value="">Selecionar procedimento</option>
              {procedimentos.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          <div>
            <span style={rotulo}>Região facial</span>
            <select value={draft.regiao} onChange={(e) => editar({ regiao: e.target.value })} style={campo}>
              <option value="">Selecionar região</option>
              {REGIOES_FACE.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          {objeto?.tipo === "texto" && (
            <div>
              <span style={rotulo}>Conteúdo do texto</span>
              <input
                value={draft.texto}
                onChange={(e) => editar({ texto: e.target.value })}
                placeholder="Texto sobre o rosto"
                style={campo}
              />
            </div>
          )}

          <div>
            <span style={rotulo}>Observação da marcação</span>
            <textarea
              value={draft.observacao}
              onChange={(e) => editar({ observacao: e.target.value })}
              rows={compacto ? 3 : 4}
              placeholder="Ex.: queixa de linhas de expressão nesta região. Avaliar tratamento."
              style={{ ...campo, resize: "vertical", lineHeight: 1.45 }}
            />
          </div>

          <div>
            <span style={rotulo}>Cor</span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {CORES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => editar({ cor: c })}
                  style={{
                    width: 18, height: 18, borderRadius: 9, backgroundColor: c, cursor: "pointer",
                    border: draft.cor === c ? "2px solid #FFFFFF" : "1px solid #2B2B2B",
                  }}
                  aria-label={`Cor ${c}`}
                />
              ))}
            </div>
          </div>

          <div>
            <span style={rotulo}>Espessura</span>
            <div className="flex items-center gap-1">
              {ESPESSURAS.map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => editar({ espessura: v })}
                  style={{
                    width: 26, height: 22, borderRadius: 5, cursor: "pointer", fontSize: 10,
                    border: `1px solid ${draft.espessura === v ? "#C8A96A" : "#2B2B2B"}`,
                    background: draft.espessura === v ? "rgba(200,169,106,0.15)" : "transparent",
                    color: draft.espessura === v ? "#C8A96A" : "#8A8A8A",
                  }}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 pt-1 flex-wrap">
            <Botao variante="perigo" onClick={onExcluir}>Excluir</Botao>
            <div className="flex items-center gap-2">
              <Botao onClick={fechar}>Cancelar</Botao>
              <Botao variante="primario" onClick={salvar} disabled={!alterado}>Salvar</Botao>
            </div>
          </div>
        </>
      )}
    </div>
  );

  if (compacto) {
    return (
      <div
        style={{ position: "fixed", inset: 0, zIndex: 70, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "flex-end" }}
        onClick={fechar}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            width: "100%",
            maxHeight: "82vh",
            overflowY: "auto",
            background: "#141414",
            borderTop: "1px solid #2B2B2B",
            borderRadius: "14px 14px 0 0",
            padding: 16,
            paddingBottom: "calc(16px + env(safe-area-inset-bottom))",
          }}
        >
          {conteudo}
        </div>
      </div>
    );
  }

  // Desktop/tablet: cartão ancorado no objeto, sempre dentro da tela
  const largura = 288;
  const larguraTela = typeof window !== "undefined" ? window.innerWidth : 1280;
  const ancoraX = ancora?.x ?? larguraTela / 2;
  const ancoraY = ancora?.y ?? 200;
  const esquerda = Math.min(Math.max(12, ancoraX - largura / 2), Math.max(12, larguraTela - largura - 12));
  const acima = ancoraY > 400;
  const estiloAncora = acima
    ? { left: esquerda, top: Math.max(12, ancoraY - 14), transform: "translateY(-100%)" }
    : { left: esquerda, top: ancoraY + 18 };

  return (
    <>
      <div style={{ position: "fixed", inset: 0, zIndex: 45 }} onClick={fechar} />
      <div
        style={{
          position: "fixed",
          zIndex: 46,
          width: largura,
          maxHeight: "80vh",
          overflowY: "auto",
          background: "#161616",
          border: "1px solid #2B2B2B",
          borderRadius: 8,
          padding: 12,
          boxShadow: "0 16px 40px rgba(0,0,0,0.65)",
          ...estiloAncora,
        }}
      >
        {conteudo}
      </div>
    </>
  );
}