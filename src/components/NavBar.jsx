import { useContext, useState, useEffect } from 'react';
import '../style/NavBar.css';
import { useLocation, useNavigate } from 'react-router-dom';
import ThemeToggle from './ThemeToogle';
import { UserContext } from '../context/UserContext';
import { Search, X, Zap, Database, Book, Terminal, History, LogIn, User,MessageSquareCodeIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { appear } from '../animations/Motion';

function NavBar() {
    const location = useLocation();
    const navigate = useNavigate();
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const activeBtn = (path) => location.pathname === path;
    const { user } = useContext(UserContext);

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

    return (
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
                        <Search size={20} className="modal-search-icon" />
                        <input 
                            type="text" 
                            placeholder="Search endpoints or docs..." 
                            autoFocus
                            className="modal-input"
                        />
                        <button className="close-modal-btn" onClick={() => setIsSearchOpen(false)}>
                            <X size={20} />
                        </button>
                    </div>
                </div>
            )}
            <ThemeToggle location='nav'/>
        </motion.nav>
    );
}

export default NavBar;