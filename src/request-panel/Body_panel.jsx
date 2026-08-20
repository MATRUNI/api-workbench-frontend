import { memo, useContext, useState, forwardRef, useImperativeHandle } from 'react'
import { RequestContext } from '../context/RequestContext';
import { FileBraces, FileCode, FileText, CheckCircle, AlertTriangle, Sparkles, CodeXml } from "lucide-react"
import { CustomDropdown } from '../components/utility_Components/CustomDropdown';
import CodeMirrorEditor from '../components/utility_Components/CodeMirrorEditor';

import { jsonProperties } from '../assets/jsonProperties'

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

const Body_panel = forwardRef((props, ref) => {

    const { request, setRequest, contentTypeTemplates } = useContext(RequestContext)
    const [error, setError] = useState(null);
    const [contentType, setContentType] = useState(request.contentType)
    const [localString, setLocalString] = useState(() => {
      if (typeof request.body === 'object' && request.body !== null) {
        return JSON.stringify(request.body, null, 2);
      }
      return typeof request.body === 'string' ? request.body : JSON.stringify({}, null, 2);
    })

    const typeOptions = [
      { value: 'application/json', label: 'JSON' },
      { value: 'text/html', label: 'HTML' },
      { value: 'application/xml', label: 'XML' },
      { value: 'text/plain', label: 'Text' },
    ];

    useImperativeHandle(ref, () => ({
      getCurrentBody() {
        return localString
      }
    }));

    const completions = jsonProperties.map(label=>({label,type:"property"}))

    const validateInput = (value, type) => {
      if (value.trim() === "") {
        setError(null);
        return;
      }
      try {
        if (type === 'application/json') {
          JSON.parse(value);
        } else if (type === 'application/xml') {
          const parser = new DOMParser();
          const dom = parser.parseFromString(value, "application/xml");
          if (dom.querySelector('parsererror')) {
              throw new Error("Invalid XML structure");
          }
        }
        setError(null);
      } catch (err) {
        setError(err.message);
      }
    };

    const handleEditorChange = (newValue) => {
      setLocalString(newValue);
      validateInput(newValue, contentType);
    };

    const getLangKey = (type) => {
      switch (type) {
        case 'application/json': return 'json';
        case 'text/html': return 'html';
        case 'application/xml': return 'xml';
        case 'text/plain':
        default: return 'text';
      }
    };
    async function handleSync() {
      try {
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
            formatted = formatXml(localString);
            finalBody = formatted;
        }

        setRequest(prev => ({
          ...prev,
          body: finalBody
        }))
        setLocalString(formatted)
        setError(null);
      } catch (err) {
        setError("SyncError: " + err.message)
      }
    }

    function handleTypeChange(e) {
      let selected = e.target.value;
      setContentType(selected)
      let template = contentTypeTemplates[selected] || "";
      setRequest(pre=>({...pre,contentType:selected,body:template}))
      
      if (selected === 'application/json') {
        try {
          const parsed = typeof template === 'string' ? JSON.parse(template) : template;
          template = JSON.stringify(parsed, null, 2);
        } catch {
          template = String(template);
        }
      }

      setLocalString(template);
      setError(null)
    }

    const renderTypeIcon = () => {
      switch (contentType) {
        case 'application/json': return <FileBraces size={15}/>;
        case 'text/html': return <FileCode size={15}/>;
        case 'application/xml': return <CodeXml size={15}/>;
        case 'text/plain':
        default: return <FileText size={15}/>;
      }
    };

  return (
    <div className="editor-area">
      <div className='pane-header'>
        <div className="pane-header-left">
            <CustomDropdown 
              value={contentType} 
              onChange={handleTypeChange} 
              options={typeOptions} 
              icon={renderTypeIcon()}
            />
          <span className='label' style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', marginLeft: '10px' }}>
            {renderTypeIcon()} BODY
          </span>
          <span className={`length-badge ${error ? 'status-error' : 'status-success'}`}>
            {error ? <><AlertTriangle size={14}/>Invalid</> : <><CheckCircle size={14}/>Valid</>}
          </span>
        </div>
        <button onClick={handleSync} className='add-row-btn'><Sparkles size={15}/>Format</button>
      </div>
      
      <div className="editor-window">
        <div style={{ height: '100%', width: '100%' }} onBlur={handleSync}>
          <CodeMirrorEditor value={localString} onChange={handleEditorChange} lang={getLangKey(contentType)} completions={completions}/>
        </div>
        
        {error && (
          <div className='validation-error'>
            <span style={{ fontWeight: 'bold' }}>✕</span>
            {error}
          </div>
        )}
      </div>
    </div>
  )
})

export default memo(Body_panel)