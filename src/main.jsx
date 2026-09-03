import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { RequestProvider } from './context/RequestContext.jsx'
import { LibraryProvider } from './context/LibraryContext.jsx'
import { UserProvider } from './context/UserContext.jsx'
import { ConfigApiProvider } from './context/ConfigureApiContext.jsx'
import { SocketProvider } from './context/SocketContext.jsx'
import { ShareProvider } from './context/ShareContext.jsx'
import { ProxyProvider } from './context/ProxyContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ProxyProvider>
      <RequestProvider>
        <LibraryProvider>
          <UserProvider>
            <SocketProvider>
              <ConfigApiProvider>
                <ShareProvider>
                  <App />
                </ShareProvider>
              </ConfigApiProvider>
            </SocketProvider>
          </UserProvider>
        </LibraryProvider>
      </RequestProvider>
    </ProxyProvider>
  </StrictMode>
)
