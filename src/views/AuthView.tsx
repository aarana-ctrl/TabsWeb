import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useApp } from '../context/AppContext'
import { Button } from '../components/ui/Button'
import { spring } from '../components/ui/motion'

export default function AuthView() {
  const app = useApp()
  const [isLoading, setIsLoading] = useState(false)

  const handleGoogleSignIn = async () => {
    setIsLoading(true)
    await app.signInWithGoogle()
    setIsLoading(false)
  }

  const handleAppleSignIn = async () => {
    setIsLoading(true)
    await app.signInWithApple()
    setIsLoading(false)
  }

  useEffect(() => {
    app.clearError()
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="min-h-dvh flex items-center justify-center px-6 bg-[var(--bg)]"
    >
      <div className="w-full max-w-sm space-y-8 text-center">
        {/* Logo & Title */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ ...spring.std, delay: 0.1 }}
          className="flex flex-col items-center space-y-4"
        >
          <img
            src="/logo.png"
            alt="Tabs logo"
            className="w-24 h-24 rounded-[22px] shadow-xl"
          />
          <div className="space-y-1">
            <h1 className="text-[48px] font-bold font-display text-[var(--primary)]">Tabs</h1>
            <p className="text-[18px] text-[var(--secondary)]">Your poker tracker</p>
          </div>
        </motion.div>

        {/* Sign-in Buttons */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ ...spring.std, delay: 0.2 }}
          className="space-y-3 pt-8"
        >
          {/* Google Sign In */}
          <Button
            fullWidth
            onClick={handleGoogleSignIn}
            loading={isLoading}
            color="bg-white text-black hover:bg-gray-50"
            className="justify-center gap-2 shadow-md"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Sign in with Google
          </Button>

          {/* Apple Sign In */}
          <Button
            fullWidth
            onClick={handleAppleSignIn}
            loading={isLoading}
            color="bg-black text-white hover:bg-gray-900"
            className="justify-center gap-2"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.05 13.5c-.91 2.92.37 5.65 2.75 7.07.47.29.99.53 1.55.7-.31.01-.62.02-.93.02-2.68 0-5.22-.97-7.2-2.72-.92-.83-1.66-1.88-2.17-3.07-.5-1.19-.77-2.47-.77-3.8 0-5.52 4.48-10 10-10 .74 0 1.47.08 2.18.23-1.48 1.62-2.43 3.8-2.41 6.21v4.36z" />
              <path d="M12.5 2c-5.79 0-10.5 4.71-10.5 10.5S6.71 23 12.5 23c5.79 0 10.5-4.71 10.5-10.5S18.29 2 12.5 2zm0 19c-4.69 0-8.5-3.81-8.5-8.5S7.81 4 12.5 4 21 7.81 21 12.5 17.19 21 12.5 21z" />
            </svg>
            Sign in with Apple
          </Button>
        </motion.div>

        {/* Error Message */}
        {app.authError && (
          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="p-3 rounded-btn bg-tabs-red/10 text-tabs-red text-[13px] font-medium"
          >
            {app.authError}
          </motion.div>
        )}

        {/* Footer Text */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-[12px] text-[var(--secondary)]"
        >
          Sign in to track your poker sessions across devices
        </motion.p>
      </div>
    </motion.div>
  )
}
