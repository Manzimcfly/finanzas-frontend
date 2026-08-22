import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, LogOut, Moon, Sun } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const navLinks = [
  { path: '/', label: 'Dashboard' },
  { path: '/transacciones', label: 'Transacciones' },
  { path: '/presupuestos', label: 'Presupuestos' },
  { path: '/inversiones', label: 'Inversiones' },
  { path: '/suscripciones', label: 'Suscripciones' },
  { path: '/metas', label: 'Metas' },
  { path: '/cuentas', label: 'Cuentas' },
];

export default function Navbar({ onOpenWidgetConfig }) {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { logout, user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <nav className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm shadow-lg border-b border-teal-100 dark:border-slate-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="text-lg sm:text-xl font-bold text-teal-700 dark:text-teal-400">
              💰 Finanzas
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  location.pathname === link.path
                    ? 'text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/30'
                    : 'text-gray-600 dark:text-gray-300 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/30'
                }`}
              >
                {link.label}
              </Link>
            ))}
            
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 ml-2 rounded-md text-gray-600 dark:text-gray-300 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/30 transition-colors"
              title={theme === 'light' ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro'}
            >
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>

            {/* Widget Config Button */}
            {location.pathname === '/' && (
              <button
                onClick={onOpenWidgetConfig}
                className="p-2 rounded-md text-gray-600 dark:text-gray-300 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/30 transition-colors"
                title="Configurar widgets"
              >
                ⚙️
              </button>
            )}

            <button
              onClick={logout}
              className="ml-4 px-4 py-2 text-sm bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 hover:bg-violet-100 dark:hover:bg-violet-900/50 rounded-md transition-colors flex items-center gap-2"
            >
              <LogOut size={16} />
              Salir
            </button>
          </div>

          {/* Mobile hamburger button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-md text-teal-600 dark:text-teal-400 hover:text-teal-800 dark:hover:text-teal-300 hover:bg-teal-50 dark:hover:bg-teal-900/30"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="md:hidden border-t border-teal-100 dark:border-slate-700">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setIsOpen(false)}
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  location.pathname === link.path
                    ? 'text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/30'
                    : 'text-gray-600 dark:text-gray-300 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/30'
                }`}
              >
                {link.label}
              </Link>
            ))}
            <div className="flex items-center gap-2 px-3 py-2 border-t border-teal-100 dark:border-slate-700 mt-2 pt-4">
              <button
                onClick={toggleTheme}
                className="flex items-center gap-2 px-3 py-2 rounded-md text-gray-600 dark:text-gray-300 hover:bg-teal-50 dark:hover:bg-teal-900/30"
              >
                {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
                {theme === 'light' ? 'Modo oscuro' : 'Modo claro'}
              </button>
            </div>
            <div className="pt-4 border-t border-teal-100 dark:border-slate-700">
              {user && (
                <div className="px-3 py-2 text-sm text-teal-600 dark:text-teal-400 mb-2">
                  👤 {user.username}
                </div>
              )}
              <button
                onClick={() => {
                  setIsOpen(false);
                  logout();
                }}
                className="w-full text-left px-3 py-2 rounded-md text-base font-medium text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/30 flex items-center gap-2"
              >
                <LogOut size={18} />
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}