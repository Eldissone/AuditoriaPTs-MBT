import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../layouts/DashboardLayout';

// Pages - Lazy Load for performance
import Login from '../pages/Login';
const Dashboard = React.lazy(() => import('../pages/Dashboard'));
const SubstationManagement = React.lazy(() => import('../pages/SubstationManagement'));
const NewSubstation = React.lazy(() => import('../pages/NewSubstation'));
const SubstationAudit = React.lazy(() => import('../pages/SubstationAudit'));
const NewPT = React.lazy(() => import('../pages/NewPT'));
const PTAudits = React.lazy(() => import('../pages/PTAudits'));
const TechnicalSheet = React.lazy(() => import('../pages/TechnicalSheet'));
const UserManagement = React.lazy(() => import('../pages/UserManagement'));
const TaskManagement = React.lazy(() => import('../pages/TaskManagement'));
const MyTasks = React.lazy(() => import('../pages/MyTasks'));

// Loading fallback component
const PageLoader = () => (
  <div className="h-screen w-screen flex items-center justify-center bg-[#f8f9ff]">
    <div className="w-12 h-12 border-4 border-[#0d3fd1] border-t-transparent rounded-full animate-spin"></div>
  </div>
);

const PrivateRoute = ({ children, requiredPerm }) => {
  const { user, signed, loading } = useAuth();

  if (loading) return <PageLoader />;

  if (!signed) return <Navigate to="/login" />;

  // Autorização baseada em permissões
  if (requiredPerm && user?.role !== 'admin') {
    const permissoes = user?.permissoes || [];
    if (!permissoes.includes(requiredPerm)) {
      return <Navigate to="/" />; // Redireciona se não tiver acesso
    }
  }

  return <DashboardLayout>{children}</DashboardLayout>;
};

export default function AppRoutes() {
  const { user, signed, loading } = useAuth();

  if (loading) return null;

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={signed ? <Navigate to="/" /> : <Login />} />

        <Route path="/" element={
          <PrivateRoute>
            <Suspense fallback={<PageLoader />}>
              <Dashboard />
            </Suspense>
          </PrivateRoute>
        } />

        <Route path="/subestacoes" element={
          <PrivateRoute requiredPerm="/subestacoes">
            <Suspense fallback={<PageLoader />}>
              <SubstationManagement />
            </Suspense>
          </PrivateRoute>
        } />

        <Route path="/subestacoes/nova" element={
          <PrivateRoute requiredPerm="/subestacoes">
            <Suspense fallback={<PageLoader />}>
              <NewSubstation />
            </Suspense>
          </PrivateRoute>
        } />

        <Route path="/subestacoes/editar/:id" element={
          <PrivateRoute>
            <Suspense fallback={<PageLoader />}>
              <NewSubstation />
            </Suspense>
          </PrivateRoute>
        } />

        <Route path="/subestacoes/:id/auditoria" element={
          <PrivateRoute>
            <Suspense fallback={<PageLoader />}>
              <SubstationAudit />
            </Suspense>
          </PrivateRoute>
        } />

        <Route path="/subestacoes/:subestacaoId/pts/novo" element={
          <PrivateRoute>
            <Suspense fallback={<PageLoader />}>
              <NewPT />
            </Suspense>
          </PrivateRoute>
        } />

        <Route path="/subestacoes/:subestacaoId/pts/editar/:id" element={
          <PrivateRoute>
            <Suspense fallback={<PageLoader />}>
              <NewPT />
            </Suspense>
          </PrivateRoute>
        } />

        <Route path="/pts" element={
          <PrivateRoute requiredPerm="/pts">
            <Suspense fallback={<PageLoader />}>
              <PTAudits />
            </Suspense>
          </PrivateRoute>
        } />

        <Route path="/ficha-tecnica" element={
          <PrivateRoute requiredPerm="/ficha-tecnica">
            <Suspense fallback={<PageLoader />}>
              <TechnicalSheet />
            </Suspense>
          </PrivateRoute>
        } />

        <Route path="/ficha-tecnica/:id_pt" element={
          <PrivateRoute requiredPerm="/ficha-tecnica">
            <Suspense fallback={<PageLoader />}>
              <TechnicalSheet />
            </Suspense>
          </PrivateRoute>
        } />

        <Route path="/usuarios" element={
          <PrivateRoute>
            <Suspense fallback={<PageLoader />}>
              {user?.role === 'admin' ? <UserManagement /> : <Navigate to="/" />}
            </Suspense>
          </PrivateRoute>
        } />

        <Route path="/tarefas" element={
          <PrivateRoute>
            <Suspense fallback={<PageLoader />}>
              {user?.role === 'admin' ? <TaskManagement /> : <Navigate to="/" />}
            </Suspense>
          </PrivateRoute>
        } />

        <Route path="/minhas-tarefas" element={
          <PrivateRoute requiredPerm="/minhas-tarefas">
            <Suspense fallback={<PageLoader />}>
              <MyTasks />
            </Suspense>
          </PrivateRoute>
        } />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}
