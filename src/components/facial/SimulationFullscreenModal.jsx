import React, { useEffect } from "react";
import { X } from "lucide-react";

export default function SimulationFullscreenModal({ image, onClose }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.95)" }}
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center z-10"
        style={{ background: "rgba(255,255,255,0.1)", color: "#fff" }}
      >
        <X className="h-5 w-5" />
      </button>
      <img
        src={image}
        alt="Imagem completa"
        style={{ maxWidth: "95vw", maxHeight: "95vh", objectFit: "contain", borderRadius: 8 }}
        onClick={e => e.stopPropagation()}
        draggable={false}
      />
    </div>
  );
}