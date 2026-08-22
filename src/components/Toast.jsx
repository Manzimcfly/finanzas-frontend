import { createContext, useContext, useState, useCallback } from 'react';
import ToastNotification from './ToastNotification';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
  }, []);

  const hideToast = useCallback(() => {
    setToast(null);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      {toast && <ToastNotification message={toast.message} type={toast.type} onClose={hideToast} />}
    </ToastContext.Provider>
  );
}

export function useGlobalToast() {
  const context = useContext(ToastContext);
  if (!context) {
    return { 
      showToast: (msg, type) => console.log(`[Toast ${type}]: ${msg}`), 
      hideToast: () => {} 
    };
  }
  return context;
}

export default ToastNotification;