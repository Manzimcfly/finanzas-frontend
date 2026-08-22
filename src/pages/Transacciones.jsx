import { useEffect, useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import { Plus, X, Edit2, Trash2, ArrowLeftRight, Split, Upload } from 'lucide-react';
import Navbar from '../components/Navbar';

export default function Transacciones() {
  const { token } = useAuth();
  const [transacciones, setTransacciones] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [cuentas, setCuentas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  const [showSplit, setShowSplit] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [scannerText, setScannerText] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const fileInputRef = useRef(null);
  const [importing, setImporting] = useState(false);
  const [newCategoryData, setNewCategoryData] = useState({ nombre: '', icono: '📦', color: '#3B82F6' });
  const [inlineEditingId, setInlineEditingId] = useState(null);
  const [inlineEditData, setInlineEditData] = useState({});
  const [formData, setFormData] = useState({
    monto: '',
    descripcion: '',
    tipo: 'gasto',
    categoria_id: '',
  });
  const [transferData, setTransferData] = useState({ cuenta_origen_id: '', cuenta_destino_id: '', monto: '', descripcion: '' });
  const [splitData, setSplitData] = useState({ descripcion: '', tipo: 'gasto', transacciones: [] });
  const [currentPage, setCurrentPage] = useState(0);
  const [totalTransacciones, setTotalTransacciones] = useState(0);
  const limit = 15;

  useEffect(() => {
    if (token) {
      fetchData();
    }
  }, [token]);

  const fetchData = async (page = 0) => {
    if (!token) return;
    try {
      console.log('Fetching transacciones and categorias...');
      const skip = page * limit;
      const [transData, catData, cuentasData] = await Promise.all([
        api.getTransacciones(token, { skip, limit }),
        api.getCategorias(token),
        api.getCuentas(token),
      ]);
      console.log('transacciones:', transData.transacciones?.length, 'categorias:', catData.categorias?.length);
      setTransacciones(transData.transacciones || []);
      setCategorias(catData.categorias || []);
      setCuentas(cuentasData.cuentas || []);
      setTotalTransacciones(transData.total || 0);
      setCurrentPage(page);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(totalTransacciones / limit);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const result = await api.createTransaccion(token, {
        monto: parseFloat(formData.monto),
        descripcion: formData.descripcion,
        tipo: formData.tipo,
        categoria_id: formData.categoria_id ? parseInt(formData.categoria_id) : null,
      });
      setShowForm(false);
      setFormData({ monto: '', descripcion: '', tipo: 'gasto', categoria_id: '' });
      fetchData();
    } catch (err) {
      console.error('Error:', err);
      alert('Error al crear transacción: ' + (err.message || 'Error'));
    }
  };

  const categoriasFiltradas = categorias.filter(c => c.tipo === formData.tipo);
  console.log('categorias:', categorias.length, 'filtered:', categoriasFiltradas.length, 'tipo:', formData.tipo);

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    try {
      if (editingCategory) {
        await fetch(`http://localhost:8000/api/categorias/${editingCategory.id}`, {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}` 
          },
          body: JSON.stringify({
            nombre: newCategoryData.nombre,
            icono: newCategoryData.icono,
            color: newCategoryData.color,
          }),
        });
      } else {
        await api.createCategoria(token, {
          ...newCategoryData,
          tipo: formData.tipo,
        });
      }
      setShowNewCategory(false);
      setEditingCategory(null);
      setNewCategoryData({ nombre: '', icono: '📦', color: '#3B82F6' });
      fetchData();
    } catch (err) {
      console.error('Error saving category:', err);
      alert('Error al guardar categoría');
    }
  };

  const handleDeleteCategory = async (catId) => {
    if (!window.confirm('¿Eliminar esta categoría?')) return;
    try {
      await fetch(`http://localhost:8000/api/categorias/${catId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchData();
    } catch (err) {
      console.error('Error deleting category:', err);
      alert('Error al eliminar categoría');
    }
  };

  const openEditCategory = (cat) => {
    setEditingCategory(cat);
    setNewCategoryData({ nombre: cat.nombre, icono: cat.icono || '📦', color: cat.color || '#3B82F6' });
    setShowNewCategory(true);
  };

  const handleEdit = (t) => {
    setEditingId(t.id);
    setFormData({
      monto: t.monto.toString(),
      descripcion: t.descripcion || '',
      tipo: t.tipo,
      categoria_id: t.categoria_id?.toString() || '',
    });
    setShowForm(true);
  };

  const startInlineEdit = (t) => {
    setInlineEditingId(t.id);
    setInlineEditData({
      monto: t.monto,
      descripcion: t.descripcion || '',
      tipo: t.tipo,
      categoria_id: t.categoria_id,
      categoria_nombre: t.categoria_nombre,
      fecha: t.fecha ? new Date(t.fecha).toISOString().split('T')[0] : '',
    });
  };

  const cancelInlineEdit = () => {
    setInlineEditingId(null);
    setInlineEditData({});
  };

  const saveInlineEdit = async (t) => {
    try {
      const updateData = {
        monto: parseFloat(inlineEditData.monto),
        descripcion: inlineEditData.descripcion,
        tipo: inlineEditData.tipo,
        categoria_id: inlineEditData.categoria_id ? parseInt(inlineEditData.categoria_id) : null,
      };
      
      if (inlineEditData.fecha) {
        updateData.fecha = new Date(inlineEditData.fecha).toISOString();
      }
      
      await api.updateTransaccion(token, t.id, updateData);
      setInlineEditingId(null);
      setInlineEditData({});
      fetchData();
    } catch (err) {
      console.error('Error updating transaction:', err);
      alert('Error al actualizar transacción');
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await api.updateTransaccion(token, editingId, {
        monto: parseFloat(formData.monto),
        descripcion: formData.descripcion,
        tipo: formData.tipo,
        categoria_id: parseInt(formData.categoria_id),
      });
      setShowForm(false);
      setEditingId(null);
      setFormData({ monto: '', descripcion: '', tipo: 'gasto', categoria_id: '' });
      fetchData();
    } catch (err) {
      console.error('Error updating transaction:', err);
      alert('Error al actualizar transacción');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Estás seguro de eliminar esta transacción?')) return;
    try {
      await api.deleteTransaccion(token, id);
      fetchData();
    } catch (err) {
      console.error('Error deleting transaction:', err);
      alert('Error al eliminar transacción');
    }
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({ monto: '', descripcion: '', tipo: 'gasto', categoria_id: '' });
  };

  // Smart Scanner - Parse receipt text
  const parseReceiptText = (text) => {
    const lines = text.split('\n').filter(l => l.trim());
    const results = [];
    
    // Palabras clave para categorías
    const categoryKeywords = {
      comida: ['restaurant', 'comida', 'super', 'walmart', 'costco', 'chedraui', 'soriana', 'oaxaca', 'food'],
      transporte: ['gas', 'gasolina', 'pemex', 'uber', 'didi', 'taxi', 'combustible', 'transporte'],
      servicios: ['luz', 'agua', 'internet', 'telefono', 'netflix', 'spotify', 'servicio', ' CFE ', 'telcel', 'movistar'],
      ropa: ['ropa', 'zara', 'h&m', 'nike', 'adidas', 'tienda', 'ropa'],
      salud: ['farmacia', 'doctor', 'hospital', 'medicina', 'salud', 'consulta'],
      ocio: ['cine', 'juego', 'parque', 'fiesta', 'evento', 'entretenimiento'],
    };
    
    const detectCategory = (desc) => {
      const lower = desc.toLowerCase();
      for (const [cat, keywords] of Object.entries(categoryKeywords)) {
        if (keywords.some(k => lower.includes(k))) {
          return cat;
        }
      }
      return 'otro';
    };
    
    // Buscar montos en el texto (formato: $123.45, 123.45, etc)
    const montoRegex = /(?:\$|USD|US\$|\b(?:cantidad|total|monto|amount)\s*[:=]?\s*)?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/gi;
    
    lines.forEach(line => {
      const matches = line.match(montoRegex);
      if (matches) {
        const monto = parseFloat(matches[matches.length - 1].replace(/,/g, ''));
        if (monto > 0 && monto < 1000000) { // Filtrar montos razonables
          const desc = line.replace(montoRegex, '').trim() || 'Gasto';
          results.push({
            monto,
            descripcion: desc.substring(0, 50),
            categoria: detectCategory(desc)
          });
        }
      }
    });
    
    return results;
  };

  const handleScannerParse = async () => {
    if (!scannerText.trim()) {
      alert('Pega el texto del recibo o describe el gasto');
      return;
    }
    
    const parsed = parseReceiptText(scannerText);
    if (parsed.length === 0) {
      alert('No se detectó ningún monto. Intenta pegar el texto del recibo o ingresa: "150.50 Restaurant"');
      return;
    }
    
    // Buscar categoría para el primer gasto
    const cat = categorias.find(c => 
      parsed[0].categoria === 'comida' ? c.nombre.toLowerCase().includes('comida') :
      parsed[0].categoria === 'transporte' ? c.nombre.toLowerCase().includes('transporte') :
      parsed[0].categoria === 'servicios' ? c.nombre.toLowerCase().includes('servicio') :
      parsed[0].categoria === 'salud' ? c.nombre.toLowerCase().includes('salud') :
      parsed[0].categoria === 'ocio' ? c.nombre.toLowerCase().includes('ocio') :
      c.tipo === 'gasto'
    );
    
    if (cat) {
      setFormData({
        monto: parsed[0].monto.toString(),
        descripcion: parsed[0].descripcion,
        tipo: 'gasto',
        categoria_id: cat.id.toString()
      });
      setShowScanner(false);
      setScannerText('');
      setShowForm(true);
      alert(`💡 Detectado: $${parsed[0].monto} - ${parsed[0].descripcion}`);
    }
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImporting(true);
    try {
      const result = await api.importarCSV(token, file);
      alert(`Se importaron ${result.importadas} transacciones`);
      setShowImport(false);
      fetchData();
    } catch (err) {
      console.error('Error importing:', err);
      alert('Error al importar CSV');
    } finally {
      setImporting(false);
    }
  };

  const handleTransfer = async (e) => {
    e.preventDefault();
    try {
      await api.transferirEntreCuentas(token, {
        cuenta_origen_id: parseInt(transferData.cuenta_origen_id),
        cuenta_destino_id: parseInt(transferData.cuenta_destino_id),
        monto: parseFloat(transferData.monto),
        descripcion: transferData.descripcion,
      });
      setShowTransfer(false);
      setTransferData({ cuenta_origen_id: '', cuenta_destino_id: '', monto: '', descripcion: '' });
      fetchData();
      alert('Transferencia exitosa');
    } catch (err) {
      console.error('Error transferring:', err);
      alert(err.message || 'Error al transferir');
    }
  };

  const handleSplitSubmit = async (e) => {
    e.preventDefault();
    const transValidas = splitData.transacciones.filter(t => t.categoria_id && t.monto > 0);
    if (transValidas.length === 0) {
      alert('Agrega al menos una transacción');
      return;
    }
    try {
      await api.crearTransaccionDividida(token, {
        descripcion: splitData.descripcion,
        tipo: splitData.tipo,
        transacciones: transValidas,
      });
      setShowSplit(false);
      setSplitData({ descripcion: '', tipo: 'gasto', transacciones: [] });
      fetchData();
      alert('Transacciones creadas');
    } catch (err) {
      console.error('Error creating split:', err);
      alert(err.message || 'Error al crear transacciones');
    }
  };

  const addSplitItem = () => {
    setSplitData({
      ...splitData,
      transacciones: [...splitData.transacciones, { categoria_id: '', monto: '' }]
    });
  };

  const updateSplitItem = (index, field, value) => {
    const newItems = [...splitData.transacciones];
    newItems[index] = { ...newItems[index], [field]: value };
    setSplitData({ ...splitData, transacciones: newItems });
  };

  const removeSplitItem = (index) => {
    setSplitData({
      ...splitData,
      transacciones: splitData.transacciones.filter((_, i) => i !== index)
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-teal-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-wrap gap-2 justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-teal-800">Transacciones</h2>
          <div className="flex gap-2">
            <button onClick={() => setShowScanner(!showScanner)} className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-indigo-700 hover:to-purple-700 flex items-center gap-2 shadow">
              <span className="text-lg">📷</span>
              <span className="hidden sm:inline">Escáner</span>
            </button>
            <button onClick={() => setShowImport(!showImport)} className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 flex items-center gap-2">
              <Upload size={18} />
              <span className="hidden sm:inline">Importar</span>
            </button>
            <button onClick={() => setShowTransfer(!showTransfer)} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2">
              <ArrowLeftRight size={18} />
              <span className="hidden sm:inline">Transferir</span>
            </button>
            <button onClick={() => setShowSplit(!showSplit)} className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center gap-2">
              <Split size={18} />
              <span className="hidden sm:inline">Dividir</span>
            </button>
            <button onClick={() => setShowForm(!showForm)} className="bg-gradient-to-r from-teal-500 to-cyan-500 text-white px-4 py-2 rounded-lg hover:from-teal-600 hover:to-cyan-600">
              {showForm ? 'Cancelar' : '+ Nueva'}
            </button>
          </div>
        </div>

        {/* Smart Scanner */}
        {showScanner && (
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-lg shadow mb-6 border border-indigo-200">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">📷</span>
              <h3 className="text-lg font-semibold text-teal-800">Escáner Inteligente</h3>
            </div>
            <p className="text-sm text-teal-600 mb-4">
              📝 Pega el texto del recibo o escribe los detalles. El sistema detectará automáticamente el monto y sugirá la categoría.
            </p>
            <textarea
              value={scannerText}
              onChange={(e) => setScannerText(e.target.value)}
              placeholder="Ej: Restaurant ABC&#10;45.50&#10;20/01/2024&#10;&#10;O simplemente: 150.50 Comida Walmart"
              className="w-full h-32 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 mb-4"
            />
            <div className="flex gap-2">
              <button onClick={handleScannerParse} className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 font-medium">
                🔍 Detectar y Crear
              </button>
              <button onClick={() => setShowScanner(false)} className="bg-gray-200 text-teal-700 px-4 py-2 rounded-lg hover:bg-gray-300">
                Cancelar
              </button>
            </div>
            <div className="mt-4 p-3 bg-white rounded-lg text-xs text-teal-500">
              <p className="font-medium mb-1">💡 Ejemplos de texto que puedes pegar:</p>
              <p>• "Total: $150.00 Walmart"</p>
              <p>• "Café Starbucks 45.50"</p>
              <p>• "Gasolina 500.00 PEMEX"</p>
            </div>
          </div>
        )}

        {showImport && (
          <div className="bg-white/80 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-teal-100 mb-6">
            <h3 className="text-lg font-semibold text-teal-800 mb-4">Importar Estado de Cuenta (CSV)</h3>
            <p className="text-sm text-teal-500 mb-4">
              Formato esperado: fecha, monto, descripcion, tipo (opcional)
            </p>
            <input
              type="file"
              accept=".csv"
              ref={fileInputRef}
              onChange={handleImport}
              className="block w-full text-sm text-teal-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
            />
            {importing && <p className="mt-2 text-orange-600">Importando...</p>}
          </div>
        )}

        {showTransfer && (
          <div className="bg-white/80 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-teal-100 mb-6">
            <h3 className="text-lg font-semibold text-teal-800 mb-4">Transferir entre Cuentas</h3>
            <form onSubmit={handleTransfer} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-teal-700 mb-1">Cuenta Origen</label>
                  <select value={transferData.cuenta_origen_id} onChange={(e) => setTransferData({ ...transferData, cuenta_origen_id: e.target.value })} className="w-full px-3 py-2 border rounded-md" required>
                    <option value="">Seleccionar...</option>
                    {cuentas.map(c => <option key={c.id} value={c.id}>{c.nombre} (${c.saldo_actual?.toLocaleString()})</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-teal-700 mb-1">Cuenta Destino</label>
                  <select value={transferData.cuenta_destino_id} onChange={(e) => setTransferData({ ...transferData, cuenta_destino_id: e.target.value })} className="w-full px-3 py-2 border rounded-md" required>
                    <option value="">Seleccionar...</option>
                    {cuentas.filter(c => c.id !== parseInt(transferData.cuenta_origen_id)).map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-teal-700 mb-1">Monto</label>
                <input type="number" step="0.01" value={transferData.monto} onChange={(e) => setTransferData({ ...transferData, monto: e.target.value })} className="w-full px-3 py-2 border rounded-md" placeholder="0.00" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-teal-700 mb-1">Descripción</label>
                <input type="text" value={transferData.descripcion} onChange={(e) => setTransferData({ ...transferData, descripcion: e.target.value })} className="w-full px-3 py-2 border rounded-md" placeholder="Ej: Ahorro" />
              </div>
              <div className="flex gap-2">
                <button type="submit" className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700">Transferir</button>
                <button type="button" onClick={() => setShowTransfer(false)} className="px-4 py-2 bg-gray-200 rounded-lg">Cancelar</button>
              </div>
            </form>
          </div>
        )}

        {showSplit && (
          <div className="bg-white/80 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-teal-100 mb-6">
            <h3 className="text-lg font-semibold text-teal-800 mb-4">Dividir Transacción</h3>
            <form onSubmit={handleSplitSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-teal-700 mb-1">Descripción</label>
                <input type="text" value={splitData.descripcion} onChange={(e) => setSplitData({ ...splitData, descripcion: e.target.value })} className="w-full px-3 py-2 border rounded-md" placeholder="Ej: Compra supermercado" required />
              </div>
              <div className="flex gap-4">
                <button type="button" onClick={() => setSplitData({ ...splitData, tipo: 'gasto' })} className={`flex-1 py-2 rounded-lg ${splitData.tipo === 'gasto' ? 'bg-red-600 text-white' : 'bg-gray-200'}`}>Gasto</button>
                <button type="button" onClick={() => setSplitData({ ...splitData, tipo: 'ingreso' })} className={`flex-1 py-2 rounded-lg ${splitData.tipo === 'ingreso' ? 'bg-green-600 text-white' : 'bg-gray-200'}`}>Ingreso</button>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium text-teal-700">Partidas</label>
                  <button type="button" onClick={addSplitItem} className="text-blue-600 text-sm">+ Agregar</button>
                </div>
                {splitData.transacciones.map((item, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <select value={item.categoria_id} onChange={(e) => updateSplitItem(i, 'categoria_id', e.target.value)} className="flex-1 px-3 py-2 border rounded-md text-sm" required>
                      <option value="">Categoría...</option>
                      {categorias.filter(c => c.tipo === splitData.tipo).map(c => <option key={c.id} value={c.id}>{c.icono} {c.nombre}</option>)}
                    </select>
                    <input type="number" step="0.01" value={item.monto} onChange={(e) => updateSplitItem(i, 'monto', e.target.value)} className="w-24 px-3 py-2 border rounded-md text-sm" placeholder="Monto" required />
                    <button type="button" onClick={() => removeSplitItem(i)} className="text-red-600"><X size={18} /></button>
                  </div>
                ))}
              </div>
              <button type="submit" className="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700">Crear Transacciones</button>
            </form>
          </div>
        )}

        {showForm && (
          <div className="bg-white/80 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-teal-100 mb-6">
            <h3 className="text-lg font-semibold text-teal-800 mb-4">
              {editingId ? 'Editar Transacción' : 'Nueva Transacción'}
            </h3>
            <form onSubmit={editingId ? handleUpdate : handleSubmit} className="space-y-4">
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, tipo: 'ingreso', categoria_id: '' })}
                  className={`flex-1 py-3 rounded-lg font-medium transition-colors ${
                    formData.tipo === 'ingreso' 
                      ? 'bg-green-600 text-white' 
                      : 'bg-gray-200 text-teal-700 hover:bg-gray-300'
                  }`}
                >
                  💰 Ingreso
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, tipo: 'gasto', categoria_id: '' })}
                  className={`flex-1 py-3 rounded-lg font-medium transition-colors ${
                    formData.tipo === 'gasto' 
                      ? 'bg-red-600 text-white' 
                      : 'bg-gray-200 text-teal-700 hover:bg-gray-300'
                  }`}
                >
                  💸 Gasto
                </button>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-teal-700 mb-1">Monto</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.monto}
                  onChange={(e) => setFormData({ ...formData, monto: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0.00"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-teal-700 mb-1">Descripción</label>
                <input
                  type="text"
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ej: Mercado, Nómina..."
                />
              </div>
              
<div>
                <label className="block text-sm font-medium text-teal-700 mb-1">Categoría (opcional)</label>
                <div className="flex gap-2">
                  <select
                    value={formData.categoria_id}
                    onChange={(e) => setFormData({ ...formData, categoria_id: e.target.value })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Sin categoría</option>
                    {categoriasFiltradas.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.icono} {cat.nombre}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setShowNewCategory(true)}
                    className="px-3 py-2 bg-gray-100 text-teal-700 rounded-md hover:bg-gray-200"
                    title="Nueva categoría"
                  >
                    <Plus size={20} />
                  </button>
                </div>
                {categoriasFiltradas.length === 0 && (
                  <button
                    type="button"
                    onClick={() => setShowNewCategory(true)}
                    className="text-sm text-teal-600 mt-1 underline"
                  >
                    Crear nueva categoría
                  </button>
                )}
</div>

              <button 
                type="submit" 
                className="w-full bg-gradient-to-r from-teal-500 to-cyan-500 text-white py-3 rounded-lg hover:from-teal-600 hover:to-cyan-600 font-medium"
              >
                {editingId ? 'Actualizar Transacción' : 'Guardar Transacción'}
              </button>
              {editingId && (
                <button 
                  type="button" 
                  onClick={handleCancelForm}
                  className="w-full mt-2 bg-gray-200 text-teal-700 py-3 rounded-lg hover:bg-gray-300 font-medium"
                >
                  Cancelar
                </button>
              )}
            </form>
          </div>
        )}

        {loading ? (
          <p className="text-center py-8">Cargando...</p>
        ) : transacciones.length > 0 ? (
          <div className="bg-white/80 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-teal-100 mt-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-teal-800">Todas las Transacciones</h3>
            </div>
            <div className="space-y-3">
              {transacciones.map((t) => (
              <div 
                key={t.id} 
                className={`p-4 rounded-xl transition-all border ${
                  inlineEditingId === t.id 
                    ? 'bg-teal-50 border-teal-300 shadow-md' 
                    : 'bg-gradient-to-r from-teal-50 to-cyan-50 hover:from-teal-100 hover:to-cyan-100 border-teal-100'
                }`}
              >
                {inlineEditingId === t.id ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-4">
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-3">
                        <div>
                          <input
                            type="number"
                            step="0.01"
                            value={inlineEditData.monto}
                            onChange={(e) => setInlineEditData({ ...inlineEditData, monto: e.target.value })}
                            className="w-full px-3 py-2 border border-teal-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                          />
                        </div>
                        <div>
                          <input
                            type="text"
                            value={inlineEditData.descripcion}
                            onChange={(e) => setInlineEditData({ ...inlineEditData, descripcion: e.target.value })}
                            className="w-full px-3 py-2 border border-teal-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                            placeholder="Descripción"
                          />
                        </div>
                        <div>
                          <input
                            type="date"
                            value={inlineEditData.fecha || ''}
                            onChange={(e) => setInlineEditData({ ...inlineEditData, fecha: e.target.value })}
                            className="w-full px-3 py-2 border border-teal-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                          />
                        </div>
                        <div>
                          <select
                            value={inlineEditData.categoria_id || ''}
                            onChange={(e) => setInlineEditData({ ...inlineEditData, categoria_id: e.target.value ? parseInt(e.target.value) : null })}
                            className="w-full px-3 py-2 border border-teal-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                          >
                            <option value="">Sin categoría</option>
                            {categorias.filter(c => c.tipo === inlineEditData.tipo).map((cat) => (
                              <option key={cat.id} value={cat.id}>{cat.icono} {cat.nombre}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <select
                            value={inlineEditData.tipo}
                            onChange={(e) => setInlineEditData({ ...inlineEditData, tipo: e.target.value })}
                            className="w-full px-3 py-2 border border-teal-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                          >
                            <option value="gasto">Gasto</option>
                            <option value="ingreso">Ingreso</option>
                          </select>
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={cancelInlineEdit}
                        className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={() => saveInlineEdit(t)}
                        className="px-3 py-1 text-sm bg-teal-600 text-white rounded-lg hover:bg-teal-700"
                      >
                        Guardar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center text-xl">
                        {t.categoria_icono || '💰'}
                      </div>
                      <div>
                        <p className="font-medium text-teal-800">{t.descripcion || 'Sin descripción'}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-sm text-teal-600">{t.categoria_nombre || 'Sin categoría'}</span>
                          {t.es_reembolso && <span className="text-xs text-blue-500 bg-blue-100 px-1 rounded">(reembolso)</span>}
                          <span className="text-teal-300">•</span>
                          <span className="text-sm text-teal-500">{new Date(t.fecha).toLocaleDateString('es-ES')}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`text-lg font-bold ${t.tipo === 'ingreso' || t.es_reembolso ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {t.tipo === 'ingreso' || t.es_reembolso ? '+' : '-'}${t.monto.toLocaleString()}
                      </span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => startInlineEdit(t)}
                          className="p-2 text-teal-600 hover:text-teal-800 hover:bg-teal-100 rounded-lg transition-all"
                          title="Editar"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(t.id)}
                          className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all"
                          title="Eliminar"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              ))}
              
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-6 pt-4 border-t border-teal-100">
                  <button
                    onClick={() => fetchData(currentPage - 1)}
                    disabled={currentPage === 0}
                    className="px-3 py-1 rounded-lg bg-teal-100 text-teal-700 hover:bg-teal-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Anterior
                  </button>
                  <span className="text-teal-600 text-sm">
                    Página {currentPage + 1} de {totalPages}
                  </span>
                  <button
                    onClick={() => fetchData(currentPage + 1)}
                    disabled={currentPage >= totalPages - 1}
                    className="px-3 py-1 rounded-lg bg-teal-100 text-teal-700 hover:bg-teal-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Siguiente
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-teal-100 p-8 text-center">
            <div className="text-4xl mb-2">🧾</div>
            <p className="text-teal-500 mb-4">No hay transacciones registradas</p>
            <button
              onClick={() => setShowForm(true)}
              className="text-teal-600 hover:underline"
            >
              + Agregar tu primera transacción
            </button>
          </div>
        )}

        {/* Gestión de Categorías */}
        <div className="bg-white/80 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-teal-100 mt-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-teal-800">Categorías</h3>
            <button 
              onClick={() => { setEditingCategory(null); setNewCategoryData({ nombre: '', icono: '📦', color: '#3B82F6' }); setShowNewCategory(true); }}
              className="text-teal-600 hover:text-teal-800 text-sm font-medium"
            >
              + Nueva Categoría
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {categorias.map((cat) => (
              <div key={cat.id} className="flex items-center justify-between p-3 bg-teal-50 rounded-lg border border-teal-100">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{cat.icono || '📦'}</span>
                  <span className="text-sm text-teal-700">{cat.nombre}</span>
                </div>
                <div className="flex gap-1">
                  <button 
                    onClick={() => openEditCategory(cat)}
                    className="p-1 text-teal-600 hover:text-teal-800"
                    title="Editar"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button 
                    onClick={() => handleDeleteCategory(cat.id)}
                    className="p-1 text-red-500 hover:text-red-700"
                    title="Eliminar"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Modal Nueva Categoría */}
        {showNewCategory && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-teal-800">{editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}</h3>
                <button onClick={() => { setShowNewCategory(false); setEditingCategory(null); }} className="text-teal-500 hover:text-teal-700">
                  <X size={24} />
                </button>
              </div>
              <form onSubmit={handleCreateCategory} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-teal-700 mb-1">Nombre</label>
                  <input
                    type="text"
                    value={newCategoryData.nombre}
                    onChange={(e) => setNewCategoryData({ ...newCategoryData, nombre: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Ej: Servicios, Freelance..."
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-teal-700 mb-1">Icono</label>
                  <input
                    type="text"
                    value={newCategoryData.icono}
                    onChange={(e) => setNewCategoryData({ ...newCategoryData, icono: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Emoji"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-teal-700 mb-1">Color</label>
                  <input
                    type="color"
                    value={newCategoryData.color}
                    onChange={(e) => setNewCategoryData({ ...newCategoryData, color: e.target.value })}
                    className="w-full h-10 border border-gray-300 rounded-md cursor-pointer"
                  />
                </div>
                <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">
                  {editingCategory ? 'Actualizar Categoría' : 'Crear Categoría'}
                </button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
