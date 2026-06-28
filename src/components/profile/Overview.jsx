export default function Overview({username,email,isVerified,createdAt})
{
    return (
        <main className="dashboard-content">      
            <section className="dashboard-hero">
                <div className="prism-backdrop">
                    <div className="line-x"></div>
                    <div className="line-y"></div>
                </div>
                <div className="prism-content">
                    <h1 className="huge-title">
                        WELCOME<span className="dot">.</span>
                        {username}
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
                        <span>{email || 'unassigned@core.net'}</span>
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
                        {isVerified ? (
                            <span className="success-tag" style={{ marginLeft: 0 }}>CORE_VERIFIED</span>
                        ) : (
                            <span className="error-tag" style={{ marginLeft: 0 }}>UNVERIFIED_THREAT</span>
                        )}
                    </div>
                </div>
                <div className="api-card">
                    <div className="card-meta">
                        <span className="card-badge">TIME_STAMP</span>
                        <span className="version-info">{createdAt?new Intl.DateTimeFormat('en-GB', { month: '2-digit',day: '2-digit' ,year: 'numeric' }).format(new Date(createdAt)).replace(/\//g, '.'): '00.00.2026'}</span>
                    </div>
                    <h3>INITIALIZED</h3>
                    <div className="endpoint-preview" style={{ marginTop: 'auto', marginBottom: 0 }}>
                        <code>INIT</code>
                        <span>{createdAt?new Intl.DateTimeFormat('en-GB', { month: '2-digit',day: '2-digit' ,year: 'numeric' }).format(new Date(createdAt)): '00/00/2026'}</span>
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
    )
}