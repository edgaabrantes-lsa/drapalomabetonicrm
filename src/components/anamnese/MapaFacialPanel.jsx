import React, { useMemo, useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import MapaFacialEditor from "./MapaFacialEditor";
import MapaToolbar from "./MapaToolbar";
import MapaObservacaoPopover from "./MapaObservacaoPopover";
import MapaMarcacoesLista from "./MapaMarcacoesLista";
import RostoReferenciaSelector from "./RostoReferenciaSelector";
import { PROCEDIMENTOS_PADRAO, migrarObjetos } from "@/lib/mapaFacial";

/**
 * Painel do mapa facial: barra de ferramentas, editor, observações e lista.
 * Recebe e devolve { objetos, imagem_file_uri, imagem_url } — coordenadas normalizadas.
 */
export default function MapaFacialPanel({ valor = {}, onChange, readOnly }) {
  const [ferramenta, setFerramenta] = useState("select");
  const [cor, setCor] = useState("#C8A96A");
  const [espessura, setEspessura] = useState(4);
  const [etapa, setEtapa] = useState("planejado");
  const [zoom, setZoom] = useState(1);
  const [selecionadoId, setSelecionadoId] = useState(null);
  const [obsId, setObsId] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [tick, setTick] = useState(0);

  const historico = useRef([]);
  const refazerLista = useRef([]);
  const rajada = useRef({ at: 0 });

  const { data: procedures = [] } = useQuery({
    queryKey: ["procedures"],
    queryFn: () => base44.entities.Procedure.list(),
  });

  const procedimentos = useMemo(() => Array.from(new Set([
    ...PROCEDIMENTOS_PADRAO,
    ...procedures.map((p) => p.name).filter(Boolean),
  ])), [procedures]);

  const objetos = useMemo(() => migrarObjetos(valor.objetos), [valor.objetos]);
  const selecionado = objetos.find((o) => o.id === selecionadoId) || null;
  const emObservacao = obsId ? objetos.find((o) => o.id === obsId) || null : null;

  // Agrupa alterações contínuas (arraste, traço) em uma única etapa de desfazer
  const aplicar = (novos) => {
    if (readOnly) return;
    const agora = Date.now();
    if (agora - rajada.current.at > 700) {
      historico.current = [...historico.current, objetos].slice(-40);
      refazerLista.current = [];
      setTick((t) => t + 1);
    }
    rajada.current.at = agora;
    onChange({ ...valor, objetos: novos });
  };

  const desfazer = () => {
    if (!historico.current.length) return;
    const anterior = historico.current[historico.current.length - 1];
    historico.current = historico.current.slice(0, -1);
    refazerLista.current = [...refazerLista.current, objetos];
    onChange({ ...valor, objetos: anterior });
    setTick((t) => t + 1);
  };

  const refazer = () => {
    if (!refazerLista.current.length) return;
    const proximo = refazerLista.current[refazerLista.current.length - 1];
    refazerLista.current = refazerLista.current.slice(0, -1);
    historico.current = [...historico.current, objetos];
    onChange({ ...valor, objetos: proximo });
    setTick((t) => t + 1);
  };

  const abrirObservacao = (id) => {
    setSelecionadoId(id);
    setObsId(id);
  };

  const salvarObservacao = (patch) => {
    if (!emObservacao) return;
    aplicar(objetos.map((o) => (
      o.id === emObservacao.id ? { ...o, ...patch, atualizado_em: new Date().toISOString() } : o
    )));
    setObsId(null);
  };

  const excluirObjeto = (id) => {
    aplicar(objetos.filter((o) => o.id !== id));
    if (selecionadoId === id) setSelecionadoId(null);
    if (obsId === id) setObsId(null);
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

  const comObservacao = objetos.filter((o) => (o.observacao || "").trim()).length;

  return (
    <div className="space-y-3" style={{ backgroundColor: "#121212", border: "1px solid #2B2B2B", borderRadius: 8, padding: 14 }}>
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <p style={{ fontSize: 12, fontWeight: 600, color: "#C8A96A", letterSpacing: "0.06em", textTransform: "uppercase" }}>
            Mapa facial
          </p>
          <p style={{ fontSize: 10, color: "#666666", marginTop: 2 }}>
            Toque em uma marcação para abrir a observação · arraste para mover.
          </p>
        </div>
        {!readOnly && (
          <label style={{ fontSize: 10, color: "#C8A96A", border: "1px solid #2B2B2B", borderRadius: 5, padding: "5px 10px", cursor: "pointer" }}>
            {enviando ? "Enviando..." : valor.imagem_file_uri ? "Trocar foto" : "Usar foto da paciente (armazenada privadamente)"}
            <input
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={(e) => enviarImagem(e.target.files?.[0])}
            />
          </label>
        )}
      </div>

      {!readOnly && (
        <RostoReferenciaSelector
          valorId={valor.rosto_referencia}
          onEscolher={(id) => onChange({ ...valor, rosto_referencia: id, imagem_file_uri: "", imagem_url: "" })}
        />
      )}

      <MapaToolbar
        ferramenta={ferramenta}
        setFerramenta={setFerramenta}
        cor={cor}
        setCor={setCor}
        espessura={espessura}
        setEspessura={setEspessura}
        etapa={etapa}
        setEtapa={setEtapa}
        zoom={zoom}
        setZoom={setZoom}
        podeDesfazer={historico.current.length > 0}
        podeRefazer={refazerLista.current.length > 0}
        onDesfazer={desfazer}
        onRefazer={refazer}
        readOnly={readOnly}
      />

      <MapaFacialEditor
        objetos={objetos}
        onChange={aplicar}
        ferramenta={ferramenta}
        cor={cor}
        espessura={espessura}
        etapa={etapa}
        zoom={zoom}
        imagemUrl={valor.imagem_url}
        rostoId={valor.rosto_referencia}
        readOnly={readOnly}
        selecionadoId={selecionadoId}
        onSelect={setSelecionadoId}
        onAbrirObservacao={abrirObservacao}
        popover={emObservacao ? (
          <MapaObservacaoPopover
            key={emObservacao.id}
            objeto={emObservacao}
            procedimentos={procedimentos}
            somenteLeitura={readOnly}
            onSalvar={salvarObservacao}
            onExcluir={() => excluirObjeto(emObservacao.id)}
            onFechar={() => setObsId(null)}
          />
        ) : null}
      />

      <div className="flex items-center justify-between flex-wrap gap-2">
        <p style={{ fontSize: 10, color: "#555555" }}>
          {objetos.length} marcação(ões) · {comObservacao} com observação
          {selecionado ? ` · selecionada: ${selecionado.regiao || selecionado.tipo}` : ""}
        </p>
        <p style={{ fontSize: 10, color: "#555555" }}>
          Desenhe com mouse, dedo ou caneta · use o zoom para marcações precisas.
        </p>
      </div>

      <MapaMarcacoesLista
        objetos={objetos}
        selecionadoId={selecionadoId}
        onSelecionar={setSelecionadoId}
        onEditar={abrirObservacao}
        onExcluir={excluirObjeto}
        somenteLeitura={readOnly}
      />

      {valor.imagem_file_uri && !readOnly && (
        <button
          type="button"
          onClick={() => onChange({ ...valor, imagem_file_uri: "", imagem_url: "" })}
          style={{ fontSize: 10, color: "#666666", background: "transparent", border: "none", cursor: "pointer", textDecoration: "underline" }}
        >
          Remover foto de referência
        </button>
      )}
    </div>
  );
}