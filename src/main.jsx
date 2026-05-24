import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { RequestProvider } from './context/RequestContext.jsx'

createRoot(document.getElementById('root')).render(
  <RequestProvider>
  <StrictMode>
    <App />
  </StrictMode>,
  </RequestProvider>
)
