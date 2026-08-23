import { useState, useEffect, useContext } from 'react'
import { X, Search, Sparkles, Terminal, UserPlus, Check, Send } from "lucide-react"
import { motion, AnimatePresence } from 'framer-motion'
import { customFetch } from '../services/customFetch'
import SelectUser from './SelectUser'
import SelectDataToShare from './SelectDataToShare'
import { RequestContext } from '../context/RequestContext'

import "../style/ConfigSharing.css"
import { UserContext } from '../context/UserContext'

let configData = [];

function ConfigSharing({ isOpen, onClose }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [selectedUsers, setSelectedUsers] = useState([])
  const [message, setMessage] = useState('');
  const [isUserSelect, setIsUserSelect] = useState(true)
  const [isSharing,setIsSharing] = useState(false)
  const {url, request, method} = useContext(RequestContext);
  const { user } = useContext(UserContext)

  if (!isOpen) return null

  useEffect(() => {
    if (isOpen) {
      document.body.classList.add("no-scroll")
    } else {
      document.body.classList.remove("no-scroll")
    }
  
    return () => {
      document.body.classList.remove("no-scroll")
    }
  }, [isOpen])

  function handleAddUser(user) {
    setSelectedUsers((currentUsers) => {
      if (currentUsers.some((currentUser) => currentUser.id === user.id)) {
        return currentUsers;
      }
      return [...currentUsers, user];
    });
  }

  function handleRemoveUser(user) {
    setSelectedUsers((currentUsers) =>
      currentUsers.filter((currentUser) => currentUser.id !== user.id)
    );
  }

  const handleShareConfig = async (shareOptions) => {
    if (selectedUsers.length === 0) {
      alert("Please select at least one user to share with.")
      return
    }
    setIsSharing(true)

    try {
      const recievers = selectedUsers.map(item=>item.id);
      
      let config = {url:shareOptions.url===true ? url : "", method};

      for(let {k,v} in shareOptions)
      {
        if(v)
          config[k] = request[k]
      }

      // const res = await customFetch(`${import.meta.env.VITE_BACKEND_URL}/api/share/config`, {
      //   method: 'POST',
      //   body: JSON.stringify({recievers, config, message})
      // })
      // const data = await res.json();

      onClose()
    } catch (error) {
      console.error("Failed to share configuration:", error)
      alert("Failed to share configuration.")
    } finally {
      setIsSharing(false)
    }
  }

  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 3) {
      return
    }

    async function searchUsers() {
      try {
        const response = await customFetch(`${import.meta.env.VITE_BACKEND_URL}/api/share/users/search/${searchQuery}`);
        configData = await response.json();
        
        setSearchResults(configData)
      } catch (error) {
        console.error("Failed to search users:", error);
      }
    }

    let debounceTimer;
    function finding() {
      if(searchQuery.length !== 0 && configData.length > 0 && 
        ( configData[0].username.toLowerCase().startsWith(searchQuery) || configData[configData.length - 1].username.toLowerCase().startsWith(searchQuery))) {
        setSearchResults(configData.filter(item=>item.username.toLowerCase().startsWith(searchQuery.toLowerCase())))
      } else {
        debounceTimer = setTimeout(() => {
          searchUsers()
        }, 300)
      }
    }
    finding()

    return () => {
      clearTimeout(debounceTimer)
    }
  }, [searchQuery])

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <motion.div 
        className="modal-surface config-modal-surface" 
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
      >
        <div className="modal-interior-content config-modal-content">

          <div className="config-header-row">
            <div className="config-title-group">
              <Sparkles size={18} className="config-brand-icon" />
              <h3>{isUserSelect ? "Search User" : "Config data"}</h3>
            </div>
            <button 
              className="modal-close-corner-btn" 
              onClick={onClose} 
              title="Close Panel (ESC)"
            >
              <X size={16} />
              <span>ESC</span>
            </button>
          </div>

          {isUserSelect ? (
            <SelectUser searchQuery={searchQuery}
            searchResults={searchResults}
            selectedUsers={selectedUsers}
            handleAddUser={handleAddUser}
            handleRemoveUser={handleRemoveUser}
            handleAddedUsers={()=>setIsUserSelect(false)}
            setSearchQuery={setSearchQuery}/>
          ):(
            <SelectDataToShare setMessage={setMessage} 
            message={message} 
            selectedUsers={selectedUsers}
            handleRemoveUser={handleRemoveUser}
            handleShareConfig={handleShareConfig}
            setIsUserSelect={setIsUserSelect}
            />
          )}

        </div>
      </motion.div>
    </div>
  )
}

export default ConfigSharing