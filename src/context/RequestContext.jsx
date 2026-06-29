import { createContext, useState } from "react";

export const RequestContext=createContext()

export function RequestProvider({children})
{
    const contentTypeTemplates = {
      "application/json": `{
      "key": "value",
      "data": "input your JSON here"
    }`,

      "text/html": `<!DOCTYPE html>
    <html lang="en">
    <head>
        <title>API Payload</title>
    </head>
    <body>
        <h1>Input your HTML markup here</h1>
    </body>
    </html>`,

      "application/xml": `<?xml version="1.0" encoding="UTF-8"?>
    <request>
        <key>value</key>
        <data>input your XML template here</data>
    </request>`,

      "text/plain": `Input your raw plain text data here.
    Line breaks and spaces are preserved exactly as typed.`
    };
    const [request,setRequest]=useState({
        body:{
              "key": "value",
              "data": "input your JSON here"
            },
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