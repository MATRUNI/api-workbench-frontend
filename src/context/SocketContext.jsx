import React, { createContext, useState, useEffect, useContext, useRef } from 'react';
import { socket } from '../socket/index.js';
import { UserContext } from './UserContext.jsx';

export const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { user } = useContext(UserContext);
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const audioRef = useRef(null)

  useEffect(() => {
    if (!user) return;

    socket.connect();

    const onConnect = () => {
      setIsConnected(true);
    };

    const onDisconnect = () => setIsConnected(false);
    const handleOnlineUsers = (usersList) => setOnlineUsers(usersList);
    const handleCallRing = async ({track})=>{
      if(!isConnected) return;

      if(track === "call-invite")
      {
        try 
        {
          const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/audio/call-invite`,{
            credentials: 'include',
            headers:{
              "x-api-key": import.meta.env.VITE_BACKEND_KEY
            }
          })
          if(!res.ok)
            return;
          const blob = await res.blob()
          const url = URL.createObjectURL(blob);
          const audio = new Audio(url);
          audioRef.current = audio
          audio.loop = true;
          
          // Handle potential Autoplay Policy rejections
          audio.play().catch(err => {
            console.warn("Ringtone blocked by browser autoplay policy:", err);
          });
        } 
        catch (error) 
        {
          console.log("Error while fetching ringtone")
        }
      }
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('audio:play', handleCallRing);
    socket.on("users:online", handleOnlineUsers);


    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('audio:play', handleCallRing);
      socket.off("users:online", handleOnlineUsers);
    };
  }, [user]);
  
  const stopRing = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      URL.revokeObjectURL(
        audioRef.current.src
      );
      audioRef.current = null;
    }
  };
  return (
    <SocketContext.Provider value={{ socket, isConnected, onlineUsers, stopRing }}>
      {children}
    </SocketContext.Provider>
  );
}