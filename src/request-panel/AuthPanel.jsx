import { useState, useContext } from 'react';
import { 
  ShieldCheck, 
  ShieldOff, 
  KeyRound, 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  Copy, 
  Check, 
  Trash2, 
  Info,
  Sparkles
} from 'lucide-react';
import { RequestContext } from '../context/RequestContext';
import { CustomDropdown } from '../components/utility_Components/CustomDropdown';
import { encodeBasicAuth, encodeBearerAuth } from '../utils/requestUtils';
import '../style/AuthPanel.css';

const AUTH_TYPE_OPTIONS = [
  { value: 'none', label: 'No Auth', icon: <ShieldOff size={14} className="auth-type-icon none" /> },
  { value: 'bearer', label: 'Bearer Token', icon: <KeyRound size={14} className="auth-type-icon bearer" /> },
  { value: 'basic', label: 'Basic Auth', icon: <Lock size={14} className="auth-type-icon basic" /> }
];

export default function AuthPanel() {
  const { request, setRequest } = useContext(RequestContext);
  const [showSecret, setShowSecret] = useState(false);
  const [copied, setCopied] = useState(false);

  const auth = request?.auth || {
    type: 'none',
    token: '',
    username: '',
    password: ''
  };

  const handleTypeChange = (e) => {
    const nextType = e.target.value;
    setRequest(prev => ({
      ...prev,
      auth: {
        ...(prev.auth || {}),
        type: nextType
      }
    }));
  };

  const handleFieldChange = (field, value) => {
    setRequest(prev => ({
      ...prev,
      auth: {
        ...(prev.auth || {}),
        [field]: value
      }
    }));
  };

  const handleClearAuth = () => {
    setRequest(prev => ({
      ...prev,
      auth: {
        type: 'none',
        token: '',
        username: '',
        password: ''
      }
    }));
  };

  // Compute live authorization header
  let generatedHeaderValue = '';
  if (auth.type === 'bearer' && auth.token?.trim()) {
    generatedHeaderValue = encodeBearerAuth(auth.token);
  } else if (auth.type === 'basic' && (auth.username || auth.password)) {
    generatedHeaderValue = encodeBasicAuth(auth);
  }

  const handleCopyHeader = async () => {
    if (!generatedHeaderValue) return;
    try {
      await navigator.clipboard.writeText(`Authorization: ${generatedHeaderValue}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy header: ", err);
    }
  };

  return (
    <div className="auth-panel-container">
      {/* Panel Top Header Bar */}
      <div className="auth-panel-header">
        <div className="auth-type-selector-group">
          <label className="auth-label">Type:</label>
          <CustomDropdown
            className="auth-dropdown"
            value={auth.type}
            options={AUTH_TYPE_OPTIONS}
            onChange={handleTypeChange}
            title="Select Authentication Type"
          />
        </div>

        {auth.type !== 'none' && (
          <button 
            type="button" 
            className="auth-clear-btn" 
            onClick={handleClearAuth}
            title="Reset authentication"
          >
            <Trash2 size={13} />
            <span>Reset Auth</span>
          </button>
        )}
      </div>

      {/* Main Configuration Form Area */}
      <div className="auth-panel-content">
        {auth.type === 'none' && (
          <div className="auth-empty-state">
            <div className="auth-empty-icon">
              <ShieldOff size={32} />
            </div>
            <h4>No Authentication Selected</h4>
            <p>This request will be sent without any authorization headers.</p>
            <div className="auth-quick-actions">
              <button 
                type="button" 
                className="auth-quick-btn"
                onClick={() => handleFieldChange('type', 'bearer')}
              >
                <KeyRound size={14} /> Enable Bearer Token
              </button>
              <button 
                type="button" 
                className="auth-quick-btn"
                onClick={() => handleFieldChange('type', 'basic')}
              >
                <Lock size={14} /> Enable Basic Auth
              </button>
            </div>
          </div>
        )}

        {auth.type === 'bearer' && (
          <div className="auth-form-card">
            <div className="auth-card-title">
              <KeyRound size={16} className="auth-accent-icon bearer" />
              <span>Bearer Token Authentication</span>
            </div>
            <p className="auth-helper-text">
              The token will be prefixed with <code>Bearer </code> and sent in the <code>Authorization</code> request header.
            </p>

            <div className="auth-input-row">
              <label className="auth-field-label">Token</label>
              <div className="auth-input-wrapper">
                <input
                  type={showSecret ? "text" : "password"}
                  className="auth-text-input"
                  placeholder="Paste Bearer Token or JWT..."
                  value={auth.token || ''}
                  onChange={(e) => handleFieldChange('token', e.target.value)}
                  autoComplete="off"
                  spellCheck="false"
                />
                <button
                  type="button"
                  className="auth-eye-btn"
                  onClick={() => setShowSecret(!showSecret)}
                  title={showSecret ? "Hide Token" : "Show Token"}
                >
                  {showSecret ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
          </div>
        )}

        {auth.type === 'basic' && (
          <div className="auth-form-card">
            <div className="auth-card-title">
              <Lock size={16} className="auth-accent-icon basic" />
              <span>Basic Authentication</span>
            </div>
            <p className="auth-helper-text">
              Credentials will be Base64-encoded and sent as <code>Authorization: Basic &lt;credentials&gt;</code>.
            </p>

            <div className="auth-grid-fields">
              <div className="auth-input-row">
                <label className="auth-field-label">
                  <User size={13} /> Username
                </label>
                <div className="auth-input-wrapper">
                  <input
                    type="text"
                    className="auth-text-input"
                    placeholder="Enter username..."
                    value={auth.username || ''}
                    onChange={(e) => handleFieldChange('username', e.target.value)}
                    autoComplete="off"
                    spellCheck="false"
                  />
                </div>
              </div>

              <div className="auth-input-row">
                <label className="auth-field-label">
                  <Lock size={13} /> Password
                </label>
                <div className="auth-input-wrapper">
                  <input
                    type={showSecret ? "text" : "password"}
                    className="auth-text-input"
                    placeholder="Enter password..."
                    value={auth.password || ''}
                    onChange={(e) => handleFieldChange('password', e.target.value)}
                    autoComplete="off"
                    spellCheck="false"
                  />
                  <button
                    type="button"
                    className="auth-eye-btn"
                    onClick={() => setShowSecret(!showSecret)}
                    title={showSecret ? "Hide Password" : "Show Password"}
                  >
                    {showSecret ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Live Header Preview Footer */}
        {auth.type !== 'none' && (
          <div className="auth-preview-card">
            <div className="auth-preview-header">
              <div className="auth-preview-title">
                <Sparkles size={14} className="preview-sparkle" />
                <span>Computed Header Preview</span>
              </div>
              {generatedHeaderValue && (
                <button 
                  type="button" 
                  className="auth-copy-header-btn" 
                  onClick={handleCopyHeader}
                  title="Copy computed Authorization header"
                >
                  {copied ? (
                    <><Check size={12} /> Copied</>
                  ) : (
                    <><Copy size={12} /> Copy Header</>
                  )}
                </button>
              )}
            </div>
            
            <div className="auth-preview-code">
              {generatedHeaderValue ? (
                <code>
                  <span className="header-key">Authorization:</span>{' '}
                  <span className="header-val">{generatedHeaderValue}</span>
                </code>
              ) : (
                <span className="preview-placeholder">
                  Enter {auth.type === 'bearer' ? 'token' : 'credentials'} above to generate the Authorization header preview.
                </span>
              )}
            </div>

            <div className="auth-footer-notice">
              <Info size={13} />
              <span>This header will be injected automatically during request dispatch and code generation.</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
