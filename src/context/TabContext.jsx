import { createContext, useContext, useState } from "react";
import { RequestContext } from "./RequestContext";

export const TabContext = createContext();
// Define standard defaults at the component level or inside
const DEFAULT_URL = 'http://localhost:3000';
const DEFAULT_METHOD = "GET";
const DEFAULT_ALIAS = "";
const DEFAULT_REQUEST = {
  body: "{\n  \"key\": \"value\",\n  \"data\": \"input your JSON here\"\n}",
  contentType: "application/json",
  bodyDrafts: {
    "application/json": "{\n  \"key\": \"value\",\n  \"data\": \"input your JSON here\"\n}",
    "text/html": "<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n  <title>API Payload</title>\n</head>\n<body>\n  <h1>Input your HTML markup here</h1>\n</body>\n</html>",
    "application/xml": "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<request>\n  <key>value</key>\n  <data>input your XML template here</data>\n</request>",
    "text/plain": "Input your raw plain text data here.\nLine breaks and spaces are preserved exactly as typed."
  },
  headers: [],
  query: []
};
const DEFAULT_RESPONSE = {
  status: 200,
  data: "",
  rawData: "",
  headers: [],
  message: "Ready to fetch data",
  length: 0,
  time: 100,
  type: "JSON",
  category: "",
  results: []
};
export function TabProvider({children})
{
  const initialTabId = Date.now();
  const { request, setRequest, url, setURL, response, setResponse, method, setMethod } = useContext(RequestContext);
  const [tabMap, setTabMap] = useState(
    new Map([
      [
        initialTabId,
        {
          url: DEFAULT_URL,
            method: DEFAULT_METHOD,
            alias: DEFAULT_ALIAS,
            request: DEFAULT_REQUEST,
            response: DEFAULT_RESPONSE
          }
        ]
      ])
    );
    const [activeTab, setActiveTab] = useState(initialTabId || null);
    // Function to add a new tab with optional data and fallbacks
    const handleAddTab = (initialData = {}) => {
      const newTabId = Date.now();
      
      // Extract with fallbacks
      const tabUrl = initialData.url ?? DEFAULT_URL;
      const tabMethod = initialData.method ?? DEFAULT_METHOD;
      const tabAlias = initialData.alias ?? DEFAULT_ALIAS;
      
      const tabRequest = {
        ...DEFAULT_REQUEST,
        ...(initialData.request || {}),
        bodyDrafts: {
          ...DEFAULT_REQUEST.bodyDrafts,
          ...(initialData.request?.bodyDrafts || {}),
          ...(initialData.request?.body ? {
            [initialData.request.contentType || "application/json"]: typeof initialData.request.body === "string" 
              ? initialData.request.body 
              : JSON.stringify(initialData.request.body, null, 2)
          } : {})
        }
      };
      
      const tabResponse = {
        ...DEFAULT_RESPONSE,
        ...(initialData.response || {})
      };
    
      setTabMap(prevMap => {
        const newMap = new Map(prevMap);
        
        // Save current active tab state first
        if (activeTab !== null && newMap.has(activeTab)) {
          const currentAlias = newMap.get(activeTab)?.alias || "";
          newMap.set(activeTab, { url, method, request, response, alias: currentAlias });
        }
        
        // Add new tab with fallback-backed data
        newMap.set(newTabId, {
          url: tabUrl,
          method: tabMethod,
          alias: tabAlias,
          request: tabRequest,
          response: tabResponse
        });
        
        return newMap;
      });
    
      // Update global context to load the new tab
      setURL(tabUrl);
      setMethod(tabMethod);
      setRequest(tabRequest);
      setResponse(tabResponse);
      setActiveTab(newTabId);
    };
    return (
        <TabContext.Provider value={{tabMap,setTabMap,activeTab,setActiveTab, handleAddTab}}>
            {children}
        </TabContext.Provider>
    )
}