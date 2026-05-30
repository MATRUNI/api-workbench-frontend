import { createContext, useState } from "react";

export const LibraryContext = createContext();

export function LibraryProvider({ children }) {
  const [APIList, setAPIList] = useState([]);

  return (
    <LibraryContext.Provider value={{ APIList, setAPIList }}>
      {children}
    </LibraryContext.Provider>
  );
}