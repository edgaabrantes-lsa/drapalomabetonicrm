import React, { useEffect, useState, useRef, useCallback } from "react";
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
  const scrollRef = useRef(null);
  const drag = useRef({ active: false, startX: 0, scrollLeft: 0, moved: false });

  useEffect(() => {
    portalApi("conteudos", {})
      .then(d => setContents(d.contents || []))
      .catch(() => setContents([]))
      .finally(() => setLoading(false));
  }, []);

  const onMouseDown = useCallback((e) => {
    const el = scrollRef.current;
    if (!el) return;
    drag.current = { active: true, startX: e.pageX - el.offsetLeft, scrollLeft: el.scrollLeft, moved: false };
  }, []);

  const onMouseMove = useCallback((e) => {
    if (!drag.current.active) return;
    const el = scrollRef.current;
    if (!el) return;
    e.preventDefault();
    const x = e.pageX - el.offsetLeft;
    const walk = x - drag.current.startX;
    if (Math.abs(walk) > 4) drag.current.moved = true;
    el.scrollLeft = drag.current.scrollLeft - walk;
  }, []);

  const onMouseUp = useCallback(() => { drag.current.active = false; }, []);

  const filtered = cat === "all" ? (contents || []) : (contents || []).filter(c => c.category === cat);

  if (loading) return <div className="px-5 py-20 flex justify-center"><Loader2 className="h-7 w-7 animate-spin" style={{ color: T.gold }} /></div>;

  return (
    <div className="px-5 py-6">
      <div className="mb-5">
        <p className="text-[11px] uppercase mb-1" style={{ color: T.dim, letterSpacing: "0.12em" }}>Conhecimento</p>
        <h1 className="text-xl" style={{ color: T.text, fontWeight: 600, letterSpacing: "-0.01em" }}>Biblioteca de conteúdos</h1>
        <p className="text-sm mt-2 leading-relaxed" style={{ color: T.muted }}>
          Conteúdos cuidadosos sobre a sua beleza natural.
        </p>
      </div>

      {/* Filtros com rolagem horizontal visível e arrastável */}
      <div
        ref={scrollRef}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        className="flex gap-2 overflow-x-auto pb-3 mb-4 portal-cat-scroll"
        style={{ cursor: "grab", scrollbarWidth: "thin" }}
      >
        <CatChip active={cat === "all"} onClick={() => !drag.current.moved && setCat("all")} label="Todos" />
        {CATEGORIAS.map(c => (
          <CatChip key={c} active={cat === c} onClick={() => !drag.current.moved && setCat(c)} label={c} />
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl p-8 text-center" style={{ background: T.card, border: `1px solid ${T.border}` }}>
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
                <p className="text-[10px] uppercase mb-1" style={{ color: T.gold, letterSpacing: "0.12em" }}>{c.category}</p>
                <p className="text-sm mb-1" style={{ color: T.text, fontWeight: 500 }}>{c.title}</p>
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

function CatChip({ active, onClick, label }) {
  return (
    <button onClick={onClick}
      className="flex-shrink-0 text-xs px-3.5 py-1.5 rounded-full transition-colors whitespace-nowrap select-none"
      style={{
        background: active ? T.gold : T.surface,
        color: active ? "#0A0A0A" : T.muted,
        border: `1px solid ${active ? T.gold : T.border}`,
        fontWeight: active ? 600 : 500,
      }}>
      {label}
    </button>
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
          <p className="text-[10px] uppercase mb-2" style={{ color: T.gold, letterSpacing: "0.12em" }}>{content.category}</p>
          <h2 className="text-xl mb-3" style={{ color: T.text, fontWeight: 600, letterSpacing: "-0.01em" }}>{content.title}</h2>
          {content.description && <p className="text-sm leading-relaxed mb-4" style={{ color: T.muted }}>{content.description}</p>}
          {content.video_url && (
            <a href={content.video_url} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-xl p-3 mb-4" style={{ background: T.goldSoft, border: `1px solid ${T.gold}40` }}>
              <Play className="h-4 w-4" style={{ color: T.gold }} />
              <span className="text-sm" style={{ color: T.gold, fontWeight: 500 }}>Assistir vídeo</span>
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