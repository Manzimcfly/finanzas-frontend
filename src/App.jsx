import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { WidgetConfigProvider } from './context/WidgetConfigContext';
import { ToastProvider } from './components/Toast';
import WidgetConfigModal from './components/WidgetConfigModal';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Transacciones from './pages/Transacciones';
import Presupuestos from './pages/Presupuestos';
import Inversiones from './pages/Inversiones';
import Suscripciones from './pages/Suscripciones';
import Metas from './pages/Metas';
import Cuentas from './pages/Cuentas';

function PrivateRoute({ children }) {
  const { token, loading } = useAuth();
  
  if (loading) return <div className="min-h-screen flex items-center justify-center dark:bg-slate-900">Cargando...</div>;
  
  return token ? children : <Navigate to="/login" />;
}

function AppContent() {
  const [showWidgetConfig, setShowWidgetConfig] = useState(false);

  return (
    <>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<PrivateRoute><Dashboard onOpenWidgetConfig={() => setShowWidgetConfig(true)} /></PrivateRoute>} />
        <Route path="/transacciones" element={<PrivateRoute><Transacciones /></PrivateRoute>} />
        <Route path="/presupuestos" element={<PrivateRoute><Presupuestos /></PrivateRoute>} />
        <Route path="/inversiones" element={<PrivateRoute><Inversiones /></PrivateRoute>} />
        <Route path="/suscripciones" element={<PrivateRoute><Suscripciones /></PrivateRoute>} />
        <Route path="/metas" element={<PrivateRoute><Metas /></PrivateRoute>} />
        <Route path="/cuentas" element={<PrivateRoute><Cuentas /></PrivateRoute>} />
      </Routes>
      <WidgetConfigModal 
        isOpen={showWidgetConfig} 
        onClose={() => setShowWidgetConfig(false)} 
      />
    </>
  );
}

function App() {
  return (
    <ThemeProvider>
      <WidgetConfigProvider>
        <AuthProvider>
          <ToastProvider>
            <BrowserRouter>
              <AppContent />
            </BrowserRouter>
          </ToastProvider>
        </AuthProvider>
      </WidgetConfigProvider>
    </ThemeProvider>
  );
}

export default App;