import { forwardRef, useContext, useState } from 'react';
import { RequestContext } from '../context/RequestContext';
import { Copy, Check, Trash2, Download, Maximize2, FileCode, FileText, KeyRound } from "lucide-react";
import VoidLoader from './VoidLoader';
import '../style/responseViewer.css';
import CodeMirrorEditor from './utility_Components/CodeMirrorEditor';
import KeyValueList from './utility_Components/KeyValueList';


const ResponseViewer = forwardRef((props, ref) => {
    const { response, isLoading, requestPhase, setResponse } = useContext(RequestContext);
    const [copied, setCopied] = useState(false);
    const [activeTab, setActiveTab] = useState('body'); // 'body' | 'headers' | 'preview'
    const [isExpanded, setIsExpanded] = useState(false);
    

    // Detect content type or default to JSON
    const getContentType = (data) => {
        if (typeof data !== 'string') return 'application/json';
        const trimmed = data.trim();
        if (trimmed.startsWith('<') && trimmed.endsWith('>')) {
            return trimmed.toLowerCase().includes('<!doctype html') ? 'text/html' : 'application/xml';
        }
        try {
            JSON.parse(trimmed);
            return 'application/json';
        } catch {
            return 'text/plain';
        }
    };

    const contentType = getContentType(response.data);

    const getLanguageKey = (type) => {
        switch (type) {
            case 'application/json': return 'json';
            case 'text/html': return 'html';
            case 'application/xml': return 'xml';
            default: return 'text';
        }
    };

    const getFormattedData = () => {
        if (response.data === undefined || response.data === null) return "";
        if (typeof response.data === 'object') {
            return JSON.stringify(response.data, null, 2);
        }
        if (contentType === 'application/json') {
            try {
                return JSON.stringify(JSON.parse(response.data), null, 2);
            } catch {
                return String(response.data);
            }
        }
        return String(response.data);
    };

    const getStatusText = (status) => {
        if (!status) return "NO RESPONSE";
        if (status >= 200 && status < 300) return "SUCCESS";
        if (status >= 400) return "FAILED";
        return "INFO";
    };

    const getStatusClass = (status) => {
        if (!status) return "error";
        if (status >= 200 && status < 300) return "success";
        if (status >= 400 && status < 500) return "warning";
        if (status >= 500) return "error";
    };

    const handleCopy = async (e) => {
        e.preventDefault();
        try {
            await navigator.clipboard.writeText(getFormattedData());
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error("Failed to copy: ", err);
        }
    };

    const handleDownload = () => {
        const blob = new Blob([getFormattedData()], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `response-${Date.now()}.${contentType === 'text/html' ? 'html' : contentType === 'application/xml' ? 'xml' : 'json'}`;
        link.click();
        URL.revokeObjectURL(url);
    };

    return (
        <section ref={ref} className={`pane response-pane ${isExpanded ? 'response-pane-expanded' : ''}`}>
            <div className="pane-header">
                <div className="pane-header-left">
                    <span className="label">Response</span>
                    <span className="length-badge" title="Response size">
                        {response.length || getFormattedData().length}
                    </span>
                </div>

                <div className="response-meta">
                    <span className={`status-badge status-${getStatusClass(response.status)}`}>
                        {`${getStatusText(response.status)} ${response.status || ""}`}
                    </span>
                    <span className="time-badge">{`${response.time || "0"} ms`}</span>
                </div>
            </div>

            <div className="response-sub-tabs">
                <button 
                    type="button"
                    className={`sub-tab ${activeTab === 'body' ? 'active' : ''}`} 
                    onClick={() => setActiveTab('body')}
                >
                    <FileCode size={13} /> BODY
                </button>
                <button 
                    type="button"
                    className={`sub-tab ${activeTab === 'headers' ? 'active' : ''}`} 
                    onClick={() => setActiveTab('headers')}
                >
                    <KeyRound size={13} /> Headers
                </button>
                {contentType === 'text/html' && (
                    <button 
                        type="button"
                        className={`sub-tab ${activeTab === 'preview' ? 'active' : ''}`} 
                        onClick={() => setActiveTab('preview')}
                    >
                        <FileText size={13} /> Preview
                    </button>
                )}
            </div>

            <div className="editor-window output">
                {isLoading ? (
                    <VoidLoader currentPhase={requestPhase} />
                ) : (
                    <>
                        {
                            activeTab === "body" &&
                            (<CodeMirrorEditor editable={false} lang={getLanguageKey(contentType)} value={getFormattedData()} placeholderText={"RESPONSE DISPLAY"}/>)
                        }
                        
                        {activeTab === 'headers' && (
                            <KeyValueList
                                items={Object.entries(response.headers || {}).map(([key, value]) => ({
                                    key,
                                    value
                                }))}
                                editable={false}
                                showAddBtn={false}
                                label="Response Headers"
                                emptyMessage="No header information available."
                            />
                        )}

                        {activeTab === 'preview' && (
                            <iframe 
                                title="HTML Preview" 
                                srcDoc={getFormattedData()} 
                                style={{ width: '100%', height: '100%', border: 'none', background: '#fff' }} 
                            />
                        )}
                    </>
                )}
            </div>

            <div className='copy-container'>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button type="button" className="copy-btn" disabled={!response.data} onClick={handleCopy}>
                        {copied ? <><Check size={14} /> COPIED</> : <><Copy size={14} /> COPY</>}
                    </button>
                    <button type="button" className="copy-btn" disabled={!response.data} onClick={handleDownload} title="Download response">
                        <Download size={14} /> SAVE
                    </button>
                </div>
                
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button type="button" className="copy-btn" onClick={() => setIsExpanded(!isExpanded)} title="Expand view">
                        <Maximize2 size={14} />
                    </button>
                    <button type="button" className='copy-btn clear-btn' disabled={!response.data} onClick={() => setResponse({ status: 200 })}>
                        <Trash2 size={14} /> CLEAR
                    </button>
                </div>
            </div>
        </section>
    );
});

export default ResponseViewer;