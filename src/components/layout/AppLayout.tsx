import { useEffect, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { Avatar } from '../ui/Misc'
import { spring } from '../ui/motion'

export function AppLayout({ children }: { children: React.ReactNode }) {
  const app = useApp()
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024)

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  if (isMobile) {
    return (
      <div className="flex flex-col h-dvh bg-[var(--bg)]">
        {/* Mobile Header */}
        <motion.div
          initial={{ y: -60 }}
          animate={{ y: 0 }}
          transition={spring.std}
          className="sticky top-0 z-40 flex items-center justify-between px-6 py-4 bg-[var(--card)] border-b border-[var(--card2)]"
        >
          <h1 className="text-[24px] font-semibold font-display text-[var(--primary)]">Tabs</h1>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-[var(--card2)] text-[var(--secondary)]"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </motion.div>

        {/* Mobile Menu Overlay */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/20 z-30"
                onClick={() => setMobileMenuOpen(false)}
              />
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={spring.std}
                className="absolute top-[68px] left-0 w-64 bg-[var(--card)] z-40 shadow-lg"
              >
                <nav className="flex flex-col p-4 gap-2">
                  <NavLink
                    to="/"
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `px-4 py-3 rounded-btn font-medium transition-colors ${
                        isActive ? 'bg-[var(--primary)] text-[var(--on-primary)]' : 'text-[var(--primary)]'
                      }`
                    }
                  >
                    My Tables
                  </NavLink>
                  <NavLink
                    to="/analytics"
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `px-4 py-3 rounded-btn font-medium transition-colors ${
                        isActive ? 'bg-[var(--primary)] text-[var(--on-primary)]' : 'text-[var(--primary)]'
                      }`
                    }
                  >
                    Analytics
                  </NavLink>
                  <NavLink
                    to="/settings"
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `px-4 py-3 rounded-btn font-medium transition-colors ${
                        isActive ? 'bg-[var(--primary)] text-[var(--on-primary)]' : 'text-[var(--primary)]'
                      }`
                    }
                  >
                    Settings
                  </NavLink>
                </nav>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Mobile Content Area */}
        <div className="flex-1 overflow-y-auto no-scrollbar">{children}</div>
      </div>
    )
  }

  return (
    <div className="flex h-dvh bg-[var(--bg)]">
      {/* Desktop Sidebar */}
      <motion.aside
        initial={{ x: -240 }}
        animate={{ x: 0 }}
        transition={spring.std}
        className="w-60 fixed left-0 top-0 h-dvh bg-[var(--card)] border-r border-[var(--card2)] flex flex-col z-30"
      >
        {/* Logo */}
        <div className="px-6 py-6 border-b border-[var(--card2)]">
          <h1 className="text-[28px] font-bold font-display text-[var(--primary)]">Tabs</h1>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-6 flex flex-col gap-2">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `px-4 py-3 rounded-btn font-medium transition-colors ${
                isActive ? 'bg-[var(--primary)] text-[var(--on-primary)]' : 'text-[var(--primary)] hover:bg-[var(--card2)]'
              }`
            }
          >
            My Tables
          </NavLink>
          <NavLink
            to="/analytics"
            className={({ isActive }) =>
              `px-4 py-3 rounded-btn font-medium transition-colors ${
                isActive ? 'bg-[var(--primary)] text-[var(--on-primary)]' : 'text-[var(--primary)] hover:bg-[var(--card2)]'
              }`
            }
          >
            Analytics
          </NavLink>
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `px-4 py-3 rounded-btn font-medium transition-colors ${
                isActive ? 'bg-[var(--primary)] text-[var(--on-primary)]' : 'text-[var(--primary)] hover:bg-[var(--card2)]'
              }`
            }
          >
            Settings
          </NavLink>
        </nav>

        {/* User Footer */}
        <div className="px-3 py-6 border-t border-[var(--card2)]">
          <motion.button
            whileTap={{ scale: 0.97 }}
            transition={spring.snap}
            onClick={() => navigate('/settings')}
            className="w-full flex items-center gap-3 p-3 rounded-btn hover:bg-[var(--card2)] transition-colors"
          >
            <Avatar name={app.currentUser?.name ?? 'U'} size={36} />
            <div className="flex-1 min-w-0 text-left">
              <p className="text-[13px] font-semibold text-[var(--primary)] truncate">{app.currentUser?.name}</p>
              <p className="text-[11px] text-[var(--secondary)] truncate">{app.currentUser?.email}</p>
            </div>
          </motion.button>
        </div>
      </motion.aside>

      {/* Desktop Content Area */}
      <div className="flex-1 ml-60 overflow-y-auto no-scrollbar">{children}</div>
    </div>
  )
}
