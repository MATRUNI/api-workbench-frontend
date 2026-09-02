import React, { useContext, useState, useRef } from 'react'
import Tabs from '../request-panel/Tabs'
import Body_panel from '../request-panel/Body_panel'
import { RequestContext } from '../context/RequestContext'
import { callAPI } from '../services/api'
import { saveToHistory } from '../services/history'
import { Send, Share2, X, Construction } from "lucide-react"
import KeyValueList from './utility_Components/KeyValueList'

import "../style/RequestBuilder.css"
import ConfigSharing from './ConfigSharing'
import { UserContext } from '../context/UserContext'

function RequestBuilder({ scrollToResponse }) {
    const {url,setURL,request,setResponse,setIsLoading,setRequestPhase,method,setMethod,setRequest}=useContext(RequestContext)
    const {user} = useContext(UserContext)
    const [activeTab,setActiveTab]=useState('body')
    const [modalActive,setModalActive] = useState(false);
    const bodyRef = useRef(null);
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
      const body = bodyRef.current?.getCurrentBody()
      setRequest(pre=>({...pre,body}))
      setIsLoading(true);
      scrollToResponse();
      setRequestPhase('initializing')
      await new Promise(res => setTimeout(res, 250));
      try{
        setRequestPhase("connecting");
        const response=await callAPI(url, method, {...request,body});

        setRequestPhase('processing')
        await new Promise(res => setTimeout(res, 350));
        setRequestPhase('parsing')
        await new Promise(res => setTimeout(res, 200));
        const finalResponse = {
          status: response.status,
          data: response.data,
          rawData: response.rawData,
          headers:response.headers,
          time: response.time || 12,
          length: response.length || 0,
          type: response.type
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
          <option value="PATCH">PATCH</option>
          <option value="DELETE">DELETE</option>
        </select>
        <input type="text" className="url-input" value={url} onChange={(e)=>setURL(e.target.value)}/>
        <button className="send-button" type='submit'>
          <Send size={18}/>
        </button>
      </form>
      <Tabs activeTab={activeTab} setActiveTab={setActiveTab} />

      {activeTab === "body" && <Body_panel ref={bodyRef}/>}

      {activeTab === "headers" && (
          <KeyValueList
              items={request.headers}
              onChange={(headers) => {
                  setRequest(prev => ({
                      ...prev,
                      headers
                  }));
              }}
              editable={true}
              showAddBtn={true}
              label="Request Headers"
              addLable="Add Header"
              emptyMessage="No headers defined. Click add to begin."
          />
      )}

      {activeTab === "query-params" && (
          <KeyValueList
              items={request.query}
              onChange={(queries) => {
                  setRequest(prev => ({
                      ...prev,
                      query: queries
                  }));
              }}
              editable={true}
              showAddBtn={true}
              label="Query Parameters"
              addLable="Add Parameter"
              emptyMessage="No query parameters defined. Click add to begin."
          />
      )}
      {user && <div>
          <button type="button" className="config-btn" title='Share your configuration with others.' onClick={()=>setModalActive(true)}>
              CONFIG <Share2 size={15} />
          </button>
      </div>}
      {modalActive &&
      <ConfigSharing isOpen={modalActive} onClose={()=>setModalActive(false)}/>
      }
    </section>
  )
}

export default RequestBuilder