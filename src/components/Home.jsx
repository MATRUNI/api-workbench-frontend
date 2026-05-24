import React from 'react'
import NavBar from './NavBar'
import {Outlet} from 'react-router-dom'

function Home() {
  return (
    <>
        <NavBar/>
        <Outlet/>
    </>
  )
}

export default Home