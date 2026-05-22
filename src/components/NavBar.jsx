import React, { useState } from 'react'
import '../style/NavBar.css'
import { useLocation, useNavigate } from 'react-router-dom';
function NavBar() {
const location=useLocation()
const navigate=useNavigate()
const activeBtn=(path) => location.pathname === path;
  function handleActive(e)
  {
    setActiveBtn(e.target.textContent);
  }
  return (
      <nav id="utility-nav">
          <div className="nav-group" onClick={()=>{navigate('/');setActiveBtn(null)}}>
              <span id="logo">⚡ API.OS</span>
              <div className="divider"></div>
              <button className="btn nav-link">V1.2</button>
          </div>

          <div className="nav-group main-links">
              <button className={`btn ${activeBtn('/endpoints')?'active':""}`} onClick={()=>navigate('/endpoints')} onFocus={(e)=>handleActive(e)}>Endpoints</button>
              <button className={`btn ${activeBtn('/docs')?'active':""}`} onFocus={(e)=>handleActive(e)} onClick={()=>navigate('/docs')} >Docs</button>
              <button className={`btn ${activeBtn('/console')?'active':""}`} onFocus={(e)=>handleActive(e)} onClick={()=>navigate('/console')} >Console</button>
              <button className={`btn fetch-trigger`} onClick={()=>{navigate('/fetch');setActiveBtn(null)}}>Fetch Data</button>
          </div>

          <div className="nav-group">
              <div className='search'>
                  <input type="text" placeholder='⌘ + K to Search'/>
              </div>
              <div id='profile'>
                  <div className="avatar"></div>
                  <span>User</span>
              </div>
          </div>
      </nav>
  )
}

export default NavBar