import React from 'react'
import './landing.css'
import RequestBuilder from './RequestBuilder';
import ResponseViewer from './ResponseViewer';
function Landing() {
  return (
    <main className="workbench-container">
      <RequestBuilder/>
      <ResponseViewer/>
    </main>
  );
};

export default Landing