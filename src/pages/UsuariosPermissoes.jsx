import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { usePermissions } from "@/lib/PermissionsContext";
import { PERFIS, ACTION_PERMISSIONS } from "@/lib/permissions";
import {
  Users, Plus, Edit, Shield, Lock, Unlock, CheckCircle2,
  XCircle, Search, UserCheck, AlertTriangle, Mail
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

const T = {
  font: "'Inter', system-ui, sans-serif",
  bg: "#0A0A0A", card: "#1A1A1A", border: "#2B2B2B",
  textPrimary: "#FFFFFF", textMuted: "#666666", textSecondary: "#B0B0B0",
  gold: "#C8A96A",
};

const S = {
  label: { fontFamily: T.font, fontSize: 11, fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: T.textMuted },
  input: { fontFamily: T.font, fontSize: 13, background: "#121212", border: `1px solid ${T.border}`, borderRadius: 6, color: T.textPrimary, padding: "8px 12px", width: "100%", outline: "none" },
  btnPrimary: { fontFamily: T.font, fontSize: 13, fontWeight: 600, background: T.gold, color: "#000", border: "none", borderRadius: 6, padding: "8px 16px", cursor: "pointer" },
  btnGhost: { fontFamily: T.font, fontSize: 13, fontWeight: 500, background: "transparent", color: T.textSecondary, border: `1px solid ${T.border}`, borderRadius: 6, padding: "7px 14px", cursor: "pointer" },
};

const PERFIL_COLORS = { super_admin: "#C8A96A", gestor: "#6366F1", recepcao: "#10B981", profissional: "#3B82F6", financeiro: "#F59E0B", visualizacao: "#6B7280" };

const STATUS_COLORS = { ativo: "#10B981", inativo: "#6B7280", bloqueado: "#EF4444" };

function UserModal({ user: editingUser, onClose, onSaved, currentUserEmail }) {
  const [form, setForm] = useState(editingUser || { nome: "", email: "", telefone: "", cargo: "", perfil: "recepcao", status: "ativo", observacoes: "" });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!form.nome || !form.email) return;
    setSaving(true);
    try {
      if (editingUser?.id) {
        await base44.entities.ClinicUser.update(editingUser.id, form);
      } else {
        await base44.entities.ClinicUser.create({ ...form, criado_por: currentUserEmail });
        // Convidar usuário para a plataforma
        await base44.users.inviteUser(form.email, "user").catch(() => {});
      }
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 28, width: "100%", maxWidth: 520, fontFamily: T.font }}>
        <h2 style={{ fontSize: 17, fontWeight: 700, color: T.textPrimary, margin: "0 0 20px" }}>
          {editingUser ? "Editar Usuário" : "Novo Usuário"}
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div style={{ gridColumn: "1 / -1" }}>
            <p style={{ ...S.label, marginBottom: 5 }}>Nome Completo *</p>
            <input value={form.nome} onChange={e => setForm(p => ({ ...p, nome: e.target.value }))} style={S.input} placeholder="Nome do usuário" />
          </div>
          <div>
            <p style={{ ...S.label, marginBottom: 5 }}>E-mail *</p>
            <input value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} style={S.input} placeholder="email@clinica.com" type="email" />
          </div>
          <div>
            <p style={{ ...S.label, marginBottom: 5 }}>Telefone</p>
            <input value={form.telefone || ""} onChange={e => setForm(p => ({ ...p, telefone: e.target.value }))} style={S.input} placeholder="(11) 99999-9999" />
          </div>
          <div>
            <p style={{ ...S.label, marginBottom: 5 }}>Cargo / Função</p>
            <input value={form.cargo || ""} onChange={e => setForm(p => ({ ...p, cargo: e.target.value }))} style={S.input} placeholder="Ex: Biomédica, Recepcionista..." />
          </div>
          <div>
            <p style={{ ...S.label, marginBottom: 5 }}>Perfil de Acesso *</p>
            <select value={form.perfil} onChange={e => setForm(p => ({ ...p, perfil: e.target.value }))} style={{ ...S.input }}>
              {Object.entries(PERFIS).map(([k, v]) => (
                <option key={k} value={k}>{v.label} — {v.descricao}</option>
              ))}
            </select>
          </div>
          <div>
            <p style={{ ...S.label, marginBottom: 5 }}>Status</p>
            <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))} style={{ ...S.input }}>
              <option value="ativo">Ativo</option>
              <option value="inativo">Inativo</option>
              <option value="bloqueado">Bloqueado</option>
            </select>
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <p style={{ ...S.label, marginBottom: 5 }}>Observações</p>
            <textarea value={form.observacoes || ""} onChange={e => setForm(p => ({ ...p, observacoes: e.target.value }))} style={{ ...S.input, height: 60, resize: "vertical" }} placeholder="Anotações internas..." />
          </div>
        </div>
        {!editingUser && (
          <div style={{ marginTop: 12, padding: "10px 12px", background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.2)", borderRadius: 8 }}>
            <p style={{ fontSize: 12, color: "#60A5FA", margin: 0, fontFamily: T.font }}>
              📧 Um convite será enviado automaticamente para o e-mail cadastrado.
            </p>
          </div>
        )}
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 }}>
          <button onClick={onClose} style={S.btnGhost}>Cancelar</button>
          <button onClick={handleSave} disabled={saving || !form.nome || !form.email} style={{ ...S.btnPrimary, opacity: saving ? 0.6 : 1 }}>
            {saving ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </div>
    </div>
  );
}

function MatrizPermissoes() {
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: T.font, fontSize: 12 }}>
        <thead>
          <tr style={{ borderBottom: `1px solid ${T.border}` }}>
            <th style={{ padding: "10px 14px", textAlign: "left", color: T.textMuted, fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", fontSize: 11, minWidth: 130 }}>Permissão</th>
            {Object.entries(PERFIS).map(([k, v]) => (
              <th key={k} style={{ padding: "10px 12px", textAlign: "center", color: PERFIL_COLORS[k], fontWeight: 600, fontSize: 11, letterSpacing: "0.05em" }}>{v.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {[
            { key: "criar", label: "Criar registros" },
            { key: "editar", label: "Editar registros" },
            { key: "excluir", label: "Excluir registros" },
            { key: "aprovar", label: "Aprovar documentos" },
            { key: "assinar", label: "Assinar contratos" },
            { key: "configurar", label: "Configurar sistema" },
            { key: "gerenciar_usuarios", label: "Gerenciar usuários" },
            { key: "ver_financeiro", label: "Ver financeiro" },
            { key: "ver_auditoria", label: "Ver auditoria" },
            { key: "exportar", label: "Exportar dados" },
          ].map((perm, i) => (
            <tr key={perm.key} style={{ borderBottom: `1px solid ${T.border}`, background: i % 2 === 0 ? "rgba(255,255,255,0.01)" : "transparent" }}>
              <td style={{ padding: "10px 14px", color: T.textSecondary, fontWeight: 500 }}>{perm.label}</td>
              {Object.keys(PERFIS).map(perfil => (
                <td key={perfil} style={{ padding: "10px 12px", textAlign: "center" }}>
                  {ACTION_PERMISSIONS[perfil]?.[perm.key]
                    ? <CheckCircle2 style={{ width: 16, height: 16, color: "#10B981", display: "inline" }} />
                    : <XCircle style={{ width: 16, height: 16, color: "#374151", display: "inline" }} />
                  }
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function UsuariosPermissoes() {
  const { perfil: myPerfil, user: myUser } = usePermissions();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [tab, setTab] = useState("usuarios");

  const { data: clinicUsers = [], isLoading } = useQuery({
    queryKey: ["clinic-users"],
    queryFn: () => base44.entities.ClinicUser.list("-created_date", 200),
  });

  const toggleStatus = async (cu) => {
    const newStatus = cu.status === "ativo" ? "bloqueado" : "ativo";
    await base44.entities.ClinicUser.update(cu.id, { status: newStatus });
    queryClient.invalidateQueries({ queryKey: ["clinic-users"] });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Remover este usuário?")) return;
    await base44.entities.ClinicUser.delete(id);
    queryClient.invalidateQueries({ queryKey: ["clinic-users"] });
  };

  const filtered = clinicUsers.filter(u =>
    u.nome?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.perfil?.toLowerCase().includes(search.toLowerCase())
  );

  if (myPerfil !== "super_admin" && myPerfil !== "gestor") {
    return (
      <div style={{ fontFamily: T.font, padding: 48, textAlign: "center" }}>
        <Shield style={{ width: 48, height: 48, color: "#EF4444", margin: "0 auto 16px" }} />
        <h2 style={{ color: T.textPrimary, fontSize: 20, fontWeight: 600 }}>Acesso Restrito</h2>
        <p style={{ color: T.textMuted, marginTop: 8 }}>Você não tem permissão para acessar esta área.</p>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: T.font, maxWidth: 1100 }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: T.textPrimary, margin: 0 }}>Usuários e Permissões</h1>
        <p style={{ fontSize: 13, color: T.textMuted, marginTop: 4 }}>
          Gerencie perfis de acesso e permissões da equipe
        </p>
      </div>

      {/* Aviso sobre Super Admin */}
      <div style={{ marginBottom: 20, padding: "12px 16px", background: "rgba(200,169,106,0.06)", border: `1px solid rgba(200,169,106,0.2)`, borderRadius: 8, display: "flex", gap: 10, alignItems: "flex-start" }}>
        <AlertTriangle style={{ width: 16, height: 16, color: T.gold, flexShrink: 0, marginTop: 1 }} />
        <div>
          <p style={{ fontSize: 13, color: T.textSecondary, margin: 0 }}>
            <strong style={{ color: T.gold }}>Super Admins</strong> são usuários com <code style={{ background: "#1A1A1A", padding: "1px 5px", borderRadius: 3, fontSize: 11 }}>role = admin</code> na plataforma Base44.
            Para garantir que Edgar e Dra. Paloma tenham acesso idêntico, ambos devem ter <strong>role = admin</strong> no painel Base44 + perfil <strong>super_admin</strong> aqui no ClinicUser.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: `1px solid ${T.border}`, marginBottom: 24 }}>
        {[{ id: "usuarios", label: "Usuários" }, { id: "permissoes", label: "Matriz de Permissões" }].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            fontFamily: T.font, fontSize: 13, fontWeight: tab === t.id ? 600 : 400,
            color: tab === t.id ? T.textPrimary : T.textMuted,
            padding: "8px 18px", border: "none", background: "transparent", cursor: "pointer",
            borderBottom: tab === t.id ? `2px solid ${T.gold}` : "2px solid transparent",
          }}>{t.label}</button>
        ))}
      </div>

      {tab === "usuarios" && (
        <>
          {/* Toolbar */}
          <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
            <div style={{ flex: "1 1 220px", position: "relative" }}>
              <Search style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", width: 14, height: 14, color: T.textMuted, pointerEvents: "none" }} />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar por nome, e-mail ou perfil..."
                style={{ ...S.input, paddingLeft: 32 }}
              />
            </div>
            <button onClick={() => { setEditingUser(null); setShowModal(true); }} style={{ ...S.btnPrimary, display: "flex", alignItems: "center", gap: 6 }}>
              <Plus style={{ width: 14, height: 14 }} /> Novo Usuário
            </button>
          </div>

          {/* Contadores por perfil */}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 20 }}>
            {Object.entries(PERFIS).map(([k, v]) => {
              const count = clinicUsers.filter(u => u.perfil === k).length;
              if (count === 0) return null;
              return (
                <div key={k} style={{ padding: "6px 12px", borderRadius: 20, background: `${PERFIL_COLORS[k]}15`, border: `1px solid ${PERFIL_COLORS[k]}30`, display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: PERFIL_COLORS[k] }}>{v.label}</span>
                  <span style={{ fontSize: 11, color: T.textMuted }}>{count}</span>
                </div>
              );
            })}
          </div>

          {/* Lista */}
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, overflow: "hidden" }}>
            {isLoading ? (
              <div style={{ padding: 40, textAlign: "center", color: T.textMuted }}>Carregando...</div>
            ) : filtered.length === 0 ? (
              <div style={{ padding: 48, textAlign: "center" }}>
                <Users style={{ width: 40, height: 40, color: T.textMuted, display: "block", margin: "0 auto 12px" }} />
                <p style={{ color: T.textMuted, fontSize: 14 }}>Nenhum usuário cadastrado. Clique em "Novo Usuário" para começar.</p>
              </div>
            ) : (
              filtered.map((cu, i) => (
                <div key={cu.id} style={{
                  display: "flex", alignItems: "center", gap: 14,
                  padding: "14px 18px",
                  borderBottom: i < filtered.length - 1 ? `1px solid ${T.border}` : "none",
                  flexWrap: "wrap",
                }}>
                  <Avatar style={{ width: 38, height: 38, flexShrink: 0, border: `2px solid ${PERFIL_COLORS[cu.perfil] || T.border}` }}>
                    <AvatarFallback style={{ background: `${PERFIL_COLORS[cu.perfil]}20`, color: PERFIL_COLORS[cu.perfil], fontSize: 14, fontWeight: 700 }}>
                      {cu.nome?.[0]?.toUpperCase() || "?"}
                    </AvatarFallback>
                  </Avatar>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: T.textPrimary }}>{cu.nome}</span>
                      <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 20, background: `${PERFIL_COLORS[cu.perfil]}18`, color: PERFIL_COLORS[cu.perfil], border: `1px solid ${PERFIL_COLORS[cu.perfil]}30` }}>
                        {PERFIS[cu.perfil]?.label || cu.perfil}
                      </span>
                      <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 20, background: `${STATUS_COLORS[cu.status]}18`, color: STATUS_COLORS[cu.status] }}>
                        {cu.status}
                      </span>
                    </div>
                    <div style={{ display: "flex", gap: 12, marginTop: 3, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 12, color: T.textMuted }}>{cu.email}</span>
                      {cu.cargo && <span style={{ fontSize: 12, color: T.textMuted }}>· {cu.cargo}</span>}
                      {cu.ultimo_acesso && (
                        <span style={{ fontSize: 12, color: T.textMuted }}>
                          · Último acesso: {new Date(cu.ultimo_acesso).toLocaleDateString("pt-BR")}
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                    <button onClick={() => { setEditingUser(cu); setShowModal(true); }} title="Editar" style={{ ...S.btnGhost, padding: "5px 10px", fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}>
                      <Edit style={{ width: 13, height: 13 }} /> Editar
                    </button>
                    <button
                      onClick={() => toggleStatus(cu)}
                      title={cu.status === "ativo" ? "Bloquear" : "Ativar"}
                      style={{ ...S.btnGhost, padding: "5px 10px", fontSize: 12, display: "flex", alignItems: "center", gap: 4, color: cu.status === "ativo" ? "#EF4444" : "#10B981", borderColor: cu.status === "ativo" ? "rgba(239,68,68,0.3)" : "rgba(16,185,129,0.3)" }}>
                      {cu.status === "ativo" ? <Lock style={{ width: 13, height: 13 }} /> : <Unlock style={{ width: 13, height: 13 }} />}
                      {cu.status === "ativo" ? "Bloquear" : "Ativar"}
                    </button>
                    {myPerfil === "super_admin" && (
                      <button onClick={() => handleDelete(cu.id)} title="Remover" style={{ ...S.btnGhost, padding: "5px 10px", fontSize: 12, color: "#EF4444", borderColor: "rgba(239,68,68,0.25)" }}>
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {tab === "permissoes" && (
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, overflow: "hidden" }}>
          <div style={{ padding: "14px 18px", borderBottom: `1px solid ${T.border}` }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: T.textPrimary, margin: 0 }}>Matriz de Permissões por Perfil</h3>
            <p style={{ fontSize: 12, color: T.textMuted, marginTop: 4 }}>Permissões são definidas por perfil e aplicadas automaticamente.</p>
          </div>
          <div style={{ padding: 18 }}>
            <MatrizPermissoes />
          </div>
        </div>
      )}

      {showModal && (
        <UserModal
          user={editingUser}
          onClose={() => { setShowModal(false); setEditingUser(null); }}
          onSaved={() => { setShowModal(false); setEditingUser(null); queryClient.invalidateQueries({ queryKey: ["clinic-users"] }); }}
          currentUserEmail={myUser?.email}
        />
      )}
    </div>
  );
}