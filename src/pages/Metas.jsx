import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import Navbar from '../components/Navbar';
import { useGlobalToast } from '../components/Toast';
import { Plus, X, Edit2, Trash2, DollarSign } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CATEGORIAS = [
  { value: 'general', label: 'General', icono: '🎯' },
  { value: 'emergencia', label: 'Emergencia', icono: '🏥' },
  { value: 'viaje', label: 'Viaje', icono: '✈️' },
  { value: 'vivienda', label: 'Vivienda', icono: '🏠' },
  { value: 'educacion', label: 'Educación', icono: '🎓' },
  { value: 'inversion', label: 'Inversión', icono: '📈' },
  { value: 'otro', label: 'Otro', icono: '📦' },
];

const getCategoriaInfo = (categoria) => {
  return CATEGORIAS.find(c => c.value === categoria) || CATEGORIAS[0];
};

export default function Metas() {
  const { token } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [filtroCategoria, setFiltroCategoria] = useState('todos');
  const [showAddMoney, setShowAddMoney] = useState(null);
  const [addMoneyAmount, setAddMoneyAmount] = useState('');
  const [crearTransaccion, setCrearTransaccion] = useState(true);
  const [transacciones, setTransacciones] = useState([]);
  const [showHistorial, setShowHistorial] = useState(null);
  const [editandoAhorro, setEditandoAhorro] = useState(null);
  const [nuevoMonto, setNuevoMonto] = useState('');
  const [editandoMetaId, setEditandoMetaId] = useState(null);
  const [editandoNuevoAhorro, setEditandoNuevoAhorro] = useState('');
  const [movimientos, setMovimientos] = useState({});
  const [showMovimientos, setShowMovimientos] = useState(null);
  const { showToast } = useGlobalToast();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nombre: '',
    monto_objetivo: '',
    fecha_limite: '',
    categoria: 'general',
  });

  useEffect(() => {
    fetchData();
  }, [token]);

  const fetchData = async () => {
    try {
      const [metasRes, progresoRes, transRes] = await Promise.all([
        fetch('http://localhost:8000/api/metas', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch('http://localhost:8000/api/metas/progreso', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch('http://localhost:8000/api/transacciones', {
          headers: { Authorization: `Bearer ${token}` },
        })
      ]);
      const data = await metasRes.json();
      const progreso = await progresoRes.json();
      const transData = await transRes.json();
      setData({ ...data, progreso });
      setTransacciones(transData.transacciones || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMovimientos = async (metaId) => {
    try {
      const res = await fetch(`http://localhost:8000/api/metas/${metaId}/movimientos`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setMovimientos(prev => ({ ...prev, [metaId]: data.movimientos || [] }));
    } catch (err) {
      console.error('Error fetching movimientos:', err);
    }
  };

  const toggleMovimientos = (metaId) => {
    if (showMovimientos === metaId) {
      setShowMovimientos(null);
    } else {
      setShowMovimientos(metaId);
      if (!movimientos[metaId]) {
        fetchMovimientos(metaId);
      }
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Cargando...</div>;

  const metas = filtroCategoria === 'todos' 
    ? (data?.metas || []) 
    : (data?.metas || []).filter(m => m.categoria === filtroCategoria);

  const totalObjetivo = metas.reduce((sum, m) => sum + (m.objetivo || 0), 0);
  const totalAhorrado = metas.reduce((sum, m) => sum + (m.actual || 0), 0);
  const totalRestante = metas.reduce((sum, m) => sum + (m.restante || 0), 0);
  
  const mesesRestantes = metas.filter(m => m.fecha_limite).map(m => {
    const fecha = new Date(m.fecha_limite);
    const ahora = new Date();
    return Math.max(1, Math.ceil((fecha - ahora) / (1000 * 60 * 60 * 24 * 30)));
  });
  const maxMeses = mesesRestantes.length > 0 ? Math.max(...mesesRestantes) : 12;
  const promedioMensual = maxMeses > 0 ? totalRestante / maxMeses : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const metaData = {
        nombre: formData.nombre,
        objetivo: parseFloat(formData.monto_objetivo),
        categoria: formData.categoria,
        icono: '🎯',
        color: '#14B8A6',
      };
      console.log('Creating meta with data:', metaData);
      
      if (formData.fecha_limite) {
        metaData.fecha_limite = formData.fecha_limite + 'T23:59:59';
      }
      
      if (editingId) {
        await fetch(`http://localhost:8000/api/metas/${editingId}`, {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}` 
          },
          body: JSON.stringify(metaData),
        });
        showToast('Meta actualizada correctamente', 'success');
      } else {
        await api.createMeta(token, metaData);
        showToast('Meta creada correctamente', 'success');
      }
      setShowForm(false);
      setEditingId(null);
      setFormData({ nombre: '', monto_objetivo: '', fecha_limite: '', categoria: 'general' });
      fetchData();
    } catch (err) {
      console.error('Error saving goal:', err);
      showToast('Error al guardar meta', 'error');
    }
  };

  const handleEdit = (meta) => {
    setEditingId(meta.id);
    setFormData({
      nombre: meta.nombre,
      monto_objetivo: meta.objetivo.toString(),
      fecha_limite: meta.fecha_limite?.split('T')[0] || '',
      categoria: meta.categoria || 'general',
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar esta meta?')) return;
    try {
      await fetch(`http://localhost:8000/api/metas/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchData();
      showToast('Meta eliminada', 'success');
    } catch (err) {
      console.error('Error deleting goal:', err);
      showToast('Error al eliminar meta', 'error');
    }
  };

  const handleAddMoney = async (metaId) => {
    const monto = parseFloat(addMoneyAmount);
    if (!monto || monto <= 0) {
      showToast('Ingresa un monto válido', 'warning');
      return;
    }
    try {
      const meta = data?.metas?.find(m => m.id === metaId);
      const metaNombre = meta?.nombre || 'Meta';
      
      // Agregar ahorro a la meta
      const metaRes = await fetch(`http://localhost:8000/api/metas/${metaId}/agregar-ahorro?monto=${monto}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
       
      if (!metaRes.ok) {
        throw new Error('Error al agregar ahorro a la meta');
      }
        
      // Create a GASTO transaction when adding savings
      const catRes = await fetch('http://localhost:8000/api/categorias', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const catData = await catRes.json();
      const catMetas = catData.categorias?.find(c => c.nombre.toLowerCase() === 'metas');
      
      await fetch('http://localhost:8000/api/transacciones', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({
          monto: monto,
          descripcion: `Meta: ${metaNombre}`,
          tipo: 'gasto',
          categoria_id: catMetas?.id || null
        }),
      });
      
      showToast(`Se agregaron $${monto.toLocaleString()} a "${metaNombre}"`, 'success');
       
      setShowAddMoney(null);
      setAddMoneyAmount('');
      setCrearTransaccion(true);
      fetchData();
    } catch (err) {
      console.error('Error adding money:', err);
      showToast('Error al agregar ahorro', 'error');
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({ nombre: '', monto_objetivo: '', fecha_limite: '', categoria: 'general' });
  };

  const handleDeleteAhorro = async (metaId, transaccionId, monto) => {
    if (!window.confirm('¿Eliminar este ahorro de la meta?')) return;
    try {
      // Revertir el ahorro en la meta
      await fetch(`http://localhost:8000/api/metas/${metaId}/agregar-ahorro?monto=-${monto}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      // Eliminar la transacción
      await fetch(`http://localhost:8000/api/transacciones/${transaccionId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchData();
      showToast('Ahorro eliminado', 'success');
    } catch (err) {
      console.error('Error deleting ahorro:', err);
      showToast('Error al eliminar ahorro', 'error');
    }
  };

  const getTransaccionesMeta = (metaId) => {
    return transacciones.filter(t => 
      t.descripcion && t.descripcion.includes(`meta: ${metaId}`) && t.tipo === 'gasto'
    );
  };

  const handleEditAhorro = async (metaId, transaccionId, montoActual) => {
    const meta = data?.metas?.find(m => m.id === metaId);
    const metaNombre = meta?.nombre || 'Meta';
    const nuevoMonto = parseFloat(prompt('Ingresa el nuevo monto:', montoActual));
    if (!nuevoMonto || nuevoMonto <= 0 || nuevoMonto === montoActual) return;
    
    try {
      const diferencia = nuevoMonto - montoActual;
      
      // Update the meta with the difference
      await fetch(`http://localhost:8000/api/metas/${metaId}/agregar-ahorro?monto=${diferencia}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      
      // If reducing amount, create an 'ingreso' transaction to return to balance
      if (diferencia < 0) {
        const catRes = await fetch('http://localhost:8000/api/categorias', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const catData = await catRes.json();
        const catAhorro = catData.categorias?.find(c => c.nombre.toLowerCase().includes('ahorro'));
        
        await fetch('http://localhost:8000/api/transacciones', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}` 
          },
          body: JSON.stringify({
            monto: Math.abs(diferencia),
            descripcion: `Meta: ${metaNombre} (reembolso)`,
            tipo: 'ingreso',
            categoria_id: catAhorro?.id
          }),
        });
      }
      
      // Update the original transaction
      await fetch(`http://localhost:8000/api/transacciones/${transaccionId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ monto: nuevoMonto, descripcion: `Meta: ${metaNombre}` }),
      });
      
      fetchData();
      setShowHistorial(null);
      showToast('Ahorro actualizado', 'success');
    } catch (err) {
      console.error('Error updating ahorro:', err);
      showToast('Error al actualizar ahorro', 'error');
    }
  };

  const handleUpdateMetaAhorro = async (metaId) => {
    const nuevoMonto = parseFloat(editandoNuevoAhorro);
    const meta = data?.metas?.find(m => m.id === metaId);
    const montoActual = meta?.actual || 0;
    const metaNombre = meta?.nombre || 'Meta';
    
    if (nuevoMonto === null || nuevoMonto === '' || isNaN(nuevoMonto) || nuevoMonto < 0) {
      showToast('Ingresa un monto válido', 'warning');
      return;
    }
    
    try {
      const diferencia = nuevoMonto - montoActual;
      
      if (diferencia !== 0) {
        // Update the meta
        const metaRes = await fetch(`http://localhost:8000/api/metas/${metaId}/agregar-ahorro?monto=${diferencia}`, {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${token}` },
        });
        
        if (!metaRes.ok) {
          throw new Error('Error al actualizar la meta');
        }
        
        // When reducing amount, delete the corresponding GASTO transaction
        if (diferencia < 0) {
          // Find and delete GASTO transaction to reduce expenses
          const metaTransacciones = transacciones.filter(t => 
            t.descripcion && t.descripcion.includes(`Meta: ${metaNombre}`) && t.tipo === 'gasto'
          );
          
          if (metaTransacciones.length > 0) {
            const transIdToDelete = metaTransacciones[0].id;
            await fetch(`http://localhost:8000/api/transacciones/${transIdToDelete}`, {
              method: 'DELETE',
              headers: { Authorization: `Bearer ${token}` },
            });
          }
          
          showToast(`Reintegrado $${Math.abs(diferencia).toLocaleString()} al balance`, 'success');
        } else {
          // If increasing, create a gasto transaction in "Metas" category
          const catRes = await fetch('http://localhost:8000/api/categorias', {
            headers: { Authorization: `Bearer ${token}` },
          });
          const catData = await catRes.json();
          const catMetas = catData.categorias?.find(c => c.nombre.toLowerCase() === 'metas');
          
          const transRes = await fetch('http://localhost:8000/api/transacciones', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}` 
            },
            body: JSON.stringify({
              monto: diferencia,
              descripcion: `Meta: ${metaNombre}`,
              tipo: 'gasto',
              categoria_id: catMetas?.id || null
            }),
          });
          
          const transData = await transRes.json();
          console.log('Add transaction response:', transData);
          
          if (transRes.ok) {
            showToast(`Agregado $${diferencia.toLocaleString()} a la meta`, 'success');
            navigate('/');
          } else {
            showToast('Error: ' + (transData.detail || 'No se pudo crear la transacción'), 'error');
          }
        }
      } else {
        showToast('El monto es el mismo', 'info');
      }
      
      setEditandoMetaId(null);
      setEditandoNuevoAhorro('');
      // Refresh data to update completion status
      fetchData();
    } catch (err) {
      console.error('Error updating meta ahorro:', err);
      showToast('Error al actualizar ahorro: ' + err.message, 'error');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-teal-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-wrap justify-between items-center mb-4 gap-2">
          <h2 className="text-2xl font-bold text-teal-800">Metas de Ahorro</h2>
          <div className="flex gap-2 items-center">
            <select value={filtroCategoria} onChange={(e) => setFiltroCategoria(e.target.value)} className="px-3 py-2 border rounded-lg text-sm">
              <option value="todos">Todas las categorías</option>
              {CATEGORIAS.map(c => <option key={c.value} value={c.value}>{c.icono} {c.label}</option>)}
            </select>
            <button onClick={() => { handleCancel(); setShowForm(!showForm); }} className="bg-gradient-to-r from-teal-500 to-cyan-500 text-white px-4 py-2 rounded-lg hover:from-teal-600 hover:to-cyan-600">
              {showForm ? 'Cancelar' : '+ Nueva Meta'}
            </button>
          </div>
        </div>

        {/* Resumen de Metas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-br from-blue-500 to-blue-700 p-4 rounded-lg shadow text-white">
            <p className="text-sm text-blue-100">Total Objetivos</p>
            <p className="text-2xl font-bold">${totalObjetivo.toLocaleString()}</p>
          </div>
          <div className="bg-gradient-to-br from-green-500 to-green-700 p-4 rounded-lg shadow text-white">
            <p className="text-sm text-green-100">Total Ahorrado</p>
            <p className="text-2xl font-bold">${totalAhorrado.toLocaleString()}</p>
          </div>
          <div className="bg-gradient-to-br from-orange-500 to-orange-700 p-4 rounded-lg shadow text-white">
            <p className="text-sm text-orange-100">Falta por Ahorrar</p>
            <p className="text-2xl font-bold">${totalRestante.toLocaleString()}</p>
          </div>
          <div className="bg-gradient-to-br from-purple-500 to-purple-700 p-4 rounded-lg shadow text-white">
            <p className="text-sm text-purple-100">Contribuciones</p>
            <p className="text-2xl font-bold">{metas.length}</p>
            <p className="text-xs text-purple-200">metas activas</p>
          </div>
        </div>

        {/* Info general */}
        <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl shadow-lg border border-teal-100 mb-6">
          <p className="text-sm text-teal-600">
            <span className="font-medium text-orange-600">💡 Necesitas ahorrar ${promedioMensual.toLocaleString()} por mes</span> en total para alcanzar todas tus metas a tiempo
          </p>
        </div>

        {showForm && (
          <div className="bg-white/80 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-teal-100 mb-6">
            <h3 className="text-lg font-semibold text-teal-800 mb-4">
              {editingId ? 'Editar Meta' : 'Nueva Meta'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-teal-700 mb-1">Nombre</label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Ej: Vacaciones, Auto, Casa..."
                  required
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-teal-700 mb-1">Monto Objetivo</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.monto_objetivo}
                    onChange={(e) => setFormData({ ...formData, monto_objetivo: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="0.00"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-teal-700 mb-1">Fecha Límite</label>
                  <input
                    type="date"
                    value={formData.fecha_limite}
                    onChange={(e) => setFormData({ ...formData, fecha_limite: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-teal-700 mb-1">Categoría</label>
                <select value={formData.categoria} onChange={(e) => setFormData({ ...formData, categoria: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md">
                  {CATEGORIAS.map(c => <option key={c.value} value={c.value}>{c.icono} {c.label}</option>)}
                </select>
              </div>
              <div className="flex gap-2">
                <button type="submit" className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-medium">
                  {editingId ? 'Actualizar Meta' : 'Crear Meta'}
                </button>
                {editingId && (
                  <button type="button" onClick={handleCancel} className="px-4 py-3 bg-gray-200 rounded-lg hover:bg-gray-300">
                    Cancelar
                  </button>
                )}
              </div>
            </form>
          </div>
        )}

        {/* Lista de Metas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {metas.length > 0 ? (
            metas.map((meta) => {
              const catInfo = getCategoriaInfo(meta.categoria);
              
              // Calcular meses restantes para esta meta específica
              let mesesRestantes = 12;
              let necesitaMensual = 0;
              if (meta.fecha_limite && !meta.completado) {
                const fecha = new Date(meta.fecha_limite);
                const ahora = new Date();
                mesesRestantes = Math.max(1, Math.ceil((fecha - ahora) / (1000 * 60 * 60 * 24 * 30)));
                necesitaMensual = meta.restante / mesesRestantes;
              }
              
              return (
                <div key={meta.id} className={`bg-white/80 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-teal-100 border-l-4 ${meta.completado ? 'border-emerald-500' : 'border-teal-500'}`}>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-3xl">{catInfo.icono}</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(meta)}
                        className="text-blue-600 hover:text-blue-800"
                        title="Editar"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(meta.id)}
                        className="text-red-600 hover:text-red-800"
                        title="Eliminar"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                  
                  {/* Estado de la meta */}
                  {meta.completado ? (
                    <div className="bg-green-100 text-green-700 text-sm font-medium px-3 py-2 rounded-lg mb-3">
                      ✅ ¡Meta alcanzada!
                    </div>
                  ) : meta.porcentaje >= 80 ? (
                    <div className="bg-yellow-100 text-yellow-700 text-sm font-medium px-3 py-2 rounded-lg mb-3">
                      ⚠️ Casi lo logras
                    </div>
                  ) : null}
                  
                  <span className="text-xs text-teal-500">{catInfo.label}</span>
                  <h4 className="font-semibold text-teal-800 text-lg mb-2">{meta.nombre}</h4>
                  
                  {showAddMoney === meta.id ? (
                    <div className="mt-3 p-3 bg-green-50 rounded-lg">
                      <p className="text-sm text-teal-600 mb-2">Agregar ahorro</p>
                      <div className="flex gap-2 mb-2">
                        <input
                          type="number"
                          step="0.01"
                          value={addMoneyAmount}
                          onChange={(e) => setAddMoneyAmount(e.target.value)}
                          placeholder="Monto"
                          className="flex-1 px-2 py-1 border rounded text-sm"
                        />
                        <button onClick={() => handleAddMoney(meta.id)} className="bg-green-600 text-white px-3 py-1 rounded text-sm">✓</button>
                        <button onClick={() => { setShowAddMoney(null); setAddMoneyAmount(''); setCrearTransaccion(true); }} className="bg-gray-200 px-3 py-1 rounded text-sm">✕</button>
                      </div>
                      <label className="flex items-center gap-2 text-xs text-teal-600">
                        <input 
                          type="checkbox" 
                          checked={crearTransaccion}
                          onChange={(e) => setCrearTransaccion(e.target.checked)}
                          className="rounded"
                        />
                        Restar de ingresos disponibles
                      </label>
                    </div>
                  ) : (
                    <button onClick={() => setShowAddMoney(meta.id)} className="mt-3 w-full py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 flex items-center justify-center gap-2">
                      <DollarSign size={16} />
                      Agregar Ahorro
                    </button>
                  )}
                  
                  <div className="grid grid-cols-2 gap-2 mt-4 text-sm">
                    <div className="bg-gray-50 p-2 rounded">
                      <span className="text-teal-500 text-xs">Ahorrado</span>
                      {editandoMetaId === meta.id ? (
                        <div className="flex items-center gap-1 mt-1">
                          <input
                            type="number"
                            value={editandoNuevoAhorro}
                            onChange={(e) => setEditandoNuevoAhorro(e.target.value)}
                            className="w-20 px-1 py-0.5 border rounded text-sm"
                            placeholder="Monto"
                          />
                          <button 
                            onClick={() => handleUpdateMetaAhorro(meta.id)}
                            className="text-green-600 text-xs"
                          >
                            ✓
                          </button>
                          <button 
                            onClick={() => { setEditandoMetaId(null); setEditandoNuevoAhorro(''); }}
                            className="text-red-500 text-xs"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <p 
                          className="font-medium text-green-600 cursor-pointer hover:text-green-800"
                          onClick={() => { setEditandoMetaId(meta.id); setEditandoNuevoAhorro(meta.actual?.toString() || '0'); }}
                        >
                          ${meta.actual?.toLocaleString()} ✏️
                        </p>
                      )}
                    </div>
                    <div className="bg-gray-50 p-2 rounded">
                      <span className="text-teal-500 text-xs">Objetivo</span>
                      <p className="font-medium text-teal-800">${meta.objetivo?.toLocaleString()}</p>
                    </div>
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-3 mb-2 mt-2">
                    <div
                      className={`h-3 rounded-full transition-all ${
                        meta.porcentaje >= 100 ? 'bg-emerald-500' : meta.porcentaje >= 80 ? 'bg-amber-500' : 'bg-teal-500'
                      }`}
                      style={{ width: `${Math.min(meta.porcentaje || 0, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-teal-500 mb-2">
                    <span>{meta.porcentaje?.toFixed(1)}%</span>
                    <span>Restante: ${meta.restante?.toLocaleString()}</span>
                  </div>
                  
                  {/* Info de contribución mensual */}
                  {!meta.completado && meta.fecha_limite ? (
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mt-2">
                      <p className="text-xs text-orange-600 font-medium">
                        Necesitas ahorrar <span className="text-orange-700 font-bold">${necesitaMensual.toLocaleString()}</span> /mes
                      </p>
                      <p className="text-xs text-orange-500">
                        para cumplir antes del {new Date(meta.fecha_limite).toLocaleDateString()}
                      </p>
                    </div>
                  ) : !meta.completado ? (
                    <div className="bg-gray-50 rounded-lg p-3 mt-2">
                      <p className="text-xs text-teal-500">
                        Establece una fecha límite para calcular cuánto necesitas ahorrar por mes
                      </p>
                    </div>
                  ) : null}

                  {/* Historial de movimientos */}
                  {showMovimientos === meta.id ? (
                    <div className="mt-3 p-3 bg-teal-50 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <p className="text-sm font-medium text-teal-700">Historial de Movimientos</p>
                        <button onClick={() => setShowMovimientos(null)} className="text-teal-500 text-xs">✕</button>
                      </div>
                      {movimientos[meta.id]?.length > 0 ? (
                        <div className="space-y-2">
                          {movimientos[meta.id].map((m) => (
                            <div key={m.id} className="flex items-center justify-between text-xs bg-white p-2 rounded">
                              <div className="flex items-center gap-2">
                                <span className={`font-medium ${m.tipo === 'agregado' ? 'text-amber-600' : 'text-emerald-600'}`}>
                                  {m.tipo === 'agregado' ? '-' : '+'}${m.monto.toLocaleString()}
                                </span>
                                <span className="text-teal-500 ml-2">
                                  {m.fecha ? new Date(m.fecha).toLocaleDateString() : ''}
                                </span>
                              </div>
                              <span className={`text-xs px-2 py-1 rounded ${m.tipo === 'agregado' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                {m.tipo === 'agregado' ? 'Ahorro' : 'Reembolso'}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-teal-500">No hay movimientos registrados</p>
                      )}
                    </div>
                  ) : (
                    <button 
                      onClick={() => toggleMovimientos(meta.id)} 
                      className="mt-2 text-xs text-teal-600 hover:underline"
                    >
                      Ver movimientos
                    </button>
                  )}
                </div>
              );
            })
          ) : (
            <div className="col-span-full text-center py-8 text-teal-500">
              No hay metas en esta categoría. ¡Crea una nueva!
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
