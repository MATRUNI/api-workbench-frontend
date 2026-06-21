import React, { useState, useContext, useEffect } from 'react';
import { UserContext } from '../context/UserContext';
import { getUserProfile } from '../services/AuthCall';
import { useNavigate } from 'react-router-dom';
import '../style/UserProfileManifest.css';

export default function UserDashboard() {
    const { user, handleLogout } = useContext(UserContext);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    const navigate = useNavigate();

    useEffect(() => {
        async function fetchDashboardData() {
            try {
                const data = await getUserProfile();
                if (!data || !data.success) {
                    return navigate('/auth');
                }
                setProfile(data.profile);
            } catch (err) {
                console.error("Dashboard link exception:", err);
                navigate('/auth');
            } finally {
                setLoading(false);
            }
        }
        fetchDashboardData();
    }, []);

    if (loading) {
        return (
            <div className="void-loader-container">
                <div className="void-scanner-box">
                    <div className="scanner-line"></div>
                    <div className="pulse-ring"></div>
                    <div className="loader-brand">SYS_INIT</div>
                </div>
                <div className="loader-status-text">
                    <span className="terminal-prompt">&gt;</span> SYNCHRONIZING_DASHBOARD...
                </div>
            </div>
        );
    }

    return (
        <div className="dashboard-shell">
            {/* --- UTILITY FIXED HEADER --- */}
            <header id="utility-nav">
                <div className="nav-group" onClick={()=> navigate('/')}>
                    <span id="logo">HOME //</span>
                    <div className="divider"></div>
                    <span className="status-pill">NODE_ONLINE</span>
                </div>
                <div className="nav-group main-links">
                    <button className={`btn ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>OVERVIEW</button>
                    <button className={`btn ${activeTab === 'analytics' ? 'active' : ''}`} onClick={() => setActiveTab('analytics')}>METRICS</button>
                </div>
                <div className="nav-group" id="profile-panel">
                    <div id="profile">
                        <div className="avatar"></div>
                        <span>{user?.username || 'OPERATOR'}</span>
                    </div>
                    <button className="logout-btn" onClick={() => handleLogout(navigate)}>⏻ LOGOUT</button>
                </div>
            </header>

            <main className="dashboard-content">
                
                <section className="dashboard-hero">
                    <div className="prism-backdrop">
                        <div className="line-x"></div>
                        <div className="line-y"></div>
                    </div>
                    <div className="prism-content">
                        <h1 className="huge-title">
                            WELCOME<span className="dot">.</span>
                            {profile.username}
                        </h1>
                        <p className="tagline">OPERATOR SESSION TERMINAL // SECURE_CONVENT</p>
                    </div>
                </section>

                {/* --- KPI STATS CARDS GRID --- */}
                <section className="api-grid">
                    <div className="api-card">
                        <div className="card-meta">
                            <span className="card-badge">IDENTITY_PARAM</span>
                            <div className="pulse-dot"></div>
                        </div>
                        <h3>SECURE ENDPOINT</h3>
                        <div className="endpoint-preview">
                            <code>ADDRESS</code>
                            <span>{profile?.email || 'unassigned@core.net'}</span>
                        </div>
                        <p>Main master clearance communication address registered to this system anchor.</p>
                    </div>

                    <div className="api-card">
                        <div className="card-meta">
                            <span className="card-badge">ACCESS_STATE</span>
                            <span className="status-success">200 OK</span>
                        </div>
                        <h3>VERIFICATION</h3>
                        <p>Clearance validation check telemetry signatures.</p>
                        <div className="label-row" style={{ marginTop: 'auto' }}>
                            {profile?.isVerified ? (
                                <span className="success-tag" style={{ marginLeft: 0 }}>CORE_VERIFIED</span>
                            ) : (
                                <span className="error-tag" style={{ marginLeft: 0 }}>UNVERIFIED_THREAT</span>
                            )}
                        </div>
                    </div>

                    <div className="api-card">
                        <div className="card-meta">
                            <span className="card-badge">TIME_STAMP</span>
                            <span className="version-info">{profile?.createdAt?new Intl.DateTimeFormat('en-GB', { month: '2-digit',day: '2-digit' ,year: 'numeric' }).format(new Date(profile.createdAt)).replace(/\//g, '.'): '00.00.2026'}</span>
                        </div>
                        <h3>INITIALIZED</h3>
                        <div className="endpoint-preview" style={{ marginTop: 'auto', marginBottom: 0 }}>
                            <code>INIT</code>
                            <span>{profile?.createdAt?new Intl.DateTimeFormat('en-GB', { month: '2-digit',day: '2-digit' ,year: 'numeric' }).format(new Date(profile.createdAt)): '00/00/2026'}</span>
                        </div>
                        <p>Timestamp records tracking when this user layout matrix profile block was committed to the database.</p>
                    </div>
                </section>

                {/* --- CONSOLE DATALOG ROW LIST --- */}
                <section className="console-container" style={{ marginTop: '40px', width: '100%' }}>
                    <div className="console-toolbar">
                        <span className="status-terminal-text"><span className="terminal-prompt">&gt;</span> LIVE_SYSTEM_REQUEST_STREAM</span>
                        <button className="btn theme-toggle-btn purge-btn">PURGE_LOGS</button>
                    </div>
                    
                    <div className="console-window" style={{ border: '1px solid var(--border-color)', borderRadius: '12px', overflow: 'hidden' }}>
                        <div className="console-log-list">
                            <div className="console-log-row">
                                <div className="log-meta">
                                    <span className="log-time">12:31:04</span>
                                    <span className="format-btn active active-success log-method-badge">GET</span>
                                </div>
                                <span className="log-url">/api/v1/auth/user/manifest_session</span>
                                <div className="log-metrics">
                                    <span className="log-size">2.4kb</span>
                                    <span className="log-status" style={{ color: 'var(--brand-green)' }}>200</span>
                                </div>
                            </div>

                            <div className="console-log-row">
                                <div className="log-meta">
                                    <span className="log-time">12:30:58</span>
                                    <span className="format-btn active active-success log-method-badge">POST</span>
                                </div>
                                <span className="log-url">/api/v1/auth/token/refresh_identity</span>
                                <div className="log-metrics">
                                    <span className="log-size">1.1kb</span>
                                    <span className="log-status" style={{ color: 'var(--brand-green)' }}>200</span>
                                </div>
                            </div>

                            <div className="console-log-row">
                                <div className="log-meta">
                                    <span className="log-time">12:28:12</span>
                                    <span className="format-btn active active-error log-method-badge" style={{ background: 'rgba(248,81,73,0.1)', borderColor: 'rgba(248,81,73,0.2)' }}>SEC</span>
                                </div>
                                <span className="log-url">CORE_GUARD: Integrity handshake verified completely.</span>
                                <div className="log-metrics">
                                    <span className="log-size">0.0kb</span>
                                    <span className="log-status" style={{ color: '#f85149' }}>000</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            {/* --- DASHBOARD SYSTEM FOOTER --- */}
            <footer className="bottom-bar" style={{ marginTop: '60px', padding: '20px 40px' }}>
                <div className="metric-group">
                    <div className="metric"><span>ENV:</span>PRODUCTION</div>
                    <div className="metric"><span>SOCKET:</span>CONNECTED</div>
                </div>
                <div className="copyright">© 2026 CORE_OS ENTERPRISE SHIELD</div>
            </footer>
        </div>
    );
}