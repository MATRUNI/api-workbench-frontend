import { Suspense } from 'react'
import NavBar from './NavBar'
import {Outlet} from 'react-router-dom'
import StartBootLoader from './StartBootLoader'
import SystemFooter from './Footer'

function Home() {
  return (
    <>
        <NavBar/>
        <Suspense fallback={<StartBootLoader/>}>
          <Outlet/>
        </Suspense>
        <SystemFooter/>
    </>
  )
}

export default Home