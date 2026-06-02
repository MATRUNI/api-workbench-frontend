import React, { useContext, useEffect } from 'react'
import {createBrowserRouter,RouterProvider} from 'react-router-dom'
import Home from './components/Home'
import Landing from './components/Landing'
import Docs from './components/Docs'
import Console from './components/Console'
import FetchComponent from './components/FetchComponent'
import HomeHero from './components/HomeHero'
import Auth from './components/Auth'
import { LibraryContext } from './context/LibraryContext'
import { UserContext } from './context/UserContext'
import { me } from './services/AuthCall'

const router=new createBrowserRouter([
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
        element:<Landing/>
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
        element:<FetchComponent/>
      },
      {
        path:'/auth',
        element:<Auth/>
      },
    ]
  }
])

function App() {
  const {setAPIList} =useContext(LibraryContext)
  const {setUser} = useContext(UserContext)
  useEffect(()=>{
    async function initAPIs() {
      try 
      {
        const [healthRes, userData, apiRes] = await Promise.all([
          fetch(import.meta.env.VITE_BACKEND_URL + "/health"),
          me(),
          fetch(import.meta.env.VITE_BACKEND_URL + "/api")
        ]);
        if (!healthRes.ok) console.warn("Health check failed");
        const APIobj = await apiRes.json();

        setUser(userData);
        setAPIList(APIobj.data);
      } 
      catch (error) 
      {
        console.error("Error initializing APIs:", error);  
      }
    }
    initAPIs()
  },[])
  return <RouterProvider router={router}/>
}

export default App