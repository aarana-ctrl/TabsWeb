import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { Modal } from '../components/ui/Modal'
import { Button } from '../components/ui/Button'
import { CurrencyInput, TextInput } from '../components/ui/Input'
import { SegmentedControl, Divider } from '../components/ui/Misc'
import { spring, fadeUp } from '../components/ui/motion'
import { SessionEntry } from '../types/models'

interface LogEntryModalProps {
  isOpen: boolean
  onClose: () => void
  table: any
  session: any
}

type EntryMode = 'split' | 'net'

export default function LogEntryModal({ isOpen, onClose, table, session }: LogEntryModalProps) {
  const app = useApp()
  const [mode, setMode] = useState<EntryMode>('split')
  const [buyIn, setBuyIn] = useState('')
  const [finalAmount, setFinalAmount] = useState('')
  const [netAmount, setNetAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const currentPlayer = app.currentPlayer(table.id)
  const existingEntry = app.sessionEntries.find(e => e.playerId === currentPlayer?.id)

  useEffect(() => {
    if (isOpen) {
      setSubmitted(false)
      setBuyIn('')
      setFinalAmount('')
      setNetAmount('')
    }
  }, [isOpen])

  const computedNet = mode === 'split' && buyIn && finalAmount
    ? parseFloat(finalAmount) - parseFloat(buyIn)
    : mode === 'net' && netAmount
    ? parseFloat(netAmount)
    : 0

  const handleSubmit = async () => {
    if (!currentPlayer || !session) return
    if (mode === 'split' && (!buyIn || !finalAmount)) return
    if (mode === 'net' && !netAmount) return

    setLoading(true)

    const entry: SessionEntry = {
      id: existingEntry?.id || crypto.randomUUID(),
      sessionId: session.id,
      tableId: table.id,
      playerId: currentPlayer.id,
      playerName: currentPlayer.name,
      buyIn: mode === 'split' ? parseFloat(buyIn) : 0,
      finalAmount: mode === 'split' ? parseFloat(finalAmount) : parseFloat(netAmount) + parseFloat(buyIn || '0'),
      netAmount: computedNet,
      submittedAt: new Date(),
      isManualNet: mode === 'net',
    }

    const success = existingEntry
      ? await app.updateEntry(entry)
      : await app.submitEntry(entry)

    if (success) {
      setSubmitted(true)
      setTimeout(() => {
        setLoading(false)
        onClose()
      }, 1500)
    } else {
      setLoading(false)
    }
  }

  const isValid = mode === 'split'
    ? buyIn && finalAmount && computedNet !== undefined
    : netAmount !== ''

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={existingEntry ? 'Update Entry' : 'Log Entry'}>
      <div className="space-y-6 py-4">
        <AnimatePresence mode="wait">
          {!submitted ? (
            <motion.div
              key="form"
              initial={fadeUp.initial}
              animate={fadeUp.animate}
              exit={fadeUp.exit}
              transition={spring.std}
              className="space-y-4"
            >
              {/* Mode Toggle */}
              <SegmentedControl
                options={[
                  { label: 'Buy-in / Final', value: 'split' },
                  { label: 'Net Only', value: 'net' },
                ]}
                value={mode}
                onChange={m => setMode(m as EntryMode)}
              />

              {/* Input Mode: Split */}
              {mode === 'split' && (
                <motion.div
                  initial={fadeUp.initial}
                  animate={fadeUp.animate}
                  exit={fadeUp.exit}
                  transition={spring.std}
                  className="space-y-3"
                >
                  <CurrencyInput
                    label="Buy-in"
                    value={buyIn}
                    onChange={setBuyIn}
                  />
                  <CurrencyInput
                    label="Final Amount"
                    value={finalAmount}
                    onChange={setFinalAmount}
                    allowNegative
                  />
                  <Divider />
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] font-medium text-[var(--secondary)]">Net P&L</span>
                    <span className="text-[18px] font-semibold font-mono text-tabs-green">
                      {computedNet > 0 ? '+' : ''}{computedNet.toFixed(2)}
                    </span>
                  </div>
                </motion.div>
              )}

              {/* Input Mode: Net Only */}
              {mode === 'net' && (
                <motion.div
                  initial={fadeUp.initial}
                  animate={fadeUp.animate}
                  exit={fadeUp.exit}
                  transition={spring.std}
                >
                  <CurrencyInput
                    label="Net Amount"
                    value={netAmount}
                    onChange={setNetAmount}
                    allowNegative
                  />
                </motion.div>
              )}

              {/* Override Warning */}
              {existingEntry && (
                <motion.div
                  initial={fadeUp.initial}
                  animate={fadeUp.animate}
                  transition={spring.std}
                  className="p-3 rounded-btn bg-orange-500/10 text-orange-600 text-[13px] font-medium"
                >
                  You already submitted an entry for this session. Updating will override it.
                </motion.div>
              )}

              {/* Submit Button */}
              <Button
                fullWidth
                onClick={handleSubmit}
                loading={loading}
                disabled={!isValid}
                color={existingEntry ? 'bg-orange-500 text-white hover:bg-orange-600' : undefined}
              >
                {existingEntry ? 'Override Entry' : 'Submit Entry'}
              </Button>
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
              <p className="text-[18px] font-semibold text-[var(--primary)]">Entry Submitted</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Modal>
  )
}
