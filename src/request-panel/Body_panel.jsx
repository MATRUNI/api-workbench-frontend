import React, { memo, useContext, useState } from 'react'
import { RequestContext } from '../context/RequestContext';
import '../style/Generic.css'

function formatXml(xml) {
    let formatted = '';
    // Strip whitespace between tags to ensure regex matching works
    xml = xml.replace(/(>)\s*(<)/g, '$1$2');
    const reg = /(>)(<)(\/*)/g;
    xml = xml.replace(reg, '$1\r\n$2$3');
    let pad = 0;
    xml.split('\r\n').forEach((node) => {
        let indent = 0;
        if (node.match(/.+<\/\w[^>]*>$/)) {
            indent = 0;
        } else if (node.match(/^<\/\w/)) {
            if (pad !== 0) {
                pad -= 1;
            }
        } else if (node.match(/^<\w[^>]*[^\/]>.*$/)) {
            indent = 1;
        } else {
            indent = 0;
        }
        formatted += '  '.repeat(pad) + node + '\n';
        pad += indent;
    });
    return formatted.trim();
}

function Body_panel() {
    const {request,setRequest, contentTypeTemplates} =useContext(RequestContext)
    const [error,setError]=useState(null);
    const [contentType,setContentType] = useState('application/json')
    const [localString,setLocalString]=useState(JSON.stringify(request.body||{},null,2))
    function handleInput(e)
    {
      const value=e.target.value;
      setLocalString(value)
      
      if(value.trim()==="")
      {
        setError(null);
        return;
      }

      try
      {
        if (contentType === 'application/json') {
          JSON.parse(value);
        } else if (contentType === 'application/xml') {
          const parser = new DOMParser();
          const dom = parser.parseFromString(value, "application/xml");
          if (dom.querySelector('parsererror')) {
              throw new Error("Invalid XML");
          }
        }
        // HTML and plain text are generally always valid as strings
        setError(null)
      }
      catch(err)
      {
        setError(err.message)
      }
    }
    async function handleSync()
    {
      try
      {
        let formatted = localString;
        let finalBody = localString;

        if (contentType === 'application/json') {
            const parsed = JSON.parse(localString);
            finalBody = parsed;
            formatted = JSON.stringify(parsed, null, 2);
        } else if (contentType === 'text/html') {
            try {
                const prettier = await import("prettier/standalone");
                const parserHtml = await import("prettier/parser-html");
                formatted = await prettier.format(localString, { parser: 'html', plugins: [parserHtml] });
            } catch (e) {
                console.error("Prettier formatting failed", e);
            }
        } else if (contentType === 'application/xml') {
            const parser = new DOMParser();
            const dom = parser.parseFromString(localString, "application/xml");
            if (dom.querySelector('parsererror')) {
                throw new Error("Invalid XML");
            }
            formatted = formatXml(localString);
        }

        setRequest(prev=>({
          ...prev,
          body: finalBody
        }))
        setLocalString(formatted)
        setError(null);
      }
      catch(err)
      {
        setError("SyncError: "+err.message)
      }
    }
    function handleTypeChange(e)
    {
      let selected = e.target.value;
      setContentType(selected)
      setLocalString(contentTypeTemplates[selected])
      setError(null)
    }
  return (
  <div className="editor-area">
      <div className='pane-header'>
        <div className="pane-header-left">
          <select className="dropdown" value={contentType} onChange={handleTypeChange}>
            <option value="application/json">JSON</option>
            <option value="text/html">HTML</option>
            <option value="application/xml">XML</option>
            <option value="text/plain">Text</option>
          </select>
          <span className='label'>BODY</span>
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

export default memo(Body_panel)