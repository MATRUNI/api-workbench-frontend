import { useContext, useState, useEffect } from 'react';
import '../style/NavBar.css';
import { useLocation, useNavigate } from 'react-router-dom';
import ThemeToggle from './ThemeToogle';
import { UserContext } from '../context/UserContext';
import { Search, X } from 'lucide-react';

function NavBar() {
    const location = useLocation();
    const navigate = useNavigate();
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const activeBtn = (path) => location.pathname === path;
    const { user } = useContext(UserContext);

    const isChatActive = location.pathname === '/chat';

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
        <nav id="utility-nav" className={isChatActive ? 'chat-workspace-active' : ''}>
            <div className="nav-group" onClick={() => { navigate('/'); }}>
                <span id="logo">⚡ API.OS<sub>v1.3</sub></span>
            </div>

            <div className="nav-group main-links">
                <button className={`btn ${activeBtn('/endpoints') ? 'active' : ""}`} onClick={() => navigate('/endpoints')}>Endpoints</button>
                <button className={`btn ${activeBtn('/docs') ? 'active' : ""}`} onClick={() => navigate('/docs')} >Docs</button>
                <button className={`btn ${activeBtn('/console') ? 'active' : ""}`} onClick={() => navigate('/console')} >Console</button>
                {user&&(<button className={`btn ${activeBtn('/chat') ? 'active' : ""}`} onClick={() => navigate('/chat')}>Chat</button>)}
                <button className="btn fetch-trigger" onClick={() => { navigate('/fetch'); }}>Fetch Data</button>
            </div>

            <div className="nav-group">
                <div className='search'>
                    <input type="text" placeholder='⌘ + K to Search' readOnly onClick={() => setIsSearchOpen(true)} />
                    <Search className="search-icon" size={18} onClick={() => setIsSearchOpen(true)} />
                </div>
                <div id='profile-panel'>
                    <div id='profile' onClick={handleProfileClick}>
                        <div className="avatar"></div>
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
        </nav>
    );
}

export default NavBar;