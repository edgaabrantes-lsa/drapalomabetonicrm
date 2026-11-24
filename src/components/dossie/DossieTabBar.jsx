import React, { useEffect, useRef, useState } from "react";
import { T } from "@/lib/designTokens";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const DRAG_THRESHOLD = 6;

export default function DossieTabBar({ tabs, activeTab, onChange }) {
  const scrollRef = useRef(null);
  const dragRef = useRef({ active: false, startX: 0, startLeft: 0, moved: false });
  const [dragging, setDragging] = useState(false);

  // Arraste horizontal com o mouse (funciona também em cima das abas)
  useEffect(() => {
    const onMove = (e) => {
      const d = dragRef.current;
      if (!d.active) return;
      const dx = e.clientX - d.startX;
      if (Math.abs(dx) > DRAG_THRESHOLD) d.moved = true;
      const el = scrollRef.current;
      if (el) el.scrollLeft = d.startLeft - dx;
    };
    const onUp = () => {
      if (!dragRef.current.active) return;
      dragRef.current.active = false;
      setDragging(false);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, []);

  const handlePointerDown = (e) => {
    if (e.pointerType === "touch") return; // mantém a rolagem nativa no celular
    if (e.button !== 0) return;
    const el = scrollRef.current;
    if (!el || el.scrollWidth <= el.clientWidth) return;
    dragRef.current = {
      active: true,
      startX: e.clientX,
      startLeft: el.scrollLeft,
      moved: false,
    };
    setDragging(true);
  };

  // Evita que a aba seja selecionada sem querer ao final de um arraste
  const handleClickCapture = (e) => {
    if (dragRef.current.moved) {
      e.stopPropagation();
      e.preventDefault();
      dragRef.current.moved = false;
    }
  };

  // Mantém a aba ativa visível na barra
  useEffect(() => {
    const btn = scrollRef.current?.querySelector(`[data-tab="${activeTab}"]`);
    btn?.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
  }, [activeTab]);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "stretch",
        backgroundColor: T.bgSecondary,
        borderBottom: `1px solid ${T.border}`,
        flexShrink: 0,
      }}
    >
      <div
        ref={scrollRef}
        onPointerDown={handlePointerDown}
        onClickCapture={handleClickCapture}
        className="scrollbar-hide"
        style={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          overflowX: "auto",
          WebkitOverflowScrolling: "touch",
          cursor: dragging ? "grabbing" : "grab",
          userSelect: dragging ? "none" : "auto",
        }}
      >
        <div style={{ display: "flex", padding: "0 8px", minWidth: "max-content" }}>
          {tabs.map((aba) => {
            const isActive = activeTab === aba.id;
            return (
              <button
                key={aba.id}
                data-tab={aba.id}
                onClick={() => onChange(aba.id)}
                style={{
                  fontFamily: T.font,
                  fontSize: 12,
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? T.textPrimary : T.textMuted,
                  padding: "10px 12px",
                  border: "none",
                  borderBottom: isActive ? `2px solid ${T.gold}` : "2px solid transparent",
                  backgroundColor: "transparent",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  transition: "all 0.15s",
                }}
              >
                {aba.label}
              </button>
            );
          })}
        </div>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            title="Ver todas as abas"
            style={{
              flexShrink: 0,
              fontFamily: T.font,
              fontSize: 11,
              fontWeight: 500,
              color: T.textSecondary,
              background: "transparent",
              border: "none",
              borderLeft: `1px solid ${T.border}`,
              padding: "0 12px",
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            Todas ▾
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          style={{
            backgroundColor: T.card,
            borderColor: T.border,
            maxHeight: 320,
            overflowY: "auto",
            minWidth: 200,
          }}
        >
          {tabs.map((aba) => (
            <DropdownMenuItem
              key={aba.id}
              onSelect={() => onChange(aba.id)}
              className="cursor-pointer data-[highlighted]:bg-[#C8A96A] data-[highlighted]:!text-black focus:bg-[#C8A96A] focus:!text-black"
              style={{
                fontFamily: T.font,
                fontSize: 13,
                color: activeTab === aba.id ? T.gold : T.textSecondary,
                fontWeight: activeTab === aba.id ? 600 : 400,
              }}
            >
              {aba.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}