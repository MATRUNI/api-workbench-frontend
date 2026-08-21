export const saveToHistory = (url, method, currentRequest, currentResponse) => {
  try {
    const history = JSON.parse(localStorage.getItem('api_os_history')) || [];
    
    const newLog = {
      id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
      timestamp: new Date().toISOString(),
      method,
      url,
      
      request: {
        body: currentRequest.body,
        contentType:currentRequest.contentType,
        headers: currentRequest.headers || [],
        query: currentRequest.query || []
      },
      
      response: {
        status: currentResponse.status,
        data: currentResponse.data || currentResponse.message || "", 
        headers: currentResponse.headers || [],
        time: currentResponse.time || "0 ms",
        length: currentResponse.length || 0,
      },
      type: currentResponse.type,
      
      size: currentResponse.data ? encodeURIComponent(String(currentResponse.data)).length : 0
    };

    const updatedHistory = [newLog, ...history].slice(0, 50);
    localStorage.setItem('api_os_history', JSON.stringify(updatedHistory));
  } catch (error) {
    console.error("API.OS Local cache update failed:", error);
  }
};