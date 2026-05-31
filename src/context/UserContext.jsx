import React, { createContext, useState, useEffect } from 'react';
import { me } from '../services/AuthCall';

// 1. Changed setUser default to a safe dummy function
export const UserContext = createContext({
  user: null,
  setUser: () => {}, 
  loading: true
});

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      if (window.location.pathname === '/auth') {
        setLoading(false);
        return;
      }
    };
    
    checkSession();
  }, []); 

  return (
    <UserContext.Provider value={{ user, setUser, loading }}>
      {children}
    </UserContext.Provider>
  );
}