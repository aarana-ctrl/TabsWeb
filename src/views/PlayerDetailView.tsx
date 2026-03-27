import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ChevronLeft, Crown, CircleX } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { Card } from '../components/ui/Card'
import { Button, IconButton } from '../components/ui/Button'
import { Avatar, SectionLabel, Badge, Divider } from '../components/ui/Misc'
import { Modal } from '../components/ui/Modal'
import { spring, fadeUp } from '../components/ui/motion'
import { formatCurrency, earningsColor, isAdmin } from '../types/models'

export default function PlayerDetailView() {
  const { tableId = '', playerId = '' } = useParams<{ tableId: string; playerId: string }>()
  const navigate = useNavigate()
  const app = useApp()
  const [history, setHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showPromoteConfirm, setShowPromoteConfirm] = useState(false)

  const table = app.tables.find(t => t.id === tableId)
  const player = app.players.find(p => p.userId === playerId)
  const isCurrentUserAdmin = table ? app.isAdmin(table) : false
  const isPlayerAdmin = table ? isAdmin(table, playerId) : false

  useEffect(() => {
    const load = async () => {
      if (!tableId || !playerId) return
      const h = await app.fetchPlayerHistory(playerId, tableId)
      setHistory(h)
      setLoading(false)
    }
    load()
  }, [tableId, playerId])

  if (!table || !player) {
    return (
      <div className="flex items-center justify-center h-dvh">
        <div className="w-8 h-8 border-2 border-[var(--card2)] border-t-[var(--primary)] rounded-full animate-spin" />
      </div>
    )
  }

  const sessionCount = new Set(history.map(e => e.sessionId)).size
  const wins = history.filter(e => e.netAmount > 0).length
  const winRate = sessionCount === 0 ? 0 : wins / sessionCount

  return (
    <div className="pb-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={spring.std}
        className="sticky top-0 z-20 bg-[var(--bg)] border-b border-[var(--card2)] px-6 py-4 flex items-center gap-3"
      >
        <IconButton onClick={() => navigate(`/tables/${tableId}`)}>
          <ChevronLeft size={20} />
        </IconButton>
        <h1 className="text-[24px] font-semibold font-display text-[var(--primary)]">{player.name}</h1>
      </motion.div>

      <div className="px-6 pt-6 space-y-6">
        {/* Player Stats */}
        <motion.div
          initial={fadeUp.initial}
          animate={fadeUp.animate}
          transition={spring.std}
        >
          <Card className="space-y-4">
            <div className="flex items-center gap-4 pb-4">
              <Avatar name={player.name} size={56} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-[18px] font-semibold text-[var(--primary)]">{player.name}</h2>
                  {isPlayerAdmin && <Crown size={16} className="text-tabs-green" />}
                </div>
                <p className="text-[13px] text-[var(--secondary)]">In {table.name}</p>
              </div>
            </div>
            <Divider className="my-2" />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[11px] text-[var(--secondary)] font-medium">Total Earnings</p>
                <p className={`text-[20px] font-semibold font-mono ${earningsColor(player.totalEarnings)}`}>
                  {formatCurrency(player.totalEarnings, true)}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-[var(--secondary)] font-medium">Lifetime</p>
                <p className={`text-[20px] font-semibold font-mono ${earningsColor(player.lifetimeEarnings)}`}>
                  {formatCurrency(player.lifetimeEarnings, true)}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-[var(--secondary)] font-medium">Sessions</p>
                <p className="text-[20px] font-semibold font-mono text-[var(--primary)]">
                  {sessionCount}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-[var(--secondary)] font-medium">Win Rate</p>
                <p className="text-[20px] font-semibold font-mono text-tabs-green">
                  {(winRate * 100).toFixed(0)}%
                </p>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Admin Actions */}
        {isCurrentUserAdmin && playerId !== app.currentUser?.id && (
          <motion.div
            initial={fadeUp.initial}
            animate={fadeUp.animate}
            transition={{ ...spring.std, delay: 0.1 }}
          >
            <SectionLabel>Admin Actions</SectionLabel>
            <Card className="space-y-2">
              {!isPlayerAdmin ? (
                <Button
                  fullWidth
                  variant="secondary"
                  onClick={() => setShowPromoteConfirm(true)}
                >
                  <Crown size={16} />
                  Promote to Co-Admin
                </Button>
              ) : (
                <Button
                  fullWidth
                  variant="danger"
                  onClick={() => app.demoteCoAdmin(playerId, table)}
                >
                  <CircleX size={16} />
                  Demote from Co-Admin
                </Button>
              )}
            </Card>
          </motion.div>
        )}

        {/* Session History */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-[var(--card2)] border-t-[var(--primary)] rounded-full animate-spin" />
          </div>
        ) : history.length === 0 ? (
          <motion.div
            initial={fadeUp.initial}
            animate={fadeUp.animate}
            transition={{ ...spring.std, delay: 0.15 }}
          >
            <SectionLabel>Session History</SectionLabel>
            <Card className="text-center py-8">
              <p className="text-[14px] text-[var(--secondary)]">No sessions yet</p>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            initial={fadeUp.initial}
            animate={fadeUp.animate}
            transition={{ ...spring.std, delay: 0.15 }}
          >
            <SectionLabel>Session History ({history.length})</SectionLabel>
            <Card>
              <div className="space-y-1 -mx-5 -my-5">
                {history
                  .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
                  .map((entry, idx) => (
                    <motion.div
                      key={entry.id}
                      initial={fadeUp.initial}
                      animate={fadeUp.animate}
                      exit={fadeUp.exit}
                      transition={{ ...spring.std, delay: idx * 0.03 }}
                      className="flex items-center justify-between px-5 py-3 hover:bg-[var(--card2)] transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] text-[var(--secondary)] font-medium">
                          {new Date(entry.submittedAt).toLocaleDateString()}
                        </p>
                        {entry.buyIn > 0 && (
                          <p className="text-[12px] text-[var(--secondary)]">
                            {formatCurrency(entry.buyIn)} → {formatCurrency(entry.finalAmount)}
                          </p>
                        )}
                      </div>
                      <p className={`text-[15px] font-semibold font-mono ${earningsColor(entry.netAmount)}`}>
                        {formatCurrency(entry.netAmount, true)}
                      </p>
                    </motion.div>
                  ))}
              </div>
            </Card>
          </motion.div>
        )}
      </div>

      {/* Promote Confirmation Modal */}
      <Modal
        isOpen={showPromoteConfirm}
        onClose={() => setShowPromoteConfirm(false)}
        title="Promote to Co-Admin"
      >
        <div className="space-y-4 py-4">
          <p className="text-[14px] text-[var(--secondary)]">
            Make {player.name} a co-admin? Co-admins can start sessions and settle tables.
          </p>
          <div className="flex gap-3 pt-4">
            <Button
              fullWidth
              variant="secondary"
              onClick={() => setShowPromoteConfirm(false)}
            >
              Cancel
            </Button>
            <Button
              fullWidth
              onClick={() => {
                app.promoteToCoAdmin(playerId, table)
                setShowPromoteConfirm(false)
              }}
            >
              Promote
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
