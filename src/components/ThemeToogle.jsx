import React, { useState, useLayoutEffect } from 'react';

function ThemeToggle() {
  const [isLight, setIsLight] = useState(()=>{
    let storedTheme=localStorage.getItem('api_os_theme');
    return storedTheme === 'light'
  });

  useLayoutEffect(() => {
    if (isLight) {
      document.documentElement.classList.add('light-theme');
      localStorage.setItem('api_os_theme', 'light')
    } else {
      document.documentElement.classList.remove('light-theme');
      localStorage.setItem('api_os_theme', "dark")
    }
  }, [isLight]);

  return (
    <button 
      className="btn theme-toggle-btn" 
      onClick={() => setIsLight(!isLight)}
    >
      {isLight ? '🔆 LIGHT_OS' : '🌙 DARK_OS'}
    </button>
  );
}

export default ThemeToggle;