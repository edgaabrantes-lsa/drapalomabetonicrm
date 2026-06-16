import React, { createContext, useContext, useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { getPerfilEfetivo, canAccessMenu, canDo, MENU_PERMISSIONS, ACTION_PERMISSIONS } from "./permissions";

const PermissionsContext = createContext(null);

export function PermissionsProvider({ children }) {
  const [user, setUser] = useState(null);
  const [clinicUser, setClinicUser] = useState(null);
  const [perfil, setPerfil] = useState("visualizacao");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const u = await base44.auth.me();
        setUser(u);
        if (u?.email) {
          const found = await base44.entities.ClinicUser.filter({ email: u.email });
          const cu = found?.[0] || null;
          setClinicUser(cu);
          setPerfil(getPerfilEfetivo(u, cu));
          // Registrar último acesso
          if (cu) {
            base44.entities.ClinicUser.update(cu.id, { ultimo_acesso: new Date().toISOString() }).catch(() => {});
          }
        }
      } catch (_) {
        setPerfil("visualizacao");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // MODO TREINAMENTO — acesso total liberado temporariamente
  const hasMenu = (_menuKey) => true;
  const hasAction = (_action) => true;

  return (
    <PermissionsContext.Provider value={{ user, clinicUser, perfil, loading, hasMenu, hasAction }}>
      {children}
    </PermissionsContext.Provider>
  );
}

export function usePermissions() {
  const ctx = useContext(PermissionsContext);
  if (!ctx) throw new Error("usePermissions must be used within PermissionsProvider");
  return ctx;
}