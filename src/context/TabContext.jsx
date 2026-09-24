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
  query: [],
  auth: {
    type: "none",
    token: "",
    username: "",
    password: ""
  }
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
      return newTabId;
    };

    // Switch active tab by ID
    const handleTabSwitch = (targetTabId) => {
      if (!targetTabId || !tabMap.has(targetTabId)) return false;
      if (targetTabId === activeTab) return true;

      const targetTab = tabMap.get(targetTabId);

      setTabMap(prevMap => {
        const newMap = new Map(prevMap);
        if (activeTab !== null && newMap.has(activeTab)) {
          const currentAlias = newMap.get(activeTab)?.alias || "";
          newMap.set(activeTab, { url, method, request, response, alias: currentAlias });
        }
        return newMap;
      });

      if (targetTab) {
        setURL(targetTab.url);
        setMethod(targetTab.method);
        setRequest(targetTab.request);
        setResponse(targetTab.response);
      }

      setActiveTab(targetTabId);
      return true;
    };

    // Close a specific tab or active tab
    const handleCloseTab = (tabId) => {
      const targetId = tabId !== undefined ? tabId : activeTab;
      if (!tabMap.has(targetId) || tabMap.size <= 1) return false;

      const newMap = new Map(tabMap);
      newMap.delete(targetId);
      setTabMap(newMap);

      if (activeTab === targetId) {
        const remainingKeys = Array.from(newMap.keys());
        const lastActiveTab = remainingKeys[remainingKeys.length - 1];
        setActiveTab(lastActiveTab);
        const target = newMap.get(lastActiveTab);
        if (target) {
          setURL(target.url);
          setMethod(target.method);
          setRequest(target.request);
          setResponse(target.response);
        }
      }
      return true;
    };

    // Close all other tabs except target
    const handleCloseOtherTabs = (targetTabId = activeTab) => {
      if (!targetTabId || !tabMap.has(targetTabId) || tabMap.size <= 1) return false;

      const targetData = targetTabId === activeTab
        ? { url, method, request, response, alias: tabMap.get(targetTabId)?.alias || "" }
        : tabMap.get(targetTabId);

      setTabMap(new Map([[targetTabId, targetData]]));
      setActiveTab(targetTabId);

      if (targetTabId !== activeTab && targetData) {
        setURL(targetData.url);
        setMethod(targetData.method);
        setRequest(targetData.request);
        setResponse(targetData.response);
      }
      return true;
    };

    // Duplicate a tab
    const handleDuplicateTab = (targetTabId = activeTab) => {
      if (!targetTabId || !tabMap.has(targetTabId)) return null;
      const newTabId = Date.now();
      const newMap = new Map(tabMap);

      if (activeTab !== null && newMap.has(activeTab)) {
        const currentAlias = newMap.get(activeTab)?.alias || "";
        newMap.set(activeTab, { url, method, request, response, alias: currentAlias });
      }

      const sourceData = targetTabId === activeTab
        ? { url, method, request, response, alias: tabMap.get(targetTabId)?.alias ? `${tabMap.get(targetTabId).alias} (Copy)` : "" }
        : { ...tabMap.get(targetTabId), alias: tabMap.get(targetTabId)?.alias ? `${tabMap.get(targetTabId).alias} (Copy)` : "" };

      newMap.set(newTabId, sourceData);
      setTabMap(newMap);

      setActiveTab(newTabId);
      if (sourceData) {
        setURL(sourceData.url);
        setMethod(sourceData.method);
        setRequest(sourceData.request);
        setResponse(sourceData.response);
      }
      return newTabId;
    };

    // Rename a tab
    const handleRenameTab = (targetTabId, newAlias) => {
      if (!targetTabId || !tabMap.has(targetTabId)) return false;
      setTabMap(prevMap => {
        const newMap = new Map(prevMap);
        const existing = targetTabId === activeTab
          ? { url, method, request, response, alias: newAlias }
          : newMap.get(targetTabId);
        if (existing) {
          newMap.set(targetTabId, { ...existing, alias: newAlias });
        }
        return newMap;
      });
      return true;
    };

    // Set tab HTTP method
    const handleSetTabMethod = (targetTabId, newMethod) => {
      if (!targetTabId || !tabMap.has(targetTabId)) return false;
      const upperMethod = newMethod.toUpperCase();
      setTabMap(prevMap => {
        const newMap = new Map(prevMap);
        const existing = newMap.get(targetTabId);
        if (existing) {
          if (targetTabId === activeTab) {
            newMap.set(targetTabId, { url, method: upperMethod, request, response, alias: existing.alias || "" });
            setMethod(upperMethod);
          } else {
            newMap.set(targetTabId, { ...existing, method: upperMethod });
          }
        }
        return newMap;
      });
      return true;
    };

    return (
        <TabContext.Provider value={{
          tabMap,
          setTabMap,
          activeTab,
          setActiveTab,
          handleAddTab,
          handleTabSwitch,
          handleCloseTab,
          handleCloseOtherTabs,
          handleDuplicateTab,
          handleRenameTab,
          handleSetTabMethod
        }}>
            {children}
        </TabContext.Provider>
    );
}