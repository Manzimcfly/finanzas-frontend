import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import { X, ShieldCheck, ShieldOff, Plus, Building2, Banknote, Wallet, Bitcoin, Home, HandCoins, Briefcase } from 'lucide-react';
import Navbar from '../components/Navbar';

const TIPOS = [
  { value: 'banco', label: 'Banco', icon: Building2 },
  { value: 'efectivo', label: 'Efectivo', icon: Banknote },
  { value: 'inversion', label: 'Inversion', icon: Wallet },
  { value: 'cripto', label: 'Cripto', icon: Bitcoin },
  { value: 'hipoteca', label: 'Hipoteca', icon: Home },
  { value: 'prestamo', label: 'Prestamo', icon: HandCoins },
  { value: 'tarjeta', label: 'Tarjeta de Credito', icon: HandCoins },
  { value: 'fondo_emergencia', label: 'Fondo de Emergencia', icon: ShieldCheck },
  { value: 'nomina', label: 'Nomina', icon: Briefcase }
];
const ICONS = Object.fromEntries(TIPOS.map((t) => [t.value, t.icon]));
const LABELS = Object.fromEntries(TIPOS.map((t) => [t.value, t.label]));
const FORM_VACIO = {
  nombre: '',
  tipo: 'banco',
  saldo_inicial: 0,
  tasa_retorno: 0,
  banco: '',
  moneda: 'USD',
};

function fmt(valor, moneda) {
  const n = Number(valor || 0);
  return '$' + n.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function CardMini(props) {
  const color = props.color || 'text-teal-800';
  return (
    <div className="bg-white/80 p-4 rounded-xl shadow border border-teal-100">
      <p className="text-xs text-teal-600">{props.label}</p>
      <p className={'text-lg font-bold ' + color}>{props.value}</p>
    </div>
  );
}

export default function Cuentas() {
  const {token} = useAuth();
  const [cuentas, setCuentas] = useState([]);
  const [resumen, setResumen] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(FORM_VACIO);

  const cargar = async () => {
    setLoading(true);
    try {
      const [c, r] = await Promise.all([api.getCuentas(token), api.getResumenCuentas(token)]);
      setCuentas(c.cuentas || []);
      setResumen(r);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (token) cargar(); }, [token]);

  const resetForm = () => { setForm(FORM_VACIO); setEditingId(null); };

  const guardar = async (e) => {
    e.preventDefault();
    const monto = parseFloat(form.saldo_inicial) || 0;
    const tasa = parseFloat(form.tasa_retorno) || 0;
    try {
      if (editingId) {
        await api.updateCuenta(token, editingId, { ...form, saldo_actual: monto, tasa_retorno: tasa });
      } else {
        await api.createCuenta(token, { ...form, saldo_inicial: monto, tasa_retorno: tasa });
      }
      setShowForm(false); resetForm(); await cargar();
    } catch (err) { console.error(err); alert('Error al guardar'); }
  };

  const editar = (c) => {
    setForm({ nombre: c.nombre, tipo: c.tipo, saldo_inicial: c.saldo_actual, tasa_retorno: c.tasa_retorno || 0, banco: c.banco || '', moneda: c.moneda || 'USD' });
    setEditingId(c.id); setShowForm(true);
  };

  const eliminar = async (id) => { if (!confirm('Eliminar?')) return; try { await api.deleteCuenta(token, id); await cargar(); } catch (err) { console.error(err); } };


  if (loading) return <div className="min-h-screen flex items-center justify-center">Cargando</div>;


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-teal-50">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-teal-800">Cuentas</h2>
            <p className="text-sm text-teal-600">Gestiona tus cuentas y tu fondo de emergencia</p>
          </div>
          <button onClick={() => { resetForm(); setShowForm(true); }} className="bg-gradient-to-r from-teal-500 to-cyan-500 text-white px-4 py-2 rounded-lg flex items-center gap-2">
            <Plus size={18} /> Nueva Cuenta
          </button>
        </div>

        {resumen && (<div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <CardMini label={'Saldo Total'} value={fmt(resumen.total)} />
          <CardMini label={'Cuentas'} value={resumen.cantidad_cuentas} />
          <CardMini label={'Rendimiento Anual'} value={fmt(resumen.rendimiento_anual_total)} color={'text-emerald-600'} />
          <CardMini label={'Rendimiento Mensual'} value={fmt(resumen.rendimiento_mensual_total)} color={'text-cyan-600'} />
        </div>)}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cuentas.length === 0 ? (
            <div className="col-span-full bg-white/80 p-12 rounded-xl shadow border border-teal-100 text-center">
              <p className="text-teal-600">No hay cuentas. Crea la primera.</p>
            </div>
          ) : (
            cuentas.map((cuenta) => {
              const Icon = ICONS[cuenta.tipo] || Wallet;
              const esFondo = cuenta.tipo === 'fondo_emergencia';
              return (
                <div key={cuenta.id} className={'bg-white/80 p-5 rounded-xl shadow border ' + (esFondo ? 'border-emerald-400 ring-2 ring-emerald-200' : 'border-teal-100')}>
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      <div className={'p-2 rounded-lg ' + (esFondo ? 'bg-emerald-100' : 'bg-teal-100')}>
                        <Icon size={20} className={esFondo ? 'text-emerald-700' : 'text-teal-700'} />
                      </div>
                      <div>
                        <p className="font-semibold text-teal-800">{cuenta.nombre}</p>
                        <p className="text-xs text-teal-500">{LABELS[cuenta.tipo] || cuenta.tipo}</p>
                      </div>
                    </div>
                    {esFondo && <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full font-medium">Fondo</span>}
                  </div>
                  <p className="text-2xl font-bold text-teal-900 mb-1">{fmt(cuenta.saldo_actual, cuenta.moneda)}</p>
                  {cuenta.banco && <p className="text-xs text-teal-600 mb-1">Banco: {cuenta.banco}</p>}
                  {cuenta.tasa_retorno > 0 && <p className="text-xs text-emerald-600">Tasa {cuenta.tasa_retorno}% + {fmt(cuenta.rendimiento_anual, cuenta.moneda)}/ano</p>}
                  <div className="mt-3 pt-3 border-t border-teal-100 flex justify-between items-center">
                    <div className="flex gap-3">
                      <button onClick={() => editar(cuenta)} className="text-xs text-blue-600">Editar</button>
                      <button onClick={() => eliminar(cuenta.id)} className="text-xs text-red-600">Eliminar</button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-teal-800">{editingId ? 'Editar Cuenta' : 'Nueva Cuenta'}</h3>
              <button onClick={() => { setShowForm(false); resetForm(); }} className="text-teal-500">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={guardar} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-teal-700 mb-1">Nombre</label>
                <input type="text" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} className="w-full px-3 py-2 border rounded-md" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-teal-700 mb-1">Tipo</label>
                <select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })} className="w-full px-3 py-2 border rounded-md">
                  {TIPOS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-teal-700 mb-1">{editingId ? 'Saldo actual' : 'Saldo inicial'}</label>
                  <input type="number" step="0.01" value={form.saldo_inicial} onChange={(e) => setForm({ ...form, saldo_inicial: e.target.value })} className="w-full px-3 py-2 border rounded-md" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-teal-700 mb-1">Tasa %</label>
                  <input type="number" step="0.1" value={form.tasa_retorno} onChange={(e) => setForm({ ...form, tasa_retorno: e.target.value })} className="w-full px-3 py-2 border rounded-md" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-teal-700 mb-1">Banco</label>
                <input type="text" value={form.banco} onChange={(e) => setForm({ ...form, banco: e.target.value })} className="w-full px-3 py-2 border rounded-md" />
              </div>
              <div>
                <label className="block text-sm font-medium text-teal-700 mb-1">Moneda</label>
                <select value={form.moneda} onChange={(e) => setForm({ ...form, moneda: e.target.value })} className="w-full px-3 py-2 border rounded-md">
                  <option value="USD">USD</option>
                  <option value="MXN">MXN</option>
                  <option value="EUR">EUR</option>
                  <option value="COP">COP</option>
                </select>
              </div>
              <button type="submit" className="w-full bg-gradient-to-r from-teal-500 to-cyan-500 text-white py-2 rounded-lg">{editingId ? 'Guardar' : 'Crear'}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
