import { createContext, useState } from "react";

export const TabContext = createContext();

export function TabProvider({children})
{
    const initialTabId = Date.now();

    const [tabMap, setTabMap] = useState(
      new Map([
        [
          initialTabId,
          {
            url: "http://localhost:3000",
            method: "GET",
            alias:"",
            request: {
              body: {
                key: "value",
                data: "input your JSON here"
              },
              contentType: "application/json",
              headers: [],
              query: []
            },
            response: {
              status: 200,
              results: [],
              message: "Ready to fetch data",
              time: 100,
              category: ""
            }
          }
        ]
      ])
    );
    const [activeTab, setActiveTab] = useState(initialTabId || null);
    return (
        <TabContext.Provider value={{tabMap,setTabMap,activeTab,setActiveTab}}>
            {children}
        </TabContext.Provider>
    )
}