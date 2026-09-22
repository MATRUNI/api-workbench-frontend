import { Suspense, useContext, useCallback, useEffect } from 'react'
import NavBar from './NavBar'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import StartBootLoader from './StartBootLoader'
import SystemFooter from './Footer'
import { ContextMenuContext, ContextMenuProvider } from '../context/ContextMenuProvider'
import {
  RefreshCw,
  Copy,
  SunDim,
  MoonStar,
  Maximize,
  Minimize,
  Trash2,
  Compass,
  Zap,
  Terminal,
  Book,
  Database,
  Search,
  Link2,
  Menu,
  MessageSquare,
} from 'lucide-react'

function HomeContent() {
  const { openContextMenu, closeContextMenu, isOpen, anchor, copyToClipboard } = useContext(ContextMenuContext)
  const navigate = useNavigate()
  const location = useLocation()

  // Dynamically calculate distance from viewport bottom to top of footer
  // so the floating workspace menu button and open menu stay cleanly floating above footer
  useEffect(() => {
    let rafId = null

    const updateFooterOffset = () => {
      if (rafId) cancelAnimationFrame(rafId)
      rafId = requestAnimationFrame(() => {
        const footer = document.querySelector('.prism-footer-shell')
        const isMobileScreen = window.innerWidth <= 1220
        const baseOffset = isMobileScreen ? 80 : 24
        let offset = baseOffset
        const windowHeight = window.innerHeight

        if (footer) {
          const rect = footer.getBoundingClientRect()
          if (rect.top < windowHeight && rect.bottom > 0) {
            const visibleFooterHeight = Math.max(0, windowHeight - rect.top)
            offset = baseOffset + visibleFooterHeight
          }
        }

        document.documentElement.style.setProperty('--workspace-btn-bottom', `${offset}px`)
      })
    }

    updateFooterOffset()

    window.addEventListener('scroll', updateFooterOffset, { passive: true })
    window.addEventListener('resize', updateFooterOffset, { passive: true })

    let resizeObserver = null
    if (window.ResizeObserver) {
      resizeObserver = new ResizeObserver(updateFooterOffset)
      const footer = document.querySelector('.prism-footer-shell')
      if (footer) resizeObserver.observe(footer)
      if (document.body) resizeObserver.observe(document.body)
    }

    return () => {
      if (rafId) cancelAnimationFrame(rafId)
      window.removeEventListener('scroll', updateFooterOffset)
      window.removeEventListener('resize', updateFooterOffset)
      if (resizeObserver) resizeObserver.disconnect()
    }
  }, [location.pathname])

  const handle = useCallback((e, opts = {}) => {
    if (e?.preventDefault) e.preventDefault()
    if (e?.stopPropagation) e.stopPropagation()

    const isFromTriggerBtn =
      e?.currentTarget?.id === 'workspace-context-btn' ||
      e?.target?.closest?.('#workspace-context-btn')

    // Toggle close if already open and clicked on the trigger button
    if (isOpen && (isFromTriggerBtn || opts?.toggle)) {
      closeContextMenu()
      return
    }

    const isLight = document.documentElement.classList.contains('light-theme')
    const isFullscreen = Boolean(document.fullscreenElement)
    const selectedText = window.getSelection()?.toString().trim() || ''
    const isBottomRight = isFromTriggerBtn || opts?.anchor === 'bottom-right'

    openContextMenu(e, [
      { type: 'header', label: 'Clipboard' },
      {
        label: selectedText
          ? `Copy "${selectedText.length > 15 ? selectedText.slice(0, 15) + '…' : selectedText}"`
          : 'Copy Selection',
        icon: Copy,
        shortcut: 'Ctrl+C',
        disabled: !selectedText,
        onClick: () => {
          if (selectedText) copyToClipboard(selectedText, 'Copied Selection!')
        },
      },
      {
        label: 'Copy Page URL',
        icon: Link2,
        onClick: () => copyToClipboard(window.location.href, 'Copied Page URL!'),
      },
      { type: 'separator' },
      { type: 'header', label: 'Navigation' },
      {
        label: 'Navigate to...',
        icon: Compass,
        submenu: [
          { type: 'header', label: 'Workspaces' },
          {
            label: 'Endpoints Workbench',
            icon: Zap,
            onClick: () => navigate('/endpoints'),
          },
          {
            label: 'Network Console',
            icon: Terminal,
            onClick: () => navigate('/console'),
          },
          {
            label: 'Communication Matrix',
            icon: MessageSquare,
            onClick: () => navigate('/chat'),
          },
          { type: 'separator' },
          { type: 'header', label: 'Resources' },
          {
            label: 'API Documentation',
            icon: Book,
            onClick: () => navigate('/docs'),
          },
          {
            label: 'Public APIs Directory',
            icon: Database,
            onClick: () => navigate('/fetch'),
          },
        ],
      },
      {
        label: 'Search Docs & Actions',
        icon: Search,
        shortcut: 'Ctrl+K',
        onClick: () => {
          window.dispatchEvent(
            new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true })
          )
        },
      },
      { type: 'separator' },
      { type: 'header', label: 'Preferences' },
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
        label: isFullscreen ? 'Exit Fullscreen' : 'Toggle Fullscreen',
        icon: isFullscreen ? Minimize : Maximize,
        shortcut: 'F11',
        onClick: () => {
          if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(() => {})
          } else {
            document.exitFullscreen().catch(() => {})
          }
        },
      },
      {
        label: 'Reload Workspace',
        icon: RefreshCw,
        shortcut: 'Ctrl+R',
        onClick: () => window.location.reload(),
      },
      { type: 'separator' },
      { type: 'header', label: 'System' },
      {
        label: 'Reset Workspace Cache',
        icon: Trash2,
        danger: true,
        onClick: () => {
          if (
            window.confirm(
              'Are you sure you want to reset workspace cache? This will clear local preferences and reload.'
            )
          ) {
            localStorage.clear()
            window.location.reload()
          }
        },
      },
    ], { anchor: isBottomRight ? 'bottom-right' : null })
  }, [isOpen, closeContextMenu, openContextMenu, navigate, copyToClipboard])

  // Direct keyboard shortcut listener to open context menu:
  // - Alt + M (Universal, works on all laptops)
  // - Shift + F10 (OS standard)
  // - ContextMenu key (Physical menu key on keyboards)
  // - Ctrl + . or Cmd + . (VS Code / IDE standard quick actions)
  useEffect(() => {
    let suppressNextContextMenu = false

    const handleKeyDown = (e) => {
      const tag = document.activeElement?.tagName?.toLowerCase()
      const isInput = tag === 'input' || tag === 'textarea' || document.activeElement?.isContentEditable
      if (isInput) return

      const isAltM = e.altKey && (e.key.toLowerCase() === 'm' || e.code === 'KeyM')
      const isShiftF10 = e.shiftKey && (e.key === 'F10' || e.code === 'F10')
      const isContextMenuKey = e.key === 'ContextMenu' || e.code === 'ContextMenu'
      const isCtrlDot = (e.ctrlKey || e.metaKey) && (e.key === '.' || e.code === 'Period')
      const isAltBackslash = e.altKey && (e.key === '\\' || e.code === 'Backslash')

      if (isAltM || isShiftF10 || isContextMenuKey || isCtrlDot || isAltBackslash) {
        e.preventDefault()
        e.stopPropagation()
        if (isContextMenuKey || isShiftF10) {
          suppressNextContextMenu = true
          setTimeout(() => {
            suppressNextContextMenu = false
          }, 200)
        }
        handle(e, { anchor: 'bottom-right', toggle: true })
      }
    }

    // Suppress native browser context menu ONLY when triggered by the keyboard key
    const handleContextMenu = (e) => {
      if (suppressNextContextMenu) {
        suppressNextContextMenu = false
        e.preventDefault()
        e.stopPropagation()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('contextmenu', handleContextMenu, true)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('contextmenu', handleContextMenu, true)
    }
  }, [handle])

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

      {/* Floating Workspace Menu Button (Accessible by Mouse Click or Keyboard Tab + Enter) */}
      <button
        type="button"
        id="workspace-context-btn"
        className={`workspace-context-trigger-btn ${isOpen && anchor === 'bottom-right' ? 'active' : ''}`}
        onClick={(e) => handle(e, { anchor: 'bottom-right', toggle: true })}
        onContextMenu={(e) => handle(e, { anchor: 'bottom-right', toggle: true })}
        title="Workspace Menu (Press Alt+M or Ctrl+.)"
        aria-label="Open Workspace Context Menu"
        aria-expanded={isOpen && anchor === 'bottom-right'}
      >
        <Menu size={14} />
        <span className="btn-label">Menu</span>
        <kbd className="btn-kbd">Alt+M</kbd>
      </button>
    </div>
  )
}

function Home() {
  return <HomeContent />
}

export default Home