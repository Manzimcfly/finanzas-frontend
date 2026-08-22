import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import { Plus, X } from 'lucide-react';
import Navbar from '../components/Navbar';

export default function Inversiones() {
  const { token } = useAuth();
  const [data, setData] = useState(null);
  const [cuentas, setCuentas] = useState([]);
  const [resumenCuentas, setResumenCuentas] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showNewCuenta, setShowNewCuenta] = useState(false);
  const [editingCuenta, setEditingCuenta] = useState(null);
  const [newCuentaData, setNewCuentaData] = useState({
    nombre: '',
    tipo: 'inversion',
    saldo_inicial: 0,
    tasa_retorno: 0,
    banco: '',
    moneda: 'USD'
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [inversionData, cuentasData, resumen] = await Promise.all([
          api.getInversion(token, new Date().getMonth() + 1, new Date().getFullYear()),
          api.getCuentas(token),
          api.getResumenCuentas(token),
        ]);
        setData(inversionData);
        setCuentas(cuentasData.cuentas || []);
        setResumenCuentas(resumen);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token]);

  const handleCreateCuenta = async (e) => {
    e.preventDefault();
    try {
      await api.createCuenta(token, {
        ...newCuentaData,
        saldo_inicial: parseFloat(newCuentaData.saldo_inicial),
        tasa_retorno: parseFloat(newCuentaData.tasa_retorno),
      });
      setShowNewCuenta(false);
      setNewCuentaData({ nombre: '', tipo: 'inversion', saldo_inicial: 0, tasa_retorno: 0, banco: '', moneda: 'USD' });
      const [cuentasData, resumen] = await Promise.all([
        api.getCuentas(token),
        api.getResumenCuentas(token)
      ]);
      setCuentas(cuentasData.cuentas || []);
      setResumenCuentas(resumen);
    } catch (err) {
      console.error('Error creating cuenta:', err);
      alert('Error al crear cuenta');
    }
  };

  const handleUpdateCuenta = async (cuentaId, saldo_actual, tasa_retorno) => {
    try {
      await api.updateCuenta(token, cuentaId, { saldo_actual, tasa_retorno });
      setEditingCuenta(null);
      const [cuentasData, resumen] = await Promise.all([
        api.getCuentas(token),
        api.getResumenCuentas(token)
      ]);
      setCuentas(cuentasData.cuentas || []);
      setResumenCuentas(resumen);
    } catch (err) {
      console.error('Error updating cuenta:', err);
      alert('Error al actualizar cuenta');
    }
  };

  const handleDeleteCuenta = async (cuentaId) => {
    if (!confirm('¿Estás seguro de eliminar esta cuenta?')) return;
    try {
      await api.deleteCuenta(token, cuentaId);
      const [cuentasData, resumen] = await Promise.all([
        api.getCuentas(token),
        api.getResumenCuentas(token)
      ]);
      setCuentas(cuentasData.cuentas || []);
      setResumenCuentas(resumen);
    } catch (err) {
      console.error('Error deleting cuenta:', err);
      alert('Error al eliminar cuenta');
    }
  };


  if (loading) return <div className="min-h-screen flex items-center justify-center">Cargando...</div>;

  const cuentasInversion = cuentas.filter(c => ['inversion', 'cripto'].includes(c.tipo));

  const getTipoLabel = (tipo) => {
    const labels = {
      banco: 'Banco',
      inversion: 'Inversión',
      cripto: 'Cripto',
      efectivo: 'Efectivo',
      hipoteca: 'Hipoteca',
      prestamo: 'Préstamo'
    };
    return labels[tipo] || tipo;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-teal-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">


        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-teal-800">Inversiones</h2>
          <button onClick={() => setShowNewCuenta(true)} className="bg-gradient-to-r from-teal-500 to-cyan-500 text-white px-4 py-2 rounded-lg hover:from-teal-600 hover:to-cyan-600 shadow-lg">
            + Nueva Cuenta
          </button>
        </div>

        {resumenCuentas && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-gradient-to-br from-emerald-400 to-teal-500 p-6 rounded-xl shadow-lg text-white">
              <h4 className="text-sm text-emerald-100 mb-1">Rendimiento Anual Total</h4>
              <p className="text-2xl font-bold">
                ${resumenCuentas.rendimiento_anual_total?.toLocaleString() || 0}
              </p>
            </div>
            <div className="bg-gradient-to-br from-cyan-400 to-blue-500 p-6 rounded-xl shadow-lg text-white">
              <h4 className="text-sm text-cyan-100 mb-1">Rendimiento Mensual Total</h4>
              <p className="text-2xl font-bold">
                ${resumenCuentas.rendimiento_mensual_total?.toLocaleString() || 0}
              </p>
            </div>
          </div>
        )}

        {cuentasInversion.length > 0 && (
          <div className="bg-white/80 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-teal-100 mb-6">
            <h3 className="text-lg font-semibold text-teal-800 mb-4">Cuentas de Inversión</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {cuentasInversion.map((cuenta) => (
                <div key={cuenta.id} className="border rounded-lg p-4">
                  {editingCuenta === cuenta.id ? (
                    <form onSubmit={(e) => { e.preventDefault(); handleUpdateCuenta(cuenta.id, e.target.saldo.value, e.target.tasa.value); }} className="space-y-2">
                      <input name="saldo" type="number" defaultValue={cuenta.saldo_actual} step="0.01" className="w-full px-2 py-1 border rounded text-sm" placeholder="Saldo" />
                      <input name="tasa" type="number" defaultValue={cuenta.tasa_retorno} step="0.1" className="w-full px-2 py-1 border rounded text-sm" placeholder="Tasa %" />
                      <div className="flex gap-2">
                        <button type="submit" className="flex-1 bg-blue-600 text-white py-1 rounded text-xs">Guardar</button>
                        <button type="button" onClick={() => setEditingCuenta(null)} className="bg-gray-200 px-3 py-1 rounded text-xs">Cancelar</button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold text-teal-800">{cuenta.nombre}</p>
                          <p className="text-xs text-teal-500">{cuenta.banco || getTipoLabel(cuenta.tipo)}</p>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => setEditingCuenta(cuenta.id)} className="text-blue-600 text-xs">Editar</button>
                          <button onClick={() => handleDeleteCuenta(cuenta.id)} className="text-red-600 text-xs">Eliminar</button>
                        </div>
                      </div>
                      <p className="text-xl font-bold text-green-600 mt-2">{cuenta.saldo_actual?.toLocaleString()}</p>
                      {cuenta.tasa_retorno > 0 && (
                        <div className="mt-2 pt-2 border-t text-xs">
                          <p className="text-teal-600">Tasa: {cuenta.tasa_retorno}%</p>
                          <p className="text-green-600">Rendimiento: {cuenta.rendimiento_anual?.toLocaleString()}</p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

       </div>

<aside className="lg:col-span-1">
          <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl shadow-lg border border-teal-100 sticky top-4">
            <h3 className="text-md font-semibold text-teal-800 mb-2">Otras Cuentas</h3>
            <p className="text-xs text-teal-500 mb-3">Banco, efectivo, hipoteca, prestamo</p>
            <Link to="/cuentas" className="block w-full text-center bg-teal-50 text-teal-700 px-3 py-2 rounded-lg hover:bg-teal-100 text-sm font-medium mb-3">Gestionar Cuentas →</Link>
            {cuentas.filter((c) => ["banco", "efectivo", "hipoteca", "prestamo"].includes(c.tipo)).length > 0 && (
                <div className="space-y-2">
                    {cuentas.filter((c) => ["banco", "efectivo", "hipoteca", "prestamo"].includes(c.tipo)).slice(0, 6).map((c) => (
                         <div key={c.id} className="text-xs p-2 bg-gray-50 rounded">
                             <p className="font-medium text-teal-800 truncate">{c.nombre}</p>
                             <p className="text-teal-600">${c.saldo_actual.toLocaleString()}</p>
                       </div>
                    ))}
                </div>
            )}
          </div>
        </aside>
       </div>
       </main>
    </div>
  );
}
