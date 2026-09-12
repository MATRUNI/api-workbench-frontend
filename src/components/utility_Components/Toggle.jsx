import { useState } from 'react';
import './Toggle.css';

export default function AnimatedToggle({isOn,setIsOn}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={isOn}
      onClick={() => setIsOn(!isOn)}
      className={`toggle-btn ${isOn ? 'on' : 'off'}`}
    >
    <span className="toggle-thumb" />
    </button>
  );
}