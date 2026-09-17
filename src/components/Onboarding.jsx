import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../context/UserContext';
import { customFetch } from '../services/customFetch'; // Adjust path based on your file structure

function Onboarding() {
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { setUser } = useContext(UserContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim()) {
      setError("IDENTITY_ERROR: USERNAME_REQUIRED");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await customFetch(
        `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}/api/auth/onboarding`,
        {
          method: 'POST',
          body: JSON.stringify({ username })
        }
      );

      const data = await response.json();

      if (response.ok) {
        setUser({username});
        navigate('/');
      } else {
        setError(data.error || data.message || "REGISTRATION_FAILED");
      }
    } catch (err) {
      setError(err.message || "NETWORK_ERROR");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-panel">
        <div className="auth-topbar">
          <span className="auth-status">● ONBOARDING_REQUIRED</span>
          <span className="auth-build">SECURE_NODE_V1</span>
        </div>

        <div className="auth-brand">
          <h1>API<span>.</span>OS</h1>
          <p>INITIALIZE_OPERATOR_IDENTITY</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-field slide-in">
            <div className="label-row">
              <label>CHOOSE_OPERATOR_ID</label>
              {error && <span className="error-tag">{error}</span>}
            </div>
            <input
              className={error ? 'input-error' : ''}
              type="text"
              placeholder="ghost_protocol"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                if (error) setError(null);
              }}
              autoFocus
              disabled={isLoading}
            />
          </div>

          <button type="submit" className="auth-submit slide-in" disabled={isLoading}>
            {isLoading ? 'CONFIGURING...' : 'COMPLETE_SETUP'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Onboarding;