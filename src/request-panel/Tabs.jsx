import { FileCode, KeyRound, ListFilter } from "lucide-react"
function Tabs({activeTab,setActiveTab}) {
  return (
    <div className="tab-container">
          <button 
          className={`tab ${activeTab==='body'?'active':''}`}
          onClick={()=>{setActiveTab('body')}}
          >
            <FileCode size={14}/>
            Body
          </button>
          <button 
          className={`tab ${activeTab==='headers'?'active':''}`}
          onClick={()=>{setActiveTab('headers')}}
          >
            <KeyRound size={14}/>
            Headers</button>
          <button 
          className={`tab ${activeTab==='query-params'?'active':''}`}
          onClick={()=>{setActiveTab('query-params')}}
          >
            <ListFilter size={14}/>
            Query Params</button>
    </div>
  )
}

export default Tabs