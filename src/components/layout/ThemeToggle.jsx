import React from "react";
import { Switch } from "@/components/ui/switch";
import { useTheme } from "@/lib/theme";

export default function ThemeToggle({ compact = false }) {
  const { theme, toggleTheme } = useTheme();
  const diurno = theme === "light";

  if (compact) {
    return (
      <div className="flex justify-center" style={{ padding: "10px 0" }}>
        <Switch
          checked={diurno}
          onCheckedChange={toggleTheme}
          aria-label="Alternar modo diurno e noturno"
          className="border-white/30 data-[state=checked]:bg-[#F7F2ED] data-[state=unchecked]:bg-white/20"
        />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-2" style={{ padding: "10px 12px" }}>
      <div className="flex items-center gap-2 min-w-0">
        <span style={{ fontSize: 12, lineHeight: 1, color: "rgba(255,255,255,0.75)" }}>
          {diurno ? "☀" : "☾"}
        </span>
        <span
          style={{
            fontSize: 12,
            color: "rgba(255,255,255,0.78)",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {diurno ? "Modo diurno" : "Modo noturno"}
        </span>
      </div>
      <Switch
        checked={diurno}
        onCheckedChange={toggleTheme}
        aria-label="Alternar modo diurno e noturno"
        className="border-white/30 data-[state=checked]:bg-[#F7F2ED] data-[state=unchecked]:bg-white/20"
      />
    </div>
  );
}