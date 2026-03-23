import React, { useState } from "react";
import { Download, Maximize2, X, Layers, FileText, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const MAP_VERSIONS = [
  {
    key: "technical",
    label: "Técnico Completo",
    description: "Todos os pontos, vetores e labels clínicos",
    icon: Layers,
    color: "text-blue-400",
    badge: "bg-blue-500/20 text-blue-400",
  },
  {
    key: "client",
    label: "Versão Cliente",
    description: "Visual clean — áreas-chave e protocolo principal",
    icon: Target,
    color: "text-emerald-400",
    badge: "bg-emerald-500/20 text-emerald-400",
  },
  {
    key: "result",
    label: "Direção de Resultado",
    description: "Vetores de lifting e transformação esperada",
    icon: FileText,
    color: "text-[#c9a55c]",
    badge: "bg-[#c9a55c]/20 text-[#c9a55c]",
  },
];

export default function FacialMapDisplay({ maps, mapData }) {
  const [fullscreen, setFullscreen] = useState(null);
  const [activeVersion, setActiveVersion] = useState("technical");

  const handleDownload = (url, label) => {
    const a = document.createElement("a");
    a.href = url;
    a.download = `mapa-facial-${label.toLowerCase().replace(/\s/g, "-")}.jpg`;
    a.click();
  };

  const activeMap = maps?.[activeVersion];

  return (
    <div className="space-y-6">
      {/* Protocol badge strip */}
      {mapData?.main_protocol && (
        <div className="flex flex-wrap items-center gap-3 p-4 bg-[#0d0d14] border border-[#c9a55c]/20 rounded-2xl">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-widest text-gray-500">Protocolo Principal</span>
          </div>
          <Badge className="bg-[#c9a55c]/20 text-[#c9a55c] text-sm px-3 py-1 font-semibold">
            {mapData.main_protocol}
          </Badge>
          {mapData?.complementary_protocols?.map((p, i) => (
            <Badge key={i} className="bg-[#1e1e2a] text-gray-300 text-xs">
              {p}
            </Badge>
          ))}
        </div>
      )}

      {/* Version selector */}
      <div className="grid grid-cols-3 gap-3">
        {MAP_VERSIONS.map((v) => {
          const Icon = v.icon;
          const selected = activeVersion === v.key;
          const hasMap = !!maps?.[v.key];
          return (
            <button
              key={v.key}
              onClick={() => hasMap && setActiveVersion(v.key)}
              disabled={!hasMap}
              className={`p-4 rounded-xl border text-left transition-all ${
                selected
                  ? "border-[#c9a55c]/40 bg-[#c9a55c]/5"
                  : "border-[#1e1e2a] bg-[#12121a] hover:border-[#1e1e2a]/80"
              } ${!hasMap ? "opacity-30 cursor-not-allowed" : "cursor-pointer"}`}
            >
              <Icon className={`h-4 w-4 mb-2 ${selected ? "text-[#c9a55c]" : "text-gray-500"}`} />
              <p className={`text-xs font-medium ${selected ? "text-white" : "text-gray-400"}`}>
                {v.label}
              </p>
              <p className="text-[10px] text-gray-600 mt-0.5 leading-tight">{v.description}</p>
            </button>
          );
        })}
      </div>

      {/* Main image display */}
      {activeMap ? (
        <div className="relative group rounded-2xl overflow-hidden border border-[#c9a55c]/20 bg-black">
          <img
            src={activeMap}
            alt={`Mapa facial — ${activeVersion}`}
            className="w-full object-contain max-h-[520px]"
          />
          {/* Overlay controls */}
          <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setFullscreen(activeMap)}
              className="bg-black/70 text-white hover:bg-black/90 h-8 w-8 p-0"
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleDownload(activeMap, MAP_VERSIONS.find(v => v.key === activeVersion)?.label || activeVersion)}
              className="bg-black/70 text-white hover:bg-black/90 h-8 w-8 p-0"
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
          {/* Version label */}
          <div className="absolute bottom-3 left-3">
            <Badge className={MAP_VERSIONS.find(v => v.key === activeVersion)?.badge || ""}>
              {MAP_VERSIONS.find(v => v.key === activeVersion)?.label}
            </Badge>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center h-48 bg-[#0d0d14] border border-[#1e1e2a] rounded-2xl">
          <p className="text-gray-600 text-sm">Gerando mapa facial...</p>
        </div>
      )}

      {/* Region annotations */}
      {mapData?.regions?.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-widest text-gray-500 mb-3">Regiões Mapeadas</p>
          <div className="grid grid-cols-2 gap-2">
            {mapData.regions.map((region, i) => (
              <div key={i} className="flex items-start gap-3 p-3 bg-[#0d0d14] border border-[#1e1e2a] rounded-xl">
                <div className="w-1.5 h-1.5 rounded-full bg-[#c9a55c] mt-1.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-medium text-white">{region.area}</p>
                  <p className="text-[11px] text-gray-500">{region.intervention}</p>
                  {region.protocol && (
                    <p className="text-[10px] text-[#c9a55c] mt-0.5">{region.protocol}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Download all */}
      <div className="flex gap-2 flex-wrap">
        {Object.entries(maps || {}).map(([key, url]) => {
          const v = MAP_VERSIONS.find(v => v.key === key);
          return (
            <Button
              key={key}
              variant="outline"
              size="sm"
              onClick={() => handleDownload(url, v?.label || key)}
              className="border-[#1e1e2a] text-gray-400 hover:text-white text-xs"
            >
              <Download className="mr-1.5 h-3.5 w-3.5" />
              {v?.label}
            </Button>
          );
        })}
      </div>

      {/* Fullscreen modal */}
      {fullscreen && (
        <div
          className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4"
          onClick={() => setFullscreen(null)}
        >
          <button
            onClick={() => setFullscreen(null)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20"
          >
            <X className="h-5 w-5" />
          </button>
          <img
            src={fullscreen}
            alt="Mapa facial fullscreen"
            className="max-w-full max-h-full object-contain rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}