import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../layouts/DashboardLayout';

// Pages
import Login from '../pages/Login';
import Dashboard from '../pages/Dashboard';
import SubstationManagement from '../pages/SubstationManagement';
import NewSubstation from '../pages/NewSubstation';
import SubstationAudit from '../pages/SubstationAudit';
import NewPT from '../pages/NewPT';
import PTAudits from '../pages/PTAudits';
import TechnicalSheet from '../pages/TechnicalSheet';

const PrivateRoute = ({ children }) => {
  const { signed, loading } = useAuth();

  if (loading) return (
    <div className="h-screen w-screen flex items-center justify-center bg-[#f8f9ff]">
      <div className="w-12 h-12 border-4 border-[#0d3fd1] border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
  
  if (!signed) return <Navigate to="/login" />;

  return <DashboardLayout>{children}</DashboardLayout>;
};

export default function AppRoutes() {
  const { signed, loading } = useAuth();

  if (loading) return null;

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={signed ? <Navigate to="/" /> : <Login />} />
        
        <Route path="/" element={
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        } />

        <Route path="/subestacoes" element={
          <PrivateRoute>
            <SubstationManagement />
          </PrivateRoute>
        } />

        <Route path="/subestacoes/nova" element={
          <PrivateRoute>
            <NewSubstation />
          </PrivateRoute>
        } />

        <Route path="/subestacoes/editar/:id" element={
          <PrivateRoute>
            <NewSubstation />
          </PrivateRoute>
        } />

        <Route path="/subestacoes/:id/auditoria" element={
          <PrivateRoute>
            <SubstationAudit />
          </PrivateRoute>
        } />

        <Route path="/subestacoes/:subestacaoId/pts/novo" element={
          <PrivateRoute>
            <NewPT />
          </PrivateRoute>
        } />

        <Route path="/subestacoes/:subestacaoId/pts/editar/:id" element={
          <PrivateRoute>
            <NewPT />
          </PrivateRoute>
        } />

        <Route path="/pts" element={
          <PrivateRoute>
            <PTAudits />
          </PrivateRoute>
        } />

        <Route path="/ficha-tecnica" element={
          <PrivateRoute>
            <TechnicalSheet />
          </PrivateRoute>
        } />

        <Route path="/ficha-tecnica/:id_pt" element={
          <PrivateRoute>
            <TechnicalSheet />
          </PrivateRoute>
        } />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}
