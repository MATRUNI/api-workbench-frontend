import { useContext, useState, useEffect } from 'react';
import '../style/NavBar.css';
import { useLocation, useNavigate } from 'react-router-dom';
import ThemeToggle from './ThemeToogle';
import { UserContext } from '../context/UserContext';
import { Search, X, Zap, Database, Book, Terminal, History, LogIn, User,MessageSquareCodeIcon, Server } from 'lucide-react';
import { SocketContext } from '../context/SocketContext';
import { ProxyContext } from '../context/ProxyContext';
import ProxyDownloadModal from './ProxyDownloadModal';
import { docsRegistry } from '../docs/index.js';
import { motion } from 'framer-motion';
import { appear } from '../animations/Motion';

function NavBar() {
    const location = useLocation();
    const navigate = useNavigate();
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const activeBtn = (path) => location.pathname === path;
    const { user } = useContext(UserContext);
    const { isProxyRunning } = useContext(ProxyContext);
    const [isProxyModalOpen, setIsProxyModalOpen] = useState(false);

    const isChatActive = location.pathname === '/chat';
    const { stopRing } = useContext(SocketContext);

    useEffect(() => {
      if (!isChatActive) {
        stopRing();
      }
    }, [isChatActive, stopRing]);
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                setIsSearchOpen((prev) => !prev);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const handleProfileClick = () => {
        if (!!user) {
            navigate('/profile');
        } else {
            navigate('/auth');
        }
    };

    const searchResults = searchQuery.trim() === '' ? [] : docsRegistry.filter(doc => 
        doc.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        doc.content.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleResultClick = (id) => {
        navigate(`/docs?doc=${id}`);
        setIsSearchOpen(false);
        setSearchQuery('');
    };

    return (
        <>
        <motion.nav id="utility-nav" 
        className={isChatActive ? 'chat-workspace-active' : ''}
        initial="hidden"
        animate="visible"
        {...appear}>
            <div className="nav-group" onClick={() => { navigate('/'); }}>
                <span id="logo"><Zap size={14}/> API.OS<sub>v{(import.meta.env.VITE_VERSION)}</sub></span>
            </div>

            <div className="nav-group main-links">
                <button className={`btn ${activeBtn('/endpoints') ? 'active' : ""}`} onClick={() => navigate('/endpoints')}><Terminal size={14}/>Endpoints</button>
                <button className={`btn ${activeBtn('/docs') ? 'active' : ""}`} onClick={() => navigate('/docs')} ><Book size={14}/> Docs</button>
                <button className={`btn ${activeBtn('/console') ? 'active' : ""}`} onClick={() => navigate('/console')} ><History size={14}/> Console</button>
                {user&&(<button className={`btn ${activeBtn('/chat') ? 'active' : ""}`} onClick={() => navigate('/chat')}><MessageSquareCodeIcon size={14}/>Chat</button>)}
                <button className="btn fetch-trigger" onClick={() => { navigate('/fetch'); }}><Database size={14}/> Fetch Data</button>
            </div>

            <div className="nav-group">
                <div 
                    className={`proxy-indicator ${isProxyRunning ? 'active' : 'offline'}`}
                    onClick={() => { if (!isProxyRunning) setIsProxyModalOpen(true); }}
                    title={isProxyRunning ? "Local Proxy is running" : "Click to download Local Proxy"}
                >
                    <Server size={14} className="proxy-icon" />
                    <span className="proxy-text">{isProxyRunning ? 'Active' : 'Offline'}</span>
                </div>
                <div className='search'>
                    <input type="text" placeholder='⌘ + K to Search' readOnly onClick={() => setIsSearchOpen(true)} />
                    <Search className="search-icon" size={18} onClick={() => setIsSearchOpen(true)} />
                </div>
                <div id='profile-panel'>
                    <div id='profile' onClick={handleProfileClick}>
                        <div className="avatar">{user?<User/>:<LogIn size={17}/>}</div>
                        <span>{user ? user.username : "Login"}</span>
                    </div>
                </div>
            </div>
            
            {isSearchOpen && (
                <div className="search-modal-overlay" onClick={() => setIsSearchOpen(false)}>
                    <div className="search-modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="search-input-wrapper">
                            <Search size={20} className="modal-search-icon" />
                            <input 
                                type="text" 
                                placeholder="Search documentation..." 
                                autoFocus
                                className="modal-input"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            <button className="close-modal-btn" onClick={() => setIsSearchOpen(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        {searchQuery && (
                            <div className="search-results-container">
                                {searchResults.length > 0 ? (
                                    searchResults.map(doc => (
                                        <div key={doc.id} className="search-result-item" onClick={() => handleResultClick(doc.id)}>
                                            <div className="result-title">{doc.title}</div>
                                            <div className="result-desc">{doc.description}</div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="search-no-results">No results found for "{searchQuery}"</div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
            <ThemeToggle location='nav'/>
        </motion.nav>
        <ProxyDownloadModal isOpen={isProxyModalOpen} onClose={() => setIsProxyModalOpen(false)} />
        </>
    );
}

export default NavBar;