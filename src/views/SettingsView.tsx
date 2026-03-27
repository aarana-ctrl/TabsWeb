import { useState } from 'react'
import { motion } from 'framer-motion'
import { LogOut } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Avatar } from '../components/ui/Misc'
import { Toggle } from '../components/ui/Toggle'
import { Modal } from '../components/ui/Modal'
import { spring, fadeUp } from '../components/ui/motion'

export default function SettingsView() {
  const app = useApp()
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false)

  const handleSignOut = () => {
    setShowSignOutConfirm(false)
    app.signOut()
  }

  return (
    <div className="pb-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={spring.std}
        className="sticky top-0 z-20 bg-[var(--bg)] border-b border-[var(--card2)] px-6 py-4"
      >
        <h1 className="text-[24px] font-semibold font-display text-[var(--primary)]">Settings</h1>
      </motion.div>

      <div className="px-6 pt-6 space-y-6">
        {/* Profile Card */}
        <motion.div
          initial={fadeUp.initial}
          animate={fadeUp.animate}
          transition={spring.std}
        >
          <Card className="flex flex-col items-center gap-4 py-8">
            <Avatar name={app.currentUser?.name ?? 'U'} size={80} />
            <div className="text-center">
              <h2 className="text-[18px] font-semibold text-[var(--primary)]">{app.currentUser?.name}</h2>
              <p className="text-[13px] text-[var(--secondary)]">{app.currentUser?.email}</p>
            </div>
          </Card>
        </motion.div>

        {/* Appearance Section */}
        <motion.div
          initial={fadeUp.initial}
          animate={fadeUp.animate}
          transition={{ ...spring.std, delay: 0.1 }}
        >
          <p className="text-[11px] font-semibold text-[var(--secondary)] tracking-widest uppercase mb-2 px-1">
            Appearance
          </p>
          <Card className="flex items-center justify-between">
            <label className="flex items-center justify-between flex-1">
              <span className="text-[15px] font-medium text-[var(--primary)]">Dark Mode</span>
            </label>
            <Toggle
              checked={app.isDarkMode}
              onChange={v => app.setDarkMode(v)}
            />
          </Card>
        </motion.div>

        {/* Sign Out Button */}
        <motion.div
          initial={fadeUp.initial}
          animate={fadeUp.animate}
          transition={{ ...spring.std, delay: 0.2 }}
        >
          <Button
            fullWidth
            variant="danger"
            onClick={() => setShowSignOutConfirm(true)}
          >
            <LogOut size={18} />
            Sign Out
          </Button>
        </motion.div>
      </div>

      {/* Sign Out Confirmation Modal */}
      <Modal
        isOpen={showSignOutConfirm}
        onClose={() => setShowSignOutConfirm(false)}
        title="Sign Out"
      >
        <div className="space-y-4 py-4">
          <p className="text-[14px] text-[var(--secondary)]">
            Are you sure you want to sign out?
          </p>
          <div className="flex gap-3 pt-4">
            <Button
              fullWidth
              variant="secondary"
              onClick={() => setShowSignOutConfirm(false)}
            >
              Cancel
            </Button>
            <Button
              fullWidth
              variant="danger"
              onClick={handleSignOut}
            >
              Sign Out
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
