import { Suspense } from 'react'
import NavBar from './NavBar'
import {Outlet} from 'react-router-dom'
import StartBootLoader from './StartBootLoader'

function Home() {
  return (
    <>
        <NavBar/>
        <Suspense fallback={<StartBootLoader/>}>
          <Outlet/>
        </Suspense>
    </>
  )
}

export default Home