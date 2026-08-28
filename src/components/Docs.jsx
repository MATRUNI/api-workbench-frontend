import React from 'react';
import { 
  Terminal, 
  Book,
  History,
  MessageSquareCodeIcon,
  Database,
  ShieldCheck,
  Lock
} from 'lucide-react';
import '../style/Docs.css';

function Docs() {
  return (
    <div className="docs-container">
      <header className="docs-header">
        <h1 className="docs-title">SYSTEM DOCUMENTATION // V1</h1>
        <p className="docs-subtitle">OPERATOR MANUAL & PLATFORM GUIDE</p>
      </header>

      <section className="docs-section">
        <h2 className="docs-section-title">
          <Book className="docs-icon" size={20} />
          OVERVIEW
        </h2>
        <div className="docs-content">
          <p>
            Welcome to <span className="docs-highlight">API-OS</span>, a real-time API workbench operating as a collaborative "Comm Matrix".
            This platform merges robust RESTful HTTP testing with real-time peer-to-peer WebRTC voice communication, terminal-styled team chat, and instant configuration sharing via WebSockets.
          </p>
        </div>
      </section>

      <section className="docs-section">
        <h2 className="docs-section-title">
          <Terminal className="docs-icon" size={20} />
          ENDPOINTS
        </h2>
        <div className="docs-content">
          <p>
            The <strong>Endpoints</strong> tab is your primary workbench for making API calls.
          </p>
          <ul className="docs-list">
            <li><strong>Request Execution:</strong> Construct and fire requests across standard HTTP methods with dynamic headers, query parameters, and body payloads.</li>
            <li><strong>Config Sharing:</strong> Includes a dedicated <strong>CONFIG</strong> button that allows you to instantly share your exact API configuration with any registered user (they do not need to be online to receive it).</li>
          </ul>
        </div>
      </section>
      
      <section className="docs-section">
        <h2 className="docs-section-title">
          <History className="docs-icon" size={20} />
          CONSOLE
        </h2>
        <div className="docs-content">
          <p>
            The <strong>Console</strong> tab serves entirely as your execution history vault.
          </p>
          <ul className="docs-list">
            <li><strong>Execution Logs:</strong> Every API call you make is automatically logged here, allowing you to easily track and review your past requests, response statuses, and latency metrics.</li>
          </ul>
        </div>
      </section>

      <section className="docs-section">
        <h2 className="docs-section-title">
          <MessageSquareCodeIcon className="docs-icon" size={20} />
          CHAT & CALL
          <span style={{ fontSize: '0.75rem', color: '#ffaa00', marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 'normal', letterSpacing: '0.5px' }}>
            <Lock size={14} /> REQUIRES LOGIN
          </span>
        </h2>
        <div className="docs-content">
          <p>
            The <strong>Chat</strong> section is your dedicated portal for real-time team communication.
          </p>
          <ul className="docs-list">
            <li><strong>Text Chat:</strong> A terminal-styled live chat interface to communicate instantly with other online users.</li>
            <li><strong>Voice Calls:</strong> Built-in WebRTC capabilities allow you to initiate secure, peer-to-peer audio calls with other online users directly from the chat interface.</li>
          </ul>
        </div>
      </section>

      <section className="docs-section">
        <h2 className="docs-section-title">
          <Database className="docs-icon" size={20} />
          FETCH
        </h2>
        <div className="docs-content">
          <p>
            The <strong>Fetch</strong> tab is the centralized API Library.
          </p>
          <ul className="docs-list">
            <li><strong>Free APIs:</strong> Contains a library of free, public APIs (like JSON Placeholder and a few others) for quick testing and exploration.</li>
            <li><strong>Product APIs <Lock size={12} style={{color:'#ffaa00', display:'inline', verticalAlign:'middle', marginBottom:'2px', marginLeft: '2px'}} title="Requires Login" />:</strong> Logged-in users gain access to exclusive product APIs to directly interact with our backend services.</li>
          </ul>
        </div>
      </section>

      <section className="docs-section">
        <h2 className="docs-section-title">
          <ShieldCheck className="docs-icon" size={20} />
          AUTHENTICATION
        </h2>
        <div className="docs-content">
          <p>
            Access to the platform is secured through a robust authentication gateway.
          </p>
          <ul className="docs-list">
            <li><strong>Sign Up:</strong> New users must register using a unique Username, an Email address, complete a mandatory OTP verification challenge, and set a Password.</li>
            <li><strong>Sign In:</strong> Returning users can securely log in using just their verified Email and Password.</li>
          </ul>
        </div>
      </section>
      
      <div style={{textAlign: 'center', margin: '3rem 0 1rem', color: '#555', fontSize: '0.8rem', letterSpacing: '1px'}}>
        END OF DOCUMENTATION
      </div>
    </div>
  );
}

export default Docs;