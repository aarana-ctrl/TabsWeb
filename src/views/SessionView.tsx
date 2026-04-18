import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { UserPlus, Plus, Trash2 } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { Modal } from '../components/ui/Modal'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Avatar, Badge, Divider, SectionLabel } from '../components/ui/Misc'
import { spring, fadeUp } from '../components/ui/motion'
import { formatCurrency, earningsColor } from '../types/models'
import type { TablePlayer } from '../types/models'
import GuestEntryModal from './GuestEntryModal'
import LogEntryModal from './LogEntryModal'

interface SessionViewProps {
  isOpen: boolean
  onClose: () => void
  session: any
  onSettle: () => void
}

export default function SessionView({ isOpen, onClose, session, onSettle }: SessionViewProps) {
  const app = useApp()
  const [showGuestEntry, setShowGuestEntry] = useState(false)
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false)
  const [isDiscarding, setIsDiscarding] = useState(false)
  const [entryForPlayer, setEntryForPlayer] = useState<TablePlayer | null>(null)

  useEffect(() => {
    if (isOpen && session && app.selectedTable) {
      app.startEntryListener(app.selectedTable.id, session.id)
    }
    return () => app.clearEntryListener()
  }, [isOpen, session])

  if (!session || !app.selectedTable) return null

  const submittedEntries = app.sessionEntries.filter(e => e.netAmount !== undefined)
  const pendingPlayers = app.players.filter(p => !submittedEntries.find(e => e.playerId === p.id))

  // Include guest entries — their P&L affects the table balance
  const playerNet = submittedEntries.reduce((sum, e) => sum + e.netAmount, 0)
  const guestNet  = app.sessionGuestEntries.reduce((sum, e) => sum + e.netAmount, 0)
  const totalNet  = playerNet + guestNet
  const isBalanced = Math.abs(totalNet) < 0.01
  const imbalance = Math.abs(totalNet)

  const isAdmin = app.isAdmin(app.selectedTable)
  const myPlayer = app.currentPlayer(app.selectedTable.id)
  const myEntry = myPlayer ? submittedEntries.find(e => e.playerId === myPlayer.id) : null

  const handleDiscard = async () => {
    setIsDiscarding(true)
    await app.discardSession(session)
    setIsDiscarding(false)
    setShowDiscardConfirm(false)
    onClose()
  }

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title={`Session ${session.sessionNumber}`}>
        <div className="space-y-5 py-4">

          {/* Header */}
          <motion.div initial={fadeUp.initial} animate={fadeUp.animate} transition={spring.std}
            className="flex items-center justify-between"
          >
            <div>
              <p className="text-[13px] text-[var(--secondary)] font-medium">Status</p>
              <p className="text-[15px] font-semibold text-[var(--primary)]">Active</p>
            </div>
            <Badge color="green">Live</Badge>
          </motion.div>

          <motion.p initial={fadeUp.initial} animate={fadeUp.animate} transition={{ ...spring.std, delay: 0.05 }}
            className="text-[13px] text-[var(--secondary)]"
          >
            Started {new Date(session.startedAt).toLocaleDateString()}
          </motion.p>

          <Divider />

          {/* Balance Card */}
          <motion.div initial={fadeUp.initial} animate={fadeUp.animate} transition={{ ...spring.std, delay: 0.1 }}>
            <Card className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-[13px] text-[var(--secondary)] font-medium">Table Balance</p>
                {isBalanced
                  ? <Badge color="green">Balanced</Badge>
                  : <Badge color="orange">Off by {formatCurrency(imbalance)}</Badge>
                }
              </div>
              <div className="w-full h-2 rounded-full bg-[var(--card2)] overflow-hidden">
                <motion.div
                  className="h-full bg-tabs-green"
                  initial={{ width: 0 }}
                  animate={{ width: isBalanced ? '50%' : `${Math.min(100, 50 + (imbalance / (submittedEntries.reduce((s, e) => s + Math.abs(e.netAmount), 0) || 1)) * 50)}%` }}
                  transition={spring.std}
                />
              </div>
            </Card>
          </motion.div>

          {/* Submitted Entries */}
          <motion.div initial={fadeUp.initial} animate={fadeUp.animate} transition={{ ...spring.std, delay: 0.12 }}>
            <div className="flex items-center justify-between mb-2">
              <SectionLabel className="mb-0">Submitted Entries ({submittedEntries.length})</SectionLabel>
              {/* Admin: add own entry if not yet submitted */}
              {isAdmin && myPlayer && !myEntry && (
                <button
                  onClick={() => setEntryForPlayer(myPlayer)}
                  className="flex items-center gap-1.5 text-[12px] font-semibold text-tabs-green bg-tabs-green/10 px-3 py-1.5 rounded-full hover:bg-tabs-green/20 transition-colors"
                >
                  <Plus size={12} /> My Entry
                </button>
              )}
            </div>
            <Card>
              {submittedEntries.length === 0 ? (
                <p className="text-center text-[var(--secondary)] py-6 text-[13px]">No entries yet</p>
              ) : (
                <div className="space-y-1 -mx-5 -my-5">
                  {submittedEntries.map((entry, idx) => (
                    <motion.div
                      key={entry.id}
                      initial={fadeUp.initial} animate={fadeUp.animate} exit={fadeUp.exit}
                      transition={{ ...spring.std, delay: idx * 0.05 }}
                      className="flex items-center gap-3 px-5 py-3"
                    >
                      <Avatar name={entry.playerName} size={32} />
                      <div className="flex-1 min-w-0">
                        <p className="text-[14px] font-semibold text-[var(--primary)]">{entry.playerName}</p>
                      </div>
                      <p className={`text-[14px] font-semibold font-mono ${earningsColor(entry.netAmount)}`}>
                        {formatCurrency(entry.netAmount, true)}
                      </p>
                    </motion.div>
                  ))}
                </div>
              )}
            </Card>
          </motion.div>

          {/* Guest Entries */}
          <motion.div initial={fadeUp.initial} animate={fadeUp.animate} transition={{ ...spring.std, delay: 0.15 }}>
            <div className="flex items-center justify-between mb-2">
              <SectionLabel className="mb-0">Guests ({app.sessionGuestEntries.length})</SectionLabel>
              {isAdmin && (
                <button
                  onClick={() => setShowGuestEntry(true)}
                  className="flex items-center gap-1.5 text-[12px] font-semibold text-tabs-green bg-tabs-green/10 px-3 py-1.5 rounded-full hover:bg-tabs-green/20 transition-colors"
                >
                  <UserPlus size={12} /> Add Guest
                </button>
              )}
            </div>
            <Card>
              {app.sessionGuestEntries.length === 0 ? (
                <p className="text-center text-[var(--secondary)] py-4 text-[13px]">No guests this session</p>
              ) : (
                <div className="space-y-1 -mx-5 -my-5">
                  {app.sessionGuestEntries.map((entry, idx) => {
                    const guest = app.guests.find(g => g.id === entry.guestId)
                    const name = guest?.name ?? 'Guest'
                    return (
                      <motion.div key={entry.id}
                        initial={fadeUp.initial} animate={fadeUp.animate}
                        transition={{ ...spring.std, delay: idx * 0.05 }}
                        className="flex items-center gap-3 px-5 py-3"
                      >
                        <Avatar name={name} size={32} />
                        <div className="flex-1 min-w-0">
                          <p className="text-[14px] font-semibold text-[var(--primary)]">{name}</p>
                          {entry.buyIn > 0 && (
                            <p className="text-[12px] text-[var(--secondary)]">
                              {formatCurrency(entry.buyIn)} → {formatCurrency(entry.finalAmount)}
                            </p>
                          )}
                        </div>
                        <p className={`text-[14px] font-semibold font-mono ${earningsColor(entry.netAmount)}`}>
                          {formatCurrency(entry.netAmount, true)}
                        </p>
                      </motion.div>
                    )
                  })}
                </div>
              )}
            </Card>
          </motion.div>

          {/* Waiting — admin can tap a player to add their entry */}
          {pendingPlayers.length > 0 && (
            <motion.div initial={fadeUp.initial} animate={fadeUp.animate} transition={{ ...spring.std, delay: 0.18 }}>
              <SectionLabel>Waiting ({pendingPlayers.length})</SectionLabel>
              <Card>
                <div className="space-y-1 -mx-5 -my-5">
                  {pendingPlayers.map((player, idx) => (
                    <motion.div
                      key={player.id}
                      initial={fadeUp.initial} animate={fadeUp.animate} exit={fadeUp.exit}
                      transition={{ ...spring.std, delay: idx * 0.05 }}
                      className="flex items-center gap-3 px-5 py-3"
                    >
                      <Avatar name={player.name} size={32} />
                      <div className="flex-1">
                        <p className="text-[14px] font-semibold text-[var(--secondary)]">{player.name}</p>
                      </div>
                      {isAdmin ? (
                        <button
                          onClick={() => setEntryForPlayer(player)}
                          className="flex items-center gap-1 text-[12px] font-semibold text-tabs-green bg-tabs-green/10 px-3 py-1.5 rounded-full hover:bg-tabs-green/20 transition-colors"
                        >
                          <Plus size={12} /> Add Entry
                        </button>
                      ) : (
                        <Badge color="default">Pending</Badge>
                      )}
                    </motion.div>
                  ))}
                </div>
              </Card>
            </motion.div>
          )}

          {/* Admin Controls */}
          {isAdmin && (
            <motion.div
              initial={fadeUp.initial} animate={fadeUp.animate}
              transition={{ ...spring.std, delay: 0.22 }}
              className="flex gap-3 pt-2"
            >
              <Button
                fullWidth
                variant="danger"
                onClick={() => setShowDiscardConfirm(true)}
              >
                <Trash2 size={15} /> Discard
              </Button>
              <Button
                fullWidth
                onClick={onSettle}
                disabled={submittedEntries.length === 0}
              >
                {pendingPlayers.length > 0
                  ? `Settle (${pendingPlayers.length} missing)`
                  : 'Settle Session'}
              </Button>
            </motion.div>
          )}
        </div>
      </Modal>

      {/* Discard Confirmation */}
      <Modal isOpen={showDiscardConfirm} onClose={() => setShowDiscardConfirm(false)} title="Discard Session?">
        <div className="space-y-4 py-4">
          <p className="text-[14px] text-[var(--secondary)]">
            All submitted entries will be permanently deleted and the session will be removed. No profits or losses will be recorded. This cannot be undone.
          </p>
          <div className="flex gap-3 pt-2">
            <Button fullWidth variant="secondary" onClick={() => setShowDiscardConfirm(false)}>
              Cancel
            </Button>
            <Button fullWidth variant="danger" loading={isDiscarding} onClick={handleDiscard}>
              Discard Session
            </Button>
          </div>
        </div>
      </Modal>

      {/* Log Entry for a specific player (admin) */}
      {app.selectedTable && session && entryForPlayer && (
        <LogEntryModal
          isOpen={entryForPlayer !== null}
          onClose={() => setEntryForPlayer(null)}
          table={app.selectedTable}
          session={session}
          targetPlayer={entryForPlayer}
        />
      )}

      {/* Guest Entry */}
      {app.selectedTable && session && (
        <GuestEntryModal
          isOpen={showGuestEntry}
          onClose={() => setShowGuestEntry(false)}
          table={app.selectedTable}
          session={session}
        />
      )}
    </>
  )
}
