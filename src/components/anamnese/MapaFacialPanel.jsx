import React, { useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import MapaFacialEditor from "./MapaFacialEditor";
import MapaToolbar, { ObjetoPanel } from "./MapaToolbar";
import { PROCEDIMENTOS_PADRAO } from "@/lib/mapaFacial";

/**
 * Painel do mapa facial: barra de ferramentas, editor e propriedades do objeto.
 * Recebe e devolve { objetos, imagem_file_uri } — coordenadas sempre normalizadas.
 */
export default function MapaFacialPanel({ valor = {}, onChange, readOnly }) {
  const [ferramenta, setFerramenta] = useState("ponto");
  const [cor, setCor] = useState("#C8A96A");
  const [etapa, setEtapa] = useState("planejado");
  const [zoom, setZoom] = useState(1);
  const [selecionadoId, setSelecionadoId] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const historico = useRef([]);
  const refazer = useRef([]);
  const [tick, setTick] = useState(0);

  const { data: procedures = [] } = useQuery({
    queryKey: ["procedures"],
    queryFn: () => base44.entities.Procedure.list(),
  });

  const procedimentos = Array.from(new Set([
    ...PROCEDIMENTOS_PADRAO,
    ...procedures.map((p) => p.name).filter(Boolean),
  ]));

  const objetos = valor.objetos || [];
  const selecionado = objetos.find((o) => o.id === selecionadoId) || null;

  // Agrupa alterações contínuas (arraste, traço) em uma única etapa de desfazer
  const rajada = useRef({ at: 0 });
  const aplicar = (novos) => {
    if (readOnly) return;
    const agora = Date.now();
    if (agora - rajada.current.at > 800) {
      historico.current = [...historico.current, objetos].slice(-40);
      refazer.current = [];
      setTick((t) => t + 1);
    }
    rajada.current.at = agora;
    onChange({ ...valor, objetos: novos });
  };

  const desfazer = () => {
    if (!historico.current.length) return;
    const anterior = historico.current[historico.current.length - 1];
    historico.current = historico.current.slice(0, -1);
    refazer.current = [...refazer.current, objetos];
    onChange({ ...valor, objetos: anterior });
    setTick((t) => t + 1);
  };

  const refazerAcao = () => {
    if (!refazer.current.length) return;
    const proximo = refazer.current[refazer.current.length - 1];
    refazer.current = refazer.current.slice(0, -1);
    historico.current = [...historico.current, objetos];
    onChange({ ...valor, objetos: proximo });
    setTick((t) => t + 1);
  };

  const atualizarObjeto = (patch) => {
    if (!selecionado) return;
    aplicar(objetos.map((o) => (o.id === selecionado.id ? { ...o, ...patch } : o)));
  };

  const removerObjeto = () => {
    if (!selecionado) return;
    aplicar(objetos.filter((o) => o.id !== selecionado.id));
    setSelecionadoId(null);
  };

  const enviarImagem = async (file) => {
    if (!file) return;
    setEnviando(true);
    try {
      const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file });
      const { signed_url } = await base44.integrations.Core.CreateFileSignedUrl({ file_uri, expires_in: 3600 });
      onChange({ ...valor, imagem_file_uri: file_uri, imagem_url: signed_url });
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="space-y-3" style={{ backgroundColor: "#121212", border: "1px solid #2B2B2B", borderRadius: 8, padding: 14 }}>
      <div className="flex items-center justify-between flex-wrap gap-2">
        <p style={{ fontSize: 12, fontWeight: 600, color: "#C8A96A", letterSpacing: "0.06em", textTransform: "uppercase" }}>
          Mapa facial
        </p>
        {!readOnly && (
          <label style={{ fontSize: 11, color: "#C8A96A", border: "1px solid #2B2B2B", borderRadius: 5, padding: "4px 10px", cursor: "pointer" }}>
            {enviando ? "Enviando..." : valor.imagem_file_uri ? "Trocar imagem de referência" : "Usar foto de referência (armazenada privadamente)"}
            <input
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={(e) => enviarImagem(e.target.files?.[0])}
            />
          </label>
        )}
      </div>

      <MapaToolbar
        ferramenta={ferramenta}
        setFerramenta={setFerramenta}
        cor={cor}
        setCor={setCor}
        etapa={etapa}
        setEtapa={setEtapa}
        zoom={zoom}
        setZoom={setZoom}
        podeDesfazer={historico.current.length > 0}
        podeRefazer={refazer.current.length > 0}
        onDesfazer={desfazer}
        onRefazer={refazerAcao}
        readOnly={readOnly}
      />

      <MapaFacialEditor
        objetos={objetos}
        onChange={(novos) => aplicar(novos, false)}
        ferramenta={ferramenta}
        cor={cor}
        etapa={etapa}
        zoom={zoom}
        imagemUrl={valor.imagem_url}
        readOnly={readOnly}
        selecionadoId={selecionadoId}
        onSelect={setSelecionadoId}
      />

      <div className="flex items-center justify-between flex-wrap gap-2">
        <p style={{ fontSize: 10, color: "#555555" }}>
          {objetos.length} marcação(ões) · plano: {objetos.filter((o) => o.etapa === "planejado").length} · realizado: {objetos.filter((o) => o.etapa === "realizado").length}
        </p>
        <p style={{ fontSize: 10, color: "#555555" }}>Toque/arraste para desenhar. “Selecionar” move e edita.</p>
      </div>

      {!readOnly && tick >= 0 && (
        <ObjetoPanel
          objeto={selecionado}
          procedimentos={procedimentos}
          onChange={atualizarObjeto}
          onDelete={removerObjeto}
        />
      )}

      {valor.imagem_file_uri && !readOnly && (
        <button
          type="button"
          onClick={() => onChange({ ...valor, imagem_file_uri: "", imagem_url: "" })}
          style={{ fontSize: 10, color: "#666666", background: "transparent", border: "none", cursor: "pointer", textDecoration: "underline" }}
        >
          Remover imagem de referência
        </button>
      )}
    </div>
  );
}