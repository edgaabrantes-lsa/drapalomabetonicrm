import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { GitBranch, GitCommit, RefreshCw, ChevronDown, ExternalLink, Users, Calendar } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function GitHubMonitor() {
  const [repos, setRepos] = useState([]);
  const [selectedRepo, setSelectedRepo] = useState(null);
  const [commits, setCommits] = useState([]);
  const [contributors, setContributors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingCommits, setLoadingCommits] = useState(false);
  const [error, setError] = useState(null);
  const [showRepoDropdown, setShowRepoDropdown] = useState(false);

  useEffect(() => {
    loadRepos();
  }, []);

  const loadRepos = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await base44.functions.invoke("githubCommits", {});
      setRepos(res.data.repos || []);
    } catch (e) {
      setError("Erro ao carregar repositórios: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const loadCommits = async (repo) => {
    setSelectedRepo(repo);
    setShowRepoDropdown(false);
    setLoadingCommits(true);
    setError(null);
    try {
      const res = await base44.functions.invoke("githubCommits", { owner: repo.owner, repo: repo.name, per_page: 30 });
      setCommits(res.data.commits || []);
      setContributors(res.data.contributors || []);
    } catch (e) {
      setError("Erro ao carregar commits: " + e.message);
    } finally {
      setLoadingCommits(false);
    }
  };

  const formatDate = (dateStr) => {
    try {
      return formatDistanceToNow(new Date(dateStr), { addSuffix: true, locale: ptBR });
    } catch {
      return dateStr;
    }
  };

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px 0" }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: "rgba(200,169,106,0.1)", border: "1px solid rgba(200,169,106,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <GitBranch style={{ width: 18, height: 18, color: "#C8A96A" }} />
          </div>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 600, color: "#FFFFFF", margin: 0 }}>Monitor GitHub</h1>
            <p style={{ fontSize: 12, color: "#666666", margin: 0 }}>Progresso de commits do repositório</p>
          </div>
        </div>
        <button
          onClick={loadRepos}
          disabled={loading}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 6, backgroundColor: "transparent", border: "1px solid #2B2B2B", color: "#B0B0B0", fontSize: 13, cursor: "pointer" }}
        >
          <RefreshCw style={{ width: 13, height: 13 }} className={loading ? "animate-spin" : ""} />
          Atualizar
        </button>
      </div>

      {error && (
        <div style={{ backgroundColor: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 8, padding: "12px 16px", marginBottom: 20, color: "#EF4444", fontSize: 13 }}>
          {error}
        </div>
      )}

      {/* Seletor de repositório */}
      {!loading && repos.length > 0 && (
        <div className="relative mb-6" style={{ maxWidth: 400 }}>
          <button
            onClick={() => setShowRepoDropdown(!showRepoDropdown)}
            style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderRadius: 8, backgroundColor: "#1A1A1A", border: "1px solid #2B2B2B", color: "#FFFFFF", fontSize: 13, cursor: "pointer" }}
          >
            <span>{selectedRepo ? selectedRepo.full_name : "Selecionar repositório..."}</span>
            <ChevronDown style={{ width: 14, height: 14, color: "#666666" }} />
          </button>
          {showRepoDropdown && (
            <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, backgroundColor: "#1A1A1A", border: "1px solid #2B2B2B", borderRadius: 8, zIndex: 50, maxHeight: 240, overflowY: "auto" }}>
              {repos.map(repo => (
                <button
                  key={repo.id}
                  onClick={() => loadCommits(repo)}
                  style={{ width: "100%", textAlign: "left", padding: "10px 14px", backgroundColor: "transparent", border: "none", color: "#B0B0B0", fontSize: 13, cursor: "pointer", borderBottom: "1px solid #1E1E1E" }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.04)"}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}
                >
                  <div style={{ color: "#FFFFFF", fontWeight: 500 }}>{repo.name}</div>
                  {repo.description && <div style={{ fontSize: 11, color: "#555555", marginTop: 2 }}>{repo.description}</div>}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {loading && (
        <div style={{ textAlign: "center", padding: 60, color: "#555555" }}>
          <RefreshCw style={{ width: 24, height: 24, margin: "0 auto 12px", animation: "spin 1s linear infinite" }} />
          <p style={{ fontSize: 13 }}>Carregando repositórios...</p>
        </div>
      )}

      {selectedRepo && (
        <div className="grid gap-6" style={{ gridTemplateColumns: contributors.length > 0 ? "1fr 280px" : "1fr" }}>
          {/* Commits */}
          <div style={{ backgroundColor: "#1A1A1A", border: "1px solid #2B2B2B", borderRadius: 10 }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid #1E1E1E", display: "flex", alignItems: "center", gap: 8 }}>
              <GitCommit style={{ width: 15, height: 15, color: "#C8A96A" }} />
              <span style={{ fontSize: 14, fontWeight: 500, color: "#FFFFFF" }}>Commits Recentes</span>
              <span style={{ marginLeft: "auto", fontSize: 11, color: "#555555" }}>{selectedRepo.full_name}</span>
            </div>

            {loadingCommits ? (
              <div style={{ padding: 40, textAlign: "center", color: "#555555", fontSize: 13 }}>Carregando commits...</div>
            ) : (
              <div>
                {commits.map((commit, idx) => (
                  <div
                    key={commit.sha}
                    style={{ padding: "14px 20px", borderBottom: idx < commits.length - 1 ? "1px solid #1E1E1E" : "none", display: "flex", alignItems: "flex-start", gap: 12 }}
                  >
                    {commit.author_avatar ? (
                      <img src={commit.author_avatar} alt={commit.author} style={{ width: 28, height: 28, borderRadius: "50%", flexShrink: 0, marginTop: 2 }} />
                    ) : (
                      <div style={{ width: 28, height: 28, borderRadius: "50%", backgroundColor: "#2B2B2B", flexShrink: 0, marginTop: 2 }} />
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, color: "#FFFFFF", margin: "0 0 4px", fontWeight: 400, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {commit.message}
                      </p>
                      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 11, color: "#666666" }}>{commit.author}</span>
                        <span style={{ fontSize: 11, color: "#555555", display: "flex", alignItems: "center", gap: 4 }}>
                          <Calendar style={{ width: 10, height: 10 }} />
                          {formatDate(commit.date)}
                        </span>
                        <code style={{ fontSize: 10, color: "#C8A96A", backgroundColor: "rgba(200,169,106,0.1)", padding: "1px 6px", borderRadius: 4 }}>
                          {commit.sha}
                        </code>
                      </div>
                    </div>
                    <a href={commit.url} target="_blank" rel="noreferrer" style={{ color: "#555555", flexShrink: 0 }}>
                      <ExternalLink style={{ width: 13, height: 13 }} />
                    </a>
                  </div>
                ))}
                {commits.length === 0 && (
                  <div style={{ padding: 40, textAlign: "center", color: "#555555", fontSize: 13 }}>Nenhum commit encontrado.</div>
                )}
              </div>
            )}
          </div>

          {/* Contribuidores */}
          {contributors.length > 0 && (
            <div style={{ backgroundColor: "#1A1A1A", border: "1px solid #2B2B2B", borderRadius: 10, height: "fit-content" }}>
              <div style={{ padding: "16px 20px", borderBottom: "1px solid #1E1E1E", display: "flex", alignItems: "center", gap: 8 }}>
                <Users style={{ width: 15, height: 15, color: "#C8A96A" }} />
                <span style={{ fontSize: 14, fontWeight: 500, color: "#FFFFFF" }}>Contribuidores</span>
              </div>
              <div style={{ padding: "8px 0" }}>
                {contributors.map((c, idx) => (
                  <div key={c.login} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 20px" }}>
                    <span style={{ fontSize: 11, color: "#3A3A3A", width: 16, textAlign: "right" }}>#{idx + 1}</span>
                    {c.avatar ? (
                      <img src={c.avatar} alt={c.login} style={{ width: 26, height: 26, borderRadius: "50%" }} />
                    ) : (
                      <div style={{ width: 26, height: 26, borderRadius: "50%", backgroundColor: "#2B2B2B" }} />
                    )}
                    <span style={{ flex: 1, fontSize: 13, color: "#B0B0B0" }}>{c.login}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#C8A96A" }}>{c.total}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {!loading && !selectedRepo && repos.length === 0 && (
        <div style={{ textAlign: "center", padding: 60, color: "#555555" }}>
          <GitBranch style={{ width: 32, height: 32, margin: "0 auto 12px" }} />
          <p style={{ fontSize: 14 }}>Nenhum repositório encontrado.</p>
        </div>
      )}
    </div>
  );
}