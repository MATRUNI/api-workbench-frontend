import { useState, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Server, 
    Download, 
    X, 
    RefreshCw, 
    ExternalLink, 
    ShieldCheck, 
    Cpu,
    Zap,
    Check,
    Copy
} from 'lucide-react';
import { ProxyContext } from '../context/ProxyContext';
import '../style/ProxyDownloadModal.css';

const FALLBACK_RELEASE = {
    tag_name: 'v1.2.0',
    html_url: 'https://github.com/MATRUNI/sankram/releases/tag/v1.2.0',
    assets: [
        {
            name: 'sankram-v1.2.0-linux-x86_64.tar.gz',
            browser_download_url: 'https://github.com/MATRUNI/sankram/releases/download/v1.2.0/sankram-v1.2.0-linux-x86_64.tar.gz',
            size_formatted: '44.2 KB',
            sha256: '7a7a400199e1a8f275c1996a2600983b760349f078ed16b3f3496f114e0941a1'
        },
        {
            name: 'sankram-v1.2.0-macos-arm64.tar.gz',
            browser_download_url: 'https://github.com/MATRUNI/sankram/releases/download/v1.2.0/sankram-v1.2.0-macos-arm64.tar.gz',
            size_formatted: '38.3 KB',
            sha256: '2c1104b09b39cd8b34e5f31fb65ff70ced383e4f074341af528f38b7fd8d409e'
        },
        {
            name: 'sankram-v1.2.0-windows-x86_64.zip',
            browser_download_url: 'https://github.com/MATRUNI/sankram/releases/download/v1.2.0/sankram-v1.2.0-windows-x86_64.zip',
            size_formatted: '122 KB',
            sha256: '8bb780cf81f17a224b67ccd9fc622e867d7a17d8c812f3fc69b6a2af3914972d'
        }
    ]
};

const CHECKSUMS = {
    'linux': '7a7a400199e1a8f275c1996a2600983b760349f078ed16b3f3496f114e0941a1',
    'macos': '2c1104b09b39cd8b34e5f31fb65ff70ced383e4f074341af528f38b7fd8d409e',
    'windows': '8bb780cf81f17a224b67ccd9fc622e867d7a17d8c812f3fc69b6a2af3914972d'
};

export default function ProxyDownloadModal({ isOpen, onClose }) {
    const { 
        isProxyRunning, 
        proxyPort, 
        checkProxyHealth, 
        lastPingMs 
    } = useContext(ProxyContext);

    const [release, setRelease] = useState(FALLBACK_RELEASE);
    const [selectedOs, setSelectedOs] = useState('linux');
    const [activeTab, setActiveTab] = useState('quickstart'); // 'quickstart' | 'commands' | 'source'
    const [copiedIndex, setCopiedIndex] = useState(null);
    const [isProbing, setIsProbing] = useState(false);

    // ESC key event listener
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e) => {
            if (e.key === 'Escape' || e.key === 'Esc') {
                e.preventDefault();
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    // OS detection
    useEffect(() => {
        const ua = (typeof window !== 'undefined' ? window.navigator.userAgent : '').toLowerCase();
        if (ua.indexOf('win') !== -1) setSelectedOs('windows');
        else if (ua.indexOf('mac') !== -1) setSelectedOs('macos');
        else setSelectedOs('linux');
    }, []);

    // Release fetch with fallback
    useEffect(() => {
        if (!isOpen) return;

        let isMounted = true;
        const fetchRelease = async () => {
            try {
                const response = await fetch('https://api.github.com/repos/MATRUNI/sankram/releases/latest');
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                const data = await response.json();
                if (isMounted && data && Array.isArray(data.assets) && data.assets.length > 0) {
                    setRelease(data);
                }
            } catch {
                if (isMounted) {
                    setRelease(FALLBACK_RELEASE);
                }
            }
        };

        fetchRelease();
        return () => { isMounted = false; };
    }, [isOpen]);

    const handleCopy = (text, idx) => {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text);
            setCopiedIndex(idx);
            setTimeout(() => setCopiedIndex(null), 2000);
        }
    };

    const handleProbe = async () => {
        setIsProbing(true);
        if (typeof checkProxyHealth === 'function') {
            await checkProxyHealth(proxyPort);
        }
        setTimeout(() => setIsProbing(false), 400);
    };

    if (!isOpen) return null;

    const getAssetForOs = (os) => {
        const assets = release?.assets || FALLBACK_RELEASE.assets;
        if (os === 'windows') {
            return assets.find(a => a.name.toLowerCase().includes('windows') || a.name.toLowerCase().includes('win')) || FALLBACK_RELEASE.assets[2];
        }
        if (os === 'macos') {
            return assets.find(a => a.name.toLowerCase().includes('macos') || a.name.toLowerCase().includes('mac') || a.name.toLowerCase().includes('arm64')) || FALLBACK_RELEASE.assets[1];
        }
        return assets.find(a => a.name.toLowerCase().includes('linux')) || FALLBACK_RELEASE.assets[0];
    };

    const currentAsset = getAssetForOs(selectedOs);
    const checksum = CHECKSUMS[selectedOs];
    const binCmd = selectedOs === 'windows' ? '.\\sankram.exe' : './sankram';

    return (
        <AnimatePresence>
            <div className="modal-backdrop" onClick={onClose}>
                <motion.div 
                    className="modal-surface proxy-modal-surface" 
                    onClick={(e) => e.stopPropagation()}
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    transition={{ duration: 0.18, ease: "easeOut" }}
                >
                    <div className="modal-interior-content">
                        
                        {/* Header */}
                        <div className="config-header-row proxy-header-row">
                            <div className="config-title-group">
                                <Server size={20} className="config-brand-icon" />
                                <div>
                                    <h3 className="proxy-title-text">
                                        Sankram Proxy
                                        <span className="sankram-tag-pill">{release?.tag_name || 'v1.2.0'}</span>
                                    </h3>
                                    <span className="sankram-powered-sub">
                                        <Zap size={11} className="sankram-powered-icon" /> Powered by Sankram C Engine
                                    </span>
                                </div>
                            </div>
                            <button className="modal-close-corner-btn" onClick={onClose} title="Close Panel (ESC)">
                                <X size={15} />
                                <span>ESC</span>
                            </button>
                        </div>

                        <div className="proxy-modal-body">
                            {/* Live Status Bar */}
                            <div className={`sankram-status-banner ${isProxyRunning ? 'online' : 'offline'}`}>
                                <div className="sankram-status-info">
                                    <span className={`status-dot ${isProxyRunning ? 'online' : 'offline'}`} />
                                    <span>
                                        {isProxyRunning 
                                            ? `Daemon Online on 127.0.0.1:${proxyPort || 17777} (${lastPingMs ? `${lastPingMs}ms` : '<1ms'} ping)` 
                                            : `Daemon Offline — Expected on 127.0.0.1:${proxyPort || 17777}`}
                                    </span>
                                </div>
                                <button 
                                    className="sankram-probe-btn" 
                                    onClick={handleProbe}
                                    disabled={isProbing}
                                    title="Check heartbeat probe"
                                >
                                    <RefreshCw size={12} className={isProbing ? 'animate-spin' : ''} />
                                    <span>Ping</span>
                                </button>
                            </div>

                            <p className="proxy-description-text">
                                Ultra-fast C reverse proxy & edge gateway (86k+ req/s, epoll/kqueue). Bypasses browser CORS constraints and unlocks native OS socket pooling.
                            </p>

                            {/* OS Selection Tabs */}
                            <div className="sankram-os-selector">
                                <button 
                                    className={`sankram-os-btn ${selectedOs === 'linux' ? 'active' : ''}`}
                                    onClick={() => setSelectedOs('linux')}
                                >
                                    Linux (x86_64)
                                </button>
                                <button 
                                    className={`sankram-os-btn ${selectedOs === 'macos' ? 'active' : ''}`}
                                    onClick={() => setSelectedOs('macos')}
                                >
                                    macOS (arm64)
                                </button>
                                <button 
                                    className={`sankram-os-btn ${selectedOs === 'windows' ? 'active' : ''}`}
                                    onClick={() => setSelectedOs('windows')}
                                >
                                    Windows (x86_64)
                                </button>
                            </div>

                            {/* View Mode Tabs */}
                            <div className="sankram-mode-tabs">
                                <button 
                                    className={`sankram-mode-tab ${activeTab === 'quickstart' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('quickstart')}
                                >
                                    Download & Run
                                </button>
                                <button 
                                    className={`sankram-mode-tab ${activeTab === 'commands' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('commands')}
                                >
                                    CLI Commands Matrix
                                </button>
                                <button 
                                    className={`sankram-mode-tab ${activeTab === 'source' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('source')}
                                >
                                    Build from Source
                                </button>
                            </div>

                            {activeTab === 'quickstart' && (
                                <div className="sankram-tab-panel">
                                    <div className="sankram-download-card">
                                        <div className="sankram-asset-meta">
                                            <div className="sankram-asset-name">
                                                <code>{currentAsset.name}</code>
                                                {currentAsset.size_formatted && (
                                                    <span className="sankram-size-badge">{currentAsset.size_formatted}</span>
                                                )}
                                            </div>
                                            {checksum && (
                                                <div className="sankram-checksum-row">
                                                    <ShieldCheck size={12} className="checksum-icon" />
                                                    <span className="checksum-hash" title={checksum}>
                                                        sha256: {checksum.slice(0, 14)}...{checksum.slice(-8)}
                                                    </span>
                                                    <button 
                                                        className="copy-sm-btn"
                                                        onClick={() => handleCopy(checksum, 'checksum')}
                                                        title="Copy SHA256 Checksum"
                                                    >
                                                        {copiedIndex === 'checksum' ? <Check size={12} className="text-success" /> : <Copy size={12} />}
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        <a 
                                            href={currentAsset.browser_download_url} 
                                            className="proxy-dl-btn" 
                                            download
                                        >
                                            <Download size={14} />
                                            <span>Download</span>
                                        </a>
                                    </div>

                                    {/* OS Instructions */}
                                    <div className="sankram-instruction-section">
                                        <span className="sankram-section-label">Terminal Setup:</span>
                                        
                                        {selectedOs === 'linux' && (
                                            <div className="sankram-code-block">
                                                <button 
                                                    className="copy-code-btn"
                                                    onClick={() => handleCopy(`tar -xzf ${currentAsset.name}\nchmod +x sankram\n./sankram -p 17777`, 'linux-cmd')}
                                                    title="Copy commands"
                                                >
                                                    {copiedIndex === 'linux-cmd' ? <Check size={13} className="text-success" /> : <Copy size={13} />}
                                                </button>
                                                <code className="code-comment"># 1. Extract tarball</code>
                                                <code>tar -xzf {currentAsset.name}</code>
                                                <code className="code-comment"># 2. Grant execute permission</code>
                                                <code>chmod +x sankram</code>
                                                <code className="code-comment"># 3. Launch proxy on port 17777</code>
                                                <code>./sankram -p 17777</code>
                                            </div>
                                        )}

                                        {selectedOs === 'macos' && (
                                            <div className="sankram-code-block">
                                                <button 
                                                    className="copy-code-btn"
                                                    onClick={() => handleCopy(`tar -xzf ${currentAsset.name}\nchmod +x sankram\n./sankram -p 17777`, 'mac-cmd')}
                                                    title="Copy commands"
                                                >
                                                    {copiedIndex === 'mac-cmd' ? <Check size={13} className="text-success" /> : <Copy size={13} />}
                                                </button>
                                                <code className="code-comment"># 1. Extract tarball</code>
                                                <code>tar -xzf {currentAsset.name}</code>
                                                <code className="code-comment"># 2. Grant execute permission</code>
                                                <code>chmod +x sankram</code>
                                                <code className="code-comment"># 3. Launch proxy (kqueue engine)</code>
                                                <code>./sankram -p 17777</code>
                                            </div>
                                        )}

                                        {selectedOs === 'windows' && (
                                            <div className="sankram-code-block">
                                                <button 
                                                    className="copy-code-btn"
                                                    onClick={() => handleCopy(`Expand-Archive ${currentAsset.name} -DestinationPath .\n.\\sankram.exe -p 17777`, 'win-cmd')}
                                                    title="Copy commands"
                                                >
                                                    {copiedIndex === 'win-cmd' ? <Check size={13} className="text-success" /> : <Copy size={13} />}
                                                </button>
                                                <code className="code-comment"># 1. Extract ZIP in PowerShell or Explorer</code>
                                                <code>Expand-Archive {currentAsset.name} -DestinationPath .\</code>
                                                <code className="code-comment"># 2. Run daemon (or double-click sankram.exe)</code>
                                                <code>.\sankram.exe -p 17777</code>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Tab Content: Commands */}
                            {activeTab === 'commands' && (
                                <div className="sankram-tab-panel">
                                    <div className="sankram-commands-list">
                                        <div className="command-item">
                                            <div className="command-title">Standard Proxy Mode (Default)</div>
                                            <div className="command-snippet">
                                                <code>{binCmd} -p 17777 -t 8</code>
                                                <button className="copy-sm-btn" onClick={() => handleCopy(`${binCmd} -p 17777 -t 8`, 'cmd-1')}>
                                                    {copiedIndex === 'cmd-1' ? <Check size={12} className="text-success" /> : <Copy size={12} />}
                                                </button>
                                            </div>
                                            <small>Runs proxy on port 17777 using 8 worker reactors</small>
                                        </div>

                                        <div className="command-item">
                                            <div className="command-title">Verbose / Debug Inspection</div>
                                            <div className="command-snippet">
                                                <code>{binCmd} -p 17777 -v</code>
                                                <button className="copy-sm-btn" onClick={() => handleCopy(`${binCmd} -p 17777 -v`, 'cmd-2')}>
                                                    {copiedIndex === 'cmd-2' ? <Check size={12} className="text-success" /> : <Copy size={12} />}
                                                </button>
                                            </div>
                                            <small>Logs every HTTP header and TCP stream connection</small>
                                        </div>

                                        <div className="command-item">
                                            <div className="command-title">Stream Formatted Runtime Logs</div>
                                            <div className="command-snippet">
                                                <code>{binCmd} -m logs</code>
                                                <button className="copy-sm-btn" onClick={() => handleCopy(`${binCmd} -m logs`, 'cmd-3')}>
                                                    {copiedIndex === 'cmd-3' ? <Check size={12} className="text-success" /> : <Copy size={12} />}
                                                </button>
                                            </div>
                                            <small>Displays live color-coded carousel access logs</small>
                                        </div>

                                        <div className="command-item">
                                            <div className="command-title">Native C Multi-Threaded Stress Test</div>
                                            <div className="command-snippet">
                                                <code>{binCmd} -m stress -u &lt;url&gt; -c 100 -n 10000</code>
                                                <button className="copy-sm-btn" onClick={() => handleCopy(`${binCmd} -m stress -u http://127.0.0.1:17777/?url=https://httpbin.org/get -c 100 -n 10000`, 'cmd-4')}>
                                                    {copiedIndex === 'cmd-4' ? <Check size={12} className="text-success" /> : <Copy size={12} />}
                                                </button>
                                            </div>
                                            <small>10,000 requests across 100 concurrent epoll/kqueue/WSAPoll workers</small>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Tab Content: Source */}
                            {activeTab === 'source' && (
                                <div className="sankram-tab-panel">
                                    <div className="sankram-source-card">
                                        <div className="source-note">
                                            <Cpu size={15} />
                                            <span>
                                                Zero external HTTP dependencies! Pure C with native epoll/kqueue. Compiles natively in ~2 seconds.
                                            </span>
                                        </div>
                                        <div className="sankram-code-block">
                                            <button 
                                                className="copy-code-btn"
                                                onClick={() => handleCopy('git clone https://github.com/MATRUNI/sankram.git\ncd sankram\nmake -j4\n./build/sankram -p 17777', 'source-cmd')}
                                                title="Copy source build commands"
                                            >
                                                {copiedIndex === 'source-cmd' ? <Check size={13} className="text-success" /> : <Copy size={13} />}
                                            </button>
                                            <code className="code-comment"># 1. Clone official repository</code>
                                            <code>git clone https://github.com/MATRUNI/sankram.git</code>
                                            <code>cd sankram</code>
                                            <code className="code-comment"># 2. Build standard (-O3) & compact (-Os) binaries</code>
                                            <code>make -j4</code>
                                            <code className="code-comment"># 3. Run compiled proxy</code>
                                            <code>./build/sankram -p 17777</code>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Modal Footer with Powered By Sankram */}
                            <div className="sankram-modal-footer">
                                <a 
                                    href="https://github.com/MATRUNI/sankram" 
                                    target="_blank" 
                                    rel="noreferrer" 
                                    className="sankram-repo-link"
                                >
                                    <ExternalLink size={12} />
                                    <span>MATRUNI/sankram</span>
                                </a>
                                <div className="sankram-powered-badge">
                                    <Zap size={11} className="sankram-powered-icon" />
                                    <span>Powered by Sankram</span>
                                </div>
                            </div>
                        </div>

                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
