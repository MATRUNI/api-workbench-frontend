import React, { useState, useEffect } from 'react';

function ThemeToggle() {
  const [isLight, setIsLight] = useState(()=>{
    let storedTheme=localStorage.getItem('api_os_theme');
    return storedTheme === 'light'
  });

  useEffect(() => {
    if (isLight) {
      document.body.classList.add('light-theme');
      localStorage.setItem('api_os_theme', 'light')
    } else {
      document.body.classList.remove('light-theme');
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