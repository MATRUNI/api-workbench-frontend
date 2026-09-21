import { memo, useContext, useState, forwardRef, useImperativeHandle, useEffect, useRef } from 'react'
import { RequestContext } from '../context/RequestContext';
import { FileBraces, FileCode, FileText, CheckCircle, AlertTriangle, Sparkles, CodeXml } from "lucide-react"
import { VscJson } from 'react-icons/vsc';
import { SiHtml5 } from 'react-icons/si';
import { CustomDropdown } from '../components/utility_Components/CustomDropdown';
import CodeMirrorEditor from '../components/utility_Components/CodeMirrorEditor';

import { jsonProperties } from '../assets/jsonProperties'
import { readJSONList, saveLearnedkeys } from '../repository/db';

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

    const { request, setRequest, contentTypeTemplates } = useContext(RequestContext);
    const [error, setError] = useState(null);
    const [contentType, setContentType] = useState(request.contentType || 'application/json');
    const isLocalChangeRef = useRef(false);

    // Independent draft store for all supported body types
    const [drafts, setDrafts] = useState(() => {
      const initialBody = typeof request.body === 'object' && request.body !== null
        ? JSON.stringify(request.body, null, 2)
        : (typeof request.body === 'string' ? request.body : JSON.stringify({}, null, 2));

      return {
        ...contentTypeTemplates,
        ...(request.bodyDrafts || {}),
        [request.contentType || 'application/json']: initialBody
      };
    });

    const [localString, setLocalString] = useState(() => {
      if (typeof request.body === 'object' && request.body !== null) {
        return JSON.stringify(request.body, null, 2);
      }
      return typeof request.body === 'string' ? request.body : JSON.stringify({}, null, 2);
    });

    const [dynamicCompletions, setDynamicCompletions] = useState([]);
    useEffect(()=>{
      readJSONList().then(entreis=>{
        const learnedProp = entreis.map(([k])=>k)
        const allProps = [...new Set([...learnedProp,...jsonProperties])]
        setDynamicCompletions(allProps.map((label)=>({label,type:"property"})))
      })
    },[])
    const typeOptions = [
      { value: 'application/json', label: 'JSON', icon: <VscJson size={14} style={{ color: '#f59e0b' }} /> },
      { value: 'text/html', label: 'HTML', icon: <SiHtml5 size={14} style={{ color: '#e34f26' }} /> },
      { value: 'application/xml', label: 'XML', icon: <CodeXml size={14} style={{ color: '#38bdf8' }} /> },
      { value: 'text/plain', label: 'Text', icon: <FileText size={14} style={{ color: '#94a3b8' }} /> },
    ];

    // Synchronize when request changes externally (e.g. tab switch or history load)
    useEffect(() => {
      if (isLocalChangeRef.current) {
        isLocalChangeRef.current = false;
        return;
      }

      const incomingType = request.contentType || 'application/json';
      let incomingBody = '';
      if (typeof request.body === 'object' && request.body !== null) {
        incomingBody = JSON.stringify(request.body, null, 2);
      } else {
        incomingBody = typeof request.body === 'string' ? request.body : JSON.stringify({}, null, 2);
      }

      setContentType(incomingType);
      setLocalString(incomingBody);
      setDrafts(prev => ({
        ...contentTypeTemplates,
        ...prev,
        ...(request.bodyDrafts || {}),
        [incomingType]: incomingBody
      }));
      validateInput(incomingBody, incomingType);
    }, [request.contentType, request.body, request.bodyDrafts]);

    const changeContentType = (selected) => {
      if (selected === contentType) return;

      // 1. Snapshot current editor buffer into outgoing type's draft
      const updatedDrafts = {
        ...drafts,
        [contentType]: localString
      };

      // 2. Fetch or initialize the draft for the newly selected type
      let nextDraft = updatedDrafts[selected];
      if (nextDraft === undefined || nextDraft === null) {
        nextDraft = contentTypeTemplates[selected] || "";
        if (selected === 'application/json') {
          try {
            const parsed = typeof nextDraft === 'string' ? JSON.parse(nextDraft) : nextDraft;
            nextDraft = JSON.stringify(parsed, null, 2);
          } catch {
            nextDraft = String(nextDraft);
          }
        }
        updatedDrafts[selected] = nextDraft;
      }

      // 3. Update local state
      setDrafts(updatedDrafts);
      setContentType(selected);
      setLocalString(nextDraft);
      validateInput(nextDraft, selected);

      // 4. Update request context state without losing drafts
      let finalBody = nextDraft;
      if (selected === 'application/json') {
        try {
          finalBody = JSON.parse(nextDraft);
        } catch {
          finalBody = nextDraft;
        }
      }

      isLocalChangeRef.current = true;
      setRequest(prev => ({
        ...prev,
        contentType: selected,
        body: finalBody,
        bodyDrafts: updatedDrafts
      }));
      setError(null);
    };

    useImperativeHandle(ref, () => ({
      getCurrentBody() {
        return localString;
      },
      formatBody() {
        handleSync();
      },
      setContentType(type) {
        changeContentType(type);
      }
    }));

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
      setDrafts(prev => ({
        ...prev,
        [contentType]: newValue
      }));
      validateInput(newValue, contentType);

      isLocalChangeRef.current = true;
      setRequest(prev => ({
        ...prev,
        body: newValue,
        bodyDrafts: {
          ...(prev.bodyDrafts || {}),
          [contentType]: newValue
        }
      }));
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
            saveLearnedkeys(parsed).then(async()=>{
              const entreis = await readJSONList(true)
              const learnedProp = entreis.map(([k])=>k)
              const allProps = [...new Set([...learnedProp,...jsonProperties])]
              setDynamicCompletions(allProps.map((label)=>({label,type:"property"})))
            }).catch(err=>console.error("Learning background tak failed. :",err))
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

        isLocalChangeRef.current = true;
        setLocalString(formatted);
        setDrafts(prev => ({
          ...prev,
          [contentType]: formatted
        }));
        setRequest(prev => ({
          ...prev,
          body: finalBody,
          bodyDrafts: {
            ...(prev.bodyDrafts || {}),
            [contentType]: formatted
          }
        }));
        setError(null);
      } catch (err) {
        setError("SyncError: " + err.message)
      }
    }

    function handleTypeChange(e) {
      changeContentType(e.target.value);
    }

    const renderTypeIcon = () => {
      switch (contentType) {
        case 'application/json': return <VscJson size={15} style={{ color: '#f59e0b' }} />;
        case 'text/html': return <SiHtml5 size={15} style={{ color: '#e34f26' }} />;
        case 'application/xml': return <CodeXml size={15} style={{ color: '#38bdf8' }} />;
        case 'text/plain':
        default: return <FileText size={15} style={{ color: '#94a3b8' }} />;
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
          <CodeMirrorEditor value={localString} onChange={handleEditorChange} lang={getLangKey(contentType)} completions={dynamicCompletions}/>
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