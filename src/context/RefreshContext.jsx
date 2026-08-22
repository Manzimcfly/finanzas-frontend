import { createContext, useContext, useState } from 'react';

const RefreshContext = createContext();

export function RefreshProvider({ children }) {
  const [refreshKey, setRefreshKey] = useState(0);
  
  const triggerRefresh = () => {
    console.log('Triggering refresh, current key:', refreshKey);
    setRefreshKey(k => {
      const newKey = k + 1;
      console.log('New refresh key:', newKey);
      return newKey;
    });
  };
  
  return (
    <RefreshContext.Provider value={{ refreshKey, triggerRefresh }}>
      {children}
    </RefreshContext.Provider>
  );
}

export function useRefresh() {
  return useContext(RefreshContext);
}
