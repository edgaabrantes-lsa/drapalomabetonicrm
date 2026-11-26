import React from "react";
import { Navigate } from "react-router-dom";
import { usePermissions } from "@/lib/PermissionsContext";
import { MENU_PERMISSIONS } from "@/lib/permissions";
import { createPageUrl } from "@/utils";

/** Página inicial: perfis sem acesso ao Dashboard vão para o primeiro módulo permitido. */
export default function HomeGate({ children }) {
  const { perfil, loading } = usePermissions();
  if (loading) return null;

  const menus = MENU_PERMISSIONS[perfil] || [];
  if (menus.includes("Dashboard")) return children;

  return <Navigate to={menus[0] ? createPageUrl(menus[0]) : "/login"} replace />;
}