import { useContext, useEffect, useState, useCallback } from 'react';
import { RequestContext } from '../context/RequestContext';
import '../style/fetchComponent.css';
import API_Library from './API_Library';
import LibraryLoader from './LibraryLoader';
import { LibraryContext } from '../context/LibraryContext';
import { UserContext } from '../context/UserContext';
import { TabContext } from '../context/TabContext';
import { ContextMenuContext } from '../context/ContextMenuContext';
import { customFetch } from '../services/customFetch';
import { Outlet, useNavigate } from 'react-router-dom';
import { RefreshCw, ExternalLink, PlusSquare, Copy, Layers } from 'lucide-react';

function FetchComponent() {
  const { APIList, setAPIList, apiListAuthState, setApiListAuthState } = useContext(LibraryContext);
  const { user } = useContext(UserContext);
  const { handleAddTab } = useContext(TabContext) || {};
  const { openContextMenu, copyToClipboard } = useContext(ContextMenuContext);
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const currentAuthState = user ? "logged-in" : "guest";
  
  const loadingApi = useCallback(async (force = false) => {
    setIsLoading(true);
    try {
      const res = await customFetch(import.meta.env.VITE_BACKEND_URL + "/api", {
        headers: {
          'x-api-key': import.meta.env.VITE_BACKEND_KEY
        }
      });
      const data = await res.json();
        
      setAPIList(data.data);
      setApiListAuthState(currentAuthState);
    } catch (error) {
      console.error("Failed to load API list:", error);
    } finally {
      setIsLoading(false);
    }
  }, [currentAuthState, setAPIList, setApiListAuthState]);

  useEffect(() => {
    if (apiListAuthState === currentAuthState && APIList.length > 0) {
      setIsLoading(false);
      return;
    }
    loadingApi();
  }, [user, apiListAuthState, currentAuthState, APIList.length, loadingApi]);

  const handleBackgroundContextMenu = useCallback((e) => {
    // Prevent if right-clicking an API card (cards have their own menu)
    if (e.target.closest('.api-card')) return;

    e.preventDefault();
    openContextMenu(e, [
      { type: "header", label: "API Library" },
      {
        label: "Refresh Library",
        icon: RefreshCw,
        shortcut: "Alt+R",
        onClick: () => loadingApi(true)
      },
      {
        label: "Open Workbench",
        icon: ExternalLink,
        shortcut: "Alt+E",
        onClick: () => navigate('/endpoints')
      },
      {
        label: "New Workbench Tab",
        icon: PlusSquare,
        shortcut: "Alt+T",
        onClick: () => {
          if (handleAddTab) handleAddTab();
          navigate('/endpoints');
        }
      },
      { type: "separator" },
      {
        label: "Copy Library URL",
        icon: Copy,
        onClick: () => copyToClipboard(window.location.href, "Copied Library URL!")
      },
      ...(APIList?.length ? [
        { type: "separator" },
        {
          label: `${APIList.length} APIs available`,
          icon: Layers,
          disabled: true
        }
      ] : [])
    ]);
  }, [openContextMenu, loadingApi, navigate, handleAddTab, copyToClipboard, APIList]);

  return (
    <div className="fetch-container" onContextMenu={handleBackgroundContextMenu}>
      <header className="fetch-header">
        <h1>API Library</h1>
        <p>Select a pre-configured API to start testing your requests.</p>
      </header>
      {isLoading ? (
        <LibraryLoader />
      ) : (
        <API_Library onRefresh={() => loadingApi(true)} />
      )}
      <Outlet />
    </div>
  );
}

export default FetchComponent;