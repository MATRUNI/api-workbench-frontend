import { createContext, useContext, useEffect, useState } from 'react';

export const MobileContext = createContext();

export function MobileProvider({ children }) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.matchMedia("(max-width: 1220px)").matches);
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  return (
    <MobileContext.Provider value={{isMobile}}>
      {children}
    </MobileContext.Provider>
  );
}