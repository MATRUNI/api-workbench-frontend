import React, { useState, useLayoutEffect, useEffect } from 'react';
import { SunDim, MoonStar } from "lucide-react"

function ThemeToggle({ location = 'nav' }) {
  const [isLight, setIsLight] = useState(() => {
    let storedTheme = localStorage.getItem('api_os_theme');
    return storedTheme === 'light';
  });

  useEffect(() => {
    const handleStorageChange = () => {
      let storedTheme = localStorage.getItem('api_os_theme');
      setIsLight(storedTheme === 'light');
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('theme-changed', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('theme-changed', handleStorageChange);
    };
  }, []);

  useLayoutEffect(() => {
    if (isLight) {
      document.documentElement.classList.add('light-theme');
      localStorage.setItem('api_os_theme', 'light');
    } else {
      document.documentElement.classList.remove('light-theme');
      localStorage.setItem('api_os_theme', 'dark');
    }
  }, [isLight]);

  return (
    <button 
      className="btn theme-toggle-btn" 
      data-theme={location === 'nav' ? "notvisible" : "visible"}
      onClick={() => {
        setIsLight(!isLight);
        window.dispatchEvent(new Event('theme-changed'));
      }}
      title={!isLight ? `Light Theme` : "Dark Theme"}
    >
      {!isLight ? <SunDim /> : <MoonStar />}
    </button>
  );
}

export default ThemeToggle;