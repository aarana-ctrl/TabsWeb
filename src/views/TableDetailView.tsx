import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, Trash2, GitMerge, Settings } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { Card, AnimatedCard } from '../components/ui/Card'
import { Button, IconButton } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import { Badge, Avatar, SectionLabel, Divider } from '../components/ui/Misc'
import { spring, fadeUp } from '../components/ui/motion'
import { formatCurrency, earningsColor } from '../types/models'
import type { TableGuest } from '../types/models'
import SessionView from './SessionView'
import LogEntryModal from './LogEntryModal'
import SettlementModal from './SettlementModal'
import TableSettlementView from './TableSettlementView'
import DisputeFundView from './DisputeFundView'

export default function TableDetailView() {
  const { tableId = '' } = useParams<{ tableId: string }>()
  const navigate = useNavigate()
  const app = useApp()
  const [activeSession, setActiveSession] = useState<any>(null)
  const [showSessionModal, setShowSessionModal] = useState(false)
  const [showLogEntryModal, setShowLogEntryModal] = useState(false)
  const [showSettlementModal, setShowSettlementModal] = useState(false)
  const [showTableSettlementModal, setShowTableSettlementModal] = useState(false)
  const [showDisputeFundModal, setShowDisputeFundModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isLoadingSession, setIsLoadingSession] = useState(false)
  const [selectedGuest, setSelectedGuest] = useState<TableGuest | null>(null)
  const [guestEntries, setGuestEntries] = useState<any[]>([])
  const [mergeTarget, setMergeTarget] = useState<any>(null)
  const [isMerging, setIsMerging] = useState(false)

  useEffect(() => {
    if (!tableId) return
    const table = app.tables.find(t => t.id === tableId)
    if (table) {
      app.selectTable(table)
      loadActiveSession()
    }
  }, [tableId])

  const loadActiveSession = useCallback(async () => {
    if (!tableId) return
    setIsLoadingSession(true)
    const session = await app.fetchActiveSession(tableId)
    setActiveSession(session)
    if (session) {
      app.startEntryListener(tableId, session.id)
    } else {
      app.clearEntryListener()
    }
    setIsLoadingSession(false)
  }, [tableId, app])

  const handleDeleteTable = useCallback(async () => {
    if (!app.selectedTable) return
    await app.deleteTable(app.selectedTable)
    navigate('/')
  }, [app.selectedTable])

  const handleStartSession = useCallback(async () => {
    if (!app.selectedTable) return
    await app.startSession(app.selectedTable)
    await loadActiveSession()
  }, [app.selectedTable])

  const handleSettleSession = useCallback(async () => {
    if (activeSession && app.sessionEntries.length > 0) {
      setShowSettlementModal(true)
    }
  }, [activeSession, app.sessionEntries])

  if (!app.selectedTable) {
    return (
      <div className="flex items-center justify-center h-dvh">
        <div className="w-8 h-8 border-2 border-[var(--card2)] border-t-[var(--primary)] rounded-full animate-spin" />
      </div>
    )
  }

  const isAdmin = app.isAdmin(app.selectedTable)
  const playerCount = app.players.length
  const sortedPlayers = [...app.players].sort((a, b) => b.totalEarnings - a.totalEarnings)

  // Identify admin/co-admin player rows using pre-resolved player document IDs.
  // AppContext resolves these via targeted Firestore queries so they work even
  // when player.userId is empty in older Firestore documents.
  function playerRole(player: any): 'admin' | 'coadmin' | null {
    if (app.adminPlayerId && player.id === app.adminPlayerId)          return 'admin'
    if (app.coAdminPlayerIds.includes(player.id))                      return 'coadmin'
    // Fallback: userId comparison for newly-created docs that always have it
    if (player.userId) {
      if (player.userId === app.selectedTable!.adminId)                return 'admin'
      if (app.selectedTable!.coAdminIds.includes(player.userId))       return 'coadmin'
    }
    return null
  }

  return (
    <div className="pb-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={spring.std}
        className="sticky top-0 z-20 bg-[var(--bg)] border-b border-[var(--card2)] px-6 py-4 flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <IconButton onClick={() => navigate('/')}>
            <ChevronLeft size={20} />
          </IconButton>
          <div>
            <h1 className="text-[24px] font-semibold font-display text-[var(--primary)]">
              {app.selectedTable.name}
            </h1>
            <Badge color="default">{app.selectedTable.referenceCode}</Badge>
          </div>
        </div>
        {isAdmin && (
          <IconButton
            onClick={() => setShowTableSettlementModal(true)}
            className="bg-[var(--card2)]"
          >
            <Settings size={18} />
          </IconButton>
        )}
      </motion.div>

      <div className="px-6 pt-6 space-y-6">
        {/* Active Session Card */}
        {activeSession && (
          <motion.div
            initial={fadeUp.initial}
            animate={fadeUp.animate}
            exit={fadeUp.exit}
            transition={spring.std}
          >
            <Card className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[13px] text-[var(--secondary)] font-medium">Session {activeSession.sessionNumber}</p>
                  <p className="text-[18px] font-semibold text-[var(--primary)]">Active</p>
                </div>
                <Badge color="green">Live</Badge>
              </div>
              <p className="text-[13px] text-[var(--secondary)]">
                Started {new Date(activeSession.startedAt).toLocaleDateString()}
              </p>
              <Divider className="my-2" />
              <div className="flex gap-3">
                <Button
                  fullWidth
                  variant="secondary"
                  onClick={() => setShowSessionModal(true)}
                >
                  View Session
                </Button>
                {!isAdmin && !app.sessionEntries.find(e => e.playerId === app.currentPlayer(app.selectedTable!.id)?.id) && (
                  <Button fullWidth onClick={() => setShowLogEntryModal(true)}>
                    Log Entry
                  </Button>
                )}
              </div>
            </Card>
          </motion.div>
        )}

        {/* Start Session / Settlement Buttons */}
        {!activeSession && isAdmin && (
          <motion.div
            initial={fadeUp.initial}
            animate={fadeUp.animate}
            exit={fadeUp.exit}
            transition={spring.std}
          >
            <Button fullWidth onClick={handleStartSession} loading={isLoadingSession}>
              Start New Session
            </Button>
          </motion.div>
        )}

        {isAdmin && !app.selectedTable.isInSettlement && app.selectedTable.disputedAmount > 0 && (
          <motion.div
            initial={fadeUp.initial}
            animate={fadeUp.animate}
            exit={fadeUp.exit}
            transition={{ ...spring.std, delay: 0.1 }}
          >
            <Card
              className="cursor-pointer"
              onClick={() => setShowDisputeFundModal(true)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[13px] text-[var(--secondary)] font-medium">Dispute Fund</p>
                  <p className="text-[20px] font-semibold text-tabs-red">
                    {formatCurrency(app.selectedTable.disputedAmount)}
                  </p>
                </div>
                <ChevronLeft size={20} className="text-[var(--secondary)] -rotate-90" />
              </div>
            </Card>
          </motion.div>
        )}

        {isAdmin && app.selectedTable.isInSettlement && (
          <motion.div
            initial={fadeUp.initial}
            animate={fadeUp.animate}
            exit={fadeUp.exit}
            transition={{ ...spring.std, delay: 0.1 }}
          >
            <Button
              fullWidth
              variant="secondary"
              onClick={() => setShowTableSettlementModal(true)}
            >
              Complete Settlement
            </Button>
          </motion.div>
        )}

        {/* Leaderboard */}
        <motion.div
          initial={fadeUp.initial}
          animate={fadeUp.animate}
          exit={fadeUp.exit}
          transition={{ ...spring.std, delay: 0.15 }}
        >
          <SectionLabel>Leaderboard</SectionLabel>
          <Card>
            {playerCount === 0 ? (
              <p className="text-center text-[var(--secondary)] py-6">No players yet</p>
            ) : (
              <div className="space-y-1 -mx-5 -my-5">
                {sortedPlayers.map((player, idx) => {
                  const role = playerRole(player)
                  return (
                  <motion.div
                    key={player.id}
                    initial={fadeUp.initial}
                    animate={fadeUp.animate}
                    exit={fadeUp.exit}
                    transition={{ ...spring.std, delay: idx * 0.05 }}
                    onClick={() => navigate(`/tables/${app.selectedTable!.id}/players/${player.userId}`)}
                    className="flex items-center gap-3 px-5 py-4 hover:bg-[var(--card2)] transition-colors cursor-pointer group"
                  >
                    <span className="text-[13px] font-bold text-[var(--secondary)] w-6">#{idx + 1}</span>
                    <Avatar name={player.name} size={36} />
                    <div className="flex-1 min-w-0 flex items-center gap-2">
                      <p className="text-[14px] font-semibold text-[var(--primary)] truncate">{player.name}</p>
                      {role === 'admin'   && <Badge color="gold">Admin</Badge>}
                      {role === 'coadmin' && <Badge color="gold">Co-Admin</Badge>}
                    </div>
                    <p className={`text-[15px] font-semibold font-mono ${earningsColor(player.totalEarnings)}`}>
                      {formatCurrency(player.totalEarnings, true)}
                    </p>
                    <ChevronLeft size={16} className="text-[var(--secondary)] opacity-0 group-hover:opacity-100 -rotate-90 transition-opacity" />
                  </motion.div>
                  )
                })}
              </div>
            )}
          </Card>
        </motion.div>

        {/* Guests Section */}
        {app.guests.length > 0 && (
          <motion.div
            initial={fadeUp.initial}
            animate={fadeUp.animate}
            transition={{ ...spring.std, delay: 0.2 }}
          >
            <SectionLabel>Guests</SectionLabel>
            <Card>
              <div className="space-y-1 -mx-5 -my-5">
                {app.guests.map((guest, idx) => (
                  <motion.button
                    key={guest.id}
                    initial={fadeUp.initial}
                    animate={fadeUp.animate}
                    transition={{ ...spring.std, delay: idx * 0.04 }}
                    onClick={async () => {
                      setSelectedGuest(guest)
                      const entries = await app.fetchGuestEntries(guest.id, guest.tableId)
                      setGuestEntries(entries)
                    }}
                    className="w-full flex items-center gap-3 px-5 py-3 hover:bg-[var(--card2)] transition-colors text-left"
                  >
                    <Avatar name={guest.name} size={36} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-[14px] font-semibold text-[var(--primary)]">{guest.name}</p>
                        {guest.mergedToPlayerId && (
                          <span className="text-[10px] font-semibold text-[var(--secondary)] bg-[var(--card2)] px-2 py-0.5 rounded-full">Merged</span>
                        )}
                      </div>
                      <p className="text-[12px] text-[var(--secondary)]">Guest</p>
                    </div>
                    <span className="text-[12px] text-[var(--secondary)]">›</span>
                  </motion.button>
                ))}
              </div>
            </Card>
          </motion.div>
        )}

        {/* Admin Section */}
        {isAdmin && (
          <motion.div
            initial={fadeUp.initial}
            animate={fadeUp.animate}
            exit={fadeUp.exit}
            transition={{ ...spring.std, delay: 0.25 }}
          >
            <SectionLabel>Admin Panel</SectionLabel>
            <Card className="space-y-3">
              <Button
                fullWidth
                variant="danger"
                onClick={() => setShowDeleteConfirm(true)}
              >
                <Trash2 size={18} />
                Delete Table
              </Button>
            </Card>
          </motion.div>
        )}
      </div>

      {/* Modals */}
      <SessionView
        isOpen={showSessionModal}
        onClose={() => setShowSessionModal(false)}
        session={activeSession}
        onSettle={handleSettleSession}
      />

      <LogEntryModal
        isOpen={showLogEntryModal}
        onClose={() => {
          setShowLogEntryModal(false)
          loadActiveSession()
        }}
        table={app.selectedTable}
        session={activeSession}
      />

      <SettlementModal
        isOpen={showSettlementModal}
        onClose={() => {
          setShowSettlementModal(false)
          loadActiveSession()
        }}
        table={app.selectedTable}
        session={activeSession}
        entries={app.sessionEntries}
      />

      <TableSettlementView
        isOpen={showTableSettlementModal}
        onClose={() => {
          setShowTableSettlementModal(false)
          loadActiveSession()
        }}
      />

      <DisputeFundView
        isOpen={showDisputeFundModal}
        onClose={() => {
          setShowDisputeFundModal(false)
          loadActiveSession()
        }}
      />

      {/* Guest Detail Modal */}
      <Modal
        isOpen={selectedGuest !== null}
        onClose={() => { setSelectedGuest(null); setGuestEntries([]) }}
        title={selectedGuest?.name ?? 'Guest'}
      >
        {selectedGuest && (
          <div className="space-y-5 py-2">
            {/* Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[var(--card2)] rounded-[12px] p-4 text-center">
                <p className="text-[20px] font-semibold font-mono text-[var(--primary)]">
                  {new Set(guestEntries.map((e: any) => e.sessionId)).size}
                </p>
                <p className="text-[12px] text-[var(--secondary)]">Sessions</p>
              </div>
              <div className="bg-[var(--card2)] rounded-[12px] p-4 text-center">
                <p className={`text-[20px] font-semibold font-mono ${earningsColor(guestEntries.reduce((s: number, e: any) => s + e.netAmount, 0))}`}>
                  {formatCurrency(guestEntries.reduce((s: number, e: any) => s + e.netAmount, 0), true)}
                </p>
                <p className="text-[12px] text-[var(--secondary)]">Net P/L</p>
              </div>
            </div>

            {/* Session history */}
            <div>
              <p className="text-[11px] font-semibold text-[var(--secondary)] uppercase tracking-wide mb-2">Session History</p>
              {guestEntries.length === 0 ? (
                <p className="text-[13px] text-[var(--secondary)] text-center py-4">No sessions yet</p>
              ) : (
                <div className="rounded-[14px] border border-[var(--card2)] divide-y divide-[var(--card2)] overflow-hidden">
                  {[...guestEntries].sort((a: any, b: any) => new Date(b.sessionDate).getTime() - new Date(a.sessionDate).getTime())
                    .map((entry: any) => (
                      <div key={entry.id} className="flex items-center justify-between px-4 py-3">
                        <div>
                          <p className="text-[13px] font-medium text-[var(--primary)]">
                            {new Date(entry.sessionDate).toLocaleDateString()}
                          </p>
                          {entry.buyIn > 0 && (
                            <p className="text-[12px] text-[var(--secondary)]">
                              {formatCurrency(entry.buyIn)} → {formatCurrency(entry.finalAmount)}
                            </p>
                          )}
                        </div>
                        <p className={`text-[14px] font-semibold font-mono ${earningsColor(entry.netAmount)}`}>
                          {formatCurrency(entry.netAmount, true)}
                        </p>
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* Merge section (admin only, not yet merged) */}
            {isAdmin && !selectedGuest.mergedToPlayerId && (
              <div>
                <p className="text-[11px] font-semibold text-[var(--secondary)] uppercase tracking-wide mb-2">Merge Account</p>
                <p className="text-[12px] text-[var(--secondary)] mb-3">
                  If {selectedGuest.name} has joined the table, merge their guest history into their account.
                </p>
                <div className="rounded-[14px] border border-[var(--card2)] divide-y divide-[var(--card2)] overflow-hidden">
                  {app.players.map(player => (
                    <button
                      key={player.id}
                      onClick={() => setMergeTarget(player)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[var(--card2)] transition-colors text-left"
                    >
                      <Avatar name={player.name} size={32} />
                      <span className="flex-1 text-[14px] font-medium text-[var(--primary)]">{player.name}</span>
                      <span className="text-[12px] font-semibold text-tabs-green flex items-center gap-1">
                        <GitMerge size={13} /> Merge
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Merge Confirmation */}
      <Modal isOpen={mergeTarget !== null} onClose={() => setMergeTarget(null)} title="Merge Account">
        {mergeTarget && selectedGuest && (
          <div className="space-y-4 py-4">
            <p className="text-[14px] text-[var(--secondary)]">
              All of {selectedGuest.name}'s session history will be added to {mergeTarget.name}'s account. This cannot be undone.
            </p>
            <div className="flex gap-3 pt-2">
              <Button fullWidth variant="secondary" onClick={() => setMergeTarget(null)}>Cancel</Button>
              <Button
                fullWidth
                loading={isMerging}
                onClick={async () => {
                  setIsMerging(true)
                  await app.mergeGuest(selectedGuest, mergeTarget)
                  setIsMerging(false)
                  setMergeTarget(null)
                  setSelectedGuest(null)
                  setGuestEntries([])
                }}
              >
                Confirm Merge
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)} title="Delete Table">
        <div className="space-y-4 py-4">
          <p className="text-[14px] text-[var(--secondary)]">
            Are you sure you want to delete "{app.selectedTable.name}"? This action cannot be undone.
          </p>
          <div className="flex gap-3 pt-4">
            <Button
              fullWidth
              variant="secondary"
              onClick={() => setShowDeleteConfirm(false)}
            >
              Cancel
            </Button>
            <Button
              fullWidth
              variant="danger"
              onClick={() => {
                setShowDeleteConfirm(false)
                handleDeleteTable()
              }}
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
