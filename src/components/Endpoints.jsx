import { useEffect, useRef, useState } from "react";
import { Group, Separator } from "react-resizable-panels";

import "../style/Endpoints.css";
import RequestBuilder from "./RequestBuilder";
import ResponseViewer from "./ResponseViewer";
import { GripHorizontal, GripVertical } from "lucide-react";

function Endpoints() {
  const responseRef = useRef(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.matchMedia("(max-width: 1220px)").matches);
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);
  
  const scrollToResponse = () => {
    if (isMobile) {
      responseRef.current?.scrollIntoView({
        behavior: "smooth",
        block:"start"
      });
    }
  };

  return (
    <Group orientation={isMobile ? "vertical" : "horizontal"} className="workbench-container">
      <RequestBuilder scrollToResponse={scrollToResponse} />
      <Separator className="separator">
        {isMobile?
        <GripHorizontal size={18}/>
        :<GripVertical size={18}/>
        }
      </Separator>
      <ResponseViewer ref={responseRef} />
    </Group>
  );
}

export default Endpoints;