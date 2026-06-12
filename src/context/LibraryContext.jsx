import { createContext, useState } from "react";

export const LibraryContext = createContext();

export function LibraryProvider({ children }) {
  const [APIList, setAPIList] = useState([]);
  const [apiListAuthState, setApiListAuthState] = useState(null);

  return (
    <LibraryContext.Provider value={{ APIList, setAPIList, apiListAuthState, setApiListAuthState }}>
      {children}
    </LibraryContext.Provider>
  );
}