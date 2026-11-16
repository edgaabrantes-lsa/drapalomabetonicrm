import React from "react";
import AnamnesePainel from "./AnamnesePainel";

/** Aba "Anamnese" do dossiê da paciente — usa os mesmos registros do módulo principal. */
export default function DossieAnamnese({ patient, currentUser }) {
  if (!patient?.id) return null;
  return (
    <div style={{ backgroundColor: "#141414", border: "1px solid #2B2B2B", borderRadius: 8, padding: 16 }}>
      <p style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", color: "#666666", marginBottom: 12 }}>
        Anamnese e mapa facial
      </p>
      <AnamnesePainel patient={patient} currentUser={currentUser} compacto />
    </div>
  );
}