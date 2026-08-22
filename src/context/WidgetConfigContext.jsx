import { createContext, useContext, useState, useEffect } from 'react';

const WidgetConfigContext = createContext();

const defaultWidgets = [
  { id: 'indicadores', label: 'Indicadores Financieros', icon: '📊', visible: true, order: 0 },
  { id: 'insights', label: 'Análisis Inteligente', icon: '🤖', visible: true, order: 1 },
  { id: 'metas', label: 'Resumen de Metas', icon: '🎯', visible: true, order: 2 },
  { id: 'grafico_categoria', label: 'Gráfico por Categoría', icon: '🥧', visible: true, order: 3 },
  { id: 'tendencia', label: 'Tendencia Mensual', icon: '📈', visible: true, order: 4 },
  { id: 'ultimos_gastos', label: 'Últimos Gastos', icon: '🧾', visible: true, order: 5 },
];

export function WidgetConfigProvider({ children }) {
  const [widgets, setWidgets] = useState(() => {
    const saved = localStorage.getItem('dashboard_widgets');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return defaultWidgets;
      }
    }
    return defaultWidgets;
  });

  const [showConfig, setShowConfig] = useState(false);

  useEffect(() => {
    localStorage.setItem('dashboard_widgets', JSON.stringify(widgets));
  }, [widgets]);

  const toggleWidget = (widgetId) => {
    setWidgets(prev => 
      prev.map(w => w.id === widgetId ? { ...w, visible: !w.visible } : w)
    );
  };

  const resetWidgets = () => {
    setWidgets(defaultWidgets);
  };

  const isWidgetVisible = (widgetId) => {
    const widget = widgets.find(w => w.id === widgetId);
    return widget ? widget.visible : true;
  };

  const getOrderedWidgets = () => {
    return [...widgets].sort((a, b) => a.order - b.order);
  };

  return (
    <WidgetConfigContext.Provider value={{ 
      widgets, 
      toggleWidget, 
      resetWidgets, 
      isWidgetVisible, 
      getOrderedWidgets,
      showConfig,
      setShowConfig
    }}>
      {children}
    </WidgetConfigContext.Provider>
  );
}

export function useWidgetConfig() {
  const context = useContext(WidgetConfigContext);
  if (!context) {
    throw new Error('useWidgetConfig must be used within a WidgetConfigProvider');
  }
  return context;
}