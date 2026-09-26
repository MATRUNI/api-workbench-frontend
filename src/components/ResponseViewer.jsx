import { forwardRef, useContext, useState, useEffect } from 'react';
import { RequestContext } from '../context/RequestContext';
import { 
  TbCopy, 
  TbCheck, 
  TbTrash, 
  TbDownload, 
  TbMaximize, 
  TbMinimize, 
  TbFileCode, 
  TbFileText, 
  TbKey, 
  TbEye, 
  TbCircleCheck, 
  TbClock, 
  TbActivity,
  TbGauge,
  TbListDetails,
  TbAlertTriangle,
  TbPlayerStop,
  TbBolt,
  TbDatabase
} from "react-icons/tb";
import VoidLoader from './VoidLoader';
import CodeMirrorEditor from './utility_Components/CodeMirrorEditor';
import KeyValueList from './utility_Components/KeyValueList';
import ResponsePreview from './ResponsePreview';
import NetworkWaterfall from './NetworkWaterfall';
import StressTelemetryViewer from './StressTelemetryViewer';
import StressSamplesViewer from './StressSamplesViewer';
import StressErrorsViewer from './StressErrorsViewer';
import '../style/responseViewer.css';
import { Panel } from 'react-resizable-panels';
import { ContextMenuContext } from '../context/ContextMenuContext';
import { MobileContext } from '../context/MobileContext';

const ResponseViewer = forwardRef((props, ref) => {
    const { 
        response, 
        isLoading, 
        requestPhase, 
        setResponse, 
        isStressMode,
        stressTelemetry,
        stressConfig,
        abortStressTest
    } = useContext(RequestContext);

    const { openContextMenu, copyToClipboard } = useContext(ContextMenuContext);
    const { isMobile: isMobileCtx } = useContext(MobileContext);
    const isMobile = props.isMobile || isMobileCtx;
    const PaneComponent = isMobile ? 'div' : Panel;
    const [copied, setCopied] = useState(false);
    const [activeTab, setActiveTab] = useState('body'); // 'telemetry' | 'body' | 'headers' | 'raw' | 'samples' | 'errors' | 'preview' | 'timing'
    const [isExpanded, setIsExpanded] = useState(false);

    // Auto-select telemetry when entering stress mode
    useEffect(() => {
        if (isStressMode && !isMobile) {
            setActiveTab('telemetry');
        } else if (!isStressMode) {
            setActiveTab('body');
        }
    }, [isStressMode, isMobile]);

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

    // Check if the current response type or category supports visual preview
    const hasPreview = Boolean(
        response.category && ['IMAGE', 'AUDIO', 'VIDEO', 'DOCUMENT'].includes(response.category) || 
        response.type === 'HTML' || 
        response.type === 'CSV' ||
        contentType === 'text/html'
    );

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
        if (response.data instanceof Blob) return "[Binary Blob Data]";
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
        return "info";
    };

    const handleCopy = async (e) => {
        if (e && e.preventDefault) e.preventDefault();
        try {
            const dataToCopy = (isStressMode && activeTab === 'telemetry')
                ? JSON.stringify(stressTelemetry?.finalReport || stressTelemetry, null, 2)
                : getFormattedData();
            await copyToClipboard(dataToCopy, (isStressMode && activeTab === 'telemetry') ? "Copied telemetry report!" : "Copied formatted response!");
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error("Failed to copy: ", err);
        }
    };

    const handleDownload = () => {
        if (isStressMode && activeTab === 'telemetry') {
            const reportData = JSON.stringify(stressTelemetry?.finalReport || stressTelemetry, null, 2);
            const blob = new Blob([reportData], { type: 'application/json;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `stress-telemetry-${Date.now()}.json`;
            link.click();
            URL.revokeObjectURL(url);
            return;
        }

        const fileData = response.rawData || getFormattedData();
        const blob = fileData instanceof Blob ? fileData : new Blob([fileData], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `response-${Date.now()}.${response.type ? response.type.toLowerCase() : 'txt'}`;
        link.click();
        URL.revokeObjectURL(url);
    };

    const handleContextMenu = (e) => {
        if (e?.preventDefault) e.preventDefault();
        if (e?.stopPropagation) e.stopPropagation();

        const selectedText = window.getSelection()?.toString().trim() || "";
        const formattedData = getFormattedData();
        const hasData = Boolean(response.data || (response.rawData && response.rawData.length > 0));

        const menuItems = [];

        if (selectedText) {
            menuItems.push(
                { type: "header", label: "Selection" },
                {
                    label: `Copy "${selectedText.length > 18 ? selectedText.slice(0, 18) + '…' : selectedText}"`,
                    icon: TbCopy,
                    shortcut: "Ctrl+C",
                    onClick: () => copyToClipboard(selectedText, "Copied selection!")
                },
                { type: "separator" }
            );
        }

        menuItems.push(
            { type: "header", label: "Response Actions" },
            {
                label: "Copy Response",
                icon: TbCopy,
                shortcut: "Ctrl+C",
                disabled: !hasData,
                onClick: () => copyToClipboard(formattedData, "Copied formatted response!")
            },
            {
                label: "Copy Raw Response",
                icon: TbFileText,
                disabled: !hasData,
                onClick: () => {
                    const rawContent = typeof response.rawData === "string" ? response.rawData : formattedData;
                    copyToClipboard(rawContent, "Copied raw response!");
                }
            },
            {
                label: "Save / Download",
                icon: TbDownload,
                shortcut: "Ctrl+S",
                disabled: !hasData && !stressTelemetry?.finalReport,
                onClick: handleDownload
            },
            {
                label: "Clear Response",
                icon: TbTrash,
                danger: true,
                disabled: !hasData,
                onClick: () => setResponse({ status: 200 })
            },
            { type: "separator" },
            { type: "header", label: "Response Views" },
            {
                label: "Body",
                icon: TbFileCode,
                type: "checkbox",
                checked: activeTab === "body",
                onClick: () => setActiveTab("body")
            },
            {
                label: "Headers",
                icon: TbKey,
                type: "checkbox",
                checked: activeTab === "headers",
                onClick: () => setActiveTab("headers")
            },
            {
                label: "Raw",
                icon: TbFileText,
                type: "checkbox",
                checked: activeTab === "raw",
                onClick: () => setActiveTab("raw")
            }
        );

        if (isStressMode) {
            menuItems.push(
                {
                    label: "Telemetry",
                    icon: TbGauge,
                    type: "checkbox",
                    checked: activeTab === "telemetry",
                    onClick: () => setActiveTab("telemetry")
                },
                {
                    label: "Samples",
                    icon: TbListDetails,
                    type: "checkbox",
                    checked: activeTab === "samples",
                    onClick: () => setActiveTab("samples")
                }
            );
        } else {
            menuItems.push({
                label: "Timing / Waterfall",
                icon: TbActivity,
                type: "checkbox",
                checked: activeTab === "timing",
                onClick: () => setActiveTab("timing")
            });
        }

        if (hasPreview) {
            menuItems.push({
                label: "Preview",
                icon: TbEye,
                type: "checkbox",
                checked: activeTab === "preview",
                onClick: () => setActiveTab("preview")
            });
        }

        menuItems.push(
            {
                label: isExpanded ? "Collapse View" : "Expand View",
                icon: isExpanded ? TbMinimize : TbMaximize,
                onClick: () => setIsExpanded(prev => !prev)
            }
        );

        if (response.status) {
            menuItems.push(
                { type: "separator" },
                { type: "header", label: "Response Info" },
                {
                    label: `Status: ${response.status} (${getStatusText(response.status)})`,
                    icon: TbCircleCheck,
                    onClick: () => copyToClipboard(`${response.status} ${getStatusText(response.status)}`, "Copied status code!")
                },
                {
                    label: `Latency: ${response.time || 0} ms`,
                    icon: TbClock,
                    onClick: () => copyToClipboard(`${response.time || 0} ms`, "Copied response latency!")
                },
                {
                    label: `Size: ${response.length || formattedData.length} bytes`,
                    icon: TbDatabase,
                    onClick: () => copyToClipboard(`${response.length || formattedData.length} bytes`, "Copied response size!")
                }
            );
        }

        openContextMenu(e, menuItems);
    };

    return (
        <PaneComponent 
            className={`pane response-pane ${isExpanded ? 'response-pane-expanded' : ''}`}
            onContextMenu={handleContextMenu}
        >
            <div ref={ref} className="pane-header">
                {isStressMode && !isMobile ? (
                    <>
                        <div className="pane-header-left">
                            <span className="label">Stress Engine</span>
                            <span className="length-badge" title="Requests completed / Total target">
                                {`${stressTelemetry?.completed || 0} / ${stressTelemetry?.total || 0} reqs`}
                            </span>
                            {stressTelemetry?.isRunning ? (
                                <span className="stress-status-pill running" style={{ padding: '2px 8px', fontSize: '0.68rem' }}>
                                    <span className="stress-pulse-dot" style={{ width: '6px', height: '6px' }} />
                                    <span>RUNNING ({stressTelemetry.percent || 0}%)</span>
                                </span>
                            ) : stressTelemetry?.finalReport ? (
                                <span className={`stress-status-pill ${stressTelemetry.aborted ? 'aborted' : 'completed'}`} style={{ padding: '2px 8px', fontSize: '0.68rem' }}>
                                    {stressTelemetry.aborted ? 'ABORTED' : 'COMPLETED'}
                                </span>
                            ) : (
                                <span className="stress-status-pill idle" style={{ padding: '2px 8px', fontSize: '0.68rem' }}>
                                    READY
                                </span>
                            )}
                        </div>

                        <div className="response-meta">
                            {response.status && (
                                <span className={`status-badge status-${getStatusClass(response.status)}`}>
                                    {`${getStatusText(response.status)} ${response.status}`}
                                </span>
                            )}

                            <span className="time-badge" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.3)' }} title="Total benchmark execution time">
                                <TbClock size={12} />
                                <span>{`${(((stressTelemetry?.finalReport?.elapsedMs || stressTelemetry?.elapsedMs) || 0) / 1000).toFixed(2)}s`}</span>
                            </span>

                            <span className="time-badge latency-pill" title="Average or last request latency">
                                <TbActivity size={12} />
                                <span>{`${stressTelemetry?.finalReport?.latencies?.avg || stressTelemetry?.lastLatency || response.time || 0} ms`}</span>
                            </span>

                            <span className="time-badge" style={{ background: 'rgba(73, 204, 144, 0.1)', color: '#49cc90', border: '1px solid rgba(73, 204, 144, 0.3)' }} title="Throughput in requests per second">
                                <TbBolt size={12} />
                                <span>{`${stressTelemetry?.finalReport?.throughputRps || stressTelemetry?.currentRps || 0} req/s`}</span>
                            </span>

                            {stressTelemetry?.isRunning && (
                                <button
                                    type="button"
                                    className="stress-abort-sm-btn"
                                    onClick={abortStressTest}
                                    title="Abort ongoing stress benchmark"
                                >
                                    <TbPlayerStop size={12} />
                                    <span>Stop</span>
                                </button>
                            )}
                        </div>
                    </>
                ) : (
                    <>
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
                            <button 
                                type="button" 
                                className={`time-badge latency-pill ${activeTab === 'timing' ? 'active' : ''}`}
                                onClick={() => setActiveTab('timing')}
                                title="Click to view latency waterfall profile"
                            >
                                {response.timing ? (
                                    <span className="mini-waterfall-spectrum">
                                        <span className="mini-spectrum-seg" style={{ width: `${Math.max(response.timing.percentages?.dns || 0, 5)}%`, background: '#d2a8ff' }} />
                                        <span className="mini-spectrum-seg" style={{ width: `${Math.max(response.timing.percentages?.tcp || 0, 5)}%`, background: '#8b5cf6' }} />
                                        <span className="mini-spectrum-seg" style={{ width: `${Math.max(response.timing.percentages?.tls || 0, 5)}%`, background: '#c084fc' }} />
                                        <span className="mini-spectrum-seg" style={{ width: `${Math.max(response.timing.percentages?.ttfb || 0, 10)}%`, background: '#f59e0b' }} />
                                        <span className="mini-spectrum-seg" style={{ width: `${Math.max(response.timing.percentages?.download || 0, 5)}%`, background: '#49cc90' }} />
                                    </span>
                                ) : (
                                    <TbClock size={11} />
                                )}
                                <span>{`${response.time || "0"} ms`}</span>
                            </button>
                        </div>
                    </>
                )}
            </div>

            {/* Response Sub-Tabs Bar */}
            <div className="response-sub-tabs">
                {isStressMode && !isMobile ? (
                    <>
                        <button 
                            type="button"
                            className={`sub-tab ${activeTab === 'telemetry' ? 'active' : ''}`} 
                            onClick={() => setActiveTab('telemetry')}
                        >
                            <TbGauge size={13} /> TELEMETRY
                        </button>
                        <button 
                            type="button"
                            className={`sub-tab ${activeTab === 'body' ? 'active' : ''}`} 
                            onClick={() => setActiveTab('body')}
                        >
                            <TbFileCode size={13} /> SAMPLE BODY
                        </button>
                        <button 
                            type="button"
                            className={`sub-tab ${activeTab === 'headers' ? 'active' : ''}`} 
                            onClick={() => setActiveTab('headers')}
                        >
                            <TbKey size={13} /> HEADERS
                        </button>
                        <button 
                            type="button"
                            className={`sub-tab ${activeTab === 'raw' ? 'active' : ''}`} 
                            onClick={() => setActiveTab('raw')}
                        >
                            <TbFileText size={13} /> RAW
                        </button>
                        <button 
                            type="button"
                            className={`sub-tab ${activeTab === 'samples' ? 'active' : ''}`} 
                            onClick={() => setActiveTab('samples')}
                        >
                            <TbListDetails size={13} /> SAMPLES {stressTelemetry?.storedResponses?.length > 0 ? `(${stressTelemetry.storedResponses.length})` : ''}
                        </button>
                        {(stressTelemetry?.failureCount > 0 || stressTelemetry?.sampleErrors?.length > 0) && (
                            <button 
                                type="button"
                                className={`sub-tab error-tab ${activeTab === 'errors' ? 'active' : ''}`} 
                                onClick={() => setActiveTab('errors')}
                            >
                                <TbAlertTriangle size={13} /> ERRORS ({stressTelemetry.failureCount})
                            </button>
                        )}
                        {response.timing && (
                            <button 
                                type="button"
                                className={`sub-tab ${activeTab === 'timing' ? 'active' : ''}`} 
                                onClick={() => setActiveTab('timing')}
                            >
                                <TbActivity size={13} /> TIMING
                            </button>
                        )}
                        {hasPreview && (
                            <button 
                                type="button"
                                className={`sub-tab ${activeTab === 'preview' ? 'active' : ''}`} 
                                onClick={() => setActiveTab('preview')}
                            >
                                <TbEye size={13} /> PREVIEW
                            </button>
                        )}
                    </>
                ) : (
                    <>
                        <button 
                            type="button"
                            className={`sub-tab ${activeTab === 'body' ? 'active' : ''}`} 
                            onClick={() => setActiveTab('body')}
                        >
                            <TbFileCode size={13} /> BODY
                        </button>
                        <button 
                            type="button"
                            className={`sub-tab ${activeTab === 'headers' ? 'active' : ''}`} 
                            onClick={() => setActiveTab('headers')}
                        >
                            <TbKey size={13} /> HEADERS
                        </button>
                        <button 
                            type="button"
                            className={`sub-tab ${activeTab === 'raw' ? 'active' : ''}`} 
                            onClick={() => setActiveTab('raw')}
                        >
                            <TbFileText size={13} /> RAW
                        </button>
                        <button 
                            type="button"
                            className={`sub-tab ${activeTab === 'timing' ? 'active' : ''}`} 
                            onClick={() => setActiveTab('timing')}
                        >
                            <TbActivity size={13} /> TIMING
                        </button>
                        {hasPreview && (
                            <button 
                                type="button"
                                className={`sub-tab ${activeTab === 'preview' ? 'active' : ''}`} 
                                onClick={() => setActiveTab('preview')}
                            >
                                <TbEye size={13} /> PREVIEW
                            </button>
                        )}
                    </>
                )}
            </div>

            {/* Tab Content Window */}
            <div className="editor-window output">
                {isLoading && !isStressMode ? (
                    <VoidLoader currentPhase={requestPhase} />
                ) : (
                    <>
                        {isStressMode && !isMobile && activeTab === 'telemetry' && (
                            <div className="stress-response-wrapper">
                                <StressTelemetryViewer onSelectTab={(tab) => setActiveTab(tab)} />
                            </div>
                        )}

                        {activeTab === "body" && (
                            !response.data && isStressMode ? (
                                <div className="stress-empty-sample-prompt">
                                    <TbFileCode size={36} className="stress-empty-icon" />
                                    <h4>No Sample Response Captured Yet</h4>
                                    <p>Launch a stress benchmark from the left panel to execute requests and inspect live server response bodies.</p>
                                    <button 
                                        type="button" 
                                        className="stress-empty-cta-btn"
                                        onClick={() => setActiveTab('telemetry')}
                                    >
                                        <TbGauge size={14} /> View Telemetry Dashboard
                                    </button>
                                </div>
                            ) : response.data instanceof Blob ? (
                                <div className="blob-notice">Binary asset loaded. Switch to the <strong>Preview</strong> tab to view.</div>
                            ) : (
                                <CodeMirrorEditor 
                                    editable={false} 
                                    lang={getLanguageKey(contentType)} 
                                    value={getFormattedData()} 
                                    placeholderText={isStressMode ? "SAMPLE RESPONSE DISPLAY" : "RESPONSE DISPLAY"}
                                />
                            )
                        )}

                        {activeTab === "raw" && (
                            <CodeMirrorEditor 
                                editable={false} 
                                lang="text" 
                                value={typeof response.rawData === 'string' ? response.rawData : (response.data ? String(response.data) : '')} 
                                placeholderText={"RAW RESPONSE DISPLAY"}
                            />
                        )}
                        
                        {activeTab === 'headers' && (
                            <KeyValueList
                                items={Object.entries(response.headers || {}).map(([key, value]) => ({
                                    key,
                                    value
                                }))}
                                editable={false}
                                showAddBtn={false}
                                label={isStressMode ? "Sample Response Headers" : "Response Headers"}
                                emptyMessage="No header information available."
                            />
                        )}

                        {isStressMode && !isMobile && activeTab === 'samples' && (
                            <StressSamplesViewer 
                                samples={stressTelemetry?.storedResponses || []} 
                                onSelectSample={(sample) => {
                                    const formattedRaw = typeof sample.data === 'object' 
                                        ? JSON.stringify(sample.data, null, 2) 
                                        : (sample.data || sample.error || '');
                                    setResponse({
                                        ...response,
                                        data: sample.data || sample.error,
                                        rawData: formattedRaw,
                                        status: typeof sample.status === 'number' ? sample.status : (sample.error ? 500 : 200),
                                        time: sample.avgLatency || sample.latency || 0,
                                        headers: sample.headers || response.headers
                                    });
                                    setActiveTab('body');
                                }}
                            />
                        )}

                        {isStressMode && !isMobile && activeTab === 'errors' && (
                            <StressErrorsViewer 
                                report={stressTelemetry?.finalReport} 
                                sampleErrors={stressTelemetry?.sampleErrors || []} 
                                failureCount={stressTelemetry?.failureCount || 0} 
                            />
                        )}

                        {activeTab === 'timing' && (
                            <NetworkWaterfall 
                                timing={response.timing} 
                                totalTime={response.time} 
                                status={response.status} 
                            />
                        )}

                        {activeTab === 'preview' && (
                            <ResponsePreview 
                                data={response.rawData || response.data} 
                                type={response.type} 
                                category={response.category} 
                            />
                        )}
                    </>
                )}
            </div>

            <div className='copy-container'>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <button 
                        type="button" 
                        className="copy-btn" 
                        disabled={!response.data && !stressTelemetry?.finalReport} 
                        onClick={handleCopy}
                    >
                        {copied ? <><TbCheck size={14} /> COPIED</> : <><TbCopy size={14} /> COPY</>}
                    </button>
                    <button 
                        type="button" 
                        className="copy-btn" 
                        disabled={!response.data && !stressTelemetry?.finalReport} 
                        onClick={handleDownload} 
                        title="Download response or benchmark telemetry"
                    >
                        <TbDownload size={14} /> SAVE
                    </button>
                    <button 
                        type="button" 
                        className="copy-btn" 
                        onClick={() => setIsExpanded(!isExpanded)} 
                        title={isExpanded ? "Collapse view" : "Expand view"}
                    >
                        {isExpanded ? <TbMinimize size={14} /> : <TbMaximize size={14} />}
                    </button>
                    <button 
                        type="button" 
                        className='copy-btn clear-btn' 
                        disabled={!response.data} 
                        onClick={() => setResponse({ status: 200 })}
                    >
                        <TbTrash size={14} /> CLEAR
                    </button>
                </div>
            </div>
        </PaneComponent>
    );
});

export default ResponseViewer;