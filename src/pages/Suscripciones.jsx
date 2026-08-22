import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Plus, X } from 'lucide-react';
import { api } from '../api';
import Navbar from '../components/Navbar';

export default function Suscripciones() {
  const { token } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    proveedor: '',
    monto: '',
    frecuencia: 'mensual',
    fecha_inicio: new Date().toISOString().split('T')[0],
    esta_activa: true,
    categoria: 'entretenimiento',
  });

  useEffect(() => {
    fetchData();
  }, [token]);

  const fetchData = async () => {
    try {
      const [suscs, resumen] = await Promise.all([
        api.getSuscripciones(token),
        api.getResumenSuscripciones(token),
      ]);
      setData({ suscripciones: suscs.suscripciones || [], resumen });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { fecha_inicio, ...dataToSend } = formData;
      const payload = {
        ...dataToSend,
        monto: parseFloat(formData.monto),
        frecuencia: formData.frecuencia,
      };
      console.log('Creating subscription with payload:', payload);
      await api.createSuscripcion(token, payload);
      setShowForm(false);
      setFormData({
        nombre: '',
        proveedor: '',
        monto: '',
        frecuencia: 'mensual',
        fecha_inicio: new Date().toISOString().split('T')[0],
        esta_activa: true,
        categoria: 'entretenimiento',
      });
      fetchData();
    } catch (err) {
      console.error('Error creating subscription:', err);
      alert('Error al crear suscripción: ' + err.message);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Cargando...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-teal-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-teal-800">Suscripciones</h2>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-gradient-to-r from-teal-500 to-cyan-500 text-white px-4 py-2 rounded-lg hover:from-teal-600 hover:to-cyan-600 shadow-lg"
          >
            {showForm ? 'Cancelar' : '+ Nueva Suscripción'}
          </button>
        </div>

        {showForm && (
          <div className="bg-white/80 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-teal-100 mb-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-teal-700 mb-1">Nombre</label>
                  <input
                    type="text"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-teal-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white/50"
                    placeholder="Netflix, Spotify..."
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-teal-700 mb-1">Proveedor</label>
                  <input
                    type="text"
                    value={formData.proveedor}
                    onChange={(e) => setFormData({ ...formData, proveedor: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-teal-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white/50"
                    placeholder="Ej: Google, Apple..."
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-teal-700 mb-1">Monto</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.monto}
                    onChange={(e) => setFormData({ ...formData, monto: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-teal-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white/50"
                    placeholder="0.00"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-teal-700 mb-1">Frecuencia</label>
                  <select
                    value={formData.frecuencia}
                    onChange={(e) => setFormData({ ...formData, frecuencia: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-teal-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white/50"
                  >
                    <option value="mensual">Mensual</option>
                    <option value="anual">Anual</option>
                    <option value="semanal">Semanal</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-teal-700 mb-1">Categoría</label>
                  <select
                    value={formData.categoria}
                    onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-teal-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white/50"
                  >
                    <option value="entretenimiento">Entretenimiento</option>
                    <option value="utilidades">Utilidades</option>
                    <option value="software">Software</option>
                    <option value="salud">Salud</option>
                    <option value="educacion">Educación</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="esta_activa"
                  checked={formData.esta_activa}
                  onChange={(e) => setFormData({ ...formData, esta_activa: e.target.checked })}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                />
                <label htmlFor="esta_activa" className="text-sm text-teal-700">Suscripción activa</label>
              </div>
              <button 
                type="submit" 
                className="w-full bg-gradient-to-r from-teal-500 to-cyan-500 text-white py-3 rounded-lg hover:from-teal-600 hover:to-cyan-600 font-medium shadow-lg"
              >
                Guardar Suscripción
              </button>
            </form>
          </div>
        )}

        {/* Resumen */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white/80 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-teal-100">
            <h3 className="text-sm text-teal-500 mb-1">Gasto Mensual</h3>
            <p className="text-3xl font-bold text-blue-600">
              ${data?.resumen?.total_mensual?.toLocaleString() || 0}
            </p>
          </div>
          <div className="bg-white/80 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-teal-100">
            <h3 className="text-sm text-teal-500 mb-1">Gasto Anual</h3>
            <p className="text-3xl font-bold text-purple-600">
              ${data?.resumen?.total_anual?.toLocaleString() || 0}
            </p>
          </div>
          <div className="bg-white/80 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-teal-100">
            <h3 className="text-sm text-teal-500 mb-1">Cantidad</h3>
            <p className="text-3xl font-bold text-teal-800">
              {data?.resumen?.cantidad || 0}
            </p>
          </div>
        </div>

        {/* Próximas a vencer */}
        {data?.resumen?.proximas_a_vencer?.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 p-6 rounded-lg shadow mb-6">
            <h3 className="text-lg font-semibold text-yellow-800 mb-4">⚠️ Próximas a vencer</h3>
            <div className="space-y-2">
              {data.resumen.proximas_a_vencer.map((s, i) => (
                <div key={i} className="flex justify-between items-center">
                  <span className="text-yellow-700">{s.nombre}</span>
                  <span className="text-yellow-700 font-medium">${s.monto} en {s.dias} días</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Lista de suscripciones */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-teal-100">
          <div className="p-4 border-b">
            <h3 className="text-lg font-semibold text-teal-800">Todas las Suscripciones</h3>
          </div>
          {data?.suscripciones?.length > 0 ? (
            <div className="divide-y">
              {data.suscripciones.map((s) => (
                <div key={s.id} className="p-4 flex justify-between items-center">
                  <div>
                    <p className="font-medium text-teal-800">{s.nombre}</p>
                    <p className="text-sm text-teal-500">{s.proveedor || s.categoria} • {s.frecuencia}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-teal-800">${s.monto}</p>
                    <span className={`text-xs px-2 py-1 rounded ${s.esta_activa ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-teal-500'}`}>
                      {s.esta_activa ? 'Activa' : 'Inactiva'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-teal-500">
              <p>No hay suscripciones registradas</p>
              <p className="text-sm mt-2">Ejemplos: Netflix, Spotify, Gym, Apps...</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
