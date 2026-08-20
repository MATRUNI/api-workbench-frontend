import { ShieldCheck, ShieldAlert, KeyRound, Clock } from 'lucide-react';

export default function Overview({ username, email, isVerified, createdAt }) {
    return (
        <main className="dashboard-content">      
            <section className="dashboard-hero api-card" style={{ padding: '40px', marginBottom: '32px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
                <div className="prism-backdrop" style={{ position: 'absolute', inset: 0, opacity: 0.1, pointerEvents: 'none' }}>
                    <div className="line-x"></div>
                    <div className="line-y"></div>
                </div>
                <div className="prism-content" style={{ position: 'relative', zIndex: 2 }}>
                    <h1 className="huge-title" style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '2px', marginBottom: '8px' }}>
                        WELCOME<span className="dot" style={{ color: 'var(--brand-color)' }}>.</span>
                        {username}
                    </h1>
                    <p className="tagline" style={{ fontFamily: 'monospace', color: 'var(--text-muted)', fontSize: '0.85rem' }}>OPERATOR SESSION TERMINAL // SECURE_CONVENT</p>
                </div>
            </section>
            
            {/* --- KPI STATS CARDS GRID --- */}
            <section className="api-grid">
                <div className="api-card">
                    <div className="card-meta">
                        <span className="card-badge"><KeyRound size={12} style={{ verticalAlign: 'middle', marginRight: '4px' }} /> IDENTITY_PARAM</span>
                        <div className="pulse-dot"></div>
                    </div>
                    <h3>SECURE ENDPOINT</h3>
                    <div className="endpoint-preview" style={{ margin: '16px 0' }}>
                        <code>ADDRESS</code>
                        <span>{email || 'unassigned@core.net'}</span>
                    </div>
                    <p>Main master clearance communication address registered to this system anchor.</p>
                </div>
                
                <div className="api-card">
                    <div className="card-meta">
                        <span className="card-badge">ACCESS_STATE</span>
                        <span className="status-success" style={{ color: 'var(--brand-green)', fontFamily: 'monospace', fontSize: '0.75rem', fontWeight: 'bold' }}>200 OK</span>
                    </div>
                    <h3>VERIFICATION</h3>
                    <p>Clearance validation check telemetry signatures.</p>
                    <div className="label-row" style={{ marginTop: 'auto', paddingTop: '16px' }}>
                        {isVerified ? (
                            <span className="success-tag" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--brand-green)', background: 'color-mix(in srgb, var(--brand-green) 12%, transparent)', padding: '6px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                                <ShieldCheck size={14} /> CORE_VERIFIED
                            </span>
                        ) : (
                            <span className="error-tag" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#f85149', background: 'rgba(248,81,73,0.12)', padding: '6px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                                <ShieldAlert size={14} /> UNVERIFIED_THREAT
                            </span>
                        )}
                    </div>
                </div>

                <div className="api-card">
                    <div className="card-meta">
                        <span className="card-badge"><Clock size={12} style={{ verticalAlign: 'middle', marginRight: '4px' }} /> TIME_STAMP</span>
                        <span className="version-info" style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {createdAt ? new Intl.DateTimeFormat('en-GB', { month: '2-digit', day: '2-digit', year: 'numeric' }).format(new Date(createdAt)).replace(/\//g, '.') : '00.00.2026'}
                        </span>
                    </div>
                    <h3>INITIALIZED</h3>
                    <div className="endpoint-preview" style={{ marginTop: '16px', marginBottom: '12px' }}>
                        <code>INIT</code>
                        <span>{createdAt ? new Intl.DateTimeFormat('en-GB', { month: '2-digit', day: '2-digit', year: 'numeric' }).format(new Date(createdAt)) : '00/00/2026'}</span>
                    </div>
                    <p>Timestamp records tracking when this user layout matrix profile block was committed to the database.</p>
                </div>
            </section>

            {/* --- CONSOLE DATALOG ROW LIST --- */}
            <section className="console-container api-card" style={{ marginTop: '40px', width: '100%', padding: '24px' }}>
                <div className="console-toolbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <span className="status-terminal-text" style={{ fontFamily: 'monospace', fontSize: '0.85rem', color: 'var(--text-main)' }}>
                        <span className="terminal-prompt" style={{ color: 'var(--brand-color)' }}>&gt;</span> LIVE_SYSTEM_REQUEST_STREAM
                    </span>
                    <button className="btn theme-toggle-btn purge-btn" style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-muted)', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontFamily: 'monospace', fontSize: '0.75rem' }}>
                        PURGE_LOGS
                    </button>
                </div>
                
                <div className="console-window" style={{ background: 'var(--terminal-input)', border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden' }}>
                    <div className="console-log-list" style={{ display: 'flex', flexDirection: 'column' }}>
                        <div className="console-log-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid var(--border-color)', fontFamily: 'monospace', fontSize: '0.8rem' }}>
                            <div className="log-meta" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <span className="log-time" style={{ color: 'var(--text-muted)' }}>12:31:04</span>
                                <span className="format-btn active active-success log-method-badge" style={{ color: 'var(--brand-green)', background: 'color-mix(in srgb, var(--brand-green) 10%, transparent)', padding: '2px 6px', borderRadius: '4px' }}>GET</span>
                            </div>
                            <span className="log-url" style={{ color: 'var(--text-main)' }}>/api/v1/auth/user/manifest_session</span>
                            <div className="log-metrics" style={{ display: 'flex', gap: '16px' }}>
                                <span className="log-size" style={{ color: 'var(--text-muted)' }}>2.4kb</span>
                                <span className="log-status" style={{ color: 'var(--brand-green)', fontWeight: 'bold' }}>200</span>
                            </div>
                        </div>

                        <div className="console-log-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid var(--border-color)', fontFamily: 'monospace', fontSize: '0.8rem' }}>
                            <div className="log-meta" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <span className="log-time" style={{ color: 'var(--text-muted)' }}>12:30:58</span>
                                <span className="format-btn active active-success log-method-badge" style={{ color: 'var(--brand-green)', background: 'color-mix(in srgb, var(--brand-green) 10%, transparent)', padding: '2px 6px', borderRadius: '4px' }}>POST</span>
                            </div>
                            <span className="log-url" style={{ color: 'var(--text-main)' }}>/api/v1/auth/token/refresh_identity</span>
                            <div className="log-metrics" style={{ display: 'flex', gap: '16px' }}>
                                <span className="log-size" style={{ color: 'var(--text-muted)' }}>1.1kb</span>
                                <span className="log-status" style={{ color: 'var(--brand-green)', fontWeight: 'bold' }}>200</span>
                            </div>
                        </div>

                        <div className="console-log-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', fontFamily: 'monospace', fontSize: '0.8rem' }}>
                            <div className="log-meta" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <span className="log-time" style={{ color: 'var(--text-muted)' }}>12:28:12</span>
                                <span className="format-btn active active-error log-method-badge" style={{ color: '#f85149', background: 'rgba(248,81,73,0.1)', padding: '2px 6px', borderRadius: '4px' }}>SEC</span>
                            </div>
                            <span className="log-url" style={{ color: 'var(--text-main)' }}>CORE_GUARD: Integrity handshake verified completely.</span>
                            <div className="log-metrics" style={{ display: 'flex', gap: '16px' }}>
                                <span className="log-size" style={{ color: 'var(--text-muted)' }}>0.0kb</span>
                                <span className="log-status" style={{ color: '#f85149', fontWeight: 'bold' }}>000</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </main>
    );
}