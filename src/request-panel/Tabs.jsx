import { FileCode, KeyRound, ListFilter } from "lucide-react"
import AnimatedToggle from "../components/utility_Components/Toggle"
import { useContext } from "react"
import { MobileContext } from "../context/MobileContext"
import { ProxyContext } from "../context/ProxyContext"
import { RequestContext } from "../context/RequestContext"
function Tabs({activeTab,setActiveTab}) {
  const {isMobile} = useContext(MobileContext)
  const { isProxyRunning } = useContext(ProxyContext)
  const { isProxyEnable,setIsProxyEnable } = useContext(RequestContext)
  return (
    <div className="tabs-header">
      <div className="tab-container">
        <button
          className={`tab ${activeTab === 'body' ? 'active' : ''}`}
          onClick={() => { setActiveTab('body') }}
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