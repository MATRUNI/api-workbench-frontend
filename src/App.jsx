import { useContext, useEffect, useState } from 'react'
import {createBrowserRouter,RouterProvider} from 'react-router-dom'
import Home from './components/Home'
import Endpoints from './components/Endpoints'
import Docs from './components/Docs'
import Console from './components/Console'
import FetchComponent from './components/FetchComponent'
import HomeHero from './components/HomeHero'
import Auth from './components/Auth'
import { LibraryContext } from './context/LibraryContext'
import { UserContext } from './context/UserContext'
import { me } from './services/AuthCall'
import StartBootLoader from './components/StartBootLoader'
import UserProfileManifest from './components/UserProfileManifest'
import { customFetch } from './services/customFetch'
import ApiDocumentationModal from './components/ApiDocumentationModal'
import CommMatrixShell from './components/socket/CommMatrixShell'

import GlobalNotificationToast from './components/GlobalNotificationToast'
import FloatingSharedIndicator from './components/FloatingSharedIndicator'
import SharedInboxModal from './components/SharedInboxModal'
import { Outlet } from 'react-router-dom';
import { ShareContext } from './context/ShareContext'
const router=new createBrowserRouter([
  {
    element:<AppLayout />,
    children:[
    {
      path:'/',
      element:<Home/>,
      children:[
        {
          path:'',
          element:<HomeHero/>
        },
        {
          path:'/endpoints',
          element:<Endpoints/>
        },
        {
          path:'/docs',
          element:<Docs/>
        },
        {
          path:'/console',
          element:<Console/>
        },
        {
          path:'/fetch',
          element:<FetchComponent/>,
          children: [
            {
              path: 'api/:id',
              element: <ApiDocumentationModal/>
            }
          ]
        },
        {
          path:'/auth',
          element:<Auth/>
        },
        {
          path:'/chat',
          element:<CommMatrixShell/>
        }
      ]
    },
    {
      path:'/profile',
      element:<UserProfileManifest/>
    }
  ]}
])

function AppContent() {
  const {setAPIList} =useContext(LibraryContext)
  const {setUser} = useContext(UserContext)
  const {setSentShares} = useContext(ShareContext)
  const [isBooting, setIsBooting]=useState(true);

  useEffect(()=>{
    async function initAPIs() {
      try 
      {
        await Promise.all([
          (async()=>{
            try 
            {
              const [healthRes, apiRes] = await Promise.all([
                customFetch(import.meta.env.VITE_BACKEND_URL + "/health",{
                  headers:{
                    'x-api-key':import.meta.env.VITE_BACKEND_KEY
                  }
                }),
                customFetch(import.meta.env.VITE_BACKEND_URL + "/api",{
                  headers:{
                    'x-api-key':import.meta.env.VITE_BACKEND_KEY
                  }
                })
              ]);
              if (!healthRes.ok) console.warn("Health check failed");
              const APIobj = await apiRes.json();
      
              setAPIList(APIobj.data);
            } 
            catch (error) 
            {
              console.error("Error initializing APIs:", error);  
            }
          })(),
          (async()=>{
            try 
            {
              const user = await me();
              setUser({username:user.username});
              setSentShares(user.sharedDataId)
            } 
            catch (error) 
            {
              setUser(null);
              setSentShares("")
            }
          })()
        ])
      } 
      catch (globalErr) 
      {
        console.error("Global boot initialization failure:", globalErr);
      }
      finally
      {
        setIsBooting(false)
      }
    }
    initAPIs()
  },[setAPIList,setUser])

  if(isBooting)
    return <StartBootLoader/>
  return <RouterProvider router={router}/>
}
function AppLayout() {
  const [isInboxOpen, setIsInboxOpen] = useState(false);

  return (
    <>
      <Outlet />

      <GlobalNotificationToast />

      <FloatingSharedIndicator
        onOpenInbox={() => setIsInboxOpen(true)}
      />

      <SharedInboxModal
        isOpen={isInboxOpen}
        onClose={() => setIsInboxOpen(false)}
      />
    </>
  );
}

function App() {
  return (
      <AppContent />
  )
}

export default App