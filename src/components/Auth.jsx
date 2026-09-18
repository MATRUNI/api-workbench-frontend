import React, { useState, useContext, useEffect } from 'react';
import '../style/auth.css';
import AuthCall, { LoginCall, me, googleExchange } from '../services/AuthCall';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { UserContext } from '../context/UserContext';
import { sendOTP, verifyOTP } from '../services/otp';
import AuthPipelineLoader from './AuthPipelineLoader';
import { FcGoogle } from 'react-icons/fc';

function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [animKey, setAnimKey] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
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

  useEffect(() => {
    const oauthToken = searchParams.get('oauth_token');
    const oauthError = searchParams.get('error');

    if (oauthError) {
      setErrors({ system: 'GOOGLE_AUTH_FAILED' });
      setSearchParams({}, { replace: true });
      return;
    }

    if (!oauthToken) {
      setUser(null);
      return;
    }

    let cancelled = false;

    const completeGoogleLogin = async () => {
      setIsLoading(true);
      setErrors({});
      try {
        const data = await googleExchange(oauthToken);
        if (cancelled) return;
        setSearchParams({}, { replace: true });
        if (data.needsOnboarding) {
          navigate('/onboarding', { replace: true });
          return;
        }
        if (data.user) {
          setUser(data.user);
          navigate('/', { replace: true });
          return;
        }
        setErrors({ system: 'GOOGLE_AUTH_FAILED' });
      } catch {
        if (!cancelled) {
          setSearchParams({}, { replace: true });
          setErrors({ system: 'GOOGLE_AUTH_FAILED' });
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    completeGoogleLogin();
    return () => {
      cancelled = true;
    };
  }, []);

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

  const handleRequestOTP = async () => {
    setIsLoading(true);
    setErrors({});

    try {
      const response = await sendOTP({
        email: formData.email,
        username: formData.username,
      });
      const paylaod = await response.json();
      switch (response.status) {
        case 200:
          setOtpSent(true);
          break;
        case 400:
          setErrors({ email: "INVALID_EMAIL" });
          break;
        case 409:
          setErrors({ [paylaod.field]: paylaod.error });
          break;
        case 429:
          setErrors({ system: "TOO_MANY_REQUESTS" });
          break;
        case 500:
          setErrors({ system: "SERVER_ERROR" });
          break;
        default:
          setErrors({ system: paylaod.error || "UNKNOWN_ERROR" });
      }
    } catch {
      setErrors({ system: "NETWORK_ERROR" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    setIsLoading(true);
    setErrors({});

    try {
      const response = await verifyOTP({
        email: formData.email,
        otp: otpCode,
      });

      switch (response.status) {
        case 200:
          setIsEmailVerified(true);
          setOtpSent(false);
          break;
        case 400:
          setErrors({ otp: "INVALID_OTP" });
          break;
        case 401:
          setOtpSent(false);
          setIsEmailVerified(false);
          setOtpCode("");
          setErrors({ otp: "OTP_EXPIRED" });
          break;
        case 403:
          setErrors({ otp: "OTP_INCORRECT" });
          break;
        case 404:
          setErrors({ otp: "OTP_NOT_FOUND" });
          break;
        case 429:
          setErrors({ otp: "TOO_MANY_ATTEMPTS" });
          break;
        default:
          setOtpSent(false);
          setIsEmailVerified(false);
          setOtpCode("");
          setErrors({ system: response.error || "VERIFICATION_FAILED" });
      }
    } catch {
      setErrors({ system: "NETWORK_ERROR" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (validate()) {
      setIsLoading(true);
      let response;
      try {
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
          setUser({username: userData.username});
          navigate('/');
        }
      } catch (err) {
        setErrors({ system: response?.error || "AUTHENTICATION_FAILED" });
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

  const handleGoogleLogin = () => {
    window.location.href = `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}/api/auth/google`;
  };

  return (
    <>
    {isLoading ? (
      <AuthPipelineLoader mode={isLogin ? "sign in" : "sign up"}/>
    ) : (
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

          {/* GOOGLE OAUTH ACTION TRIGGER */}
          <button 
            type="button" 
            className="google-auth-btn"
            onClick={handleGoogleLogin}
          >
            <FcGoogle size={18} />
            <span>GOOGLE</span>
          </button>

          <div className="auth-divider">
            <span>OR_STANDARD_PROTOCOL</span>
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
                {!isLogin && isEmailVerified && <span className="success-tag">VERIFIED</span>}
                
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

            {/* OTP CHALLENGE INPUT LAYER */}
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

            {/* PASSWORD FIELD */}
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

            {/* SUBMIT BUTTON */}
            {(isLogin || isEmailVerified) && (
              <button className="auth-submit slide-in" disabled={isLoading}>
                {isLoading ? 'ENCRYPTING...' : isLogin ? 'ESTABLISH_SESSION' : 'REGISTER_OPERATOR'}
              </button>
            )}
          </form>
        </div>
      </div>
    )}
    </>
  );
}

export default Auth;