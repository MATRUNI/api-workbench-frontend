import React, { useContext, useEffect, useState } from 'react'; // Added useEffect
import { useParams, useNavigate } from 'react-router-dom';
import { LibraryContext } from '../context/LibraryContext';
import ApiDocumentation from './ApiDocumentation';
import { X } from 'lucide-react';
import '../style/ApiDocumentationModal.css';
import callConfigAPI from '../services/callConfig';

export default function ApiDocumentationModal() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { APIList } = useContext(LibraryContext);
  const [ configData, setConfigData ] = useState(null)
  const targetApi = APIList?.find((api) => api._id === id);

  const handleClose = () => {
    navigate('/fetch');
  };

  useEffect(() => {
    document.body.classList.add('no-scroll');
    async function getAPIConfig() 
    {
        setConfigData(await callConfigAPI(id))
    }
    getAPIConfig()
    return () => {
      document.body.classList.remove('no-scroll');
    };
  }, []);

  if (!targetApi) return null;

  return (
    <div className="modal-backdrop" onClick={handleClose}>
      <div className="modal-surface" onClick={(e) => e.stopPropagation()}>
        <div className="modal-interior-content">
          <button 
            className="modal-close-corner-btn" 
            onClick={handleClose} 
            title="Close Panel (ESC)"
          >
            <X size={16} />
            <span>ESC</span>
          </button>
          
          <ApiDocumentation apiConfig={configData} onClose={handleClose} />
        </div>
      </div>
    </div>
  );
}