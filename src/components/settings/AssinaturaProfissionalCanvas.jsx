import React, { useRef, useState, useEffect } from "react";
import { PenLine, RotateCcw, Save } from "lucide-react";

/**
 * Canvas para a profissional desenhar a própria assinatura (toque/caneta/mouse)
 * e salvá-la como PNG transparente via UploadFile.
 */
export default function AssinaturaProfissionalCanvas({ onSaved, uploading }) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [lastPos, setLastPos] = useState({ x: 0, y: 0 });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    initCanvas();
  }, []);

  function initCanvas() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "#111111";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }

  function getPos(e, canvas) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if (e.touches) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }

  function startDraw(e) {
    e.preventDefault();
    const canvas = canvasRef.current;
    const pos = getPos(e, canvas);
    setIsDrawing(true);
    setLastPos(pos);
    setHasSignature(true);
  }

  function draw(e) {
    e.preventDefault();
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const pos = getPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(lastPos.x, lastPos.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    setLastPos(pos);
  }

  function stopDraw(e) {
    e?.preventDefault();
    setIsDrawing(false);
  }

  function clearCanvas() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  }

  async function handleSalvar() {
    if (!hasSignature) return;
    setSaving(true);
    try {
      const canvas = canvasRef.current;
      const dataUrl = canvas.toDataURL("image/png");
      const blob = await fetch(dataUrl).then((r) => r.blob());
      const file = new File([blob], "assinatura_profissional.png", { type: "image/png" });
      await onSaved(file);
    } catch (e) {
      console.error("Erro ao salvar assinatura:", e);
    } finally {
      setSaving(false);
    }
  }

  const busy = saving || uploading;

  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <p style={{ fontSize: 12, color: "#B0B0B0", fontWeight: 500, display: "flex", alignItems: "center", gap: 6 }}>
          <PenLine style={{ width: 13, height: 13 }} /> Assinar no tablet/celular
        </p>
        <button
          onClick={clearCanvas}
          disabled={!hasSignature}
          style={{
            background: "none", border: "none", cursor: hasSignature ? "pointer" : "default",
            display: "flex", alignItems: "center", gap: 4, color: "#B0B0B0",
            fontSize: 12, opacity: hasSignature ? 1 : 0.4,
          }}
        >
          <RotateCcw style={{ width: 12, height: 12 }} /> Limpar
        </button>
      </div>
      <div
        style={{
          border: `1px dashed ${hasSignature ? "#C8A96A" : "#2B2B2B"}`,
          borderRadius: 8, overflow: "hidden", touchAction: "none",
          backgroundColor: "#fafafa",
        }}
      >
        <canvas
          ref={canvasRef}
          width={580}
          height={160}
          style={{ width: "100%", height: 140, cursor: "crosshair", display: "block", background: "transparent" }}
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={stopDraw}
          onMouseLeave={stopDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={stopDraw}
        />
      </div>
      {!hasSignature && (
        <p style={{ fontSize: 11, color: "#666666", marginTop: 4 }}>
          Desenhe a assinatura acima com o dedo, caneta digital ou mouse.
        </p>
      )}
      <button
        onClick={handleSalvar}
        disabled={!hasSignature || busy}
        style={{
          marginTop: 10, display: "inline-flex", alignItems: "center", gap: 8, cursor: !hasSignature || busy ? "not-allowed" : "pointer",
          backgroundColor: "#C8A96A", color: "#000", border: "none", borderRadius: 6,
          padding: "9px 18px", fontSize: 13, fontWeight: 600,
          opacity: hasSignature && !busy ? 1 : 0.4,
        }}
      >
        <Save style={{ width: 14, height: 14 }} />
        {busy ? "Salvando..." : "Salvar assinatura"}
      </button>
    </div>
  );
}