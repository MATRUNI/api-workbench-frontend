import { useContext } from 'react';
import { RequestContext } from '../context/RequestContext';
import '../style/fetchComponent.css';
import API_Library from './API_Library';
import LibraryLoader from './LibraryLoader';

function FetchComponent() {
  const {APIList} = useContext(RequestContext);

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