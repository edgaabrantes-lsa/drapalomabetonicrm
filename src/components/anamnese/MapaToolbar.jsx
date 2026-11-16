import React from "react";
import { FERRAMENTAS, CORES, REGIOES_FACE } from "@/lib/mapaFacial";
import { Input } from "@/components/ui/input";

const btn = (ativo) => ({
  padding: "5px 10px",
  fontSize: 11,
  fontWeight: 600,
  borderRadius: 5,
  cursor: "pointer",
  border: `1px solid ${ativo ? "#C8A96A" : "#2B2B2B"}`,
  background: ativo ? "rgba(200,169,106,0.15)" : "transparent",
  color: ativo ? "#C8A96A" : "#B0B0B0",
  whiteSpace: "nowrap",
});

export default function MapaToolbar({
  ferramenta, setFerramenta, cor, setCor, etapa, setEtapa,
  zoom, setZoom, podeDesfazer, podeRefazer, onDesfazer, onRefazer, readOnly,
}) {
  if (readOnly) return null;
  return (
    <div className="space-y-2" style={{ borderBottom: "1px solid #2B2B2B", paddingBottom: 10 }}>
      <div className="flex flex-wrap gap-1.5">
        {FERRAMENTAS.map((f) => (
          <button key={f.id} type="button" onClick={() => setFerramenta(f.id)} style={btn(ferramenta === f.id)}>
            {f.label}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1">
          {CORES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCor(c)}
              style={{
                width: 18, height: 18, borderRadius: 9, backgroundColor: c, cursor: "pointer",
                border: cor === c ? "2px solid #FFFFFF" : "1px solid #2B2B2B",
              }}
              aria-label={`Cor ${c}`}
            />
          ))}
        </div>
        <div className="flex gap-1">
          {["planejado", "realizado"].map((e) => (
            <button key={e} type="button" onClick={() => setEtapa(e)} style={btn(etapa === e)}>
              {e === "planejado" ? "Planejado" : "Realizado"}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <button type="button" onClick={onDesfazer} disabled={!podeDesfazer} style={{ ...btn(false), opacity: podeDesfazer ? 1 : 0.4 }}>Desfazer</button>
          <button type="button" onClick={onRefazer} disabled={!podeRefazer} style={{ ...btn(false), opacity: podeRefazer ? 1 : 0.4 }}>Refazer</button>
        </div>
        <div className="flex items-center gap-1">
          <button type="button" onClick={() => setZoom((z) => Math.max(1, +(z - 0.25).toFixed(2)))} style={btn(false)}>−</button>
          <span style={{ fontSize: 11, color: "#666666", minWidth: 34, textAlign: "center" }}>{Math.round(zoom * 100)}%</span>
          <button type="button" onClick={() => setZoom((z) => Math.min(3, +(z + 0.25).toFixed(2)))} style={btn(false)}>+</button>
        </div>
      </div>
    </div>
  );
}

export function ObjetoPanel({ objeto, onChange, onDelete, procedimentos = [] }) {
  if (!objeto) {
    return (
      <p style={{ fontSize: 11, color: "#555555" }}>
        Selecione uma marcação no mapa para definir procedimento, região e observação.
      </p>
    );
  }
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.07em", color: "#666666" }}>
          Marcação — {objeto.tipo}
        </p>
        <button type="button" onClick={onDelete} style={{ ...btn(false), color: "#EF4444", borderColor: "rgba(239,68,68,0.3)" }}>
          Apagar
        </button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <select
          value={objeto.procedimento || ""}
          onChange={(e) => onChange({ procedimento: e.target.value })}
          style={{ background: "#121212", border: "1px solid #2B2B2B", borderRadius: 5, color: "#FFFFFF", fontSize: 12, padding: "6px 8px" }}
        >
          <option value="">Procedimento</option>
          {procedimentos.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        <select
          value={objeto.regiao || ""}
          onChange={(e) => onChange({ regiao: e.target.value })}
          style={{ background: "#121212", border: "1px solid #2B2B2B", borderRadius: 5, color: "#FFFFFF", fontSize: 12, padding: "6px 8px" }}
        >
          <option value="">Região facial</option>
          {REGIOES_FACE.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
        <Input
          value={objeto.quantidade || ""}
          onChange={(e) => onChange({ quantidade: e.target.value })}
          placeholder="Qtd. planejada"
          className="bg-[#121212] border-[#2B2B2B] text-white"
          style={{ height: 30, fontSize: 12 }}
        />
        <Input
          value={objeto.unidade || ""}
          onChange={(e) => onChange({ unidade: e.target.value })}
          placeholder="Unidade (U, ml...)"
          className="bg-[#121212] border-[#2B2B2B] text-white"
          style={{ height: 30, fontSize: 12 }}
        />
      </div>
      <Input
        value={objeto.observacao || ""}
        onChange={(e) => onChange({ observacao: e.target.value })}
        placeholder="Observação"
        className="bg-[#121212] border-[#2B2B2B] text-white"
        style={{ height: 30, fontSize: 12 }}
      />
    </div>
  );
}