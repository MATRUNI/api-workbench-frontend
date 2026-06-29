import React, { useContext, useState } from 'react'
import Tabs from '../request-panel/Tabs'
import Body_panel from '../request-panel/Body_panel'
import Header_panel from '../request-panel/Header_panel'
import Query_panel from '../request-panel/Query_panel'
import { RequestContext } from '../context/RequestContext'
import { callAPI } from '../services/api'
import { saveToHistory } from '../services/history'

function RequestBuilder({ scrollToResponse }) {
    const {url,setURL,request,setResponse,setIsLoading,setRequestPhase,method,setMethod}=useContext(RequestContext)
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
      setIsLoading(true);
      scrollToResponse();
      setRequestPhase('initializing')
      await new Promise(res => setTimeout(res, 250));
      try{
        setRequestPhase("connecting");
        const response=await callAPI(url, method, request);

        setRequestPhase('processing')
        await new Promise(res => setTimeout(res, 350));
        setRequestPhase('parsing')
        await new Promise(res => setTimeout(res, 200));
        const finalResponse = {
          status: response.status,
          data: response.data,
          time: response.time || 12,
          length: response.length || 0
        };
        setResponse(response)
        saveToHistory(url,method,request,finalResponse)
      }
      catch(error)
      {
        const errResponse = {
          status: error.status || "500",
          data: error.message,
          time: "0 ms"
        };
        setResponse({
          status:error.status,
          data:error.message,
        })
        saveToHistory(url,method,request,errResponse)
      }
      finally
      {
        setIsLoading(false);
        setRequestPhase('');
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