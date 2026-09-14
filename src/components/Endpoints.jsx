import { useContext, useRef, useState } from "react";
import { Group, Separator } from "react-resizable-panels";
import { motion } from 'framer-motion';

import "../style/Endpoints.css";
import RequestBuilder from "./RequestBuilder";
import ResponseViewer from "./ResponseViewer";
import { GripHorizontal, GripVertical, X, Plus } from "lucide-react";
import { MobileContext } from "../context/MobileContext";
import { TabContext } from "../context/TabContext";
import { RequestContext } from "../context/RequestContext";
import { tabItemVariants, tabVariants } from "../animations/Motion";

function Endpoints() {
  const { tabMap, setTabMap, activeTab,setActiveTab } = useContext(TabContext);
  const responseRef = useRef(null);
  const { isMobile } = useContext(MobileContext);
  const { request, setRequest, url, setURL, response, setResponse, method, setMethod } = useContext(RequestContext);
  
  const tabs = Array.from(tabMap.keys());

  // Function to add a new tab
  const handleAddTab = () => {
    const newTabId = Date.now(); // Unique ID to prevent key collisions
    
    setTabMap(prevMap => {
      const newMap = new Map(prevMap);
      if (activeTab !== null) {
        newMap.set(activeTab, { url, method, request, response });
      }
      newMap.set(newTabId, {
        url: 'http://localhost:3000',
        method: "GET",
        request: {
          body: "{\n  \"key\": \"value\",\n  \"data\": \"input your JSON here\"\n}",
          contentType: "application/json",
          headers: [],
          query: []
        },
        response: {
          status: 200,
          results: [],
          message: "Ready to fetch data",
          time: 100,
          category: ""
        }
      });
      return newMap;
    });

    setURL('http://localhost:3000');
    setMethod("GET");
    setRequest({
      body: "{\n  \"key\": \"value\",\n  \"data\": \"input your JSON here\"\n}",
      contentType: "application/json",
      headers: [],
      query: []
    });
    setResponse({
      status: 200,
      results: [],
      message: "Ready to fetch data",
      time: 100,
      category: ""
    });
    setActiveTab(newTabId);
  };

  // Function to close a tab
  const handleCloseTab = (e, tabId) => {
    e.stopPropagation(); 
    if (tabMap.size <= 1) return; 

    const newMap = new Map(tabMap);
    newMap.delete(tabId);
    setTabMap(newMap);

    if (activeTab === tabId) {
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
  };

  const handleTabSwitch = (targetTabId) => {
    if (targetTabId === activeTab || !tabMap.has(targetTabId)) return;

    // 1. Safely extract target tab data first
    const targetTab = tabMap.get(targetTabId);

    // 2. Update map to persist current tab state
    setTabMap(prevMap => {
      const newMap = new Map(prevMap);
      newMap.set(activeTab, { url, method, request, response });
      return newMap;
    });

    // 3. Load target tab data into context outside of the state updater
    if (targetTab) {
      setURL(targetTab.url);
      setMethod(targetTab.method);
      setRequest(targetTab.request);
      setResponse(targetTab.response);
    }

    setActiveTab(targetTabId);
  };

  const scrollToResponse = () => {
    if (isMobile) {
      responseRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    }
  };

  return (
    <>
      <motion.div className={`tabs-wrapper`}
      variants={tabVariants}
      initial="hidden"
      animate="visible"
      >
      {tabs.map((tabId) => {
        const isActive = activeTab === tabId;
        const tabData = tabMap.get(tabId) || { method: "GET", url: "" };
      
        // Extract clean path or fallback to Request ID
        let displayPath = "";
        try {
          const urlObj = new URL(tabData.url);
          displayPath = urlObj.pathname === "/" ? tabData.url : urlObj.pathname;
        } catch {
          displayPath = tabData.url || `Request ${tabId}`;
        }
        return (
          <motion.div
            key={tabId}
            className={`tab-item ${isActive ? "active" : ""}`}
            onClick={() => handleTabSwitch(tabId)}
            variants={tabItemVariants}
          >
            <span className={`tab-method-pill tab-method-${tabData.method}`}>
              {tabData.method}
            </span>
            <span className="tab-label-text" title={tabData.url}>
              {displayPath}
            </span>
            <button
              className="tab-close-btn"
              onClick={(e) => handleCloseTab(e, tabId)}
              title="Close Tab"
            >
              <X size={13} />
            </button>
          </motion.div>
        );
        })}
        <button className="add-tab-btn" onClick={handleAddTab} title="New Tab">
          <Plus size={16} />
        </button>
      </motion.div>
      <Group orientation={isMobile ? "vertical" : "horizontal"} className="workbench-container">
        <RequestBuilder scrollToResponse={scrollToResponse} />
        <Separator className="separator">
          {isMobile ? <GripHorizontal size={18} /> : <GripVertical size={18} />}
        </Separator>
        <ResponseViewer ref={responseRef} />
      </Group>
    </>
  );
}

export default Endpoints;