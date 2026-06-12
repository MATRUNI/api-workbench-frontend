import { useContext, useEffect } from 'react';
import { RequestContext } from '../context/RequestContext';
import '../style/fetchComponent.css';
import API_Library from './API_Library';
import LibraryLoader from './LibraryLoader';
import { LibraryContext } from '../context/LibraryContext';
import { UserContext } from '../context/UserContext';
import { customFetch } from '../services/customFetch';
function FetchComponent() {
  const {APIList,setAPIList, apiListAuthState, setApiListAuthState} = useContext(LibraryContext);
  const {user} = useContext(UserContext)
  const currentAuthState = user ? "logged-in" : "guest";
  
  useEffect(() => {
    if (apiListAuthState === currentAuthState && APIList.length > 0) {
      return;
    }
  
    async function loadingApi() {
      const res = await customFetch(import.meta.env.VITE_BACKEND_URL + "/api",{
          headers:{
            'x-api-key':import.meta.env.VITE_BACKEND_KEY
          }});
      const data = await res.json();
        
      setAPIList(data.data);
      setApiListAuthState(currentAuthState);
    }
  
    loadingApi();
  }, [user]);
  return (
    <div className="fetch-container">
      <header className="fetch-header">
        <h1>API Library</h1>
        <p>Select a pre-configured API to start testing your requests.</p>
      </header>
      {APIList.length!==0
      ?
      <API_Library/>
      :
      <LibraryLoader/>}
    </div>
  );
}

export default FetchComponent;