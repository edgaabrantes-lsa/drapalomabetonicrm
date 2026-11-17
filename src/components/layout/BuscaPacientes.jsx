import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";

export default function BuscaPacientes({ variant = "desktop" }) {
  const navigate = useNavigate();
  const boxRef = useRef(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const page = await base44.entities.Patient.filter(
          {
            $or: [
              { full_name: { $regex: q, $options: "i" } },
              { phone: { $regex: q } },
              { whatsapp: { $regex: q } },
              { document_number: { $regex: q } },
            ],
          },
          { limit: 8, sort: "full_name" }
        );
        setResults(page.items || []);
      } catch (error) {
        setResults([]);
      }
      setLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const handleOutside = (event) => {
      if (boxRef.current && !boxRef.current.contains(event.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  const openPatient = (patient) => {
    setOpen(false);
    setQuery("");
    setResults([]);
    navigate(`/DossiePatient?patient_id=${patient.id}`);
  };

  const handleKeyDown = (event) => {
    if (event.key === "Escape") setOpen(false);
    if (event.key === "Enter" && results.length > 0) openPatient(results[0]);
  };

  const showPanel = open && query.trim().length >= 2;

  return (
    <div ref={boxRef} className="relative" style={{ width: variant === "mobile" ? "100%" : 280 }}>
      <input
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder="Buscar paciente por nome, telefone ou CPF"
        aria-label="Buscar paciente"
        style={{
          width: "100%",
          height: 34,
          padding: "0 12px",
          borderRadius: 6,
          fontSize: 13,
        }}
      />

      {showPanel && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            right: 0,
            zIndex: 60,
            backgroundColor: "#1A1A1A",
            border: "1px solid #2B2B2B",
            borderRadius: 8,
            overflow: "hidden",
            boxShadow: "0 12px 32px rgba(0,0,0,0.45)",
            maxHeight: 320,
            overflowY: "auto",
          }}
        >
          {loading && (
            <p style={{ margin: 0, padding: "12px 14px", fontSize: 12.5, color: "#666666" }}>
              Buscando...
            </p>
          )}

          {!loading && results.length === 0 && (
            <p style={{ margin: 0, padding: "12px 14px", fontSize: 12.5, color: "#666666" }}>
              Nenhum paciente encontrado
            </p>
          )}

          {!loading &&
            results.map((patient) => (
              <button
                key={patient.id}
                type="button"
                onClick={() => openPatient(patient)}
                style={{
                  display: "block",
                  width: "100%",
                  textAlign: "left",
                  padding: "10px 14px",
                  background: "transparent",
                  border: "none",
                  borderBottom: "1px solid #242424",
                  cursor: "pointer",
                }}
                onMouseEnter={(event) => {
                  event.currentTarget.style.backgroundColor = "rgba(200,169,106,0.08)";
                }}
                onMouseLeave={(event) => {
                  event.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                <span style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#FFFFFF" }}>
                  {patient.full_name}
                </span>
                <span style={{ display: "block", fontSize: 11.5, color: "#777777", marginTop: 2 }}>
                  {patient.phone || patient.whatsapp || patient.document_number || "Sem telefone cadastrado"}
                </span>
              </button>
            ))}
        </div>
      )}
    </div>
  );
}