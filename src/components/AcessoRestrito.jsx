import React from "react";
import { Lock } from "lucide-react";

/** Tela exibida quando o perfil do usuário não tem acesso ao módulo financeiro. */
export default function AcessoRestrito({ titulo = "Acesso Restrito", texto = "Este módulo está disponível apenas para os administradores da clínica." }) {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center px-6">
        <Lock className="mx-auto mb-4" style={{ width: 40, height: 40, color: "#3A3A3A" }} />
        <h2 style={{ fontSize: 18, color: "#FFFFFF", fontWeight: 500, margin: 0 }}>{titulo}</h2>
        <p style={{ fontSize: 13, color: "#666666", marginTop: 8, maxWidth: 360 }}>{texto}</p>
      </div>
    </div>
  );
}