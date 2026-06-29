import React, { useRef } from "react";
import "../style/Endpoints.css";
import RequestBuilder from "./RequestBuilder";
import ResponseViewer from "./ResponseViewer";

function Endpoints() {
  const responseRef = useRef(null);

  const scrollToResponse = () => {
    if (window.matchMedia("(max-width: 1228px)").matches) {
      responseRef.current?.scrollIntoView({
        behavior: "smooth",
        block:"center"
      });
    }
  };

  return (
    <main className="workbench-container">
      <RequestBuilder scrollToResponse={scrollToResponse} />
      <ResponseViewer ref={responseRef} />
    </main>
  );
}

export default Endpoints;