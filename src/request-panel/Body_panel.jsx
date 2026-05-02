import React, { useContext, useState } from 'react'
import { RequestContext } from '../context/RequestContext';

function Body_panel() {
    const {request,setRequest} =useContext(RequestContext)
    const [error,setError]=useState(null);
    const [localString,setLocalString]=useState(JSON.stringify(request.body||{},null,2))
    function handleInput(e)
    {
      const value=e.target.value;
      setLocalString(e.target.value)
      try
      {
        if(value.trim()==="")
        {
          setError(null);
          return;
        }
        JSON.parse(value);
        setError(null)
      }
      catch(err)
      {
        setError(err.message)
      }
    }
    function handleSync()
    {
      try
      {
        const parsed=JSON.parse(localString);
        setRequest(prev=>({
          ...prev,
          body:parsed
        }))
        setLocalString(JSON.stringify(parsed,null,2))
        setError(null);
      }
      catch(err)
      {
        setError("SyncError: "+err.message)
      }
    }
  return (
  <div className="editor-area">
      <div className='pane-header'>
        <div className="pane-header-left">
          <span className="label">JSON Body</span>
          <span className={`length-badge ${error ? 'status-error' : 'status-success'}`}>
                {error ? 'Invalid' : 'Valid'}
            </span>
        </div>
          <button onClick={handleSync} className='add-row-btn'>Format</button>
      </div>
      <div className="editor-window">
        <textarea 
          className="code-input ghost-textarea"
          onChange={handleInput}
          onBlur={handleSync}
          value={localString}
          spellCheck='false'
          autoCapitalize='none'
        />
        {error&&(
          <div className='validation-error'>
            <span style={{ fontWeight: 'bold' }}>✕</span>
            {error}
          </div>
        )}
      </div>
    </div>
  )
}

export default Body_panel