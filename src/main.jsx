import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { RequestProvider } from './context/RequestContext.jsx'
import { LibraryProvider } from './context/LibraryContext.jsx'
import { UserProvider } from './context/UserContext.jsx'
import { ConfigApiProvider } from './context/ConfigureApiContext.jsx'
import { SocketProvider } from './context/SocketContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RequestProvider>
      <LibraryProvider>
        <UserProvider>
          <SocketProvider>
            <ConfigApiProvider>
              <App />
            </ConfigApiProvider>
          </SocketProvider>
        </UserProvider>
      </LibraryProvider>
    </RequestProvider>
  </StrictMode>
)
