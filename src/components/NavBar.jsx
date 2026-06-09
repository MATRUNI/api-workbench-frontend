import { useContext } from 'react';
import '../style/NavBar.css';
import { useLocation, useNavigate } from 'react-router-dom';
import ThemeToggle from './ThemeToogle';
import { UserContext } from '../context/UserContext';
import { LogoutCall } from '../services/AuthCall'; 

function NavBar() {
    const location = useLocation();
    const navigate = useNavigate();
    const activeBtn = (path) => location.pathname === path;
    const { user, setUser, handleLogout } = useContext(UserContext);

    return (
        <nav id="utility-nav">
            <div className="nav-group" onClick={() => { navigate('/'); }}>
                <span id="logo">⚡ API.OS</span>
                <div className="divider"></div>
                <button className="btn nav-link">V1.2</button>
            </div>

            <div className="nav-group main-links">
                <button className={`btn ${activeBtn('/endpoints') ? 'active' : ""}`} onClick={() => navigate('/endpoints')}>Endpoints</button>
                <button className={`btn ${activeBtn('/docs') ? 'active' : ""}`} onClick={() => navigate('/docs')} >Docs</button>
                <button className={`btn ${activeBtn('/console') ? 'active' : ""}`} onClick={() => navigate('/console')} >Console</button>
                <button className={`btn fetch-trigger`} onClick={() => { navigate('/fetch'); }}>Fetch Data</button>
            </div>

            <div className="nav-group">
                <div className='search'>
                    <input type="text" placeholder='⌘ + K to Search' />
                </div>
                <div id='profile-panel'>
                    <div id='profile' onClick={() => user?navigate('/profile'):navigate('/auth')}>
                        <div className="avatar"></div>
                        <span>{user ? user.username : "User"}</span>
                    </div>
                    {user && (
                        <button className="logout-btn" onClick={()=>handleLogout(navigate)} title="Terminate Session">
                            ⏻ LOGOUT
                        </button>
                    )}
                </div>
            </div>
            <ThemeToggle />
        </nav>
    );
}

export default NavBar;