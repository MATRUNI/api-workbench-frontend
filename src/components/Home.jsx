import React from 'react'
import NavBar from './NavBar'
import {Outlet} from 'react-router-dom'
import { RequestProvider } from '../context/RequestContext'

function Home() {
  return (
    <RequestProvider>
    <div>
        <NavBar/>
        <Outlet/>
    </div>
    </RequestProvider>
  )
}

export default Home