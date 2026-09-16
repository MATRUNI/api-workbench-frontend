import React, { useState, useEffect } from 'react';
import { SunDim, MoonStar } from "lucide-react"

function ThemeToggle({ location = 'nav' }) {
  const [isLight, setIsLight] = useState(() => {
    return document.documentElement.classList.contains('light-theme');
  });

  useEffect(() => {
    const handleThemeChange = () => {
      const currentIsLight = document.documentElement.classList.contains('light-theme');
      setIsLight(currentIsLight);
    };

    window.addEventListener('storage', handleThemeChange);
    window.addEventListener('theme-changed', handleThemeChange);

    return () => {
      window.removeEventListener('storage', handleThemeChange);
      window.removeEventListener('theme-changed', handleThemeChange);
    };
  }, []);

  const toggleTheme = () => {
    const nextIsLight = !isLight;
    
    // Update DOM & localStorage immediately
    if (nextIsLight) {
      document.documentElement.classList.add('light-theme');
      localStorage.setItem('api_os_theme', 'light');
    } else {
      document.documentElement.classList.remove('light-theme');
      localStorage.setItem('api_os_theme', 'dark');
    }

    setIsLight(nextIsLight);
    window.dispatchEvent(new Event('theme-changed'));
  };

  return (
    <button 
      className="btn theme-toggle-btn" 
      data-theme={location === 'nav' ? "notvisible" : "visible"}
      onClick={toggleTheme}
      title={!isLight ? `Light Theme` : "Dark Theme"}
    >
      {!isLight ? <SunDim /> : <MoonStar />}
    </button>
  );
}

export default ThemeToggle;