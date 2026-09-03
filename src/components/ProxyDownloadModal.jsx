import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Server, Download, X, Loader2, Terminal, Play } from 'lucide-react';
import '../style/ProxyDownloadModal.css';

export default function ProxyDownloadModal({ isOpen, onClose }) {
    const [release, setRelease] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [os, setOs] = useState('unknown');
    const [alreadyHaveIt, setAlreadyHaveIt] = useState(false);

    useEffect(() => {
        const userAgent = window.navigator.userAgent.toLowerCase();
        if (userAgent.indexOf('win') !== -1) setOs('windows');
        else if (userAgent.indexOf('mac') !== -1) setOs('macos');
        else if (userAgent.indexOf('linux') !== -1) setOs('linux');
    }, []);

    useEffect(() => {
        if (!isOpen) return;

        const fetchRelease = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await fetch('https://api.github.com/repos/MATRUNI/api-workbench-desktop-agent/releases/latest');
                if (!response.ok) throw new Error('Failed to fetch release info');
                const data = await response.json();
                setRelease(data);
            } catch (err) {
                setError('Could not fetch the latest proxy release. Please visit the GitHub repository directly.');
            } finally {
                setLoading(false);
            }
        };

        fetchRelease();
    }, [isOpen]);

    const getDownloadAsset = () => {
        if (!release || !release.assets) return null;
        return release.assets.find(asset => {
            const name = asset.name.toLowerCase();
            if (!name.includes('workbench-agent')) return false;
            if (os === 'windows' && name.includes('win') && name.includes('.exe')) return true;
            if (os === 'macos' && name.includes('mac')) return true;
            if (os === 'linux' && name.includes('linux')) return true;
            return false;
        }) || release.assets.find(asset => asset.name.toLowerCase().includes('workbench-agent')) || release.assets[0];
    };

    if (!isOpen) return null;

    const downloadAsset = getDownloadAsset();

    return (
        <AnimatePresence>
            <div className="modal-backdrop" onClick={onClose}>
                <motion.div 
                    className="modal-surface proxy-modal-surface" 
                    onClick={(e) => e.stopPropagation()}
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                >
                    <div className="modal-interior-content">
                        
                        <div className="config-header-row">
                            <div className="config-title-group">
                                <Server size={18} className="config-brand-icon" />
                                <h3>Setup Local Proxy</h3>
                            </div>
                            <button className="modal-close-corner-btn" onClick={onClose} title="Close Panel (ESC)">
                                <X size={16} />
                                <span>ESC</span>
                            </button>
                        </div>

                        <div className="proxy-modal-body">
                            <p className="proxy-description-text">
                                To bypass browser CORS restrictions and enable binary file downloads, you need to run the local API Workbench Agent. It acts as a lightweight, transparent TCP tunnel on your machine.
                            </p>

                            <div className="shared-inbox-feed">
                                <div className="shared-item-card">
                                    <div className="shared-item-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span className="shared-sender">
                                            Latest Release: <strong>{release ? release.tag_name : 'Loading...'}</strong>
                                        </span>
                                        <button 
                                            onClick={() => setAlreadyHaveIt(!alreadyHaveIt)} 
                                            style={{ background: 'none', border: 'none', color: 'var(--accent-color, #3b82f6)', cursor: 'pointer', fontSize: '12px', textDecoration: 'underline' }}
                                        >
                                            {alreadyHaveIt ? "Need to download?" : "Already have it installed?"}
                                        </button>
                                    </div>
                                    
                                    {loading ? (
                                        <div className="config-empty-state proxy-empty-override">
                                            <Loader2 size={24} className="config-empty-icon animate-spin" />
                                            <p>Fetching latest release...</p>
                                        </div>
                                    ) : error ? (
                                        <div className="config-empty-state proxy-empty-override proxy-error-text">
                                            <Terminal size={24} className="config-empty-icon" />
                                            <p>{error}</p>
                                        </div>
                                    ) : alreadyHaveIt ? (
                                        <>
                                            <p className="shared-item-message">
                                                Great! If you already downloaded the agent, just fire it up from your terminal or applications folder.
                                            </p>
                                            <div className="proxy-instructions-box">
                                                {os === 'windows' ? (
                                                    <code>Double-click your downloaded workbench-agent.exe file or run it via CMD/PowerShell.</code>
                                                ) : (
                                                    <>
                                                        <code># Navigate to where you saved it and run:</code>
                                                        <code>./{downloadAsset ? downloadAsset.name : 'workbench-agent'}</code>
                                                    </>
                                                )}
                                            </div>
                                            <div className="shared-item-actions">
                                                <button onClick={() => setAlreadyHaveIt(false)} className="config-action-btn proxy-dl-btn">
                                                    <span>Back to Download</span>
                                                </button>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <p className="shared-item-message">
                                                Identified OS: {os === 'windows' ? 'Windows' : os === 'macos' ? 'macOS' : os === 'linux' ? 'Linux' : 'Unknown OS'}
                                            </p>
                                            
                                            <div className="proxy-instructions-box">
                                                {os === 'windows' ? (
                                                    <>
                                                        <code>1. Download the .exe file</code>
                                                        <code>2. Double click to run</code>
                                                    </>
                                                ) : (
                                                    <>
                                                        <code>chmod +x {downloadAsset ? downloadAsset.name : 'workbench-agent'}</code>
                                                        <code>./{downloadAsset ? downloadAsset.name : 'workbench-agent'}</code>
                                                    </>
                                                )}
                                            </div>
                                            
                                            <div className="shared-item-actions">
                                                {downloadAsset ? (
                                                    <a href={downloadAsset.browser_download_url} className="config-action-btn proxy-dl-btn" download>
                                                        <span>Download {downloadAsset.name}</span>
                                                        <Download size={14} />
                                                    </a>
                                                ) : (
                                                    <a href={release.html_url} target="_blank" rel="noreferrer" className="config-action-btn proxy-dl-btn">
                                                        <span>View on GitHub</span>
                                                        <Download size={14} />
                                                    </a>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}