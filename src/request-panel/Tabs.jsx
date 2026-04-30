import React from 'react'

function Tabs({activeTab,setActiveTab}) {
  return (
    <div className="tab-container">
          <button 
          className={`tab ${activeTab==='body'?'active':''}`}
          onClick={e=>{setActiveTab('body')}}
          >Body</button>
          <button 
          className={`tab ${activeTab==='headers'?'active':''}`}
          onClick={e=>{setActiveTab('headers')}}
          >Headers</button>
          <button 
          className={`tab ${activeTab==='query-params'?'active':''}`}
          onClick={e=>{setActiveTab('query-params')}}
          >Query Params</button>
    </div>
  )
}

export default Tabs