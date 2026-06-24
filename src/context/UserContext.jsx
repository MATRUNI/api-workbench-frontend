import React, { createContext, useState, useEffect, useContext } from 'react';
import { LogoutCall, me } from '../services/AuthCall';
import { LibraryContext } from './LibraryContext';
// 1. Changed setUser default to a safe dummy function
export const UserContext = createContext({
  user: null,
  setUser: () => {}, 
  loading: true,
  handleLogout: async()=>{}
});

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const { setAPIList } = useContext(LibraryContext)

  useEffect(() => {
    const checkSession = async () => {
      if (window.location.pathname === '/auth') {
        setLoading(false);
        return;
      }
    };
    
    checkSession();
  }, []); 
    const handleLogout = async () => {
        const confirmed = window.confirm(
          "Are you sure you want to logout?"
        );
      
        if (!confirmed) {
            return;
        }
        try {
            await LogoutCall(); 
            setUser(null);
            setAPIList([])
          window.location.replace('/auth');
        } catch (err) {
            console.error("LOGOUT_CRITICAL_FAILURE:", err);
        }
    };
  return (
    <UserContext.Provider value={{ user, setUser, loading, handleLogout }}>
      {children}
    </UserContext.Provider>
  );
}