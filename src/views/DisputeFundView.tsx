import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { Modal } from '../components/ui/Modal'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { SectionLabel, Divider } from '../components/ui/Misc'
import { spring, fadeUp } from '../components/ui/motion'
import { formatCurrency } from '../types/models'

interface DisputeFundViewProps {
  isOpen: boolean
  onClose: () => void
}

export default function DisputeFundView({ isOpen, onClose }: DisputeFundViewProps) {
  const app = useApp()
  const [showSplitConfirm, setShowSplitConfirm] = useState(false)
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [splitting, setSplitting] = useState(false)
  const [clearing, setClearing] = useState(false)
  const [splitSuccess, setSplitSuccess] = useState(false)
  const [clearSuccess, setClearSuccess] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setSplitSuccess(false)
      setClearSuccess(false)
    }
  }, [isOpen])

  const handleSplitEvenly = async () => {
    if (!app.selectedTable) return
    setSplitting(true)
    const success = await app.settleDisputeSplit(app.selectedTable)
    setSplitting(false)
    if (success) {
      setSplitSuccess(true)
      setTimeout(() => {
        onClose()
      }, 1500)
    }
  }

  const handleClearFund = async () => {
    if (!app.selectedTable) return
    setClearing(true)
    const success = await app.resetDisputeFund(app.selectedTable.id)
    setClearing(false)
    if (success) {
      setClearSuccess(true)
      setTimeout(() => {
        onClose()
      }, 1500)
    }
  }

  if (!app.selectedTable) return null

  const perPlayerShare = app.selectedTable.disputedAmount / Math.max(1, app.players.length)

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Dispute Fund">
      <div className="space-y-6 py-4">
        <AnimatePresence mode="wait">
          {!splitSuccess && !clearSuccess ? (
            <motion.div
              key="fund"
              initial={fadeUp.initial}
              animate={fadeUp.animate}
              exit={fadeUp.exit}
              transition={spring.std}
              className="space-y-6"
            >
              {/* Total Amount */}
              <motion.div
                initial={fadeUp.initial}
                animate={fadeUp.animate}
                transition={{ ...spring.std, delay: 0.05 }}
              >
                <SectionLabel>Total Disputed</SectionLabel>
                <Card>
                  <p className="text-[13px] text-[var(--secondary)] font-medium">Amount in Fund</p>
                  <p className="text-[32px] font-bold font-mono text-tabs-red">
                    {formatCurrency(app.selectedTable.disputedAmount)}
                  </p>
                </Card>
              </motion.div>

              {/* Split Preview */}
              <motion.div
                initial={fadeUp.initial}
                animate={fadeUp.animate}
                transition={{ ...spring.std, delay: 0.1 }}
              >
                <SectionLabel>Split Evenly Among {app.players.length} Players</SectionLabel>
                <Card>
                  <div className="flex items-center justify-between">
                    <span className="text-[14px] text-[var(--secondary)]">Per player</span>
                    <span className="text-[18px] font-semibold font-mono text-tabs-green">
                      +{formatCurrency(perPlayerShare)}
                    </span>
                  </div>
                </Card>
              </motion.div>

              <Divider />

              {/* Action Buttons */}
              <motion.div
                initial={fadeUp.initial}
                animate={fadeUp.animate}
                transition={{ ...spring.std, delay: 0.15 }}
                className="space-y-3 pt-4"
              >
                <Button
                  fullWidth
                  onClick={() => setShowSplitConfirm(true)}
                  loading={splitting}
                >
                  Split Evenly
                </Button>
                <Button
                  fullWidth
                  variant="danger"
                  onClick={() => setShowClearConfirm(true)}
                  loading={clearing}
                >
                  Clear Fund
                </Button>
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={fadeUp.exit}
              transition={spring.bounce}
              className="flex flex-col items-center justify-center py-12 gap-4"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={spring.bounce}
                className="w-16 h-16 rounded-full bg-tabs-green/10 flex items-center justify-center"
              >
                <Check size={32} className="text-tabs-green" />
              </motion.div>
              <p className="text-[18px] font-semibold text-[var(--primary)]">
                {splitSuccess ? 'Fund Split' : 'Fund Cleared'}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Split Confirmation Modal */}
      <Modal
        isOpen={showSplitConfirm}
        onClose={() => setShowSplitConfirm(false)}
        title="Split Evenly"
      >
        <div className="space-y-4 py-4">
          <p className="text-[14px] text-[var(--secondary)]">
            This will credit {formatCurrency(perPlayerShare)} to each of the {app.players.length} players and clear the fund.
          </p>
          <div className="flex gap-3 pt-4">
            <Button
              fullWidth
              variant="secondary"
              onClick={() => setShowSplitConfirm(false)}
            >
              Cancel
            </Button>
            <Button
              fullWidth
              onClick={() => {
                setShowSplitConfirm(false)
                handleSplitEvenly()
              }}
            >
              Split
            </Button>
          </div>
        </div>
      </Modal>

      {/* Clear Confirmation Modal */}
      <Modal
        isOpen={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        title="Clear Fund"
      >
        <div className="space-y-4 py-4">
          <p className="text-[14px] text-[var(--secondary)]">
            This will permanently delete {formatCurrency(app.selectedTable.disputedAmount)} from the dispute fund. This cannot be undone.
          </p>
          <div className="flex gap-3 pt-4">
            <Button
              fullWidth
              variant="secondary"
              onClick={() => setShowClearConfirm(false)}
            >
              Cancel
            </Button>
            <Button
              fullWidth
              variant="danger"
              onClick={() => {
                setShowClearConfirm(false)
                handleClearFund()
              }}
            >
              Clear
            </Button>
          </div>
        </div>
      </Modal>
    </Modal>
  )
}
