import React, { useState } from 'react'
import './NavBar.css'
import { useNavigate } from 'react-router-dom';
function NavBar() {
  const [activeBtn,setActiveBtn]=useState('Endpoints')
  const navigate=useNavigate()
  function handleActive(e)
  {
    setActiveBtn(e.target.textContent);
  }
  return (
      <nav id="utility-nav">
          <div className="nav-group">
              <span id="logo">⚡ API.OS</span>
              <div className="divider"></div>
              <button className="btn nav-link">V1.2</button>
          </div>

          <div className="nav-group main-links">
              <button className={`btn ${activeBtn==="Endpoints"?'active':""}`} onClick={()=>navigate('/')} onFocus={(e)=>handleActive(e)}>Endpoints</button>
              <button className={`btn ${activeBtn==="Docs"?'active':""}`} onFocus={(e)=>handleActive(e)} onClick={()=>navigate('/docs')} >Docs</button>
              <button className={`btn ${activeBtn==="Console"?'active':""}`} onFocus={(e)=>handleActive(e)} onClick={()=>navigate('/console')} >Console</button>
              <button className={`btn fetch-trigger`}>Fetch Data</button>
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