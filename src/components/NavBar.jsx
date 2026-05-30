import React, { useState } from 'react'
import '../style/NavBar.css'
import { useLocation, useNavigate } from 'react-router-dom';
function NavBar() {
const location=useLocation()
const navigate=useNavigate()
const activeBtn=(path) => location.pathname === path;
  return (
      <nav id="utility-nav">
          <div className="nav-group" onClick={()=>{navigate('/');}}>
              <span id="logo">⚡ API.OS</span>
              <div className="divider"></div>
              <button className="btn nav-link">V1.2</button>
          </div>

          <div className="nav-group main-links">
              <button className={`btn ${activeBtn('/endpoints')?'active':""}`} onClick={()=>navigate('/endpoints')}>Endpoints</button>
              <button className={`btn ${activeBtn('/docs')?'active':""}`} onClick={()=>navigate('/docs')} >Docs</button>
              <button className={`btn ${activeBtn('/console')?'active':""}`} onClick={()=>navigate('/console')} >Console</button>
              <button className={`btn fetch-trigger`} onClick={()=>{navigate('/fetch');}}>Fetch Data</button>
          </div>

          <div className="nav-group">
              <div className='search'>
                  <input type="text" placeholder='⌘ + K to Search'/>
              </div>
              <div id='profile' onClick={()=>navigate('/auth')}>
                  <div className="avatar"></div>
                  <span>User</span>
              </div>
          </div>
      </nav>
  )
}

export default NavBar