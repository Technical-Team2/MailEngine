import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store/authStore';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ContactsPage from './pages/ContactsPage';
import TemplatesPage from './pages/TemplatesPage';
import CampaignsPage from './pages/CampaignsPage';
import SectorsPage from './pages/SectorsPage';
import ExtractorPage from './pages/ExtractorPage';
import './styles/globals.css';

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 1000 * 60 * 5, retry: 1 } },
});

function ProtectedLayout({ children }) {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Header />
        <main className="page-body">{children}</main>
      </div>
    </div>
  );
}

export default function App() {
  const { initAuth } = useAuthStore();

  useEffect(() => { initAuth(); }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<ProtectedLayout><DashboardPage /></ProtectedLayout>} />
          <Route path="/contacts" element={<ProtectedLayout><ContactsPage /></ProtectedLayout>} />
          <Route path="/templates" element={<ProtectedLayout><TemplatesPage /></ProtectedLayout>} />
          <Route path="/campaigns" element={<ProtectedLayout><CampaignsPage /></ProtectedLayout>} />
          <Route path="/campaigns/new" element={<ProtectedLayout><CampaignsPage /></ProtectedLayout>} />
          <Route path="/sectors" element={<ProtectedLayout><SectorsPage /></ProtectedLayout>} />
          <Route path="/extractor" element={<ProtectedLayout><ExtractorPage /></ProtectedLayout>} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: 'var(--bg-elevated)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border)',
            fontFamily: 'var(--font-body)',
            fontSize: 13.5,
          },
          success: { iconTheme: { primary: 'var(--success)', secondary: 'var(--bg-elevated)' } },
          error: { iconTheme: { primary: 'var(--danger)', secondary: 'var(--bg-elevated)' } },
        }}
      />
    </QueryClientProvider>
  );
}
