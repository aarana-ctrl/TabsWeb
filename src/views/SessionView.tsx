import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { Modal } from '../components/ui/Modal'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Avatar, Badge, Divider, SectionLabel } from '../components/ui/Misc'
import { spring, fadeUp } from '../components/ui/motion'
import { formatCurrency, earningsColor } from '../types/models'

interface SessionViewProps {
  isOpen: boolean
  onClose: () => void
  session: any
  onSettle: () => void
}

export default function SessionView({ isOpen, onClose, session, onSettle }: SessionViewProps) {
  const app = useApp()

  useEffect(() => {
    if (isOpen && session && app.selectedTable) {
      app.startEntryListener(app.selectedTable.id, session.id)
    }
    return () => app.clearEntryListener()
  }, [isOpen, session])

  if (!session || !app.selectedTable) return null

  const submittedEntries = app.sessionEntries.filter(e => e.netAmount !== undefined)
  const pendingPlayerIds = app.players
    .filter(p => !submittedEntries.find(e => e.playerId === p.id))
    .map(p => p.id)

  const totalNet = submittedEntries.reduce((sum, e) => sum + e.netAmount, 0)
  const isBalanced = Math.abs(totalNet) < 0.01
  const imbalance = Math.abs(totalNet)

  const isAdmin = app.isAdmin(app.selectedTable)

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Session ${session.sessionNumber}`}>
      <div className="space-y-6 py-4">
        {/* Header Info */}
        <motion.div
          initial={fadeUp.initial}
          animate={fadeUp.animate}
          transition={spring.std}
          className="flex items-center justify-between"
        >
          <div>
            <p className="text-[13px] text-[var(--secondary)] font-medium">Status</p>
            <p className="text-[15px] font-semibold text-[var(--primary)]">Active</p>
          </div>
          <Badge color="green">Live</Badge>
        </motion.div>

        <motion.p
          initial={fadeUp.initial}
          animate={fadeUp.animate}
          transition={{ ...spring.std, delay: 0.05 }}
          className="text-[13px] text-[var(--secondary)]"
        >
          Started {new Date(session.startedAt).toLocaleDateString()}
        </motion.p>

        <Divider />

        {/* Balance Card */}
        <motion.div
          initial={fadeUp.initial}
          animate={fadeUp.animate}
          transition={{ ...spring.std, delay: 0.1 }}
        >
          <Card className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-[13px] text-[var(--secondary)] font-medium">Table Balance</p>
              {isBalanced ? (
                <Badge color="green">Balanced</Badge>
              ) : (
                <Badge color="orange">Off by {formatCurrency(imbalance)}</Badge>
              )}
            </div>
            <div className="w-full h-2 rounded-pill bg-[var(--card2)] overflow-hidden">
              <motion.div
                className="h-full bg-tabs-green"
                initial={{ width: 0 }}
                animate={{ width: isBalanced ? '50%' : `${Math.min(100, 50 + (imbalance / submittedEntries.reduce((s, e) => s + Math.abs(e.netAmount), 0) || 1) * 50)}%` }}
                transition={spring.std}
              />
            </div>
          </Card>
        </motion.div>

        {/* Submitted Entries */}
        <motion.div
          initial={fadeUp.initial}
          animate={fadeUp.animate}
          transition={{ ...spring.std, delay: 0.15 }}
        >
          <SectionLabel>Submitted Entries ({submittedEntries.length})</SectionLabel>
          <Card>
            {submittedEntries.length === 0 ? (
              <p className="text-center text-[var(--secondary)] py-6">No entries yet</p>
            ) : (
              <div className="space-y-1 -mx-5 -my-5">
                {submittedEntries.map((entry, idx) => (
                  <motion.div
                    key={entry.id}
                    initial={fadeUp.initial}
                    animate={fadeUp.animate}
                    exit={fadeUp.exit}
                    transition={{ ...spring.std, delay: idx * 0.05 }}
                    onClick={() => {
                      // Could open edit modal here if admin
                    }}
                    className={`flex items-center gap-3 px-5 py-3 hover:bg-[var(--card2)] transition-colors ${
                      isAdmin ? 'cursor-pointer group' : ''
                    }`}
                  >
                    <Avatar name={entry.playerName} size={32} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-semibold text-[var(--primary)]">{entry.playerName}</p>
                    </div>
                    <p className={`text-[14px] font-semibold font-mono ${earningsColor(entry.netAmount)}`}>
                      {formatCurrency(entry.netAmount, true)}
                    </p>
                    {isAdmin && <ChevronRight size={16} className="text-[var(--secondary)] opacity-0 group-hover:opacity-100 -rotate-90 transition-opacity" />}
                  </motion.div>
                ))}
              </div>
            )}
          </Card>
        </motion.div>

        {/* Pending Players */}
        {pendingPlayerIds.length > 0 && (
          <motion.div
            initial={fadeUp.initial}
            animate={fadeUp.animate}
            transition={{ ...spring.std, delay: 0.2 }}
          >
            <SectionLabel>Waiting ({pendingPlayerIds.length})</SectionLabel>
            <Card>
              <div className="space-y-1 -mx-5 -my-5">
                {app.players
                  .filter(p => pendingPlayerIds.includes(p.id))
                  .map((player, idx) => (
                    <motion.div
                      key={player.id}
                      initial={fadeUp.initial}
                      animate={fadeUp.animate}
                      exit={fadeUp.exit}
                      transition={{ ...spring.std, delay: idx * 0.05 }}
                      className="flex items-center gap-3 px-5 py-3"
                    >
                      <Avatar name={player.name} size={32} />
                      <div className="flex-1">
                        <p className="text-[14px] font-semibold text-[var(--secondary)]">{player.name}</p>
                      </div>
                      <Badge color="default">Pending</Badge>
                    </motion.div>
                  ))}
              </div>
            </Card>
          </motion.div>
        )}

        {/* Settlement Button */}
        {isAdmin && submittedEntries.length > 0 && (
          <motion.div
            initial={fadeUp.initial}
            animate={fadeUp.animate}
            transition={{ ...spring.std, delay: 0.25 }}
            className="pt-4"
          >
            {pendingPlayerIds.length > 0 ? (
              <Button fullWidth variant="secondary" onClick={onSettle}>
                Close & Settle ({pendingPlayerIds.length} missing)
              </Button>
            ) : (
              <Button fullWidth onClick={onSettle}>
                Settle Session
              </Button>
            )}
          </motion.div>
        )}
      </div>
    </Modal>
  )
}
