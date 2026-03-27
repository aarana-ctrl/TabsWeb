import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { Modal } from '../components/ui/Modal'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Avatar, Badge } from '../components/ui/Misc'
import { spring, fadeUp } from '../components/ui/motion'
import { formatCurrency, earningsColor } from '../types/models'

interface TableSettlementViewProps {
  isOpen: boolean
  onClose: () => void
}

export default function TableSettlementView({ isOpen, onClose }: TableSettlementViewProps) {
  const app = useApp()
  const [closing, setClosing] = useState(false)
  const [closed, setClosed] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setClosed(false)
    }
  }, [isOpen])

  if (!app.selectedTable) return null

  const allSettled = app.selectedTable.settledPlayerIds.length === app.players.length
  const pendingCount = app.players.length - app.selectedTable.settledPlayerIds.length

  const handleClose = async () => {
    if (!app.selectedTable) return
    setClosing(true)
    const success = await app.closeTableSettlement(app.selectedTable)
    setClosing(false)
    if (success) {
      setClosed(true)
      setTimeout(() => {
        onClose()
      }, 1500)
    }
  }

  const togglePlayerSettled = async (playerId: string, isSettled: boolean) => {
    if (!app.selectedTable) return
    await app.setPlayerSettled(playerId, app.selectedTable, isSettled)
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Table Settlement">
      <div className="space-y-6 py-4">
        <AnimatePresence mode="wait">
          {!closed ? (
            <motion.div
              key="settlement"
              initial={fadeUp.initial}
              animate={fadeUp.animate}
              exit={fadeUp.exit}
              transition={spring.std}
              className="space-y-6"
            >
              {/* Info */}
              <motion.p
                initial={fadeUp.initial}
                animate={fadeUp.animate}
                transition={{ ...spring.std, delay: 0.05 }}
                className="text-[14px] text-[var(--secondary)]"
              >
                Mark each player's balance as settled. {pendingCount > 0 && `${pendingCount} pending.`}
              </motion.p>

              {/* Players List */}
              <motion.div
                initial={fadeUp.initial}
                animate={fadeUp.animate}
                transition={{ ...spring.std, delay: 0.1 }}
              >
                <Card>
                  <div className="space-y-2 -mx-5 -my-5">
                    {app.players.map((player, idx) => {
                      const isSettled = app.selectedTable!.settledPlayerIds.includes(player.id)
                      return (
                        <motion.button
                          key={player.id}
                          initial={fadeUp.initial}
                          animate={fadeUp.animate}
                          exit={fadeUp.exit}
                          transition={{ ...spring.std, delay: idx * 0.05 }}
                          onClick={() => togglePlayerSettled(player.id, !isSettled)}
                          className={`w-full flex items-center gap-3 px-5 py-4 transition-colors rounded-none ${
                            isSettled ? 'bg-tabs-green/5' : 'hover:bg-[var(--card2)]'
                          } ${idx < app.players.length - 1 ? 'border-b border-[var(--card2)]' : ''}`}
                        >
                          <Avatar name={player.name} size={36} />
                          <div className="flex-1 text-left min-w-0">
                            <p className="text-[14px] font-semibold text-[var(--primary)]">{player.name}</p>
                            <p className={`text-[12px] ${earningsColor(player.totalEarnings)}`}>
                              {player.totalEarnings > 0 ? 'Pays' : 'Receives'} {formatCurrency(Math.abs(player.totalEarnings))}
                            </p>
                          </div>
                          {isSettled && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={spring.bounce}
                              className="w-6 h-6 rounded-full bg-tabs-green flex items-center justify-center flex-shrink-0"
                            >
                              <Check size={14} className="text-white" />
                            </motion.div>
                          )}
                        </motion.button>
                      )
                    })}
                  </div>
                </Card>
              </motion.div>

              {/* Close Button */}
              <motion.div
                initial={fadeUp.initial}
                animate={fadeUp.animate}
                transition={{ ...spring.std, delay: 0.15 }}
                className="pt-4"
              >
                <Button
                  fullWidth
                  onClick={handleClose}
                  loading={closing}
                  disabled={!allSettled}
                >
                  {allSettled ? 'Close Settlement' : `${pendingCount} players pending`}
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
              <p className="text-[18px] font-semibold text-[var(--primary)]">Settlement Complete</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Modal>
  )
}
