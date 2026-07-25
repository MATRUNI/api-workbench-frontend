import React, { createContext, useState, useEffect, useContext } from 'react';
import { socket } from '../socket/index.js';
import { UserContext } from './UserContext.jsx';

export const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { user } = useContext(UserContext);
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [onlineUsers, setOnlineUsers] = useState([]);

  useEffect(() => {
    if (!user) return;

    socket.connect();

    const onConnect = () => {
      setIsConnected(true);
      socket.emit("users:online:get");
    };

    const onDisconnect = () => setIsConnected(false);
    const handleOnlineUsers = (usersList) => setOnlineUsers(usersList);

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on("users:online", handleOnlineUsers);

    if (socket.connected) {
      socket.emit("users:online:get");
    }

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off("users:online", handleOnlineUsers);
    };
  }, [user]);

  return (
    <SocketContext.Provider value={{ socket, isConnected, onlineUsers }}>
      {children}
    </SocketContext.Provider>
  );
}