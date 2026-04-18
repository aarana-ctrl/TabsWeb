import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { UserPlus, CheckCircle } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { Modal } from '../components/ui/Modal'
import { Button } from '../components/ui/Button'
import { TextInput } from '../components/ui/Input'
import { spring, fadeUp } from '../components/ui/motion'
import type { PokerTable, GameSession, TableGuest, GuestEntry } from '../types/models'
import { formatCurrency, earningsColor } from '../types/models'

interface Props {
  isOpen: boolean
  onClose: () => void
  table: PokerTable
  session: GameSession
}

export default function GuestEntryModal({ isOpen, onClose, table, session }: Props) {
  const app = useApp()

  const [selectedGuest, setSelectedGuest] = useState<TableGuest | null>(null)
  const [isCreatingNew, setIsCreatingNew] = useState(false)
  const [newGuestName, setNewGuestName] = useState('')
  const [useNetMode, setUseNetMode] = useState(false)
  const [buyIn, setBuyIn] = useState('')
  const [finalStack, setFinalStack] = useState('')
  const [netAmount, setNetAmount] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  const existingGuests = app.guests.filter(g => !g.mergedToPlayerId)

  const activeGuest = selectedGuest

  const isFormValid = (() => {
    const hasGuest = activeGuest !== null || (isCreatingNew && newGuestName.trim().length > 0)
    if (!hasGuest) return false
    if (useNetMode) return netAmount.trim() !== '' && !isNaN(Number(netAmount))
    return buyIn.trim() !== '' && finalStack.trim() !== '' &&
      !isNaN(Number(buyIn)) && !isNaN(Number(finalStack))
  })()

  const previewNet = useNetMode
    ? Number(netAmount) || 0
    : (Number(finalStack) || 0) - (Number(buyIn) || 0)

  const handleSubmit = async () => {
    setIsSubmitting(true)
    let guest = selectedGuest

    if (isCreatingNew) {
      const name = newGuestName.trim()
      if (!name) { setIsSubmitting(false); return }
      const created = await app.addGuest(name, table.id)
      if (!created) { setIsSubmitting(false); return }
      guest = created
    }
    if (!guest) { setIsSubmitting(false); return }

    const net = useNetMode
      ? Number(netAmount)
      : (Number(finalStack) || 0) - (Number(buyIn) || 0)

    const entry: GuestEntry = {
      id: crypto.randomUUID(),
      guestId: guest.id,
      tableId: table.id,
      sessionId: session.id,
      sessionDate: session.startedAt,
      buyIn: useNetMode ? 0 : Number(buyIn) || 0,
      finalAmount: useNetMode ? 0 : Number(finalStack) || 0,
      netAmount: net,
      isManualNet: useNetMode,
      submittedAt: new Date(),
    }

    const ok = await app.submitGuestEntry(entry)
    setIsSubmitting(false)
    if (ok) {
      setShowSuccess(true)
      setTimeout(() => { setShowSuccess(false); onClose(); resetForm() }, 1400)
    }
  }

  const resetForm = () => {
    setSelectedGuest(null); setIsCreatingNew(false); setNewGuestName('')
    setBuyIn(''); setFinalStack(''); setNetAmount(''); setShowSuccess(false)
  }

  const handleClose = () => { resetForm(); onClose() }

  const selectGuest = (g: TableGuest) => {
    setSelectedGuest(g); setIsCreatingNew(false)
  }

  const selectNew = () => { setIsCreatingNew(true); setSelectedGuest(null) }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Guest Entry">
      <AnimatePresence mode="wait">
        {showSuccess ? (
          <motion.div
            key="success"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={spring.bounce}
            className="flex flex-col items-center gap-4 py-10"
          >
            <CheckCircle size={64} className="text-tabs-green" />
            <p className="text-[18px] font-semibold text-[var(--primary)]">Entry Submitted</p>
          </motion.div>
        ) : (
          <motion.div key="form" className="space-y-5 py-2">

            {/* Guest selector */}
            <div>
              <p className="text-[11px] font-semibold text-[var(--secondary)] uppercase tracking-wide mb-2">
                Select Guest
              </p>
              <div className="rounded-[14px] border border-[var(--card2)] overflow-hidden divide-y divide-[var(--card2)]">
                {existingGuests.map(g => {
                  const hasEntry = app.sessionGuestEntries.some(e => e.guestId === g.id)
                  return (
                    <button
                      key={g.id}
                      onClick={() => selectGuest(g)}
                      className={`w-full flex items-center justify-between px-4 py-3 text-left transition-colors ${
                        selectedGuest?.id === g.id ? 'bg-[var(--card2)]' : 'hover:bg-[var(--card2)]'
                      }`}
                    >
                      <div>
                        <p className="text-[14px] font-medium text-[var(--primary)]">{g.name}</p>
                        {hasEntry && (
                          <p className="text-[12px] text-orange-500">Already has entry this session</p>
                        )}
                      </div>
                      {selectedGuest?.id === g.id && (
                        <CheckCircle size={18} className="text-tabs-green" />
                      )}
                    </button>
                  )
                })}

                {/* New guest row */}
                <button
                  onClick={selectNew}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                    isCreatingNew ? 'bg-[var(--card2)]' : 'hover:bg-[var(--card2)]'
                  }`}
                >
                  <UserPlus size={16} className="text-tabs-green" />
                  <span className="text-[14px] font-medium text-tabs-green">Add New Guest</span>
                  {isCreatingNew && <CheckCircle size={18} className="text-tabs-green ml-auto" />}
                </button>

                {isCreatingNew && (
                  <div className="px-4 py-2">
                    <TextInput
                      label=""
                      value={newGuestName}
                      onChange={e => setNewGuestName(e.target.value)}
                      placeholder="Guest name"
                      autoFocus
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Entry form — appears once a guest is chosen */}
            <AnimatePresence>
              {(selectedGuest || isCreatingNew) && (
                <motion.div
                  key="entry"
                  initial={fadeUp.initial}
                  animate={fadeUp.animate}
                  exit={{ opacity: 0 }}
                  transition={spring.std}
                  className="space-y-4"
                >
                  {/* Mode toggle */}
                  <div className="flex p-1 rounded-[12px] bg-[var(--card2)] gap-0.5">
                    {['Buy-in / Final', 'Net Amount'].map((label, i) => {
                      const active = useNetMode === (i === 1)
                      return (
                        <button
                          key={label}
                          onClick={() => setUseNetMode(i === 1)}
                          className={`flex-1 py-2 rounded-[10px] text-[13px] font-semibold transition-all ${
                            active ? 'bg-[var(--primary)] text-[var(--on-primary)]' : 'text-[var(--secondary)]'
                          }`}
                        >
                          {label}
                        </button>
                      )
                    })}
                  </div>

                  {/* Amount fields */}
                  <div className="rounded-[14px] border border-[var(--card2)] overflow-hidden divide-y divide-[var(--card2)]">
                    {useNetMode ? (
                      <div className="flex items-center px-4 py-3 gap-3">
                        <span className="text-[14px] text-[var(--secondary)] flex-1">Net amount (+/-)</span>
                        <input
                          type="number"
                          value={netAmount}
                          onChange={e => setNetAmount(e.target.value)}
                          placeholder="0.00"
                          className="w-28 text-right text-[14px] font-mono bg-transparent text-[var(--primary)] outline-none"
                        />
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center px-4 py-3 gap-3">
                          <span className="text-[14px] text-[var(--secondary)] flex-1">Buy-in</span>
                          <input
                            type="number"
                            value={buyIn}
                            onChange={e => setBuyIn(e.target.value)}
                            placeholder="0.00"
                            className="w-28 text-right text-[14px] font-mono bg-transparent text-[var(--primary)] outline-none"
                          />
                        </div>
                        <div className="flex items-center px-4 py-3 gap-3">
                          <span className="text-[14px] text-[var(--secondary)] flex-1">Final stack</span>
                          <input
                            type="number"
                            value={finalStack}
                            onChange={e => setFinalStack(e.target.value)}
                            placeholder="0.00"
                            className="w-28 text-right text-[14px] font-mono bg-transparent text-[var(--primary)] outline-none"
                          />
                        </div>
                      </>
                    )}
                  </div>

                  {/* Net preview */}
                  {isFormValid && (
                    <motion.div
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-right"
                    >
                      <span className="text-[12px] text-[var(--secondary)]">Net: </span>
                      <span className={`text-[15px] font-semibold font-mono ${earningsColor(previewNet)}`}>
                        {formatCurrency(previewNet, true)}
                      </span>
                    </motion.div>
                  )}

                  <div className="flex gap-3 pt-2">
                    <Button fullWidth variant="secondary" onClick={handleClose}>Cancel</Button>
                    <Button
                      fullWidth
                      onClick={handleSubmit}
                      loading={isSubmitting}
                      disabled={!isFormValid}
                    >
                      Submit Entry
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

          </motion.div>
        )}
      </AnimatePresence>
    </Modal>
  )
}
