import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Loader2, Copy, ArrowRight, ShieldAlert } from "lucide-react";
import {
  normalizeName, normalizePhone, normalizeCpf, normalizeEmail, findDuplicateCandidates,
} from "@/lib/patientUtils";
import { usePermissions } from "@/lib/PermissionsContext";

// Comparação campo a campo para exibir diferenças
function DiffRow({ label, oficial, duplicado, onPick, fieldKey }) {
  const same = JSON.stringify(oficial || "") === JSON.stringify(duplicado || "");
  const oficialEmpty = !oficial || oficial === "" || oficial === "null";
  return (
    <tr style={{ borderBottom: "1px solid #1E1E1E" }}>
      <td style={{ padding: "10px 16px", fontSize: 12, color: "#666", textTransform: "uppercase", letterSpacing: "0.07em" }}>{label}</td>
      <td style={{ padding: "10px 16px", fontSize: 13, color: "#FFFFFF" }}>
        {oficialEmpty ? <span style={{ color: "#555", fontStyle: "italic" }}>vazio</span> : String(oficial)}
      </td>
      <td style={{ padding: "10px 16px", fontSize: 13, color: same ? "#B0B0B0" : "#fbbf24" }}>
        {!duplicado || duplicado === "" ? <span style={{ color: "#555", fontStyle: "italic" }}>vazio</span> : String(duplicado)}
      </td>
      <td style={{ padding: "10px 16px" }}>
        {!same && duplicado && (
          <button
            onClick={() => onPick(fieldKey)}
            title="Manter este valor do duplicado"
            style={{ background: "rgba(200,169,106,0.1)", border: "1px solid rgba(200,169,106,0.3)", color: "#C8A96A", borderRadius: 4, padding: "3px 8px", fontSize: 11, cursor: "pointer" }}
          >
            <Copy className="inline h-3 w-3 mr-1" /> usar
          </button>
        )}
      </td>
    </tr>
  );
}

export default function MesclarPacientes() {
  const { hasAction } = usePermissions();
  const canMerge = hasAction("mesclar_pacientes") || hasAction("gerenciar_usuarios");
  const [busca, setBusca] = useState("");
  const [idOficial, setIdOficial] = useState(null);
  const [idDuplicado, setIdDuplicado] = useState(null);
  const [camposEscolhidos, setCamposEscolhidos] = useState({});
  const [mesclando, setMesclando] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [erro, setErro] = useState("");

  const { data: patients = [], isLoading } = useQuery({
    queryKey: ["patients"],
    queryFn: () => base44.entities.Patient.list("-created_date", 1000),
  });

  // Detecta grupos de duplicidade automaticamente
  const gruposDuplicidade = useMemo(() => {
    const grupos = {};
    patients.forEach((p) => {
      const keys = [
        normalizeCpf(p.document_number) && normalizeCpf(p.document_number) !== "00000000000" ? "cpf:" + normalizeCpf(p.document_number) : null,
        normalizePhone(p.phone) && normalizePhone(p.phone).length >= 10 ? "phone:" + normalizePhone(p.phone) : null,
      ].filter(Boolean);
      keys.forEach((k) => {
        if (!grupos[k]) grupos[k] = new Set();
        grupos[k].add(p.id);
      });
      // nome exato
      const nm = normalizeName(p.full_name);
      if (nm.length >= 6) {
        if (!grupos["name:" + nm]) grupos["name:" + nm] = new Set();
        grupos["name:" + nm].add(p.id);
      }
    });
    const result = [];
    Object.values(grupos).forEach((ids) => {
      if (ids.size > 1) {
        const arr = Array.from(ids);
        const objs = arr.map((id) => patients.find((x) => x.id === id)).filter(Boolean);
        if (objs.length > 1) result.push(objs);
      }
    });
    // dedup grupos por id do primeiro
    const seen = new Set();
    return result.filter((g) => {
      const k = g.map((x) => x.id).sort().join(",");
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  }, [patients]);

  const oficial = patients.find((p) => p.id === idOficial);
  const duplicado = patients.find((p) => p.id === idDuplicado);

  const toggleCampo = (field) => {
    setCamposEscolhidos((p) => ({ ...p, [field]: !p[field] }));
  };

  const handleMesclar = async () => {
    setErro("");
    setResultado(null);
    if (!idOficial || !idDuplicado) {
      setErro("Selecione o paciente oficial e o duplicado.");
      return;
    }
    if (idOficial === idDuplicado) {
      setErro("Os dois pacientes selecionados são o mesmo registro.");
      return;
    }
    if (!window.confirm(
      `Confirmar mesclagem?\n\nO registro duplicado "${duplicado?.full_name}" será arquivado e TODOS os seus dados (tratamentos, prontuários, documentos, financeiro, agenda) serão migrados para o registro oficial "${oficial?.full_name}".\n\nEsta ação é irreversível e será registrada no log de auditoria.`
    )) return;

    setMesclando(true);
    try {
      const res = await base44.functions.invoke("mergePatients", {
        oficial_id: idOficial,
        duplicado_id: idDuplicado,
        campos_escolhidos: camposEscolhidos,
      });
      setResultado(res.data || res);
      setIdOficial(null);
      setIdDuplicado(null);
      setCamposEscolhidos({});
    } catch (err) {
      setErro(err?.message || "Erro ao mesclar pacientes.");
    } finally {
      setMesclando(false);
    }
  };

  if (!canMerge) {
    return (
      <div style={{ maxWidth: 480, margin: "80px auto", textAlign: "center", color: "#B0B0B0" }}>
        <ShieldAlert className="h-12 w-12 mx-auto mb-4" style={{ color: "#EF4444" }} />
        <h2 style={{ fontSize: 20, fontWeight: 500, color: "#FFF", marginBottom: 8 }}>Acesso Restrito</h2>
        <p style={{ fontSize: 14 }}>A mesclagem de pacientes é uma operação administrativa sensível (LGPD). Apenas administradores podem executá-la.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      <div>
        <h1 style={{ fontSize: 24, fontWeight: 600, color: "#FFF" }}>Mesclar Pacientes Duplicados</h1>
        <p style={{ fontSize: 13, color: "#666", marginTop: 4 }}>
          Ferramenta administrativa LGPD — mescla registros duplicados migrando todos os dados relacionados com segurança.
        </p>
      </div>

      {/* Alerta de LGPD */}
      <div style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 8, padding: "14px 18px", display: "flex", gap: 12, alignItems: "flex-start" }}>
        <AlertTriangle className="h-5 w-5 flex-shrink-0" style={{ color: "#EF4444", marginTop: 1 }} />
        <div style={{ fontSize: 13, color: "#B0B0B0", lineHeight: 1.6 }}>
          Esta operação migra prontuários, documentos, financeiro, agenda e simulações do paciente duplicado para o oficial,
          arquiva o duplicado (removendo dados pessoais sensíveis) e registra tudo no log de auditoria. <strong style={{ color: "#FFF" }}>Irreversível.</strong>
        </div>
      </div>

      {/* Grupos detectados */}
      {gruposDuplicidade.length > 0 && (
        <div>
          <h3 style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", color: "#666", marginBottom: 10 }}>
            Possíveis duplicidades detectadas ({gruposDuplicidade.length})
          </h3>
          <div className="space-y-2">
            {gruposDuplicidade.map((grupo, gi) => (
              <div key={gi} style={{ background: "#1A1A1A", border: "1px solid #2B2B2B", borderRadius: 8, padding: 14 }}>
                {grupo.map((p) => (
                  <div key={p.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 0", fontSize: 13 }}>
                    <span style={{ color: "#FFF" }}>{p.full_name}</span>
                    <span style={{ color: "#666", fontSize: 12 }}>{p.phone} · {p.document_number || "sem CPF"} · {new Date(p.created_date).toLocaleDateString("pt-BR")}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Seleção */}
      <div>
        <Label className="text-gray-300 text-sm">Buscar paciente</Label>
        <Input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Nome ou telefone..." className="bg-[#121212] border-[#2B2B2B] text-white mt-1" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Lista de seleção */}
        <div>
          <h3 style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", color: "#C8A96A", marginBottom: 8 }}>Selecione o oficial e o duplicado</h3>
          <div style={{ maxHeight: 380, overflowY: "auto", border: "1px solid #2B2B2B", borderRadius: 8 }}>
            {patients
              .filter((p) => {
                if (!busca) return true;
                const q = busca.toLowerCase();
                return p.full_name?.toLowerCase().includes(q) || p.phone?.includes(q);
              })
              .map((p) => {
                const isO = idOficial === p.id;
                const isD = idDuplicado === p.id;
                return (
                  <div key={p.id} style={{ padding: "10px 14px", borderBottom: "1px solid #1E1E1E", display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 500, color: "#FFF", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.full_name}</p>
                      <p style={{ fontSize: 11, color: "#666" }}>{p.phone} · {p.document_number || "sem CPF"}</p>
                    </div>
                    <button
                      onClick={() => setIdOficial(p.id)}
                      style={{
                        padding: "3px 10px", fontSize: 11, borderRadius: 4, cursor: "pointer",
                        background: isO ? "rgba(74,222,128,0.15)" : "transparent",
                        border: isO ? "1px solid rgba(74,222,128,0.4)" : "1px solid #2B2B2B",
                        color: isO ? "#4ADE80" : "#888",
                      }}
                    >Oficial</button>
                    <button
                      onClick={() => setIdDuplicado(p.id)}
                      style={{
                        padding: "3px 10px", fontSize: 11, borderRadius: 4, cursor: "pointer",
                        background: isD ? "rgba(239,68,68,0.15)" : "transparent",
                        border: isD ? "1px solid rgba(239,68,68,0.4)" : "1px solid #2B2B2B",
                        color: isD ? "#EF4444" : "#888",
                      }}
                    >Duplicado</button>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Comparação */}
        <div>
          <h3 style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", color: "#C8A96A", marginBottom: 8 }}>Comparação dos registros</h3>
          {oficial && duplicado ? (
            <div style={{ border: "1px solid #2B2B2B", borderRadius: 8, overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #2B2B2B" }}>
                    <th style={{ padding: "10px 16px", fontSize: 11, textTransform: "uppercase", color: "#666", textAlign: "left" }}>Campo</th>
                    <th style={{ padding: "10px 16px", fontSize: 11, color: "#4ADE80", textAlign: "left" }}>Oficial</th>
                    <th style={{ padding: "10px 16px", fontSize: 11, color: "#EF4444", textAlign: "left" }}>Duplicado</th>
                    <th style={{ padding: "10px 16px" }}></th>
                  </tr>
                </thead>
                <tbody>
                  <DiffRow label="Nome" fieldKey="full_name" oficial={oficial.full_name} duplicado={duplicado.full_name} onPick={toggleCampo} />
                  <DiffRow label="CPF" fieldKey="document_number" oficial={oficial.document_number} duplicado={duplicado.document_number} onPick={toggleCampo} />
                  <DiffRow label="RG" fieldKey="rg" oficial={oficial.rg} duplicado={duplicado.rg} onPick={toggleCampo} />
                  <DiffRow label="Nascimento" fieldKey="birth_date" oficial={oficial.birth_date} duplicado={duplicado.birth_date} onPick={toggleCampo} />
                  <DiffRow label="Telefone" fieldKey="phone" oficial={oficial.phone} duplicado={duplicado.phone} onPick={toggleCampo} />
                  <DiffRow label="WhatsApp" fieldKey="whatsapp" oficial={oficial.whatsapp} duplicado={duplicado.whatsapp} onPick={toggleCampo} />
                  <DiffRow label="E-mail" fieldKey="email" oficial={oficial.email} duplicado={duplicado.email} onPick={toggleCampo} />
                  <DiffRow label="Profissão" fieldKey="profession" oficial={oficial.profession} duplicado={duplicado.profession} onPick={toggleCampo} />
                  <DiffRow label="Endereço" fieldKey="address" oficial={JSON.stringify(oficial.address)} duplicado={JSON.stringify(duplicado.address)} onPick={toggleCampo} />
                  <DiffRow label="Resp. Legal" fieldKey="responsavel_legal" oficial={JSON.stringify(oficial.responsavel_legal)} duplicado={JSON.stringify(duplicado.responsavel_legal)} onPick={toggleCampo} />
                  <DiffRow label="Observações" fieldKey="notes" oficial={oficial.notes} duplicado={duplicado.notes} onPick={toggleCampo} />
                  <DiffRow label="Origem" fieldKey="source" oficial={oficial.source} duplicado={duplicado.source} onPick={toggleCampo} />
                </tbody>
              </table>
              <div style={{ padding: 12, borderTop: "1px solid #2B2B2B" }}>
                <p style={{ fontSize: 11, color: "#666" }}>Campos marcados com "usar" serão copiados do duplicado para o oficial (apenas se preenchidos).</p>
              </div>
            </div>
          ) : (
            <div style={{ border: "1px dashed #2B2B2B", borderRadius: 8, padding: 40, textAlign: "center", color: "#555", fontSize: 13 }}>
              Selecione um paciente como <span style={{ color: "#4ADE80" }}>Oficial</span> e outro como <span style={{ color: "#EF4444" }}>Duplicado</span> para comparar.
            </div>
          )}
        </div>
      </div>

      {erro && (
        <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 6, padding: "10px 14px", color: "#f87171", fontSize: 13 }}>
          ⚠️ {erro}
        </div>
      )}

      {resultado && (
        <div style={{ background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.25)", borderRadius: 6, padding: 14 }}>
          <p style={{ color: "#4ADE80", fontWeight: 500, fontSize: 14, marginBottom: 8 }}>✓ Mesclagem concluída</p>
          <pre style={{ fontSize: 11, color: "#B0B0B0", whiteSpace: "pre-wrap", maxHeight: 200, overflow: "auto" }}>
            {JSON.stringify(resultado, null, 2)}
          </pre>
        </div>
      )}

      {/* Ação */}
      <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: 12, borderTop: "1px solid #1E1E1E" }}>
        <Button
          onClick={handleMesclar}
          disabled={!oficial || !duplicado || mesclando}
          className="bg-[#C8A96A] hover:bg-[#D4BC88] text-black"
          style={{ minWidth: 220 }}
        >
          {mesclando ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Mesclando...</> : <><ArrowRight className="h-4 w-4 mr-2" /> Mesclar e Arquivar Duplicado</>}
        </Button>
      </div>
    </div>
  );
}