import { Suspense, useContext } from 'react'
import NavBar from './NavBar'
import { Outlet } from 'react-router-dom'
import StartBootLoader from './StartBootLoader'
import SystemFooter from './Footer'
import { ContextMenuContext, ContextMenuProvider } from '../context/ContextMenuProvider'
import { RefreshCw, Copy, SunDim, MoonStar, Maximize, Trash2 } from 'lucide-react'

function HomeContent() {
  const { openContextMenu } = useContext(ContextMenuContext)

  const handle = (e) => {
    e.preventDefault()

    const isLight = document.documentElement.classList.contains('light-theme')

    openContextMenu(e, [
      {
        label: 'Reload Workspace',
        icon: RefreshCw,
        onClick: () => window.location.reload(),
      },
      {
        label: 'Copy Selection',
        icon: Copy,
        onClick: () => {
          const text = window.getSelection().toString()
          if (text) navigator.clipboard.writeText(text)
        },
      },
      { type: 'separator' },
      {
        label: isLight ? 'Switch to Dark Mode' : 'Switch to Light Mode',
        icon: isLight ? MoonStar : SunDim,
        onClick: () => {
          const nextTheme = !isLight
          if (nextTheme) {
            document.documentElement.classList.add('light-theme')
            localStorage.setItem('api_os_theme', 'light')
          } else {
            document.documentElement.classList.remove('light-theme')
            localStorage.setItem('api_os_theme', 'dark')
          }
          window.dispatchEvent(new Event('theme-changed'))
        },
      },
      {
        label: document.fullscreenElement ? 'Exit Fullscreen' : 'Toggle Fullscreen',
        icon: Maximize,
        onClick: () => {
          if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen()
          } else {
            document.exitFullscreen()
          }
        },
      },
    ])
  }

  return (
    <div
      style={{
        minHeight: '100dvh',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
      onContextMenu={handle}
    >
      <NavBar />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Suspense fallback={<StartBootLoader />}>
          <Outlet />
        </Suspense>
      </div>

      <SystemFooter />
    </div>
  )
}

function Home() {
  return (
    <ContextMenuProvider>
      <HomeContent />
    </ContextMenuProvider>
  )
}

export default Home