import { createContext, useState } from "react";

export const ConfigApiContext = createContext();

export function ConfigApiProvider({children})
{
    const [configAPI, setConfigAPI] = useState(new Map());

    return (
        <ConfigApiContext.Provider value={{ configAPI, setConfigAPI }}>
            {children}
        </ConfigApiContext.Provider>
    )
}