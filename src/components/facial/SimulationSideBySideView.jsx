import React from "react";

export default function SimulationSideBySideView({ before, after }) {
  return (
    <div className="grid grid-cols-2 gap-2 w-full">
      <div className="relative rounded-xl overflow-hidden bg-black">
        <img src={before} alt="Antes"
          style={{ display: "block", width: "100%", height: "auto", objectFit: "contain" }}
        />
        <div className="absolute bottom-2 left-2 text-xs font-semibold text-white px-2 py-0.5 rounded"
          style={{ background: "rgba(0,0,0,0.65)" }}>ANTES</div>
      </div>
      <div className="relative rounded-xl overflow-hidden bg-black">
        <img src={after} alt="Depois"
          style={{ display: "block", width: "100%", height: "auto", objectFit: "contain" }}
        />
        <div className="absolute bottom-2 right-2 text-xs font-semibold text-white px-2 py-0.5 rounded"
          style={{ background: "rgba(0,0,0,0.65)" }}>DEPOIS</div>
      </div>
    </div>
  );
}