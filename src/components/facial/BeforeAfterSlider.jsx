import React, { useState, useRef, useEffect } from "react";

export default function BeforeAfterSlider({ beforeUrl, afterUrl }) {
  const [position, setPosition] = useState(50);
  const [dragging, setDragging] = useState(false);
  const containerRef = useRef(null);

  const updatePosition = (clientX) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    setPosition((x / rect.width) * 100);
  };

  const onMouseMove = (e) => { if (dragging) updatePosition(e.clientX); };
  const onTouchMove = (e) => { if (dragging) updatePosition(e.touches[0].clientX); };
  const stopDrag = () => setDragging(false);

  useEffect(() => {
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", stopDrag);
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", stopDrag);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", stopDrag);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", stopDrag);
    };
  });

  return (
    <div
      ref={containerRef}
      className="relative select-none rounded-2xl overflow-hidden cursor-col-resize"
      style={{ userSelect: "none" }}
      onMouseDown={(e) => { setDragging(true); updatePosition(e.clientX); }}
      onTouchStart={(e) => { setDragging(true); updatePosition(e.touches[0].clientX); }}
    >
      {/* AFTER (base layer) */}
      <img
        src={afterUrl}
        alt="Depois"
        className="w-full block object-contain"
        draggable={false}
        style={{ maxHeight: 520 }}
      />

      {/* BEFORE (clipped overlay) */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ width: `${position}%` }}
      >
        <img
          src={beforeUrl}
          alt="Antes"
          className="object-contain"
          draggable={false}
          style={{
            position: "absolute",
            top: 0, left: 0,
            width: `${100 / (position / 100)}%`,
            maxWidth: "none",
            maxHeight: 520,
            height: "100%",
          }}
        />
      </div>

      {/* Labels */}
      <div className="absolute top-4 left-4 bg-black/70 text-white text-xs px-3 py-1 rounded-full font-medium tracking-wide">
        ANTES
      </div>
      <div className="absolute top-4 right-4 bg-[#c9a55c]/90 text-black text-xs px-3 py-1 rounded-full font-medium tracking-wide">
        DEPOIS
      </div>

      {/* Divider line */}
      <div
        className="absolute top-0 bottom-0 w-0.5 bg-white/90 shadow-lg"
        style={{ left: `${position}%`, transform: "translateX(-50%)" }}
      >
        {/* Handle */}
        <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-white shadow-xl flex items-center justify-center border-2 border-[#c9a55c]">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M6 5L2 9L6 13M12 5L16 9L12 13" stroke="#c9a55c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>
    </div>
  );
}