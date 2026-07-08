import React, { useEffect, useState } from "react";
import { T, portalApi } from "./portalConfig";
import { Loader2, BookOpen, ChevronRight, X, Play } from "lucide-react";
import ReactMarkdown from "react-markdown";

const CATEGORIAS = [
  "Beleza natural", "Harmonização facial", "Toxina botulínica", "Preenchimentos",
  "Bioestimuladores", "Skin Quality", "Cuidados antes e depois", "Mitos e verdades", "Manutenção dos resultados",
];

export default function BibliotecaConteudos() {
  const [contents, setContents] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cat, setCat] = useState("all");
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    portalApi("conteudos", {})
      .then(d => setContents(d.contents || []))
      .catch(() => setContents([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = cat === "all" ? (contents || []) : (contents || []).filter(c => c.category === cat);

  if (loading) return <div className="px-5 py-20 flex justify-center"><Loader2 className="h-7 w-7 animate-spin" style={{ color: T.gold }} /></div>;

  return (
    <div className="px-5 py-6">
      <div className="mb-5">
        <p className="text-[11px] uppercase tracking-widest mb-1" style={{ color: T.dim }}>Conhecimento</p>
        <h1 className="font-serif text-xl" style={{ color: T.text }}>Biblioteca de conteúdos</h1>
        <p className="text-sm mt-2 leading-relaxed" style={{ color: T.muted }}>
          Conteúdos cuidadosos sobre a sua beleza natural.
        </p>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-4 scrollbar-hide">
        <button onClick={() => setCat("all")}
          className="flex-shrink-0 text-xs px-3 py-1.5 rounded-full transition-colors"
          style={{ background: cat === "all" ? T.gold : T.surface, color: cat === "all" ? "#0A0A0A" : T.muted, border: `1px solid ${cat === "all" ? T.gold : T.border}` }}>
          Todos
        </button>
        {CATEGORIAS.map(c => (
          <button key={c} onClick={() => setCat(c)}
            className="flex-shrink-0 text-xs px-3 py-1.5 rounded-full transition-colors whitespace-nowrap"
            style={{ background: cat === c ? T.gold : T.surface, color: cat === c ? "#0A0A0A" : T.muted, border: `1px solid ${cat === c ? T.gold : T.border}` }}>
            {c}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl p-8 text-center" style={{ background: T.card, border: `1px solid ${T.border}` }}>
          <BookOpen className="mx-auto mb-3" style={{ width: 28, height: 28, color: T.dim }} />
          <p className="text-sm" style={{ color: T.muted }}>Nenhum conteúdo disponível nesta categoria.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(c => (
            <button key={c.id} onClick={() => setSelected(c)}
              className="w-full flex items-stretch rounded-2xl overflow-hidden text-left transition-all hover:scale-[1.01]"
              style={{ background: T.card, border: `1px solid ${T.border}` }}>
              {c.cover_image_url && (
                <div className="w-24 flex-shrink-0 bg-black/30">
                  <img src={c.cover_image_url} alt={c.title} className="w-full h-full object-cover" />
                </div>
              )}
              <div className="p-4 flex-1 min-w-0">
                <p className="text-[10px] uppercase tracking-widest mb-1" style={{ color: T.gold }}>{c.category}</p>
                <p className="text-sm font-medium mb-1" style={{ color: T.text }}>{c.title}</p>
                {c.description && <p className="text-xs leading-relaxed line-clamp-2" style={{ color: T.muted }}>{c.description}</p>}
              </div>
              <div className="flex items-center pr-3">
                <ChevronRight style={{ width: 18, height: 18, color: T.dim }} />
              </div>
            </button>
          ))}
        </div>
      )}

      {selected && <ContentModal content={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

function ContentModal({ content, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" style={{ background: "rgba(0,0,0,0.8)" }}>
      <div className="w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl" style={{ background: T.card, border: `1px solid ${T.border}`, maxHeight: "90vh", overflowY: "auto" }}>
        {content.cover_image_url && (
          <div className="relative h-40 bg-black/30">
            <img src={content.cover_image_url} alt={content.title} className="w-full h-full object-cover" />
            <button onClick={onClose} className="absolute top-3 right-3 rounded-full p-1.5" style={{ background: "rgba(0,0,0,0.6)" }}>
              <X className="h-4 w-4" style={{ color: T.text }} />
            </button>
          </div>
        )}
        <div className="p-5">
          {!content.cover_image_url && (
            <div className="flex justify-end mb-2">
              <button onClick={onClose} className="p-1" style={{ color: T.dim }}><X className="h-5 w-5" /></button>
            </div>
          )}
          <p className="text-[10px] uppercase tracking-widest mb-2" style={{ color: T.gold }}>{content.category}</p>
          <h2 className="font-serif text-xl mb-3" style={{ color: T.text }}>{content.title}</h2>
          {content.description && <p className="text-sm leading-relaxed mb-4" style={{ color: T.muted }}>{content.description}</p>}
          {content.video_url && (
            <a href={content.video_url} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-xl p-3 mb-4" style={{ background: T.goldSoft, border: `1px solid ${T.gold}40` }}>
              <Play className="h-4 w-4" style={{ color: T.gold }} />
              <span className="text-sm font-medium" style={{ color: T.gold }}>Assistir vídeo</span>
            </a>
          )}
          {content.content && (
            <div className="prose prose-invert prose-sm max-w-none" style={{ color: T.muted }}>
              <ReactMarkdown>{content.content}</ReactMarkdown>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}