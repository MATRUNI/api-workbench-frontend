import { useContext } from 'react';
import '../style/NavBar.css';
import { useLocation, useNavigate } from 'react-router-dom';
import ThemeToggle from './ThemeToogle';
import { UserContext } from '../context/UserContext';

function NavBar() {
    const location = useLocation();
    const navigate = useNavigate();
    const activeBtn = (path) => location.pathname === path;
    const { user, setUser, loading} = useContext(UserContext);
    const handleProfileClick = () => {
        if (loading) return; 

        if (!!user) {
            navigate('/profile');
        } else {
            navigate('/auth');
        }
    };
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
                    <div id='profile' onClick={handleProfileClick}>
                        <div className="avatar"></div>
                        <span>{user ? user.username : "Login"}</span>
                    </div>
                </div>
            </div>
            <ThemeToggle location='nav'/>
        </nav>
    );
}

export default NavBar;