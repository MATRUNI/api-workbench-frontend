import { FileCode, KeyRound, ListFilter } from "lucide-react"
import AnimatedToggle from "../components/utility_Components/Toggle"
import { useContext } from "react"
import { MobileContext } from "../context/MobileContext"
import { ProxyContext } from "../context/ProxyContext"
import { RequestContext } from "../context/RequestContext"
function Tabs({activeTab,setActiveTab}) {
  const {isMobile} = useContext(MobileContext)
  const { isProxyRunning } = useContext(ProxyContext)
  const { isProxyEnable,setIsProxyEnable, method } = useContext(RequestContext)

  const isBodyDisabled = method === "GET" || method === "HEAD";

  return (
    <div className="tabs-header">
      <div className="tab-container">
        <button
          type="button"
          className={`tab ${activeTab === 'body' ? 'active' : ''} ${isBodyDisabled ? 'disabled' : ''}`}
          disabled={isBodyDisabled}
          title={isBodyDisabled ? `${method} requests do not accept a request body` : "Request Body"}
          onClick={() => { if (!isBodyDisabled) setActiveTab('body'); }}
        >
          <FileCode size={14} />
          Body
        </button>
        <button
          className={`tab ${activeTab === 'headers' ? 'active' : ''}`}
          onClick={() => { setActiveTab('headers') }}
        >
          <KeyRound size={14} />
          Headers
        </button>
        <button
          className={`tab ${activeTab === 'query-params' ? 'active' : ''}`}
          onClick={() => { setActiveTab('query-params') }}
        >
          <ListFilter size={14} />
          Query Params
        </button>
      </div>
      { !isMobile && <div className="tab-container" aria-disabled={!isProxyRunning}>
        <span className="tab">PROXY</span>
        <AnimatedToggle isOn={isProxyEnable} setIsOn={setIsProxyEnable}/>
      </div>}
    </div>
  )
}

export default Tabs