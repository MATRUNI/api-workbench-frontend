import React, { useContext, useState } from 'react'
import { RequestContext } from '../context/RequestContext'

function ResponseViewer() {
    const {response}=useContext(RequestContext)
  return (
        <section className="pane response-pane">
        <div className="pane-header">
          <div className="pane-header-left">
            <span className="label">Response</span>
            {Array.isArray(response.data) && (
              <span className="length-badge" title='Response length'>
                {response.data.length}
              </span>
            )}
          </div>
          
          <div className="response-meta">
            <span className="status-badge">{response.status}</span>
            <span className="time-badge">{`${response.time} ms`}</span>
          </div>
        </div>

        <div className="editor-window output">
          <pre className="code-output">
            {JSON.stringify(response.data,null,2)}
          </pre>
        </div>
      </section>
  )
}

export default ResponseViewer