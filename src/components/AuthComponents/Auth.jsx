import React, { useState } from 'react';
import '../../style/auth.css';

function Auth() {
  const [isLogin, setIsLogin] = useState(true);

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: ''
  });
  const [showPassword,setShowPassword]=useState(false)

  const [animKey, setAnimKey] = useState(0);

  const handleChange = (e) => {
    e.preventDefault();
    const {name,value}=e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (isLogin) {
      console.log('LOGIN', formData);
    } else {
      console.log('REGISTER', formData);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-panel">

        <div className="auth-topbar">
          <span className="auth-status">
            ● SECURE_NODE
          </span>
          <span className="auth-build">
            AUTH_MODULE_V1
          </span>
        </div>

        <div className="auth-brand">
          <h1>
            API<span>.</span>OS
          </h1>
          <p>
            {isLogin
              ? 'SESSION AUTHENTICATION REQUIRED'
              : 'REGISTER NEW OPERATOR'}
          </p>
        </div>

        <div className="auth-switch">
          <button
            className={isLogin ? 'active' : ''}
            onClick={() => {
              setIsLogin(true)
              setAnimKey(prev=>prev+1)
            }}
          >
            SIGN IN
          </button>

          <button
            className={!isLogin ? 'active' : ''}
            onClick={() => {
              setIsLogin(false)
              setAnimKey(prev=>prev+1)
            }}
          >
            SIGN UP
          </button>
        </div>

        <form onSubmit={handleSubmit} key={animKey} className="auth-form">

          {!isLogin && (
            <div className="auth-field slide-in">
              <label>OPERATOR_ID</label>

              <input
                type="text"
                name="username"
                placeholder="ghost_protocol"
                value={formData.username}
                onChange={handleChange}
              />
            </div>
          )}

          <div className="auth-field slide-in">
            <label>EMAIL_ADDRESS</label>

            <input
              type="email"
              name="email"
              placeholder="operator@node.net"
              value={formData.email}
              onChange={handleChange}
            />
          </div>

          <div className="auth-field slide-in">
            <label>ACCESS_KEY</label>

            <input
              type={showPassword?'text':'password'}
              name="password"
              placeholder="••••••••••"
              value={formData.password}
              onChange={handleChange}
            />
              <button
                type="button"
                onClick={() => setShowPassword(prev => !prev)}
                className="toggle-password"
              >
                {showPassword ? "HIDE" : "SHOW"}
              </button>
          </div>

          <button className="auth-submit slide-in">
            {isLogin
              ? 'ESTABLISH_SESSION'
              : 'REGISTER_OPERATOR'}
          </button>

        </form>

      </div>
    </div>
  );
}

export default Auth;