import React, { useContext, useState } from 'react'
import { RequestContext } from '../context/RequestContext';

function Body_panel() {
    const {request,setRequest} =useContext(RequestContext)
    const [localString,setLocalString]=useState(JSON.stringify(request.body||{},null,2))
    function handleInput(e)
    {
        setLocalString(e.target.value)
    }
    function handleSync()
    {
      const parsed=JSON.parse(localString);
      setRequest(prev=>({
        ...prev,
        body:parsed
      }))
      setLocalString(JSON.stringify(parsed,null,2))
    }
  return (
  <div className="editor-area">
      <div className="pane-header">
        <span className="label">JSON Body</span>
        <button onClick={handleSync}>JSON</button>
      </div>
      <div className="editor-window">
        <textarea 
          className="code-input ghost-textarea"
          onChange={handleInput}
          onBlur={handleSync}
          value={localString}
          spellCheck='false'
          autoCapitalize='none'
        >
        </textarea>
      </div>
    </div>
  )
}

export default Body_panel