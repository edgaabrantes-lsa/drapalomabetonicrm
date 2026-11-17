import React from "react";
import { FERRAMENTAS, CORES, ESPESSURAS } from "@/lib/mapaFacial";

const btn = (ativo) => ({
  padding: "6px 11px",
  fontSize: 11,
  fontWeight: 600,
  borderRadius: 5,
  cursor: "pointer",
  border: `1px solid ${ativo ? "#C8A96A" : "#2B2B2B"}`,
  background: ativo ? "rgba(200,169,106,0.15)" : "transparent",
  color: ativo ? "#C8A96A" : "#B0B0B0",
  whiteSpace: "nowrap",
  flex: "0 0 auto",
});

const linha = {
  display: "flex",
  alignItems: "center",
  flexWrap: "wrap",
  gap: 6,
  paddingBottom: 2,
};

export default function MapaToolbar({
  ferramenta, setFerramenta, cor, setCor, espessura, setEspessura,
  etapa, setEtapa, zoom, setZoom, podeDesfazer, podeRefazer, onDesfazer, onRefazer, readOnly,
}) {
  if (readOnly) return null;
  return (
    <div className="space-y-2" style={{ borderBottom: "1px solid #2B2B2B", paddingBottom: 10 }}>
      <div style={linha}>
        {FERRAMENTAS.map((f) => (
          <button key={f.id} type="button" onClick={() => setFerramenta(f.id)} style={btn(ferramenta === f.id)}>
            {f.label}
          </button>
        ))}
      </div>

      <div style={linha}>
        <div style={{ display: "flex", alignItems: "center", gap: 4, flex: "0 0 auto" }}>
          {CORES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCor(c)}
              style={{
                width: 20, height: 20, borderRadius: 10, backgroundColor: c, cursor: "pointer",
                border: cor === c ? "2px solid #FFFFFF" : "1px solid #2B2B2B", flex: "0 0 auto",
              }}
              aria-label={`Cor ${c}`}
            />
          ))}
        </div>

        <div style={{ width: 1, height: 18, background: "#2B2B2B", flex: "0 0 auto" }} />

        <div style={{ display: "flex", alignItems: "center", gap: 3, flex: "0 0 auto" }}>
          {ESPESSURAS.map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setEspessura(v)}
              style={{ ...btn(espessura === v), padding: "4px 7px", fontSize: 10 }}
              title={`Espessura ${v}`}
            >
              {v}
            </button>
          ))}
        </div>

        <div style={{ width: 1, height: 18, background: "#2B2B2B", flex: "0 0 auto" }} />

        <div style={{ display: "flex", gap: 3, flex: "0 0 auto" }}>
          {["planejado", "realizado"].map((e) => (
            <button key={e} type="button" onClick={() => setEtapa(e)} style={btn(etapa === e)}>
              {e === "planejado" ? "Planejado" : "Realizado"}
            </button>
          ))}
        </div>

        <div style={{ width: 1, height: 18, background: "#2B2B2B", flex: "0 0 auto" }} />

        <div style={{ display: "flex", gap: 3, flex: "0 0 auto" }}>
          <button type="button" onClick={onDesfazer} disabled={!podeDesfazer} style={{ ...btn(false), opacity: podeDesfazer ? 1 : 0.4 }}>
            Desfazer
          </button>
          <button type="button" onClick={onRefazer} disabled={!podeRefazer} style={{ ...btn(false), opacity: podeRefazer ? 1 : 0.4 }}>
            Refazer
          </button>
        </div>

        <div style={{ width: 1, height: 18, background: "#2B2B2B", flex: "0 0 auto" }} />

        <div style={{ display: "flex", alignItems: "center", gap: 3, flex: "0 0 auto" }}>
          <button type="button" onClick={() => setZoom((z) => Math.max(1, +(z - 0.25).toFixed(2)))} style={btn(false)}>−</button>
          <span style={{ fontSize: 11, color: "#666666", minWidth: 36, textAlign: "center" }}>{Math.round(zoom * 100)}%</span>
          <button type="button" onClick={() => setZoom((z) => Math.min(3, +(z + 0.25).toFixed(2)))} style={btn(false)}>+</button>
        </div>
      </div>
    </div>
  );
}