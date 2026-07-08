import React, { useState, useEffect } from "react";
import PortalAccess from "@/components/portalPaciente/PortalAccess";
import PortalLayout from "@/components/portalPaciente/PortalLayout";
import PortalHome from "@/components/portalPaciente/PortalHome";
import MeuPlano from "@/components/portalPaciente/MeuPlano";
import MeusAgendamentos from "@/components/portalPaciente/MeusAgendamentos";
import CuidadosPosProcedimento from "@/components/portalPaciente/CuidadosPosProcedimento";
import MinhaEvolucao from "@/components/portalPaciente/MinhaEvolucao";
import TermosConsentimentos from "@/components/portalPaciente/TermosConsentimentos";
import ClubeRecorrencia from "@/components/portalPaciente/ClubeRecorrencia";
import BibliotecaConteudos from "@/components/portalPaciente/BibliotecaConteudos";
import FalarEquipe from "@/components/portalPaciente/FalarEquipe";
import { DEFAULT_WHATSAPP, whatsappLink, WHATSAPP_MESSAGES } from "@/components/portalPaciente/portalConfig";

export default function PortalPaciente() {
  const [token, setToken] = useState(null);
  const [patient, setPatient] = useState(null);
  const [whatsappNumber, setWhatsappNumber] = useState(DEFAULT_WHATSAPP);
  const [section, setSection] = useState("home");

  // Tenta ler token da URL (?t= / ?token=) ao montar
  useEffect(() => {
    const url = new URLSearchParams(window.location.search);
    const t = url.get("t") || url.get("token");
    if (t) {
      setToken(t);
      window.history.replaceState({}, document.title, window.location.pathname);
    } else {
      // tenta session storage (acesso já feito nesta aba)
      const saved = sessionStorage.getItem("portal_token");
      if (saved) setToken(saved);
    }
  }, []);

  function handleAuthenticated(t, data) {
    setToken(t);
    sessionStorage.setItem("portal_token", t);
    if (data?.patient) setPatient(data.patient);
    if (data?.clinic?.whatsapp) setWhatsappNumber(data.clinic.whatsapp);
  }

  // Já tem token na URL/session mas ainda não carregou paciente
  useEffect(() => {
    if (token && !patient) {
      import("@/api/base44Client").then(({ base44 }) => {
        base44.functions.invoke("portalPaciente", { action: "validate", token })
          .then(res => {
            if (res.data?.patient) {
              setPatient(res.data.patient);
              if (res.data?.clinic?.whatsapp) setWhatsappNumber(res.data.clinic.whatsapp);
            } else if (res.data?.error) {
              sessionStorage.removeItem("portal_token");
              setToken(null);
            }
          })
          .catch(() => {});
      });
    }
  }, [token, patient]);

  if (!token || !patient) {
    return <PortalAccess onAuthenticated={handleAuthenticated} />;
  }

  const whatsappUrl = whatsappLink(whatsappNumber, WHATSAPP_MESSAGES.duvida);

  function renderSection() {
    switch (section) {
      case "home": return <PortalHome patient={patient} onNavigate={setSection} />;
      case "plano": return <MeuPlano token={token} whatsappNumber={whatsappNumber} onNavigate={setSection} />;
      case "agenda": return <MeusAgendamentos token={token} whatsappNumber={whatsappNumber} />;
      case "cuidados": return <CuidadosPosProcedimento token={token} whatsappNumber={whatsappNumber} onNavigate={setSection} />;
      case "evolucao": return <MinhaEvolucao token={token} />;
      case "termos": return <TermosConsentimentos token={token} />;
      case "clube": return <ClubeRecorrencia token={token} whatsappNumber={whatsappNumber} onNavigate={setSection} />;
      case "biblioteca": return <BibliotecaConteudos />;
      case "falar": return <FalarEquipe token={token} whatsappNumber={whatsappNumber} onNavigate={setSection} />;
      default: return <PortalHome patient={patient} onNavigate={setSection} />;
    }
  }

  return (
    <PortalLayout patient={patient} section={section} onNavigate={setSection} whatsappUrl={whatsappUrl}>
      {renderSection()}
    </PortalLayout>
  );
}