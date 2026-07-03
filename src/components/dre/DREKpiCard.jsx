import React from "react";

export default function DREKpiCard({ label, value, accent, sublabel, icon: Icon }) {
  return (
    <div
      style={{
        backgroundColor: "#1A1A1A",
        border: "1px solid #2B2B2B",
        borderRadius: 8,
        padding: "16px 20px",
      }}
    >
      <div className="flex items-center justify-between" style={{ marginBottom: 6 }}>
        <p
          style={{
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "#666666",
          }}
        >
          {label}
        </p>
        {Icon && <Icon style={{ width: 13, height: 13, color: "#3A3A3A" }} />}
      </div>
      <p
        style={{
          fontSize: 20,
          fontWeight: 600,
          letterSpacing: "-0.02em",
          color: accent || "#FFFFFF",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {value}
      </p>
      {sublabel && (
        <p style={{ fontSize: 11, color: "#555555", marginTop: 4 }}>{sublabel}</p>
      )}
    </div>
  );
}