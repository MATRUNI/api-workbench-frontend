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
        header: currentRequest.header || [],
        query: currentRequest.query || []
      },
      
      response: {
        status: currentResponse.status,
        data: currentResponse.data || currentResponse.message || "", 
        time: currentResponse.time || "0 ms",
        length: currentResponse.length || 0
      },
      
    size: currentResponse.data ? encodeURIComponent(String(currentResponse.data)).length : 0
    };

    const updatedHistory = [newLog, ...history].slice(0, 50);
    localStorage.setItem('api_os_history', JSON.stringify(updatedHistory));
  } catch (error) {
    console.error("API.OS Local cache update failed:", error);
  }
};