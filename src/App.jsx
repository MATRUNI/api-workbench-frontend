import React from 'react'
import {createBrowserRouter,RouterProvider} from 'react-router-dom'
import Home from './components/Home'
import Landing from './components/Landing'
import Docs from './components/Docs'
import Console from './components/Console'
import FetchComponent from './components/FetchComponent'

const router=new createBrowserRouter([
  {
    path:'/',
    element:<Home/>,
    children:[
      {
        path:'',
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
    ]
  }
])

function App() {
  return <RouterProvider router={router}/>
}

export default App