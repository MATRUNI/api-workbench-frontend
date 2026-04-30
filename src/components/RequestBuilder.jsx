import React, { useContext, useState } from 'react'
import Tabs from '../request-panel/Tabs'
import Body_panel from '../request-panel/Body_panel'
import Header_panel from '../request-panel/Header_panel'
import Query_panel from '../request-panel/Query_panel'
import { RequestContext } from '../context/RequestContext'

function RequestBuilder() {
    const {url,setURL}=useContext(RequestContext)
    const [method,setMethod]=useState("GET")
    const [activeTab,setActiveTab]=useState('body')
  return (
<section className="pane request-pane">
      <div className="url-bar-group">
        <select 
          className={`method-dropdown method-${method}`}
          value={method} 
          onChange={(e) => setMethod(e.target.value)}>
          <option value="GET">GET</option>
          <option value="POST">POST</option>
          <option value="PUT">PUT</option>
          <option value="DELETE">DELETE</option>
        </select>
        <input type="text" className="url-input" value={url}/>
        <button className="send-button">Send</button>
      </div>
      <Tabs activeTab={activeTab} setActiveTab={setActiveTab} />

      {activeTab === "body" && <Body_panel/>}
      {activeTab === "headers" && <Header_panel/>}
      {activeTab === "query-params" && <Query_panel/>}
    </section>
  )
}

export default RequestBuilder