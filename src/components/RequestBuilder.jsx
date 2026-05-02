import React, { useContext, useState } from 'react'
import Tabs from '../request-panel/Tabs'
import Body_panel from '../request-panel/Body_panel'
import Header_panel from '../request-panel/Header_panel'
import Query_panel from '../request-panel/Query_panel'
import { RequestContext } from '../context/RequestContext'
import { callAPI } from '../services/api'

function RequestBuilder() {
    const {url,setURL,request,setResponse}=useContext(RequestContext)
    const [method,setMethod]=useState("GET")
    const [activeTab,setActiveTab]=useState('body')
    const isValidURL=(value)=>
    {
      try{
        new URL(value)
        return true;
      }
      catch
      {
        return false;
      }
    }
    const handleSubmit=async(e)=>
    {
      e.preventDefault();
      if(!isValidURL(url))
      {
        alert("Invalid URL");
        return;
      }
      try{
        const response=await callAPI(url, method, request);
        setResponse({
          status:response.status,
          data:response.data,
          time:response.time,
        })
      }
      catch(error)
      {
        setResponse({
          status:error.status,
          data:error.message,
        })
      }
    }
  return (
<section className="pane request-pane">
      <form className="url-bar-group" onSubmit={handleSubmit}>
        <select 
          className={`method-dropdown method-${method}`}
          value={method} 
          onChange={(e) => setMethod(e.target.value)}>
          <option value="GET">GET</option>
          <option value="POST">POST</option>
          <option value="PUT">PUT</option>
          <option value="DELETE">DELETE</option>
        </select>
        <input type="text" className="url-input" value={url} onChange={(e)=>setURL(e.target.value)}/>
        <button className="send-button" type='submit'>Send</button>
      </form>
      <Tabs activeTab={activeTab} setActiveTab={setActiveTab} />

      {activeTab === "body" && <Body_panel/>}
      {activeTab === "headers" && <Header_panel/>}
      {activeTab === "query-params" && <Query_panel/>}
    </section>
  )
}

export default RequestBuilder