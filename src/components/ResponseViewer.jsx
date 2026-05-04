import React, { useContext, useState } from 'react'
import { RequestContext } from '../context/RequestContext'

function ResponseViewer() {
    const {response}=useContext(RequestContext)
    const getStatusText=(status)=>
    {
      if(!status) return "No Response";
      if(status>=200 && status<300) return "SUCCESS";
      if(status>=400) return "FAILED";
      return "INFO"
    }
    
    function getStatusClass(status)
    {
      if(!status) return "";
      if(status>=200 && status<300) return "success";
      if(status>=400 && status<500) return "warning";
      if(status>=500) return "error";
      return ""
    }
  return (
        <section className="pane response-pane">
        <div className="pane-header">
          <div className="pane-header-left">
            <span className="label">Response</span>
              <span className="length-badge" title='Response length'>
                {response.length||0}
              </span>
          </div>
          
          <div className="response-meta">
            <span className={`status-${getStatusClass(response.status)}`}>
              {`${getStatusText(response.status)} ${response.status}`}
              </span>
            <span className="time-badge">{`${response.time|"0"} ms`}</span>
          </div>
        </div>

        <div className="editor-window output">
          <pre className="code-output">
            {/* {JSON.stringify(response.data,null,2)} */}
            {response.data}
          </pre>
        </div>
      </section>
  )
}

export default ResponseViewer