import { useContext, useRef } from "react";
import { Group, Separator } from "react-resizable-panels";

import "../style/Endpoints.css";
import RequestBuilder from "./RequestBuilder";
import ResponseViewer from "./ResponseViewer";
import { GripHorizontal, GripVertical } from "lucide-react";
import { MobileContext } from "../context/MobileContext";

function Endpoints() {
  const responseRef = useRef(null);
  const {isMobile} = useContext(MobileContext);
  
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