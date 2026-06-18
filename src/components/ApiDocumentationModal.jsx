import React, { useContext, useEffect } from 'react'; // Added useEffect
import { useParams, useNavigate } from 'react-router-dom';
import { LibraryContext } from '../context/LibraryContext';
import ApiDocumentation from './ApiDocumentation';
import { X } from 'lucide-react';
import '../style/ApiDocumentationModal.css';

export default function ApiDocumentationModal() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { APIList } = useContext(LibraryContext);

  const targetApi = APIList?.find((api) => api._id === id);

  const handleClose = () => {
    navigate('/fetch');
  };

  useEffect(() => {
    document.body.classList.add('no-scroll');

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
          
          <ApiDocumentation onClose={handleClose} />
        </div>
      </div>
    </div>
  );
}