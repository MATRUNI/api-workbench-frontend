import { useContext, useState, useRef, useEffect } from 'react'
import Tabs from '../request-panel/Tabs'
import Body_panel from '../request-panel/Body_panel'
import AuthPanel from '../request-panel/AuthPanel'
import { RequestContext } from '../context/RequestContext'
import { ProxyContext } from '../context/ProxyContext'
import { callAPI } from '../services/api'
import { saveToHistory } from '../services/history'
import { 
  Send, 
  Share2, 
  X, 
  Code, 
  Copy, 
  Link2, 
  Terminal, 
  ArrowRightLeft, 
  FileCode, 
  KeyRound, 
  SlidersHorizontal, 
  RotateCcw,
  Sparkles,
  CodeXml,
  Plus,
  ShieldCheck,
  Trash2
} from "lucide-react"
import { TbFlame } from "react-icons/tb"
import KeyValueList from './utility_Components/KeyValueList'
import StressControls from './StressControls'

import "../style/RequestBuilder.css"
import ConfigSharing from './ConfigSharing'
import CodeSnippetModal from './CodeSnippetModal'
import { UserContext } from '../context/UserContext'
import { ShareContext } from '../context/ShareContext'
import { MobileContext } from '../context/MobileContext'
import { Panel } from 'react-resizable-panels'
import { ContextMenuContext } from '../context/ContextMenuContext'
import { generateCodeSnippet } from '../utils/codeGenerators'
import { CustomDropdown } from './utility_Components/CustomDropdown'
import { 
  VscArrowDown, 
  VscArrowUp, 
  VscSync, 
  VscEdit, 
  VscTrash, 
  VscEye, 
  VscSettings 
} from 'react-icons/vsc';

const methodOptions = [
  { value: 'GET', label: 'GET', className: 'method-opt-GET', icon: <VscArrowDown size={14} style={{ color: '#61affe' }} /> },
  { value: 'POST', label: 'POST', className: 'method-opt-POST', icon: <VscArrowUp size={14} style={{ color: '#49cc90' }} /> },
  { value: 'PUT', label: 'PUT', className: 'method-opt-PUT', icon: <VscSync size={14} style={{ color: '#fca130' }} /> },
  { value: 'PATCH', label: 'PATCH', className: 'method-opt-PATCH', icon: <VscEdit size={14} style={{ color: '#9b59b6' }} /> },
  { value: 'DELETE', label: 'DELETE', className: 'method-opt-DELETE', icon: <VscTrash size={14} style={{ color: '#f93e3e' }} /> },
  { value: 'HEAD', label: 'HEAD', className: 'method-opt-HEAD', icon: <VscEye size={14} style={{ color: '#ec4899' }} /> },
  { value: 'OPTIONS', label: 'OPTIONS', className: 'method-opt-OPTIONS', icon: <VscSettings size={14} style={{ color: '#0331ff' }} /> }
];

function RequestBuilder({ scrollToResponse }) {
    const {url,setURL,request,setResponse,setIsLoading,setRequestPhase,method,setMethod,setRequest,isProxyEnable,setIsProxyEnable,isStressMode}=useContext(RequestContext)
    const { isProxyRunning } = useContext(ProxyContext)
    const {user} = useContext(UserContext)
    const { isMobile } = useContext(MobileContext)
    const { openContextMenu, copyToClipboard } = useContext(ContextMenuContext);
    const shareCtx = useContext(ShareContext);
    const hasSharedIndicator = Boolean(shareCtx && (shareCtx.unreadShares?.length > 0 || shareCtx.sentShares));
    const [activeTab,setActiveTab]=useState('body')
    const [modalActive,setModalActive] = useState(false);
    const [codeModalActive, setCodeModalActive] = useState(false);
    const bodyRef = useRef(null);

    const PaneComponent = isMobile ? 'div' : Panel;

    const isBodyDisabled = method === 'GET' || method === 'HEAD';

    // Automatically switch away from Body tab when GET or HEAD is selected
    useEffect(() => {
      if (isBodyDisabled && activeTab === 'body') {
        setActiveTab('headers');
      }
    }, [isBodyDisabled, activeTab]);

    // Switch to Stress tab when Stress Mode is toggled (desktop only)
    useEffect(() => {
      if (isStressMode && !isMobile) {
        setActiveTab('stress');
      } else if (activeTab === 'stress') {
        setActiveTab(isBodyDisabled ? 'headers' : 'body');
      }
    }, [isStressMode, isBodyDisabled, isMobile]);

    const isValidURL=(value)=>
    {
      try{
        new URL(value)
        return true;
      }
      catch
      {
        return false;
      }
    }
    const handleClearUrl = () => {
        setURL('');
    };
    const handleSubmit=async(e)=>
    {
      if (e && e.preventDefault) e.preventDefault();
      if(!isValidURL(url))
      {
        alert("Invalid URL");
        return;
      }
      if (isStressMode) {
        if (activeTab !== 'stress') {
          setActiveTab('stress');
        }
        scrollToResponse();
        return;
      }
      const body = isBodyDisabled ? "" : bodyRef.current?.getCurrentBody()
      setRequest(pre=>({...pre,body}))
      setIsLoading(true);
      scrollToResponse();
      setRequestPhase('initializing')
      await new Promise(res => setTimeout(res, 250));
      try{
        setRequestPhase("connecting");
        const response=await callAPI(url, method, {...request,body},isProxyEnable);

        setRequestPhase('processing')
        await new Promise(res => setTimeout(res, 350));
        setRequestPhase('parsing')
        await new Promise(res => setTimeout(res, 200));
        const finalResponse = {
          status: response.status,
          data: response.rawData,
          headers: response.headers,
          time: response.time || 12,
          timing: response.timing || null,
          length: response.length || 0,
          type: response.type,
          category: response.category
        };
        setResponse(response)
        saveToHistory(url,method,request,finalResponse)
      }
      catch(error)
      {
        const errResponse = {
          status: error.status || "500",
          data: error.message,
          time: "0 ms",
          timing: error.timing || null
        };
        setResponse({
          status:error.status,
          data:error.message,
          timing: error.timing || null
        })
        saveToHistory(url,method,request,errResponse)
      }
      finally
      {
        setIsLoading(false);
        setRequestPhase('');
      }
    }

    const handleContextMenu = (e) => {
      if (e?.preventDefault) e.preventDefault();
      if (e?.stopPropagation) e.stopPropagation();

      const selectedText = window.getSelection()?.toString().trim() || "";
      const methods = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"];
      const currentBody = bodyRef.current?.getCurrentBody() || (typeof request.body === "string" ? request.body : JSON.stringify(request.body || {}));

      const menuItems = [];

      if (selectedText) {
        menuItems.push(
          { type: "header", label: "Selection" },
          {
            label: `Copy "${selectedText.length > 18 ? selectedText.slice(0, 18) + '…' : selectedText}"`,
            icon: Copy,
            shortcut: "Ctrl+C",
            onClick: () => copyToClipboard(selectedText, "Copied selection!")
          },
          { type: "separator" }
        );
      }

      menuItems.push(
        { type: "header", label: "Request Execution" },
        {
          label: "Send Request",
          icon: Send,
          shortcut: "Ctrl+Enter",
          onClick: () => handleSubmit(e)
        },
        {
          label: "Copy URL",
          icon: Link2,
          disabled: !url,
          onClick: () => copyToClipboard(url, "Copied request URL!")
        },
        {
          label: "Copy Full URL (with Query)",
          icon: Link2,
          disabled: !url,
          onClick: () => {
            const validQueries = (request.query || []).filter(q => q.key && q.key.trim());
            let full = url;
            if (validQueries.length && url) {
              try {
                const urlObj = new URL(url);
                validQueries.forEach(q => urlObj.searchParams.append(q.key, q.value ?? ""));
                full = urlObj.toString();
              } catch {
                const qs = validQueries.map(q => `${encodeURIComponent(q.key)}=${encodeURIComponent(q.value ?? "")}`).join("&");
                full = url.includes("?") ? `${url}&${qs}` : `${url}?${qs}`;
              }
            }
            copyToClipboard(full, "Copied full URL with parameters!");
          }
        },
        {
          label: "Clear URL",
          icon: X,
          danger: true,
          disabled: !url,
          onClick: handleClearUrl
        },
        { type: "separator" },
        { type: "header", label: "HTTP Method" },
        {
          label: `Method: ${method}`,
          icon: ArrowRightLeft,
          submenu: methods.map(m => ({
            label: m,
            type: "checkbox",
            checked: method === m,
            onClick: () => {
              setMethod(m);
              if ((m === "GET" || m === "HEAD") && activeTab === "body") {
                setActiveTab("headers");
              }
            }
          }))
        },
        { type: "separator" },
        { type: "header", label: "Request Tabs" },
        {
          label: isBodyDisabled ? "Body (Unavailable for GET)" : "Body",
          icon: FileCode,
          type: "checkbox",
          disabled: isBodyDisabled,
          checked: activeTab === "body",
          onClick: () => {
            if (!isBodyDisabled) setActiveTab("body");
          }
        },
        {
          label: `Headers (${request.headers?.length || 0})`,
          icon: KeyRound,
          type: "checkbox",
          checked: activeTab === "headers",
          onClick: () => setActiveTab("headers")
        },
        {
          label: `Query Params (${request.query?.length || 0})`,
          icon: SlidersHorizontal,
          type: "checkbox",
          checked: activeTab === "query-params",
          onClick: () => setActiveTab("query-params")
        }
      );

      // Context-aware actions for active tab
      if (activeTab === "body" && !isBodyDisabled) {
        menuItems.push(
          { type: "separator" },
          { type: "header", label: "Body Options" },
          {
            label: "Prettify / Format Body",
            icon: Sparkles,
            shortcut: "Alt+Shift+F",
            onClick: () => bodyRef.current?.formatBody()
          },
          {
            label: `Content-Type: ${request.contentType || 'application/json'}`,
            icon: CodeXml,
            submenu: [
              {
                label: "JSON (application/json)",
                type: "checkbox",
                checked: (request.contentType || 'application/json') === 'application/json',
                onClick: () => bodyRef.current?.setContentType('application/json')
              },
              {
                label: "HTML (text/html)",
                type: "checkbox",
                checked: request.contentType === 'text/html',
                onClick: () => bodyRef.current?.setContentType('text/html')
              },
              {
                label: "XML (application/xml)",
                type: "checkbox",
                checked: request.contentType === 'application/xml',
                onClick: () => bodyRef.current?.setContentType('application/xml')
              },
              {
                label: "Text (text/plain)",
                type: "checkbox",
                checked: request.contentType === 'text/plain',
                onClick: () => bodyRef.current?.setContentType('text/plain')
              },
            ]
          }
        );
      } else if (activeTab === "headers") {
        menuItems.push(
          { type: "separator" },
          { type: "header", label: "Headers Actions" },
          {
            label: "Add Header",
            icon: Plus,
            onClick: () => {
              setRequest(prev => ({
                ...prev,
                headers: [...(prev.headers || []), { key: "", value: "" }]
              }));
            }
          },
          {
            label: "Clear All Headers",
            icon: Trash2,
            danger: true,
            disabled: !request.headers || request.headers.length === 0,
            onClick: () => {
              setRequest(prev => ({ ...prev, headers: [] }));
            }
          }
        );
      } else if (activeTab === "query-params") {
        menuItems.push(
          { type: "separator" },
          { type: "header", label: "Query Actions" },
          {
            label: "Add Query Parameter",
            icon: Plus,
            onClick: () => {
              setRequest(prev => ({
                ...prev,
                query: [...(prev.query || []), { key: "", value: "" }]
              }));
            }
          },
          {
            label: "Clear All Query Params",
            icon: Trash2,
            danger: true,
            disabled: !request.query || request.query.length === 0,
            onClick: () => {
              setRequest(prev => ({ ...prev, query: [] }));
            }
          }
        );
      }

      menuItems.push(
        { type: "separator" },
        { type: "header", label: "Tools & Network" },
        {
          label: "Copy as cURL",
          icon: Terminal,
          onClick: () => {
            const reqData = {
              url,
              method,
              headers: request.headers || [],
              query: request.query || [],
              body: isBodyDisabled ? "" : currentBody,
              contentType: request.contentType || "application/json",
              auth: request.auth
            };
            const curlSnippet = generateCodeSnippet("curl", "curl", reqData);
            copyToClipboard(curlSnippet, "Copied as cURL!");
          }
        },
        {
          label: "Generate Code Snippet",
          icon: Code,
          onClick: () => setCodeModalActive(true)
        },
        {
          type: "checkbox",
          label: `Backend Proxy (${isProxyEnable ? 'Enabled' : 'Disabled'})`,
          icon: ShieldCheck,
          disabled: !isProxyRunning,
          checked: isProxyEnable,
          onClick: () => setIsProxyEnable(prev => !prev)
        }
      );

      if (user) {
        menuItems.push({
          label: "Share Configuration",
          icon: Share2,
          onClick: () => setModalActive(true)
        });
      }

      menuItems.push(
        { type: "separator" },
        {
          label: "Reset Request",
          icon: RotateCcw,
          danger: true,
          onClick: () => {
            setURL("http://localhost:3000");
            setMethod("GET");
            setRequest({
              body: "{\n  \"key\": \"value\",\n  \"data\": \"input your JSON here\"\n}",
              contentType: "application/json",
              headers: [],
              query: []
            });
          }
        }
      );

      openContextMenu(e, menuItems);
    };

    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleSubmit(e);
      }
    };

  return (
<PaneComponent 
  className="pane request-pane"
  onContextMenu={handleContextMenu}
  onKeyDown={handleKeyDown}
>
      <form className="url-bar-group" onSubmit={handleSubmit}>
        <CustomDropdown 
          className={`method-selector method-${method}`}
          value={method} 
          options={methodOptions}
          title="Scroll or click to switch HTTP method"
          onChange={(e) => {
            const nextMethod = e.target.value;
            setMethod(nextMethod);
            if ((nextMethod === 'GET' || nextMethod === 'HEAD') && activeTab === 'body') {
              setActiveTab('headers');
            }
          }}
        />
        <div className="url-input-wrapper">
            <input 
                type="text" 
                className="url-input" 
                placeholder="Enter request URL..."
                value={url} 
                onChange={(e) => setURL(e.target.value)}
            />
            {url && (
                <button 
                    type="button" 
                    className="url-clear-btn" 
                    onClick={handleClearUrl}
                    title="Clear URL"
                >
                    <X size={16} />
                </button>
            )}
        </div>
        <button 
          className={`send-button ${(isStressMode && !isMobile) ? 'stress-send-btn' : ''}`} 
          type='submit'
          title={(isStressMode && !isMobile) ? "Open Stress Controls / Start Test" : "Send Request (Ctrl+Enter)"}
        >
          {(isStressMode && !isMobile) ? <TbFlame size={19} style={{ color: '#fca130' }} /> : <Send size={18} />}
        </button>
      </form>
      <Tabs activeTab={activeTab} setActiveTab={setActiveTab} />

      {activeTab === "stress" && !isMobile && <StressControls scrollToResponse={scrollToResponse} />}

      {activeTab === "body" && <Body_panel ref={bodyRef}/>}

      {activeTab === "auth" && <AuthPanel />}

      {activeTab === "headers" && (
          <KeyValueList
              items={request.headers}
              onChange={(headers) => {
                  setRequest(prev => ({
                      ...prev,
                      headers
                  }));
              }}
              editable={true}
              showAddBtn={true}
              label="Request Headers"
              addLable="Add Header"
              emptyMessage="No headers defined. Click add to begin."
          />
      )}

      {activeTab === "query-params" && (
          <KeyValueList
              items={request.query}
              onChange={(queries) => {
                  setRequest(prev => ({
                      ...prev,
                      query: queries
                  }));
              }}
              editable={true}
              showAddBtn={true}
              label="Query Parameters"
              addLable="Add Parameter"
              emptyMessage="No query parameters defined. Click add to begin."
          />
      )}
      
      {activeTab !== "stress" && (
        <div className={`action-button-group ${hasSharedIndicator ? 'has-indicator' : ''}`}>
            <button 
                type="button" 
                className="code-btn" 
                title="Generate Code Snippet" 
                onClick={() => setCodeModalActive(true)}
            >
                CODE <Code size={15} />
            </button>
            
            {user && (
                <button 
                    type="button" 
                    className="config-btn" 
                    title="Share your configuration with others." 
                    onClick={() => setModalActive(true)}
                >
                    CONFIG <Share2 size={15} />
                </button>
            )}
        </div>
      )}

      {modalActive &&
      <ConfigSharing isOpen={modalActive} onClose={()=>setModalActive(false)}/>
      }
      {codeModalActive && 
      <CodeSnippetModal 
          isOpen={codeModalActive} 
          onClose={() => setCodeModalActive(false)} 
          requestData={{
              url,
              method,
              headers: request.headers,
              query: request.query,
              body: bodyRef.current?.getCurrentBody(),
              auth: request.auth
          }}
      />
      }
    </PaneComponent>
  )
}

export default RequestBuilder