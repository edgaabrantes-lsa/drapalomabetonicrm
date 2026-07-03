/**
 * Sistema de Permissões — CRM Clínico
 * Perfis: super_admin, gestor, recepcao, profissional, financeiro, visualizacao
 *
 * No Base44, o campo `role` do User é usado para controle de acesso.
 * super_admin e admin = acesso total
 * Os demais perfis são armazenados no ClinicUser vinculado pelo email.
 */

export const PERFIS = {
  super_admin: {
    label: "Super Admin",
    color: "#C8A96A",
    descricao: "Acesso total ao sistema",
  },
  profissional_clinico_premium: {
    label: "Profissional Clínico Premium",
    color: "#06B6D4",
    descricao: "Acesso clínico completo — sem financeiro/admin",
  },
  gestor: {
    label: "Gestor",
    color: "#6366F1",
    descricao: "Gerenciamento da clínica",
  },
  recepcao: {
    label: "Recepção",
    color: "#10B981",
    descricao: "Atendimento e agendamento",
  },
  profissional: {
    label: "Profissional",
    color: "#3B82F6",
    descricao: "Área clínica e prontuários",
  },
  financeiro: {
    label: "Financeiro",
    color: "#F59E0B",
    descricao: "Gestão financeira",
  },
  visualizacao: {
    label: "Consulta",
    color: "#6B7280",
    descricao: "Somente leitura",
  },
};

// Menus disponíveis por perfil
export const MENU_PERMISSIONS = {
  super_admin: [
    "Dashboard", "Patients", "DossiePatient", "Agenda", "MedicalRecords",
    "FacialAnalysis", "BeforeAfterIA", "Protocols", "ProtocolosPremium",
    "Financial", "Inventory", "CRM", "Chat", "Intake",
    "Governanca", "VigilanciaPage", "ClinicSettingsPage", "Settings",
    "UsuariosPermissoes", "GitHubMonitor", "DREClinica",
  ],
  gestor: [
    "Dashboard", "Patients", "DossiePatient", "Agenda", "MedicalRecords",
    "Financial", "Protocols", "Governanca", "CRM", "Chat", "Intake",
    "UsuariosPermissoes",
  ],
  recepcao: [
    "Dashboard", "Patients", "DossiePatient", "Agenda", "Governanca", "CRM", "Chat",
  ],
  profissional_clinico_premium: [
    "Patients", "DossiePatient", "Agenda", "MedicalRecords",
    "FacialAnalysis", "BeforeAfterIA", "Protocols", "ProtocolosPremium",
    "CRM", "Chat",
  ],
  profissional: [
    "Dashboard", "Patients", "DossiePatient", "Agenda", "MedicalRecords",
    "FacialAnalysis", "BeforeAfterIA", "Protocols", "ProtocolosPremium",
  ],
  financeiro: [
    "Dashboard", "Financial", "DREClinica", "DossiePatient", "Governanca",
  ],
  visualizacao: [
    "Dashboard",
  ],
};

// Permissões de ação por perfil
export const ACTION_PERMISSIONS = {
  super_admin: {
    criar: true, editar: true, excluir: true, aprovar: true,
    assinar: true, configurar: true, gerenciar_usuarios: true,
    ver_financeiro: true, ver_auditoria: true, exportar: true,
  },
  gestor: {
    criar: true, editar: true, excluir: false, aprovar: true,
    assinar: true, configurar: false, gerenciar_usuarios: true,
    ver_financeiro: true, ver_auditoria: false, exportar: true,
  },
  recepcao: {
    criar: true, editar: true, excluir: false, aprovar: false,
    assinar: false, configurar: false, gerenciar_usuarios: false,
    ver_financeiro: false, ver_auditoria: false, exportar: false,
  },
  profissional_clinico_premium: {
    criar: true, editar: true, excluir: false, aprovar: false,
    assinar: true, configurar: false, gerenciar_usuarios: false,
    ver_financeiro: false, ver_auditoria: false, exportar: false,
  },
  profissional: {
    criar: true, editar: true, excluir: false, aprovar: false,
    assinar: true, configurar: false, gerenciar_usuarios: false,
    ver_financeiro: false, ver_auditoria: false, exportar: false,
  },
  financeiro: {
    criar: true, editar: true, excluir: false, aprovar: true,
    assinar: false, configurar: false, gerenciar_usuarios: false,
    ver_financeiro: true, ver_auditoria: false, exportar: true,
  },
  visualizacao: {
    criar: false, editar: false, excluir: false, aprovar: false,
    assinar: false, configurar: false, gerenciar_usuarios: false,
    ver_financeiro: false, ver_auditoria: false, exportar: false,
  },
};

/**
 * Retorna o perfil efetivo do usuário.
 * - Se role === 'admin' → super_admin
 * - Caso contrário, busca no ClinicUser pelo email
 */
export function getPerfilEfetivo(user, clinicUser) {
  if (!user) return "visualizacao";
  if (user.role === "admin") return "super_admin";
  if (clinicUser?.perfil) return clinicUser.perfil;
  return "visualizacao";
}

export function canAccessMenu(perfil, menuKey) {
  const allowed = MENU_PERMISSIONS[perfil] || MENU_PERMISSIONS.visualizacao;
  return allowed.includes(menuKey);
}

export function canDo(perfil, action) {
  const perms = ACTION_PERMISSIONS[perfil] || ACTION_PERMISSIONS.visualizacao;
  return !!perms[action];
}