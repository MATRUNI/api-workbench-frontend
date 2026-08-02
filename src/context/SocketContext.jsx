import React, { createContext, useState, useEffect, useContext, useRef } from 'react';
import { socket } from '../socket/index.js';
import { UserContext } from './UserContext.jsx';

export const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { user } = useContext(UserContext);
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [member, setMember] = useState(0);
  const [latency,setLatency] = useState(null)
  const audioRef = useRef(null)


  
  useEffect(() => {
    if (!user) return;
    
    socket.connect();
    
    function measureLatency() {
      const start = performance.now();
      let finished = false;
  
      const timeout = setTimeout(() => {
        if (!finished) {
          setLatency(null); // timeout
        }
      }, 3000);
  
      socket.emit("ping", () => {
        finished = true;
        clearTimeout(timeout);
  
        setLatency(Math.round(performance.now() - start));
  
        setTimeout(measureLatency, 5000);
      });
    } // fro RTT (Rounf-trip Time -> Latency)

    const onConnect = () => {
      setIsConnected(true);
      measureLatency();
    };

    const onDisconnect = () => setIsConnected(false);
    const handleOnlineUsers = (usersList) =>{
      setOnlineUsers(usersList);
      setMember(usersList.length)
    }
    const handleCallRing = async ({track})=>{
      if(track !== "call-invite") return;
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
    <SocketContext.Provider value={{ socket, isConnected, onlineUsers, member,stopRing,latency }}>
      {children}
    </SocketContext.Provider>
  );
}