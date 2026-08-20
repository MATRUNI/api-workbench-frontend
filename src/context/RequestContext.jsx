import { createContext, useState } from "react";

export const RequestContext=createContext()

export function RequestProvider({children})
{
    const contentTypeTemplates = {
      "application/json": "{\n  \"key\": \"value\",\n  \"data\": \"input your JSON here\"\n}",

      "text/html": "<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n  <title>API Payload</title>\n</head>\n<body>\n  <h1>Input your HTML markup here</h1>\n</body>\n</html>",

      "application/xml": "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<request>\n  <key>value</key>\n  <data>input your XML template here</data>\n</request>",

      "text/plain": "Input your raw plain text data here.\nLine breaks and spaces are preserved exactly as typed."
    };
    const [request,setRequest]=useState({
        body:{
              "key": "value",
              "data": "input your JSON here"
            },
        contentType: "application/json",
        header:[],
        query:[]
    });
    const [response,setResponse]=useState({
              "status": 200,
              "results": [],
              "message": "Ready to fetch data",
              "time":100
            })
    const [url,setURL]=useState('http://localhost:3000')
    const [isLoading,setIsLoading]=useState(false);
    const [requestPhase, setRequestPhase] = useState("")
    const [method,setMethod]=useState("GET")
    return (
        <RequestContext.Provider value={{contentTypeTemplates ,request,setRequest,url,setURL,response,setResponse,isLoading,setIsLoading,requestPhase,setRequestPhase,method,setMethod}}>
            {children}
        </RequestContext.Provider>
    )
}