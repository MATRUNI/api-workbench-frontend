import React, { useState, useContext, useEffect } from 'react';
import '../style/auth.css';
import AuthCall, { LoginCall, me } from '../services/AuthCall';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../context/UserContext';
import { sendOTP, verifyOTP } from '../services/otp';

function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [animKey, setAnimKey] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  
  // Custom Flow Validation Drivers
  const [isEmailValidFormat, setIsEmailValidFormat] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [otpCode, setOtpCode] = useState('');

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: ''
  });

  const [errors, setErrors] = useState({});
  const { setUser } = useContext(UserContext);

  // Real-time listener checking for a clean structural regex pass
  useEffect(() => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (emailRegex.test(formData.email)) {
      setIsEmailValidFormat(true);
    } else {
      setIsEmailValidFormat(false);
    }
  }, [formData.email]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const validate = () => {
    let tempErrors = {};

    if (!isLogin && !isEmailVerified) {
      tempErrors.email = "PROTOCOL_ERROR: EMAIL_VERIFICATION_REQUIRED";
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

  // Triggered via the inline verification badge component
  const handleRequestOTP = async () => {
    setIsLoading(true);
    try {
      setOtpSent(await sendOTP({email:formData.email}))
      setErrors(prev => ({ ...prev, email: null }));
    } catch (err) {
      setErrors({ system: "DISPATCH_FAILED: OTP_GATEWAY_OFFLINE" });
    } finally {
      setIsLoading(false);
    }
  };

  // Triggered inside the verification challenge terminal
  const handleVerifyOTP = async () => {
    setIsLoading(true);
    try {
      setIsEmailVerified(await verifyOTP({email:formData.email,otp:otpCode}))
      setErrors(prev => ({ ...prev, otp: null }));
    } catch (err) {
      setErrors({ otp: "ACCESS_DENIED: MATCH_FAILED" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (validate()) {
      setIsLoading(true);
      try {
        let response;
        if (isLogin) {
          const { email, password } = formData;
          response = await LoginCall({ email, password });
        } else {
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
    setOtpSent(false);
    setIsEmailVerified(false);
    setOtpCode('');
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
          <button className={isLogin ? 'active' : ''} onClick={() => toggleAuthMode(true)}>
            SIGN IN
          </button>
          <button className={!isLogin ? 'active' : ''} onClick={() => toggleAuthMode(false)}>
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
              
              {/* Contextual dynamic utility badges appearing inline inside header label area */}
              {errors.email && <span className="error-tag">{errors.email}</span>}
              {!isLogin && isEmailVerified && <span className="success-tag">VERIFIED</span>}
              
              {/* Inline Action Trigger: Reveals itself right beside label when regex passes */}
              {!isLogin && isEmailValidFormat && !otpSent && !isEmailVerified && (
                <button 
                  type="button" 
                  className="inline-verify-trigger"
                  onClick={handleRequestOTP}
                  disabled={isLoading}
                >
                  [VERIFY_EMAIL]
                </button>
              )}
            </div>
            <input
              className={errors.email ? 'input-error' : ''}
              type="email"
              name="email"
              placeholder="operator@node.net"
              value={formData.email}
              onChange={handleChange}
              autoFocus={isLogin}
              disabled={!isLogin && otpSent}
            />
          </div>

          {/* OTP CHALLENGE INPUT LAYER (Revealed directly under email upon verification click) */}
          {!isLogin && otpSent && !isEmailVerified && (
            <div className="auth-field challenge-reveal">
              <div className="label-row">
                <label>OTP_SECURITY_CHALLENGE</label>
                {errors.otp && <span className="error-tag">{errors.otp}</span>}
              </div>
              <div className="otp-input-group">
                <input
                  className={errors.otp ? 'input-error' : ''}
                  type="text"
                  maxLength="6"
                  placeholder="######"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  autoFocus
                />
                <button 
                  type="button" 
                  onClick={handleVerifyOTP} 
                  className="auth-verify-action-btn"
                  disabled={isLoading}
                >
                  {isLoading ? "VERIFYING..." : "CONFIRM"}
                </button>
              </div>
            </div>
          )}

          {/* PASSWORD FIELD (Unlocked permanently for Login, unlocked via email validation for SignUp) */}
          {(isLogin || isEmailVerified) && (
            <div className="auth-field slide-in credential-reveal">
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
          )}

          {errors.system && <div className="system-error-log">{errors.system}</div>}

          {/* Main system interaction button trigger handles standard login execution or finalized deployment updates */}
          {(isLogin || isEmailVerified) && (
            <button className="auth-submit slide-in" disabled={isLoading}>
              {isLoading ? 'ENCRYPTING...' : isLogin ? 'ESTABLISH_SESSION' : 'REGISTER_OPERATOR'}
            </button>
          )}
        </form>
      </div>
    </div>
  );
}

export default Auth;