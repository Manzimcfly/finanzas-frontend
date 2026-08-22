import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useWidgetConfig } from '../context/WidgetConfigContext';
import { api } from '../api';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, TrendingDown, Wallet, Edit2, Trash2 } from 'lucide-react';
import Navbar from '../components/Navbar';

export default function Dashboard({ onOpenWidgetConfig }) {
  const { token } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState(null);
  const [metas, setMetas] = useState(null);
  const [suscripcionesTotal, setSuscripcionesTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mountKey, setMountKey] = useState(0);
  const [showEditTransaccion, setShowEditTransaccion] = useState(false);
  const [editTransaccionData, setEditTransaccionData] = useState(null);
  const [categorias, setCategorias] = useState([]);
  const { isWidgetVisible, getOrderedWidgets } = useWidgetConfig();
  
  const fetchDashboard = async () => {
    setLoading(true);
    const cacheBust = '_=' + Date.now();
    try {
      const [dashData, metasResponse, suscResponse] = await Promise.all([
        api.getDashboard(token),
        fetch(`http://localhost:8000/api/metas?${cacheBust}`, {
          headers: { Authorization: `Bearer ${token}` },
        }).then(r => {
          if (!r.ok) throw new Error('Failed to fetch metas');
          return r.json();
        }),
        fetch(`http://localhost:8000/api/suscripciones/resumen?${cacheBust}`, {
          headers: { Authorization: `Bearer ${token}` },
        }).then(r => r.json()).catch(() => ({ total_mensual: 0 }))
      ]);
      setDashboard(dashData);
      console.log('Dashboard API response:', JSON.stringify(dashData, null, 2));
      setMetas(metasResponse);
      setSuscripcionesTotal(suscResponse?.total_mensual || 0);
    } catch (err) {
      console.error('Dashboard fetch error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    if (token) {
      fetchDashboard();
    }
  }, [token, location.pathname, mountKey]);

  const handleEditTransaccion = async (gasto) => {
    const catRes = await fetch('http://localhost:8000/api/categorias', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const catData = await catRes.json();
    setCategorias(catData.categorias || []);
    setEditTransaccionData({
      id: gasto.id,
      monto: gasto.monto,
      descripcion: gasto.descripcion,
      tipo: gasto.tipo,
      categoria_id: gasto.categoria_id,
      categoria_nombre: gasto.categoria,
    });
    setShowEditTransaccion(true);
  };

  const handleDeleteTransaccion = async (id) => {
    if (!window.confirm('¿Eliminar esta transacción?')) return;
    try {
      await fetch(`http://localhost:8000/api/transacciones/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchDashboard();
    } catch (err) {
      console.error('Error deleting:', err);
    }
  };

  const handleUpdateTransaccion = async (e) => {
    e.preventDefault();
    try {
      await fetch(`http://localhost:8000/api/transacciones/${editTransaccionData.id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({
          monto: parseFloat(editTransaccionData.monto),
          descripcion: editTransaccionData.descripcion,
          tipo: editTransaccionData.tipo,
          categoria_id: editTransaccionData.categoria_id ? parseInt(editTransaccionData.categoria_id) : null,
        }),
      });
      setShowEditTransaccion(false);
      setEditTransaccionData(null);
      fetchDashboard();
    } catch (err) {
      console.error('Error updating:', err);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Cargando...</div>;

  if (error) return <div className="min-h-screen flex items-center justify-center text-red-600">Error: {error}</div>;

  const indicadores = dashboard?.indicadores || [];
  const gastos = dashboard?.gastos_por_categoria || [];
  const tendencia = dashboard?.tendencia_mensual || [];
  const cuentaNomina = dashboard?.cuenta_nomina || null;
  
  const metasData = metas?.metas || [];
  const totalObjetivo = metasData.reduce((sum, m) => sum + (m.objetivo || 0), 0);
  const totalAhorrado = metasData.reduce((sum, m) => sum + (m.actual || 0), 0);
  const metasCompletadas = metasData.filter(m => m?.completado).length;

  // AI Insights - Análisis inteligente
  const ingreso = indicadores.find(i => i.label === 'Ingresos')?.valor || 0;
  const gasto = indicadores.find(i => i.label === 'Gastos')?.valor || 0;
  const balance = ingreso - gasto;
  const tasaAhorroNum = ingreso > 0 ? (balance / ingreso) * 100 : 0;
  const tasaAhorro = tasaAhorroNum.toFixed(1);
  
  const generarInsights = () => {
    const insights = [];
    
    // Análisis de tasa de ahorro
    if (tasaAhorroNum >= 20) {
      insights.push({ tipo: 'success', emoji: '🎉', texto: '¡Excelente! Tu tasa de ahorro es del ' + tasaAhorro + '%' });
    } else if (tasaAhorroNum >= 10) {
      insights.push({ tipo: 'warning', emoji: '👍', texto: 'Bien! Estás ahorrando el ' + tasaAhorro + '% de tus ingresos' });
    } else {
      insights.push({ tipo: 'danger', emoji: '⚠️', texto: 'Tu tasa de ahorro es solo del ' + tasaAhorro + '%. Intenta llegar al 20%' });
    }
    
    // Análisis de gastos por categoría
    if (gastos && gastos.length > 0) {
      const validGastos = gastos.filter(g => g && typeof g.total === 'number');
      if (validGastos.length > 0) {
        const mayorGasto = validGastos.reduce((max, g) => g.total > max.total ? g : max, validGastos[0]);
        insights.push({ tipo: 'info', emoji: '💡', texto: 'Tu mayor gasto es en "' + (mayorGasto.categoria || 'categoria') + '" con $' + mayorGasto.total.toLocaleString() });
      }
    }
    
    // Análisis de metas
    if (metasCompletadas > 0) {
      insights.push({ tipo: 'success', emoji: '🏆', texto: 'Has completado ' + metasCompletadas + ' meta(s) de ahorro!' });
    }
    
    // Predicción de gasto mensual
    const gastoPromedio = typeof gasto === 'number' ? gasto : 0;
    insights.push({ tipo: 'prediction', emoji: '📊', texto: 'Predicción: Este mes gastarás aproximadamente $' + gastoPromedio.toLocaleString() });
    
    // Recomendación de inversión
    if (balance > 0 && totalAhorrado > 0) {
      const invertible = balance * 0.5;
      insights.push({ tipo: 'investment', emoji: '📈', texto: '💰 Con tu balance actual, podrías invertir $' + invertible.toLocaleString() + ' al mes' });
    }
    
    return insights;
  };
  
  const insights = generarInsights();

  const COLORS = ['#14B8A6', '#3B82F6', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4'];

  const balanceInd = indicadores.find(i => i?.label === 'Balance');
  const balanceValor = (balanceInd?.valor || 0) + totalAhorrado;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-teal-50 dark:from-slate-900 dark:to-slate-800">
      <Navbar onOpenWidgetConfig={onOpenWidgetConfig} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-teal-800">Dashboard</h2>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 flex items-center gap-2"
          >
            <span>🔄</span> Actualizar
          </button>
        </div>

        {/* Indicadores */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          {/* Ingresos */}
          <div className="bg-gradient-to-br from-teal-400 to-cyan-500 p-6 rounded-xl shadow-lg text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-teal-100 font-medium">Ingresos</p>
                <p className="text-2xl font-bold">
                  ${(indicadores.find(i => i?.label === 'Ingresos')?.valor || 0).toLocaleString()}
               </p>
              </div>
              <TrendingUp className="text-white" size={24} />
           </div>
            {cuentaNomina ? (
              <Link to="/cuentas" className="block mt-2 text-xs text-teal-50 hover:text-white">
                <span className="opacity-80">Nomina</span> <span className="font-medium">{cuentaNomina.nombre}</span>
                <span className="opacity-80"> · ${Number(cuentaNomina.saldo_actual || 0).toLocaleString()}</span>
            </Link>
            ) : (
              <Link to="/cuentas" className="block mt-2 text-xs text-teal-50 hover:text-white opacity-80 hover:opacity-100">
                Configurar cuenta de nomina →
             </Link>
            )}
            {indicadores.find(i => i?.label === 'Ingresos')?.cambio_porcentual !== undefined && (
              <p className="text-sm text-teal-100 mt-2">
                {indicadores.find(i => i?.label === 'Ingresos')?.cambio_porcentual > 0 ? '↑' : '↓'}
                {Math.abs(indicadores.find(i => i?.label === 'Ingresos')?.cambio_porcentual || 0).toFixed(1)}% vs mes anterior
             </p>
            )}
         </div>

          {/* Gastos */}
          <div className="bg-gradient-to-br from-amber-400 to-orange-500 p-6 rounded-xl shadow-lg text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-amber-100 font-medium">Gastos</p>
                <p className="text-2xl font-bold">
                  ${(indicadores.find(i => i?.label === 'Gastos')?.valor || 0).toLocaleString()}
                </p>
              </div>
              <TrendingDown className="text-white" size={24} />
            </div>
            {indicadores.find(i => i?.label === 'Gastos')?.cambio_porcentual !== undefined && (
              <p className="text-sm text-amber-100 mt-2">
                {indicadores.find(i => i?.label === 'Gastos')?.cambio_porcentual > 0 ? '↑' : '↓'} 
                {Math.abs(indicadores.find(i => i?.label === 'Gastos')?.cambio_porcentual || 0).toFixed(1)}% vs mes anterior
              </p>
            )}
          </div>

          {/* Balance */}
          <div className={`p-6 rounded-xl shadow-lg text-white ${
            (indicadores.find(i => i?.label === 'Balance')?.valor || 0) >= 0 
              ? 'bg-gradient-to-br from-cyan-400 to-blue-500' 
              : 'bg-gradient-to-br from-red-400 to-rose-500'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/80 font-medium">Balance</p>
                <p className="text-2xl font-bold">
                  ${(indicadores.find(i => i?.label === 'Balance')?.valor || 0).toLocaleString()}
                </p>
              </div>
              <Wallet className="text-white" size={24} />
            </div>
          </div>

          {/* Suscripciones */}
          <div className="bg-gradient-to-br from-blue-400 to-indigo-500 p-6 rounded-xl shadow-lg text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-100 font-medium">Suscripciones</p>
                <p className="text-2xl font-bold">${suscripcionesTotal.toLocaleString()}</p>
              </div>
              <span className="text-2xl">📱</span>
            </div>
            <p className="text-sm text-blue-200 mt-2">Este mes</p>
          </div>

          {/* Total Ahorrado en Metas */}
          <div className="bg-gradient-to-br from-violet-500 to-purple-600 p-6 rounded-xl shadow-lg text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-100 font-medium">Ahorrado en Metas</p>
                <p className="text-2xl font-bold">${totalAhorrado.toLocaleString()}</p>
              </div>
              <span className="text-2xl">🎯</span>
            </div>
          </div>
        </div>

        {/* AI Insights */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl">🤖</span>
            <h3 className="text-lg font-semibold text-teal-800">Análisis Inteligente</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {insights.map((insight, i) => (
              <div 
                key={i} 
                className={`p-4 rounded-lg border-l-4 shadow ${
                  insight.tipo === 'success' ? 'bg-teal-50 border-teal-500' :
                  insight.tipo === 'warning' ? 'bg-amber-50 border-amber-500' :
                  insight.tipo === 'danger' ? 'bg-red-50 border-red-500' :
                  insight.tipo === 'prediction' ? 'bg-cyan-50 border-cyan-500' :
                  'bg-violet-50 border-violet-500'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{insight.emoji}</span>
                  <p className={`text-sm ${
                    insight.tipo === 'success' ? 'text-teal-700' :
                    insight.tipo === 'warning' ? 'text-amber-700' :
                    insight.tipo === 'danger' ? 'text-red-700' :
                    insight.tipo === 'prediction' ? 'text-cyan-700' :
                    'text-violet-700'
                  }`}>{insight.texto}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Resumen de Metas */}
        {metasData && metasData.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-teal-800">🎯 Resumen de Metas</h3>
              <Link to="/metas" className="text-teal-600 hover:text-teal-800 text-sm">Ver todas →</Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-cyan-500 to-teal-600 p-4 rounded-xl shadow-lg text-white">
                <p className="text-sm text-cyan-100">Total Objetivos</p>
                <p className="text-2xl font-bold">${totalObjetivo.toLocaleString()}</p>
              </div>
              <div className="bg-gradient-to-br from-teal-500 to-emerald-600 p-4 rounded-xl shadow-lg text-white">
                <p className="text-sm text-teal-100">Total Ahorrado</p>
                <p className="text-2xl font-bold">${totalAhorrado.toLocaleString()}</p>
              </div>
              <div className="bg-gradient-to-br from-amber-500 to-yellow-600 p-4 rounded-xl shadow-lg text-white">
                <p className="text-sm text-amber-100">Falta</p>
                <p className="text-2xl font-bold">${(totalObjetivo - totalAhorrado).toLocaleString()}</p>
              </div>
              <div className="bg-gradient-to-br from-violet-500 to-purple-600 p-4 rounded-xl shadow-lg text-white">
                <p className="text-sm text-violet-100">Completadas</p>
                <p className="text-2xl font-bold">{metasCompletadas}/{metasData.length}</p>
              </div>
            </div>
            
            {/* Lista de metas con progreso */}
            <div className="mt-4 bg-white/80 backdrop-blur-sm p-4 rounded-xl shadow-lg border border-teal-100">
              <h4 className="text-sm font-medium text-teal-700 mb-3">Progreso de Metas</h4>
              <div className="space-y-3">
                {metasData.slice(0, 3).map((meta) => (
                  <div key={meta?.id || Math.random()} className="flex items-center gap-3">
                    <div className="w-24 text-sm font-medium text-teal-800 truncate">{meta?.nombre || 'Meta'}</div>
                    <div className="flex-1 bg-teal-100 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${(meta?.porcentaje || 0) >= 100 ? 'bg-emerald-500' : (meta?.porcentaje || 0) >= 80 ? 'bg-amber-500' : 'bg-teal-500'}`}
                        style={{ width: `${Math.min(meta?.porcentaje || 0, 100)}%` }}
                      />
                    </div>
                    <div className="w-16 text-sm text-teal-600 text-right">{(meta?.porcentaje || 0).toFixed(0)}%</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Gastos por categoría */}
          <div className="bg-white/80 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-teal-100">
            <h3 className="text-lg font-semibold text-teal-800 mb-4">Gastos por Categoría</h3>
            {gastos && gastos.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={gastos}
                    dataKey="total"
                    nameKey="categoria"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    labelLine={false}
                    label={({ categoria, porcentaje }) => `${(porcentaje || 0).toFixed(0)}%`}
                  >
                    {gastos.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => `$${value.toLocaleString()}`}
                    contentStyle={{ 
                      backgroundColor: 'rgba(255,255,255,0.95)', 
                      border: '1px solid #ccfbf1',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                    }}
                  />
                  <Legend 
                    verticalAlign="bottom"
                    height={36}
                    formatter={(value) => <span className="text-teal-700 text-sm">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-teal-500">
                <div className="text-center">
                  <div className="text-4xl mb-2">💸</div>
                  <p>No hay gastos registrados</p>
                  <Link to="/transacciones" className="text-teal-600 hover:underline mt-2 inline-block">
                    + Agregar transacción
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Tendencia mensual */}
          <div className="bg-white/80 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-teal-100">
            <h3 className="text-lg font-semibold text-teal-800 mb-4">Tendencia Mensual</h3>
            {tendencia && tendencia.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={tendencia} barGap={8}>
                  <XAxis 
                    dataKey="mes" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#0f766e', fontSize: 12 }}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#0f766e', fontSize: 12 }}
                    tickFormatter={(value) => `$${value/1000}k`}
                  />
                  <Tooltip 
                    formatter={(value) => `$${value.toLocaleString()}`}
                    contentStyle={{ 
                      backgroundColor: 'rgba(255,255,255,0.95)', 
                      border: '1px solid #ccfbf1',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                    }}
                  />
                  <Legend 
                    verticalAlign="top"
                    height={36}
                    formatter={(value) => <span className="text-teal-700 text-sm">{value}</span>}
                  />
                  <Bar 
                    dataKey="ingreso" 
                    fill="#14B8A6" 
                    name="Ingresos" 
                    radius={[4, 4, 0, 0]} 
                  />
                  <Bar 
                    dataKey="gasto" 
                    fill="#F59E0B" 
                    name="Gastos" 
                    radius={[4, 4, 0, 0]} 
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-teal-500">
                <div className="text-center">
                  <div className="text-4xl mb-2">📊</div>
                  <p>No hay datos de tendencia</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Últimos gastos */}
        <div className="bg-white/80 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-teal-100 mt-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-teal-800">Últimos Gastos</h3>
            <Link to="/transacciones" className="text-teal-600 hover:underline text-sm">
              Ver todas →
            </Link>
          </div>
          {dashboard?.ultimos_gastos?.length > 0 ? (
            <div className="space-y-3">
              {dashboard.ultimos_gastos.map((gasto, i) => (
                <div 
                  key={i} 
                  className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-teal-50 to-cyan-50 hover:from-teal-100 hover:to-cyan-100 transition-all border border-teal-100"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center text-lg">
                      {gasto.categoria_icono}
                    </div>
                    <div>
                      <p className="font-medium text-teal-800">{gasto.descripcion}</p>
                      <p className="text-sm text-teal-600">{gasto.categoria}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className={`font-bold ${gasto.tipo === 'ingreso' ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {gasto.tipo === 'ingreso' ? '+' : '-'}${gasto.monto.toLocaleString()}
                      </span>
                      <p className="text-xs text-teal-500">{gasto.fecha}</p>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleEditTransaccion(gasto)}
                        className="p-2 text-teal-600 hover:text-teal-800 hover:bg-teal-100 rounded-lg transition-all"
                        title="Editar"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteTransaccion(gasto.id)}
                        className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all"
                        title="Eliminar"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-teal-500">
              <div className="text-4xl mb-2">🧾</div>
              <p>No hay gastos recientes</p>
              <Link to="/transacciones" className="text-teal-600 hover:underline mt-2 inline-block">
                + Agregar tu primer gasto
              </Link>
            </div>
          )}
        </div>
      </main>

      {/* Modal Editar Transacción */}
      {showEditTransaccion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-teal-800">Editar Transacción</h3>
              <button onClick={() => setShowEditTransaccion(false)} className="text-teal-500 hover:text-teal-700">
                ✕
              </button>
            </div>
            <form onSubmit={handleUpdateTransaccion} className="space-y-4">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditTransaccionData({ ...editTransaccionData, tipo: 'ingreso' })}
                  className={`flex-1 py-2 rounded-lg ${editTransaccionData.tipo === 'ingreso' ? 'bg-green-600 text-white' : 'bg-gray-200'}`}
                >
                  Ingreso
                </button>
                <button
                  type="button"
                  onClick={() => setEditTransaccionData({ ...editTransaccionData, tipo: 'gasto' })}
                  className={`flex-1 py-2 rounded-lg ${editTransaccionData.tipo === 'gasto' ? 'bg-red-600 text-white' : 'bg-gray-200'}`}
                >
                  Gasto
                </button>
              </div>
              <div>
                <label className="block text-sm font-medium text-teal-700 mb-1">Monto</label>
                <input
                  type="number"
                  step="0.01"
                  value={editTransaccionData.monto}
                  onChange={(e) => setEditTransaccionData({ ...editTransaccionData, monto: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-teal-700 mb-1">Descripción</label>
                <input
                  type="text"
                  value={editTransaccionData.descripcion}
                  onChange={(e) => setEditTransaccionData({ ...editTransaccionData, descripcion: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-teal-700 mb-1">Categoría</label>
                <select
                  value={editTransaccionData.categoria_id || ''}
                  onChange={(e) => setEditTransaccionData({ ...editTransaccionData, categoria_id: e.target.value ? parseInt(e.target.value) : null })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">Sin categoría</option>
                  {categorias.filter(c => c.tipo === editTransaccionData.tipo).map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.icono} {cat.nombre}</option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                className="w-full bg-teal-600 text-white py-2 rounded-lg hover:bg-teal-700"
              >
                Guardar Cambios
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
