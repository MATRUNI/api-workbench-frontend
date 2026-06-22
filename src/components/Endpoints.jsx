import React from 'react'
import '../style/Endpoints.css'
import RequestBuilder from './RequestBuilder';
import ResponseViewer from './ResponseViewer';
function Endpoints() {
  return (
    <main className="workbench-container">
      <RequestBuilder/>
      <ResponseViewer/>
    </main>
  );
};

export default Endpoints