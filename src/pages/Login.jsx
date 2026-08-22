import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    email: '',
    nombre_completo: '',
  });
  const [error, setError] = useState('');
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      if (isLogin) {
        await login(formData.username, formData.password);
      } else {
        await register(formData);
        await login(formData.username, formData.password);
      }
      navigate('/');
    } catch (err) {
      setError(err.message || 'Error de autenticación');
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-violet-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center">
      <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm p-8 rounded-2xl shadow-xl w-full max-w-md border border-teal-100 dark:border-slate-700">
        <h1 className="text-2xl font-bold text-center mb-6 text-teal-700 dark:text-teal-400">
          💰 Finanzas App
        </h1>
        
        <h2 className="text-xl font-semibold mb-4 text-teal-800 dark:text-teal-300">
          {isLogin ? 'Iniciar Sesión' : 'Registrarse'}
        </h2>
        
        {error && (
          <div className="bg-red-50 dark:bg-red-900/50 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-teal-700 dark:text-teal-300">Usuario</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-teal-200 dark:border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white/50 dark:bg-slate-700/50 text-gray-900 dark:text-white"
              required
            />
          </div>
          
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-teal-700 dark:text-teal-300">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-teal-200 dark:border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white/50 dark:bg-slate-700/50 text-gray-900 dark:text-white"
                required
              />
            </div>
          )}
          
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-teal-700 dark:text-teal-300">Nombre Completo</label>
              <input
                type="text"
                name="nombre_completo"
                value={formData.nombre_completo}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-teal-200 dark:border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white/50 dark:bg-slate-700/50 text-gray-900 dark:text-white"
              />
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-teal-700 dark:text-teal-300">Contraseña</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-teal-200 dark:border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white/50 dark:bg-slate-700/50 text-gray-900 dark:text-white"
              required
            />
          </div>
          
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-teal-500 to-cyan-500 text-white py-2 px-4 rounded-lg hover:from-teal-600 hover:to-cyan-600 transition-all shadow-lg"
          >
            {isLogin ? 'Iniciar Sesión' : 'Registrarse'}
          </button>
        </form>
        
        <p className="mt-4 text-center text-sm text-teal-600 dark:text-teal-400">
          {isLogin ? '¿No tienes cuenta? ' : '¿Ya tienes cuenta? '}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-violet-600 dark:text-violet-400 hover:underline font-medium"
          >
            {isLogin ? 'Regístrate' : 'Inicia sesión'}
          </button>
        </p>
      </div>
    </div>
  );
}
