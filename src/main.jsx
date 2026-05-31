import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { RequestProvider } from './context/RequestContext.jsx'
import { LibraryProvider } from './context/LibraryContext.jsx'
import { UserProvider } from './context/UserContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RequestProvider>
      <LibraryProvider>
        <UserProvider>
          <App />
        </UserProvider>
      </LibraryProvider>
    </RequestProvider>
  </StrictMode>,
)
