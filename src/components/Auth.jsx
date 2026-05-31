import React, { useState, useContext } from 'react';
import '../style/auth.css';
import AuthCall, { LoginCall, me } from '../services/AuthCall';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../context/UserContext';

function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [animKey, setAnimKey] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const navigate=useNavigate()
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: ''
  });

  const [errors, setErrors] = useState({});
  const { setUser } = useContext(UserContext);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for specific field as user types
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const validate = () => {
    let tempErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!formData.email) {
      tempErrors.email = "REQUIRED_FIELD: EMAIL_NULL";
    } else if (!emailRegex.test(formData.email)) {
      tempErrors.email = "PROTOCOL_ERROR: INVALID_EMAIL_FORMAT";
    }

    if (formData.password.length < 6) {
      tempErrors.password = "SECURITY_BREACH: PASS_MIN_6_CHAR";
    }

    if (!isLogin && !formData.username) {
      tempErrors.username = "IDENTITY_ERROR: ID_MISSING";
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (validate()) {
      setIsLoading(true);
      try {
        let response;
        if(isLogin)
        {
          const {email,password}=formData
          response = await LoginCall({email,password})
        }
        else
        {
          response = await AuthCall(formData);
        }
        if (response && response.user) {
          setUser(response.user); 
          navigate('/');
        } else {
          const userData = await me();
          setUser(userData);
          navigate('/');
        }
      } catch (err) {
        setErrors({ system: "CONNECTION_REFUSED: NODE_UNREACHABLE" });
      } finally {
        setIsLoading(false);
      }
    }
  };

  const toggleAuthMode = (mode) => {
    setIsLogin(mode);
    setErrors({});
    setAnimKey(prev => prev + 1);
  };

  return (
    <div className="auth-shell">
      <div className="auth-panel">
        <div className="auth-topbar">
          <span className="auth-status">● SECURE_NODE</span>
          <span className="auth-build">AUTH_MODULE_V1</span>
        </div>

        <div className="auth-brand">
          <h1>API<span>.</span>OS</h1>
          <p>
            {isLogin ? 'SESSION AUTHENTICATION REQUIRED' : 'REGISTER NEW OPERATOR'}
          </p>
        </div>

        <div className="auth-switch">
          <button 
            className={isLogin ? 'active' : ''} 
            onClick={() => toggleAuthMode(true)}
          >
            SIGN IN
          </button>
          <button 
            className={!isLogin ? 'active' : ''} 
            onClick={() => toggleAuthMode(false)}
          >
            SIGN UP
          </button>
        </div>

        <form onSubmit={handleSubmit} key={animKey} className="auth-form">
          {/* USERNAME FIELD (Sign Up Only) */}
          {!isLogin && (
            <div className="auth-field slide-in">
              <div className="label-row">
                <label>OPERATOR_ID</label>
                {errors.username && <span className="error-tag">{errors.username}</span>}
              </div>
              <input
                className={errors.username ? 'input-error' : ''}
                type="text"
                name="username"
                placeholder="ghost_protocol"
                value={formData.username}
                onChange={handleChange}
                autoFocus
              />
            </div>
          )}

          {/* EMAIL FIELD */}
          <div className="auth-field slide-in">
            <div className="label-row">
              <label>EMAIL_ADDRESS</label>
              {errors.email && <span className="error-tag">{errors.email}</span>}
            </div>
            <input
              className={errors.email ? 'input-error' : ''}
              type="email"
              name="email"
              placeholder="operator@node.net"
              value={formData.email}
              onChange={handleChange}
              autoFocus={isLogin}
            />
          </div>

          {/* PASSWORD FIELD */}
          <div className="auth-field slide-in">
            <div className="label-row">
              <label>ACCESS_KEY</label>
              {errors.password && <span className="error-tag">{errors.password}</span>}
            </div>
            <div className="password-input-wrapper">
              <input
                className={errors.password ? 'input-error' : ''}
                type={showPassword ? 'text' : 'password'}
                name="password"
                placeholder="••••••••••"
                value={formData.password}
                onChange={handleChange}
              />
              <button
                type="button"
                onClick={() => setShowPassword(prev => !prev)}
                className="toggle-password-btn"
              >
                {showPassword ? "HIDE" : "SHOW"}
              </button>
            </div>
          </div>

          {errors.system && <div className="system-error-log">{errors.system}</div>}

          <button className="auth-submit slide-in" disabled={isLoading}>
            {isLoading ? 'ENCRYPTING...' : isLogin ? 'ESTABLISH_SESSION' : 'REGISTER_OPERATOR'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Auth;