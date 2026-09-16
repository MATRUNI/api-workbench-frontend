import { useContext, useRef, useState } from "react";
import { Group, Separator } from "react-resizable-panels";
import { motion } from 'framer-motion';

import "../style/Endpoints.css";
import RequestBuilder from "./RequestBuilder";
import ResponseViewer from "./ResponseViewer";
import { GripHorizontal, GripVertical, X, Plus, Copy, ArrowRightToLine, Pencil } from "lucide-react";
import { MobileContext } from "../context/MobileContext";
import { TabContext } from "../context/TabContext";
import { RequestContext } from "../context/RequestContext";
import { tabItemVariants, tabVariants } from "../animations/Motion";
import { ContextMenuContext } from "../context/ContextMenuProvider";

function Endpoints() {
  const { tabMap, setTabMap, activeTab, setActiveTab } = useContext(TabContext);
  const responseRef = useRef(null);
  const [editingTabId, setEditingTabId] = useState(null);
  const [tempAlias, setTempAlias] = useState("");
  const { isMobile } = useContext(MobileContext);
  const { request, setRequest, url, setURL, response, setResponse, method, setMethod } = useContext(RequestContext);
  const { openContextMenu } = useContext(ContextMenuContext);
  const tabs = Array.from(tabMap.keys());

  // Ref to hold the long-press timeout ID for mobile devices
  const longPressTimerRef = useRef(null);

  // Function to add a new tab
  const handleAddTab = () => {
    const newTabId = Date.now();
    
    setTabMap(prevMap => {
      const newMap = new Map(prevMap);
      if (activeTab !== null) {
        const currentAlias = prevMap.get(activeTab)?.alias || "";
        newMap.set(activeTab, { url, method, request, response, alias: currentAlias });
      }
      newMap.set(newTabId, {
        url: 'http://localhost:3000',
        method: "GET",
        alias: "",
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

  // Handle closing other tabs
  function handleCloseOtherTabs(targetTabId) {
    const targetTabData = targetTabId === activeTab 
      ? { url, method, request, response, alias: tabMap.get(targetTabId)?.alias || "" } 
      : tabMap.get(targetTabId);

    setTabMap(new Map([[targetTabId, targetTabData]]));
    setActiveTab(targetTabId);

    if (targetTabId !== activeTab && targetTabData) {
      setURL(targetTabData.url);
      setMethod(targetTabData.method);
      setRequest(targetTabData.request);
      setResponse(targetTabData.response);
    }
  }

  function handleCloseRightSideTabs(targetTabId) {
    const tabIds = Array.from(tabMap.keys());
    const targetIndex = tabIds.indexOf(targetTabId);
    
    if (targetIndex === -1) return;

    const newMap = new Map();
    for (let i = 0; i <= targetIndex; i++) {
      const tabId = tabIds[i];
      if (tabId === activeTab) {
        const currentAlias = tabMap.get(activeTab)?.alias || "";
        newMap.set(tabId, { url, method, request, response, alias: currentAlias });
      } else if (tabMap.has(tabId)) {
        newMap.set(tabId, tabMap.get(tabId));
      }
    }
    
    setTabMap(newMap);

    const activeIndex = tabIds.indexOf(activeTab);
    if (activeIndex > targetIndex) {
      setActiveTab(targetTabId);
      const targetData = tabMap.get(targetTabId);
      if (targetData) {
        setURL(targetData.url);
        setMethod(targetData.method);
        setRequest(targetData.request);
        setResponse(targetData.response);
      }
    }
  }
  
  function handleTabDuplication(targetTabId) {
    const newTabId = Date.now();
    const newTabMap = new Map(tabMap);
    
    if (activeTab !== null) {
      const currentAlias = tabMap.get(activeTab)?.alias || "";
      newTabMap.set(activeTab, { url, method, request, response, alias: currentAlias });
    }

    const sourceData = targetTabId === activeTab 
      ? { url, method, request, response, alias: tabMap.get(targetTabId)?.alias || "" } 
      : tabMap.get(targetTabId);

    newTabMap.set(newTabId, sourceData);
    setTabMap(newTabMap);
    
    setActiveTab(newTabId);
    if (sourceData) {
      setURL(sourceData.url);
      setMethod(sourceData.method);
      setRequest(sourceData.request);
      setResponse(sourceData.response);
    }
  }

  function saveRename(targetTabId) {
    if (editingTabId === null) return;

    setTabMap(prevMap => {
      const newMap = new Map(prevMap);
      const existingData = targetTabId === activeTab 
        ? { url, method, request, response, alias: tempAlias.trim() }
        : newMap.get(targetTabId);
      
      if (existingData) {
        newMap.set(targetTabId, { ...existingData, alias: tempAlias.trim() });
      }
      return newMap;
    });

    setEditingTabId(null);
    setTempAlias("");
  }

  function handleRenameKeyDown(e, targetTabId) {
    if (e.key === "Enter") {
      saveRename(targetTabId);
    } else if (e.key === "Escape") {
      setEditingTabId(null);
      setTempAlias("");
    }
  }

  function handleRenameTab(targetTabId) {
    const targetData = targetTabId === activeTab 
      ? { alias: tabMap.get(targetTabId)?.alias || "" } 
      : tabMap.get(targetTabId);

    setEditingTabId(targetTabId);
    setTempAlias(targetData?.alias || "");
  }

  // Handle right-click or long-press context menu on a specific tab item
  function handleTabContext(e, targetTabId) {
    e.preventDefault();
    e.stopPropagation();

    openContextMenu(e, [
      {
        label: "Duplicate tab",
        icon: Copy,
        onClick: () => handleTabDuplication(targetTabId)
      },
      {
        label: "Rename tab",
        icon: Pencil,
        onClick: () => handleRenameTab(targetTabId)
      },
      { type: "separator" },
      {
        label: "Close other tabs",
        icon: X,
        onClick: () => handleCloseOtherTabs(targetTabId)
      },
      {
        label: "Close tabs to the right",
        icon: ArrowRightToLine,
        onClick: () => handleCloseRightSideTabs(targetTabId)
      },
    ]);
  }

  const handleTouchStart = (e, tabId) => {
    longPressTimerRef.current = setTimeout(() => {
      const touch = e.touches[0];
      const syntheticEvent = {
        preventDefault: () => e.preventDefault(),
        stopPropagation: () => e.stopPropagation(),
        clientX: touch.clientX,
        clientY: touch.clientY,
        currentTarget: e.currentTarget,
      };
      handleTabContext(syntheticEvent, tabId);
    }, 500);
  };

  const handleTouchMove = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handleTouchEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handleTabSwitch = (targetTabId) => {
    if (targetTabId === activeTab || !tabMap.has(targetTabId)) return;

    const targetTab = tabMap.get(targetTabId);

    setTabMap(prevMap => {
      const newMap = new Map(prevMap);
      const currentAlias = prevMap.get(activeTab)?.alias || "";
      newMap.set(activeTab, { url, method, request, response, alias: currentAlias });
      return newMap;
    });

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
      <motion.div 
        className={`tabs-wrapper`}
        variants={tabVariants}
        initial="hidden"
        animate="visible"
      >
        {tabs.map((tabId) => {
          const isActive = activeTab === tabId;
          const tabData = tabMap.get(tabId) || { method: "GET", url: "", alias: "" };

          let displayPath = "";
          if (tabData.alias && tabData.alias.trim() !== "") {
            displayPath = tabData.alias; 
          } else {
            try {
              const urlObj = new URL(tabData.url);
              displayPath = urlObj.pathname === "/" ? tabData.url : urlObj.pathname;
            } catch {
              displayPath = tabData.url || `Request ${tabId}`;
            }
          }
          return (
            <motion.div
              key={tabId}
              className={`tab-item ${isActive ? "active" : ""}`}
              onClick={() => handleTabSwitch(tabId)}
              onContextMenu={(e) => handleTabContext(e, tabId)}
              onTouchStart={(e) => handleTouchStart(e, tabId)}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onTouchCancel={handleTouchEnd}
              variants={tabItemVariants}
            >
              <span className={`tab-method-pill tab-method-${tabData.method}`}>
                {tabData.method}
              </span>

              {editingTabId === tabId ? (
                <input
                  type="text"
                  autoFocus
                  className="tab-rename-input"
                  value={tempAlias}
                  onChange={(e) => setTempAlias(e.target.value)}
                  onBlur={() => saveRename(tabId)}
                  onKeyDown={(e) => handleRenameKeyDown(e, tabId)}
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <span className="tab-label-text" title={tabData.url}>
                  {displayPath}
                </span>
              )}

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