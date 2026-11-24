import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes, useLocation, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Mfa from './pages/Mfa';
import ProtocolosPremium from './pages/ProtocolosPremium';
import VigilanciaPage from './pages/VigilanciaPage';
import FullFaceSimulations from './pages/FullFaceSimulations';
import BeforeAfterIA from './pages/BeforeAfterIA.jsx';
import DossiePatient from './pages/DossiePatient.jsx';
import Governanca from './pages/Governanca.jsx';
import ClinicSettingsPage from './pages/ClinicSettingsPage.jsx';
import UsuariosPermissoes from './pages/UsuariosPermissoes.jsx';
import GitHubMonitor from './pages/GitHubMonitor.jsx';
import DREClinica from './pages/DREClinica.jsx';
import MesclarPacientes from './pages/MesclarPacientes.jsx';
import AuditoriaDuplicidades from './pages/AuditoriaDuplicidades.jsx';
import { PermissionsProvider } from '@/lib/PermissionsContext';
import PortalPaciente from './pages/PortalPaciente.jsx';
import PortalAdmin from './pages/PortalAdmin.jsx';
import PlanosAssinatura from './pages/PlanosAssinatura.jsx';
import SensorFlowForm from './pages/SensorFlowForm.jsx';
import GestaoFinanceira from './pages/GestaoFinanceira.jsx';
import AnalyticsAgenda from './pages/AnalyticsAgenda.jsx';
import SearchConsoleAgenda from './pages/SearchConsoleAgenda.jsx';
import AnamnesePacientes from './pages/AnamnesePacientes.jsx';

// Rotas do Portal da Paciente — fora do gate de autenticação (acesso por token)
function PortalRoutes() {
  return (
    <Routes>
      <Route path="/portal-paciente" element={<PortalPaciente />} />
      <Route path="/minha-jornada" element={<PortalPaciente />} />
      <Route path="/jornada-da-beleza-natural" element={<PortalPaciente />} />
    </Routes>
  );
}

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;

const LayoutWrapper = ({ children, currentPageName }) => Layout ?
  <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

const AppRoutes = () => {
  const { isLoadingPublicSettings } = useAuth();

  // Aguarda o carregamento das configurações públicas do app
  if (isLoadingPublicSettings) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Páginas de acesso */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/mfa" element={<Mfa />} />

      {/* Todo o app exige autenticação */}
      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
      <Route path="/" element={
        <LayoutWrapper currentPageName={mainPageKey}>
          <MainPage />
        </LayoutWrapper>
      } />
      {Object.entries(Pages).map(([path, Page]) => (
        <Route
          key={path}
          path={`/${path}`}
          element={
            <LayoutWrapper currentPageName={path}>
              <Page />
            </LayoutWrapper>
          }
        />
      ))}
      <Route path="*" element={<PageNotFound />} />
      
      {/* Nova rota de Protocolos Premium */}
      <Route path="/ProtocolosPremium" element={
        <LayoutWrapper currentPageName="ProtocolosPremium">
          <ProtocolosPremium />
        </LayoutWrapper>
      } />
      
      {/* Nova rota de Simulações Full Face */}
      <Route path="/FullFaceSimulations" element={
        <LayoutWrapper currentPageName="FullFaceSimulations">
          <FullFaceSimulations />
        </LayoutWrapper>
      } />
      
      {/* Vigilância Sanitária */}
      <Route path="/VigilanciaPage" element={
        <LayoutWrapper currentPageName="VigilanciaPage">
          <VigilanciaPage />
        </LayoutWrapper>
      } />

      {/* Gerar Antes e Depois com IA */}
      <Route path="/BeforeAfterIA" element={
        <LayoutWrapper currentPageName="BeforeAfterIA">
          <BeforeAfterIA />
        </LayoutWrapper>
      } />

      {/* Dossiê da Paciente */}
      <Route path="/DossiePatient" element={
        <LayoutWrapper currentPageName="DossiePatient">
          <DossiePatient />
        </LayoutWrapper>
      } />

      {/* Governança Documental */}
      <Route path="/Governanca" element={
        <LayoutWrapper currentPageName="Governanca">
          <Governanca />
        </LayoutWrapper>
      } />

      {/* Configurações da Clínica */}
      <Route path="/ClinicSettingsPage" element={
        <LayoutWrapper currentPageName="ClinicSettingsPage">
          <ClinicSettingsPage />
        </LayoutWrapper>
      } />

      {/* GitHub Monitor */}
      <Route path="/GitHubMonitor" element={
        <LayoutWrapper currentPageName="GitHubMonitor">
          <GitHubMonitor />
        </LayoutWrapper>
      } />

      {/* Usuários e Permissões */}
      <Route path="/UsuariosPermissoes" element={
        <LayoutWrapper currentPageName="UsuariosPermissoes">
          <UsuariosPermissoes />
        </LayoutWrapper>
      } />

      {/* DRE da Clínica */}
      <Route path="/DREClinica" element={
        <LayoutWrapper currentPageName="DREClinica">
          <DREClinica />
        </LayoutWrapper>
      } />

      {/* Mesclar Pacientes Duplicados (admin) */}
      <Route path="/MesclarPacientes" element={
        <LayoutWrapper currentPageName="MesclarPacientes">
          <MesclarPacientes />
        </LayoutWrapper>
      } />

      {/* Auditoria de Duplicidades (admin) */}
      <Route path="/AuditoriaDuplicidades" element={
        <LayoutWrapper currentPageName="AuditoriaDuplicidades">
          <AuditoriaDuplicidades />
        </LayoutWrapper>
      } />

      {/* Portal da Paciente — atalho administrativo (admin) */}
      <Route path="/PortalAdmin" element={
        <LayoutWrapper currentPageName="PortalAdmin">
          <PortalAdmin />
        </LayoutWrapper>
      } />

      {/* Planos de Assinatura */}
      <Route path="/PlanosAssinatura" element={
        <LayoutWrapper currentPageName="PlanosAssinatura">
          <PlanosAssinatura />
        </LayoutWrapper>
      } />

      {/* Gestão Financeira */}
      <Route path="/GestaoFinanceira" element={
        <LayoutWrapper currentPageName="GestaoFinanceira">
          <GestaoFinanceira />
        </LayoutWrapper>
      } />

      {/* Analytics — Acessos à Agenda (Google Analytics) */}
      <Route path="/AnalyticsAgenda" element={
        <LayoutWrapper currentPageName="AnalyticsAgenda">
          <AnalyticsAgenda />
        </LayoutWrapper>
      } />

      {/* Search Console — Páginas de Agendamento */}
      <Route path="/SearchConsoleAgenda" element={
        <LayoutWrapper currentPageName="SearchConsoleAgenda">
          <SearchConsoleAgenda />
        </LayoutWrapper>
      } />

      {/* Anamnese de Pacientes + Mapa Facial */}
      <Route path="/AnamnesePacientes" element={
        <LayoutWrapper currentPageName="AnamnesePacientes">
          <AnamnesePacientes />
        </LayoutWrapper>
      } />
      </Route>
    </Routes>
  );
};


function App() {

  return (
    <QueryClientProvider client={queryClientInstance}>
      <Router>
        <AppRouter />
      </Router>
      <Toaster />
    </QueryClientProvider>
  )
}

// Sensor Flow não monta os provedores de autenticação e permissões da equipe.
function AppRouter() {
  const location = useLocation();
  const path = location.pathname.replace(/\/+$/, "").toLowerCase();

  if (path === "/sensorflow") {
    return (
      <Routes>
        <Route path="/sensorflow" element={<SensorFlowForm />} />
      </Routes>
    );
  }

  const isPortal = path === "/portal-paciente" || path === "/minha-jornada" || path === "/jornada-da-beleza-natural";
  return (
    <AuthProvider>
      <PermissionsProvider>
        {isPortal ? <PortalRoutes /> : <AppRoutes />}
      </PermissionsProvider>
    </AuthProvider>
  );
}

export default App