import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { Modal } from '../components/ui/Modal'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Avatar, SectionLabel, Divider } from '../components/ui/Misc'
import { spring, fadeUp } from '../components/ui/motion'
import { formatCurrency, earningsColor } from '../types/models'
import type { SessionEntry, DisputeResolution } from '../types/models'

interface SettlementModalProps {
  isOpen: boolean
  onClose: () => void
  table: any
  session: any
  entries: SessionEntry[]
}

export default function SettlementModal({ isOpen, onClose, table, session, entries }: SettlementModalProps) {
  const app = useApp()
  const [resolution, setResolution] = useState<DisputeResolution>('splitEvenly')
  const [settling, setSettling] = useState(false)
  const [settled, setSettled] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setSettled(false)
      setSettling(false)
      setResolution('splitEvenly')
    }
  }, [isOpen])

  // Include guest entries in the balance — their P&L affects the table offset
  const guestEntries = app.sessionGuestEntries
  const playerNet = entries.reduce((sum, e) => sum + e.netAmount, 0)
  const guestNet  = guestEntries.reduce((sum, e) => sum + e.netAmount, 0)
  const totalNet  = playerNet + guestNet
  const isBalanced = Math.abs(totalNet) < 0.01
  const imbalance = Math.abs(totalNet)

  const handleSettle = async () => {
    if (!session) return
    setSettling(true)

    const success = await app.settleSession(session, entries, resolution, isBalanced ? 0 : imbalance)

    if (success) {
      setSettled(true)
      setTimeout(() => {
        setSettling(false)
        onClose()
      }, 1500)
    } else {
      setSettling(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Settle Session">
      <div className="space-y-6 py-4">
        <AnimatePresence mode="wait">
          {!settled ? (
            <motion.div
              key="settlement"
              initial={fadeUp.initial}
              animate={fadeUp.animate}
              exit={fadeUp.exit}
              transition={spring.std}
              className="space-y-6"
            >
              {/* Summary */}
              <motion.div
                initial={fadeUp.initial}
                animate={fadeUp.animate}
                transition={{ ...spring.std, delay: 0.05 }}
              >
                <SectionLabel>Net Summary</SectionLabel>
                <Card>
                  <div className="space-y-2 -mx-5 -my-5">
                    {entries.map((entry, idx) => (
                      <motion.div
                        key={entry.id}
                        initial={fadeUp.initial}
                        animate={fadeUp.animate}
                        exit={fadeUp.exit}
                        transition={{ ...spring.std, delay: idx * 0.03 }}
                        className="flex items-center gap-3 px-5 py-3"
                      >
                        <Avatar name={entry.playerName} size={32} />
                        <div className="flex-1">
                          <p className="text-[14px] font-semibold text-[var(--primary)]">{entry.playerName}</p>
                        </div>
                        <p className={`text-[14px] font-semibold font-mono ${earningsColor(entry.netAmount)}`}>
                          {formatCurrency(entry.netAmount, true)}
                        </p>
                      </motion.div>
                    ))}
                  </div>
                </Card>
              </motion.div>

              {/* Balance Status */}
              <motion.div
                initial={fadeUp.initial}
                animate={fadeUp.animate}
                transition={{ ...spring.std, delay: 0.1 }}
              >
                <SectionLabel>Balance Status</SectionLabel>
                <Card>
                  <div className="flex items-center justify-between">
                    <span className="text-[14px] text-[var(--secondary)]">
                      {isBalanced ? 'All entries balanced' : `Off by ${formatCurrency(imbalance)}`}
                    </span>
                    <span className={`text-[15px] font-semibold ${isBalanced ? 'text-tabs-green' : 'text-tabs-red'}`}>
                      {isBalanced ? '✓ Balanced' : '⚠ Imbalance'}
                    </span>
                  </div>
                </Card>
              </motion.div>

              {/* Resolution Options */}
              {!isBalanced && (
                <motion.div
                  initial={fadeUp.initial}
                  animate={fadeUp.animate}
                  transition={{ ...spring.std, delay: 0.15 }}
                >
                  <SectionLabel>Handling Imbalance</SectionLabel>
                  <Card className="space-y-2">
                    <label className="flex items-center gap-3 p-3 cursor-pointer hover:bg-[var(--card2)] transition-colors rounded-btn">
                      <input
                        type="radio"
                        name="resolution"
                        value="splitEvenly"
                        checked={resolution === 'splitEvenly'}
                        onChange={e => setResolution(e.target.value as DisputeResolution)}
                        className="w-4 h-4"
                      />
                      <div>
                        <p className="text-[14px] font-semibold text-[var(--primary)]">Split Evenly</p>
                        <p className="text-[12px] text-[var(--secondary)]">Deduct {formatCurrency(imbalance / entries.length)} from each</p>
                      </div>
                    </label>
                    <Divider className="my-0" />
                    <label className="flex items-center gap-3 p-3 cursor-pointer hover:bg-[var(--card2)] transition-colors rounded-btn">
                      <input
                        type="radio"
                        name="resolution"
                        value="disputeFund"
                        checked={resolution === 'disputeFund'}
                        onChange={e => setResolution(e.target.value as DisputeResolution)}
                        className="w-4 h-4"
                      />
                      <div>
                        <p className="text-[14px] font-semibold text-[var(--primary)]">Dispute Fund</p>
                        <p className="text-[12px] text-[var(--secondary)]">Hold {formatCurrency(imbalance)} to resolve later</p>
                      </div>
                    </label>
                  </Card>
                </motion.div>
              )}

              {/* Settle Button */}
              <motion.div
                initial={fadeUp.initial}
                animate={fadeUp.animate}
                transition={{ ...spring.std, delay: 0.2 }}
                className="pt-4"
              >
                <Button fullWidth onClick={handleSettle} loading={settling}>
                  Settle Session
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
              <p className="text-[18px] font-semibold text-[var(--primary)]">Session Settled</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Modal>
  )
}
