import React, { useContext } from 'react'
import { RequestContext } from '../context/RequestContext';

function Body_panel() {
    const {request,setRequest} =useContext(RequestContext)
    function handleInput(e)
    {
        let value=e.target.textContent;
        setRequest(JSON.parse(value||{
              "key": "value",
              "data": "input your JSON here"
            }))
    }
  return (
  <div className="editor-area">
      <div className="pane-header">
        <span className="label">JSON Body</span>
      </div>
      <div className="editor-window">
        <pre 
          className="code-input"
          contentEditable="true" 
          suppressContentEditableWarning={true}
          onInput={e => handleInput(e)}
        >
          {JSON.stringify(request.body, null, 2)}
        </pre>
      </div>
    </div>
  )
}

export default Body_panel