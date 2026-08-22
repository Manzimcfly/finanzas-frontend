import { X, RotateCcw } from 'lucide-react';
import { useWidgetConfig } from '../context/WidgetConfigContext';

export default function WidgetConfigModal({ isOpen, onClose }) {
  const { widgets, toggleWidget, resetWidgets } = useWidgetConfig();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-md w-full">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
            ⚙️ Configurar Widgets
          </h3>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-4 space-y-3">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Muestra u oculta los widgets del Dashboard
          </p>
          {widgets.map((widget) => (
            <div 
              key={widget.id}
              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{widget.icon}</span>
                <span className="text-gray-700 dark:text-gray-200 font-medium">
                  {widget.label}
                </span>
              </div>
              <button
                onClick={() => toggleWidget(widget.id)}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  widget.visible 
                    ? 'bg-teal-500' 
                    : 'bg-gray-300 dark:bg-slate-600'
                }`}
              >
                <span
                  className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    widget.visible ? 'left-7' : 'left-1'
                  }`}
                />
              </button>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-gray-200 dark:border-slate-700 flex gap-2">
          <button
            onClick={resetWidgets}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
          >
            <RotateCcw size={16} />
            Restablecer
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}