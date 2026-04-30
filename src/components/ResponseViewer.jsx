import React, { useState } from 'react'

function ResponseViewer() {
    const [responseData,setResponseData]=useState({
              "status": "success",
              "results": [],
              "message": "Ready to fetch data"
            })
    const [resStatus,setResStatus]=useState(null)
  return (
          <section className="pane response-pane">
        <div className="pane-header">
          <span className="label">Response</span>
          <div className="response-meta">
            <span className="status-badge">{resStatus}</span>
            <span className="time-badge">45ms</span>
          </div>
        </div>

        <div className="editor-window output">
          <pre className="code-output">
            {JSON.stringify(responseData,null,2)}
          </pre>
        </div>
      </section>
  )
}

export default ResponseViewer