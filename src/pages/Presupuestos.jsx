import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import Navbar from '../components/Navbar';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, Legend } from 'recharts';
import { Settings, X } from 'lucide-react';

export default function Presupuestos() {
  const { token } = useAuth();
  const [resumen, setResumen] = useState(null);
  const [fondoEmergencia, setFondoEmergencia] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mesesObjetivo, setMesesObjetivo] = useState(6);
  const [activeTab, setActiveTab] = useState('resumen');
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [configCategorias, setConfigCategorias] = useState([]);
  const [loadingConfig, setLoadingConfig] = useState(false);
  const [showMovimientoModal, setShowMovimientoModal] = useState(false);
  const [movimientoForm, setMovimientoForm] = useState({ monto: '', tipo: 'aportacion', nota: '' });
  const [savingMovimiento, setSavingMovimiento] = useState(false);

  const openMovimientoModal = () => {
    setMovimientoForm({ monto: '', tipo: 'aportacion', nota: '' });
    setShowMovimientoModal(true);
  };

  const handleAddMovimiento = async () => {
    if (!movimientoForm.monto || parseFloat(movimientoForm.monto) <= 0) return;
    
    try {
      setSavingMovimiento(true);
      await api.addFondoEmergenciaMovimiento(token, {
        monto: parseFloat(movimientoForm.monto),
        tipo: movimientoForm.tipo,
        nota: movimientoForm.nota || null
      });
      setShowMovimientoModal(false);
      const fondoData = await api.getFondoEmergencia(token, new Date().getMonth() + 1, new Date().getFullYear(), mesesObjetivo);
      setFondoEmergencia(fondoData);
    } catch (err) {
      console.error('Error adding movimiento:', err);
    } finally {
      setSavingMovimiento(false);
    }
  };

  const handleDeleteMovimiento = async (movimientoId) => {
    try {
      await api.deleteFondoEmergenciaMovimiento(token, movimientoId);
      const fondoData = await api.getFondoEmergencia(token, new Date().getMonth() + 1, new Date().getFullYear(), mesesObjetivo);
      setFondoEmergencia(fondoData);
    } catch (err) {
      console.error('Error deleting movimiento:', err);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const hoy = new Date();
        console.log('Fetching data for mes:', hoy.getMonth() + 1, 'anio:', hoy.getFullYear());
        
        const resumenData = await api.getResumen502030(token, hoy.getMonth() + 1, hoy.getFullYear());
        console.log('Resumen received:', resumenData);
        
        const fondoData = await api.getFondoEmergencia(token, hoy.getMonth() + 1, hoy.getFullYear(), mesesObjetivo);
        console.log('Fondo received:', fondoData);
        
        setResumen(resumenData);
        setFondoEmergencia(fondoData);
      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };
    
    if (token) {
      fetchData();
    }
  }, [token, mesesObjetivo]);

  const openConfigModal = async () => {
    setShowConfigModal(true);
    setLoadingConfig(true);
    try {
      const data = await api.getConfiguracionEsenciales(token);
      
      const todasCategorias = {};
      
      data.configuraciones?.forEach(c => {
        todasCategorias[c.categoria_id] = {
          categoria_id: c.categoria_id,
          categoria_nombre: c.categoria_nombre,
          categoria_icono: c.categoria_icono,
          es_esencial: c.es_esencial,
          configurado: true
        };
      });
      
      data.categorias_sin_configurar?.forEach(c => {
        if (!todasCategorias[c.categoria_id]) {
          todasCategorias[c.categoria_id] = {
            categoria_id: c.categoria_id,
            categoria_nombre: c.categoria_nombre,
            categoria_icono: c.categoria_icono,
            es_esencial: null,
            configurado: false
          };
        }
      });
      
      setConfigCategorias(Object.values(todasCategorias).sort((a, b) => 
        (b.es_esencial === true) - (a.es_esencial === true) || 
        a.categoria_nombre.localeCompare(b.categoria_nombre)
      ));
    } catch (err) {
      console.error('Error loading config:', err);
    } finally {
      setLoadingConfig(false);
    }
  };

  const toggleCategoriaEsencial = (catId) => {
    setConfigCategorias(prev => prev.map(cat => {
      if (cat.categoria_id === catId) {
        const newValue = cat.es_esencial === true ? false : true;
        return { ...cat, es_esencial: newValue, configurado: true };
      }
      return cat;
    }));
  };

  const saveConfiguracion = async () => {
    try {
      const configuraciones = configCategorias
        .filter(c => c.configurado)
        .map(c => ({
          categoria_id: c.categoria_id,
          es_esencial: c.es_esencial === true
        }));
      
      await api.guardarConfiguracionEsenciales(token, configuraciones);
      setShowConfigModal(false);
      
      const hoy = new Date();
      const fondoData = await api.getFondoEmergencia(token, hoy.getMonth() + 1, hoy.getFullYear(), mesesObjetivo);
      setFondoEmergencia(fondoData);
    } catch (err) {
      console.error('Error saving config:', err);
      alert('Error al guardar configuración');
    }
  };

  const COLORS = ['#10B981', '#F59E0B', '#3B82F6'];

  if (loading) return <div className="min-h-screen flex items-center justify-center">Cargando...</div>;

  if (!resumen && !fondoEmergencia) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-teal-50">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-20">
            <p className="text-xl text-gray-600 mb-4">Error cargando datos</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-teal-600 text-white rounded-lg"
            >
              Recargar
            </button>
          </div>
        </main>
      </div>
    );
  }

  const gastoSeleccionado = mesesObjetivo === 3 ? fondoEmergencia?.fondo_necesario_3_meses :
                          mesesObjetivo === 6 ? fondoEmergencia?.fondo_necesario_6_meses :
                          fondoEmergencia?.fondo_necesario_12_meses;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-teal-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('resumen')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'resumen' 
                ? 'bg-teal-600 text-white' 
                : 'bg-white text-teal-600 hover:bg-teal-50'
            }`}
          >
            50/30/20
          </button>
          <button
            onClick={() => setActiveTab('fondo')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'fondo' 
                ? 'bg-teal-600 text-white' 
                : 'bg-white text-teal-600 hover:bg-teal-50'
            }`}
          >
            🛡️ Fondo de Emergencia
          </button>
        </div>

        {activeTab === 'resumen' && (
          <>
            <h2 className="text-2xl font-bold text-teal-800 mb-6">Regla 50/30/20</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-gradient-to-br from-emerald-400 to-teal-500 p-6 rounded-xl shadow-lg text-white">
                <h3 className="text-lg font-semibold text-white mb-4">🏠 Necesidades (50%)</h3>
                <p className="text-2xl font-bold">${resumen?.necesidades_limite?.toLocaleString() || 0}</p>
                <p className="text-sm text-emerald-100 mt-2">Gastado: ${resumen?.necesidades_actual?.toLocaleString() || 0}</p>
                <div className="mt-4 bg-white/30 rounded-full h-3">
                  <div
                    className="bg-white h-3 rounded-full"
                    style={{ width: `${Math.min((resumen?.necesidades_actual / resumen?.necesidades_limite) * 100 || 0, 100)}%` }}
                  />
                </div>
              </div>

              <div className="bg-gradient-to-br from-amber-400 to-orange-500 p-6 rounded-xl shadow-lg text-white">
                <h3 className="text-lg font-semibold text-white mb-4">🎉 Deseos (30%)</h3>
                <p className="text-2xl font-bold">${resumen?.deseos_limite?.toLocaleString() || 0}</p>
                <p className="text-sm text-amber-100 mt-2">Gastado: ${resumen?.deseos_actual?.toLocaleString() || 0}</p>
                <div className="mt-4 bg-white/30 rounded-full h-3">
                  <div
                    className="bg-white h-3 rounded-full"
                    style={{ width: `${Math.min((resumen?.deseos_actual / resumen?.deseos_limite) * 100 || 0, 100)}%` }}
                  />
                </div>
              </div>

              <div className="bg-gradient-to-br from-violet-500 to-purple-600 p-6 rounded-xl shadow-lg text-white">
                <h3 className="text-lg font-semibold text-white mb-4">💰 Ahorro (20%)</h3>
                <p className="text-2xl font-bold">${resumen?.ahorro_limite?.toLocaleString() || 0}</p>
                <p className="text-sm text-violet-100 mt-2">Ahorrado: ${resumen?.ahorro_actual?.toLocaleString() || 0}</p>
                <div className="mt-4 bg-white/30 rounded-full h-3">
                  <div
                    className="bg-white h-3 rounded-full"
                    style={{ width: `${Math.min((resumen?.ahorro_actual / resumen?.ahorro_limite) * 100 || 0, 100)}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-teal-100">
              <h3 className="text-lg font-semibold text-teal-800 mb-4">💡 Recomendaciones</h3>
              <ul className="space-y-3">
                {resumen?.recomendaciones?.map((rec, i) => (
                  <li key={i} className="text-teal-700">{rec}</li>
                ))}
              </ul>
            </div>

            <div className="bg-white/80 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-teal-100 mt-6">
              <h3 className="text-lg font-semibold text-teal-800 mb-4">Distribución 50/30/20</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Necesidades', value: resumen?.necesidades_limite || 0 },
                      { name: 'Deseos', value: resumen?.deseos_limite || 0 },
                      { name: 'Ahorro', value: resumen?.ahorro_limite || 0 },
                    ]}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {[0, 1, 2].map((index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </>
        )}

        {activeTab === 'fondo' && fondoEmergencia && (
          <>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-2xl font-bold text-teal-800">🛡️ Fondo de Emergencia</h2>
              <button
                onClick={openConfigModal}
                className="flex items-center gap-2 px-4 py-2 bg-white text-teal-600 rounded-lg hover:bg-teal-50 shadow-md border border-teal-200"
              >
                <Settings size={18} />
                Configurar Gastos
              </button>
            </div>
            <p className="text-teal-600 mb-6">{fondoEmergencia.que_es_fondo_emergencia}</p>

            {/* Selector de meses */}
            <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl shadow-lg border border-teal-100 mb-6">
              <p className="text-sm font-medium text-teal-700 mb-3">¿Cuántos meses quieres cubrir?</p>
              <div className="flex gap-3">
                {[3, 6, 12].map((meses) => (
                  <button
                    key={meses}
                    onClick={() => setMesesObjetivo(meses)}
                    className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
                      mesesObjetivo === meses
                        ? 'bg-gradient-to-br from-teal-500 to-cyan-500 text-white shadow-lg'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {meses} meses
                    <span className="block text-sm mt-1">
                      ${(fondoEmergencia.gastos_esenciales_promedio * meses).toLocaleString()}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Resumen de metas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-gradient-to-br from-emerald-400 to-teal-500 p-5 rounded-xl shadow-lg text-white">
                <p className="text-sm text-emerald-100 mb-1">Gastos Esenciales/Mes</p>
                <p className="text-2xl font-bold">${fondoEmergencia.gastos_esenciales_promedio?.toLocaleString() || 0}</p>
                <p className="text-xs text-emerald-200 mt-1">Para sobrevivir sin empleo</p>
              </div>
              <div className="bg-gradient-to-br from-amber-400 to-orange-500 p-5 rounded-xl shadow-lg text-white">
                <p className="text-sm text-amber-100 mb-1">Gastos No Esenciales/Mes</p>
                <p className="text-2xl font-bold">${fondoEmergencia.gastos_flexibles_promedio?.toLocaleString() || 0}</p>
                <p className="text-xs text-amber-200 mt-1">Pueden reducirse en crisis</p>
              </div>
              <div className="bg-gradient-to-br from-cyan-400 to-blue-500 p-5 rounded-xl shadow-lg text-white">
                <p className="text-sm text-cyan-100 mb-1">Total Gastos/Mes</p>
                <p className="text-2xl font-bold">${fondoEmergencia.gastos_mensuales_promedio?.toLocaleString() || 0}</p>
                <p className="text-xs text-cyan-200 mt-1">Suma de todos los gastos</p>
              </div>
              <div className={`p-5 rounded-xl shadow-lg text-white ${
                    fondoEmergencia.meta_completada 
                      ? 'bg-gradient-to-br from-emerald-500 to-emerald-600' 
                      : 'bg-gradient-to-br from-violet-500 to-purple-600'
                  }`}>
                <p className="text-sm text-violet-100 mb-1">Tu Meta ({mesesObjetivo} meses)</p>
                <p className="text-2xl font-bold">${gastoSeleccionado?.toLocaleString() || 0}</p>
                <p className="text-xs text-violet-200 mt-1">{mesesObjetivo} × ${fondoEmergencia.gastos_esenciales_promedio?.toLocaleString()}</p>
                {fondoEmergencia.fondo_actual > 0 && (
                  <div className="mt-2 pt-2 border-t border-violet-400/30">
                    <p className="text-xs text-violet-200">
                      💰 Ahorrado: ${fondoEmergencia.fondo_actual?.toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Detalle de gastos esenciales */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <div className="bg-white/80 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-teal-100">
                <h3 className="text-lg font-semibold text-teal-800 mb-4">📊 Tus Gastos por Categoría</h3>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {fondoEmergencia.analisis_gastos?.gastos_por_categoria
                    ?.sort((a, b) => b.monto_promedio - a.monto_promedio)
                    .map((gasto, i) => (
                      <div 
                        key={i}
                        className={`flex items-center justify-between p-3 rounded-lg ${
                          gasto.es_esencial ? 'bg-emerald-50 border-l-4 border-emerald-500' : 'bg-amber-50 border-l-4 border-amber-500'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{gasto.categoria_icono}</span>
                          <div>
                            <p className="font-medium text-teal-800">{gasto.categoria_nombre}</p>
                            <p className={`text-xs ${gasto.es_esencial ? 'text-emerald-600' : 'text-amber-600'}`}>
                              {gasto.es_esencial ? '✓ Esencial' : '~ No Esencial'}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-teal-800">${gasto.monto_promedio?.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}</p>
                          <p className="text-xs text-teal-500">/mes</p>
                        </div>
                      </div>
                    ))}
                  {(!fondoEmergencia.analisis_gastos?.gastos_por_categoria || 
                    fondoEmergencia.analisis_gastos.gastos_por_categoria.length === 0) && (
                    <p className="text-center text-gray-500 py-4">No hay gastos registrados para analizar</p>
                  )}
                </div>
              </div>

              <div className="space-y-6">
                {/* Gráfico */}
                <div className="bg-white/80 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-teal-100">
                  <h3 className="text-lg font-semibold text-teal-800 mb-4">Distribución de Gastos</h3>
                  {fondoEmergencia && (fondoEmergencia.gastos_esenciales_promedio > 0 || fondoEmergencia.gastos_flexibles_promedio > 0) ? (
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Esenciales', value: Math.round(fondoEmergencia.gastos_esenciales_promedio) },
                            { name: 'No Esenciales', value: Math.round(fondoEmergencia.gastos_flexibles_promedio) },
                          ].filter(d => d.value > 0)}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={90}
                          paddingAngle={2}
                          dataKey="value"
                          label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                        >
                          <Cell key="cell-esencial" fill="#10B981" />
                          <Cell key="cell-no-esencial" fill="#F59E0B" />
                        </Pie>
                        <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-center text-gray-500 py-8">Sin datos de gastos</p>
                  )}
                </div>

                {/* Tu Progreso */}
                <div className="bg-white/80 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-teal-100">
                  <h3 className="text-lg font-semibold text-teal-800 mb-4">
                    {fondoEmergencia.meta_completada ? '🎉 ¡Meta Alcanzada!' : '📈 Tu Progreso'}
                  </h3>
                  
                  {/* Barra de progreso */}
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-medium text-teal-700">
                        ${fondoEmergencia.fondo_actual?.toLocaleString() || 0}
                      </span>
                      <span className="text-teal-600">
                        de ${gastoSeleccionado?.toLocaleString() || 0}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          fondoEmergencia.meta_completada 
                            ? 'bg-gradient-to-r from-emerald-400 to-emerald-600' 
                            : 'bg-gradient-to-r from-teal-500 to-cyan-500'
                        }`}
                        style={{ width: `${Math.min(fondoEmergencia.progreso_porcentaje || 0, 100)}%` }}
                      />
                    </div>
                    <p className="text-center text-sm text-teal-600 mt-2">
                      {fondoEmergencia.progreso_porcentaje?.toFixed(1)}% completado
                    </p>
                  </div>

                  {/* Info de la cuenta */}
                  {fondoEmergencia.cuenta_nombre ? (
                    <div className="bg-gradient-to-br from-teal-50 to-cyan-50 p-4 rounded-lg border border-teal-200">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center">
                          🏦
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-teal-800">{fondoEmergencia.cuenta_nombre}</p>
                          {fondoEmergencia.cuenta_banco && (
                            <p className="text-sm text-teal-600">{fondoEmergencia.cuenta_banco}</p>
                          )}
                          <div className="flex items-center gap-4 mt-2">
                            {fondoEmergencia.cuenta_tasa_retorno > 0 && (
                              <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded">
                                📈 {fondoEmergencia.cuenta_tasa_retorno}% anual
                              </span>
                            )}
                            {fondoEmergencia.cuenta_rendimiento_anual > 0 && (
                              <span className="text-xs bg-teal-100 text-teal-700 px-2 py-1 rounded">
                                +${fondoEmergencia.cuenta_rendimiento_anual?.toLocaleString(undefined, {maximumFractionDigits: 0})} rendimientos/año
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                      <p className="text-sm text-amber-700">
                        ⚠️ No tienes una cuenta marcada como Fondo de Emergencia. 
                        Ve a Cuentas y marca una como "Fondo de Emergencia" para rastrear tu progreso.
                      </p>
                    </div>
                  )}

                  {fondoEmergencia.meta_completada && (
                    <div className="mt-4 bg-emerald-100 p-3 rounded-lg">
                      <p className="text-emerald-700 font-medium text-sm">
                        ✅ ¡Felicidades! Ya tienes {mesesObjetivo} meses de gastos esenciales cubiertos.
                        Considera destinar ese dinero a inversiones.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Historial de aportaciones */}
            {fondoEmergencia.cuenta_nombre && (
              <div className="bg-white/80 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-teal-100 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-teal-800">💰 Historial de Aportaciones</h3>
                  <button
                    onClick={openMovimientoModal}
                    className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 text-sm font-medium"
                  >
                    + Agregar
                  </button>
                </div>
                
                {/* Resumen */}
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="bg-emerald-50 p-3 rounded-lg text-center">
                    <p className="text-xs text-emerald-600 mb-1">Total Aportado</p>
                    <p className="font-bold text-emerald-700">${fondoEmergencia.total_acumulado?.toLocaleString() || 0}</p>
                  </div>
                  <div className="bg-red-50 p-3 rounded-lg text-center">
                    <p className="text-xs text-red-600 mb-1">Total Retirado</p>
                    <p className="font-bold text-red-700">${fondoEmergencia.total_retirado?.toLocaleString() || 0}</p>
                  </div>
                  <div className="bg-teal-50 p-3 rounded-lg text-center">
                    <p className="text-xs text-teal-600 mb-1">Falta para Meta</p>
                    <p className="font-bold text-teal-700">${fondoEmergencia.falta_para_meta?.toLocaleString() || 0}</p>
                  </div>
                </div>

                {/* Lista de movimientos */}
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {fondoEmergencia.movimientos?.length > 0 ? (
                    fondoEmergencia.movimientos.map((mov) => (
                      <div key={mov.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            mov.tipo === 'aportacion' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'
                          }`}>
                            {mov.tipo === 'aportacion' ? '↑' : '↓'}
                          </div>
                          <div>
                            <p className="font-medium text-teal-800">
                              ${mov.monto?.toLocaleString()}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(mov.fecha).toLocaleDateString()}
                              {mov.nota && ` • ${mov.nota}`}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteMovimiento(mov.id)}
                          className="text-gray-400 hover:text-red-500 p-1"
                        >
                          ×
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-gray-500 py-4">
                      Sin aportaciones registradas
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Sugerencias */}
            <div className="bg-white/80 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-teal-100 mb-6">
              <h3 className="text-lg font-semibold text-teal-800 mb-4">💡 Sugerencias Personalizadas</h3>
              <div className="space-y-2">
                {fondoEmergencia.sugerencias?.map((sug, i) => (
                  <p key={i} className={`text-sm ${
                    sug.startsWith('📊') || sug.startsWith('💡') || sug.startsWith('✂️') || sug.startsWith('🎯') || sug.startsWith('   ')
                      ? 'text-teal-700 font-medium' 
                      : 'text-gray-600'
                  }`}>{sug}</p>
                ))}
              </div>
            </div>

            {/* Cómo construirlo */}
            <div className="bg-gradient-to-br from-teal-500 to-cyan-500 p-6 rounded-xl shadow-lg text-white">
              <h3 className="text-lg font-semibold mb-4">📝 Cómo Construir tu Fondo de Emergencia</h3>
              <div className="space-y-2">
                {fondoEmergencia.como_construirlo?.map((paso, i) => (
                  <p key={i} className="text-sm text-teal-100">{paso}</p>
                ))}
              </div>
            </div>
          </>
        )}
      </main>

      {/* Modal Configurar Esenciales */}
      {showConfigModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div>
                <h3 className="text-lg font-semibold text-teal-800">Configurar Gastos Esenciales</h3>
                <p className="text-sm text-gray-500">Marca cuáles gastos son esenciales para tu fondo de emergencia</p>
              </div>
              <button
                onClick={() => setShowConfigModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-4 overflow-y-auto max-h-[60vh]">
              {loadingConfig ? (
                <p className="text-center py-8 text-gray-500">Cargando...</p>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg text-sm font-medium text-emerald-700">
                    <span>✓ Esencial = Necesario para sobrevivir sin empleo</span>
                  </div>
                  {configCategorias.map((cat) => (
                    <div
                      key={cat.categoria_id}
                      className={`flex items-center justify-between p-3 rounded-lg border ${
                        cat.es_esencial === true
                          ? 'bg-emerald-50 border-emerald-300'
                          : cat.es_esencial === false
                          ? 'bg-amber-50 border-amber-300'
                          : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{cat.categoria_icono}</span>
                        <span className="font-medium text-gray-800">{cat.categoria_nombre}</span>
                        {cat.configurado && (
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            cat.es_esencial === true ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                          }`}>
                            {cat.es_esencial === true ? 'Esencial' : 'No Esencial'}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => toggleCategoriaEsencial(cat.categoria_id)}
                        className={`relative w-12 h-6 rounded-full transition-colors ${
                          cat.es_esencial === true
                            ? 'bg-emerald-500'
                            : cat.es_esencial === false
                            ? 'bg-amber-400'
                            : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                            cat.es_esencial === true ? 'left-7' : 'left-1'
                          }`}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-200 flex gap-3">
              <button
                onClick={() => setShowConfigModal(false)}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                Cancelar
              </button>
              <button
                onClick={saveConfiguracion}
                className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Agregar Movimiento */}
      {showMovimientoModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div>
                <h3 className="text-lg font-semibold text-teal-800">Agregar Aportación</h3>
                <p className="text-sm text-gray-500">Registra una aportación o retiro del fondo</p>
              </div>
              <button
                onClick={() => setShowMovimientoModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setMovimientoForm(f => ({ ...f, tipo: 'aportacion' }))}
                    className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                      movimientoForm.tipo === 'aportacion'
                        ? 'bg-emerald-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    ↑ Aportación
                  </button>
                  <button
                    type="button"
                    onClick={() => setMovimientoForm(f => ({ ...f, tipo: 'retiro' }))}
                    className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                      movimientoForm.tipo === 'retiro'
                        ? 'bg-red-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    ↓ Retiro
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Monto</label>
                <input
                  type="number"
                  value={movimientoForm.monto}
                  onChange={(e) => setMovimientoForm(f => ({ ...f, monto: e.target.value }))}
                  placeholder="0.00"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nota (opcional)</label>
                <input
                  type="text"
                  value={movimientoForm.nota}
                  onChange={(e) => setMovimientoForm(f => ({ ...f, nota: e.target.value }))}
                  placeholder="Ej: Aportación mensual Julio 2026"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                />
              </div>
            </div>

            <div className="p-4 border-t border-gray-200 flex gap-3">
              <button
                onClick={() => setShowMovimientoModal(false)}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                disabled={savingMovimiento}
              >
                Cancelar
              </button>
              <button
                onClick={handleAddMovimiento}
                disabled={savingMovimiento || !movimientoForm.monto || parseFloat(movimientoForm.monto) <= 0}
                className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {savingMovimiento ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
