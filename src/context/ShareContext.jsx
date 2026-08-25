import React, { createContext, useState, useEffect, useContext } from 'react';
import { SocketContext } from './SocketContext';

export const ShareContext = createContext(null);

export function ShareProvider({ children }) {
  const { socket } = useContext(SocketContext);
  
  const [unreadShares, setUnreadShares] = useState([]);
  const [sentShares, setSentShares] = useState([]);
  const [toastQueue, setToastQueue] = useState([]);

  useEffect(() => {
    if (!socket) return;

    const handleShareReceived = (payload) => {
      setUnreadShares((prev) => {
        // Prevent duplicate entries based on sharedDataId
        if (prev.some(item => item.sharedDataId === payload.sharedDataId)) return prev;
        return [payload, ...prev];
      });
      setToastQueue(pre=>[payload,...pre])
    };

    socket.on("share:received", handleShareReceived);

    return () => {
      socket.off("share:received", handleShareReceived);
    };
  }, [socket]);

  const clearUnreadShare = (sharedDataId) => {
    setUnreadShares((prev) => prev.filter(item => item.sharedDataId !== sharedDataId));
  };
  const removeTopToast = () => {
    setToastQueue((prev) => prev.slice(1));
  };
  const addSentShare = (payload) => {
    setSentShares((prev) => [payload, ...prev]);
  };

  return (
    <ShareContext.Provider value={{
      unreadShares,
      clearUnreadShare,
      sentShares,
      addSentShare,
      toastQueue,
      removeTopToast
    }}>
      {children}
    </ShareContext.Provider>
  );
}