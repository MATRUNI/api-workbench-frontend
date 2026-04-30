import { createContext, useState } from "react";

export const RequestContext=createContext()

export function RequestProvider({children})
{
    const [request,setRequest]=useState({
        body:{
              "key": "value",
              "data": "input your JSON here"
            },
        header:[],
        query:[]
    });
    const [url,setURL]=useState('http://localhost:3000')
    return (
        <RequestContext.Provider value={{request,setRequest,url,setURL}}>
            {children}
        </RequestContext.Provider>
    )
}