import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, LogIn, Plus as PlusIcon, ChevronRight, Users, Zap } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { Card, AnimatedCard } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { TextInput } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { Badge, EmptyState, SectionLabel, LiveDot, Avatar } from '../components/ui/Misc'
import { spring, scalePop } from '../components/ui/motion'
import { formatCurrency } from '../types/models'

export default function HomeView() {
  const app = useApp()
  const navigate = useNavigate()
  const [fabOpen, setFabOpen] = useState(false)
  const [joinCode, setJoinCode] = useState('')
  const [tableName, setTableName] = useState('')
  const [joinModalOpen, setJoinModalOpen] = useState(false)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [joinLoading, setJoinLoading] = useState(false)
  const [createLoading, setCreateLoading] = useState(false)

  useEffect(() => {
    app.loadTables()
  }, [])

  const handleJoinTable = useCallback(async () => {
    if (!joinCode.trim()) return
    setJoinLoading(true)
    const result = await app.joinTable(joinCode)
    setJoinLoading(false)
    if (result) {
      setJoinCode('')
      setJoinModalOpen(false)
      setFabOpen(false)
    }
  }, [joinCode, app])

  const handleCreateTable = useCallback(async () => {
    if (!tableName.trim()) return
    setCreateLoading(true)
    const result = await app.createTable(tableName)
    setCreateLoading(false)
    if (result) {
      setTableName('')
      setCreateModalOpen(false)
      setFabOpen(false)
    }
  }, [tableName, app])

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
  }

  return (
    <div className="pb-24 md:pb-8">
      {/* Hero Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={spring.std}
        className="px-6 pt-8 pb-6"
      >
        <h1 className="text-[36px] font-bold font-display text-[var(--primary)]">
          {getGreeting()}, {app.currentUser?.name?.split(' ')[0] || 'Player'}
        </h1>
      </motion.div>

      {/* Analytics Strip */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...spring.std, delay: 0.1 }}
        className="px-6 mb-8"
      >
        <Card
          onClick={() => navigate('/analytics')}
          className="cursor-pointer flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <Zap className="w-6 h-6 text-tabs-green" />
            <div>
              <p className="text-[13px] text-[var(--secondary)] font-medium">My Analytics</p>
              <p className="text-[15px] font-semibold text-[var(--primary)]">View stats across all tables</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-[var(--secondary)] group-hover:translate-x-1 transition-transform" />
        </Card>
      </motion.div>

      {/* Tables Section */}
      <div className="px-6">
        <SectionLabel>YOUR TABLES</SectionLabel>

        {app.isLoadingTables ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-[var(--card2)] border-t-[var(--primary)] rounded-full animate-spin" />
          </div>
        ) : app.tables.length === 0 ? (
          <EmptyState
            icon={<Users size={40} />}
            title="No tables yet"
            subtitle="Create a new table or join an existing one to get started"
          />
        ) : (
          <motion.div className="space-y-3" layout>
            <AnimatePresence>
              {app.tables.map((table, idx) => (
                <motion.div
                  key={table.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ ...spring.std, delay: idx * 0.05 }}
                >
                  <TableRowCard table={table} />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      {/* Floating Action Button */}
      <motion.div className="fixed bottom-6 right-6 md:bottom-8 md:right-8 z-20">
        <AnimatePresence>
          {fabOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0"
                onClick={() => setFabOpen(false)}
              />

              {/* Menu Items */}
              <motion.button
                {...scalePop}
                onClick={() => {
                  setJoinModalOpen(true)
                  setFabOpen(false)
                }}
                className="absolute bottom-16 right-0 glass rounded-pill px-4 py-3 flex items-center gap-2 text-[15px] font-semibold text-[var(--primary)] whitespace-nowrap"
              >
                <LogIn size={18} />
                Join Table
              </motion.button>

              <motion.button
                {...scalePop}
                transition={{ ...spring.bounce, delay: 0.05 }}
                onClick={() => {
                  setCreateModalOpen(true)
                  setFabOpen(false)
                }}
                className="absolute bottom-32 right-0 glass rounded-pill px-4 py-3 flex items-center gap-2 text-[15px] font-semibold text-[var(--primary)] whitespace-nowrap"
              >
                <PlusIcon size={18} />
                Create Table
              </motion.button>
            </>
          )}
        </AnimatePresence>

        {/* FAB Button */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setFabOpen(!fabOpen)}
          className={`w-14 h-14 rounded-full flex items-center justify-center font-semibold text-white shadow-lg transition-colors ${
            fabOpen ? 'bg-[var(--secondary)] scale-125' : 'bg-tabs-green'
          }`}
        >
          <motion.div
            animate={{ rotate: fabOpen ? 45 : 0 }}
            transition={spring.snap}
          >
            <Plus size={24} />
          </motion.div>
        </motion.button>
      </motion.div>

      {/* Join Table Modal */}
      <Modal isOpen={joinModalOpen} onClose={() => setJoinModalOpen(false)} title="Join Table">
        <div className="space-y-4 py-4">
          <p className="text-[14px] text-[var(--secondary)]">Enter the table reference code to join</p>
          <TextInput
            label="Reference Code"
            value={joinCode}
            onChange={e => setJoinCode(e.target.value)}
            placeholder="e.g., 123456"
            autoCapitalize="off"
            autoCorrect="off"
          />
          <Button
            fullWidth
            onClick={handleJoinTable}
            loading={joinLoading}
            disabled={!joinCode.trim()}
          >
            Join Table
          </Button>
        </div>
      </Modal>

      {/* Create Table Modal */}
      <Modal isOpen={createModalOpen} onClose={() => setCreateModalOpen(false)} title="Create Table">
        <div className="space-y-4 py-4">
          <p className="text-[14px] text-[var(--secondary)]">Give your table a name</p>
          <TextInput
            label="Table Name"
            value={tableName}
            onChange={e => setTableName(e.target.value)}
            placeholder="e.g., Weekly Poker"
          />
          <Button
            fullWidth
            onClick={handleCreateTable}
            loading={createLoading}
            disabled={!tableName.trim()}
          >
            Create Table
          </Button>
        </div>
      </Modal>

      {/* Error Snackbar */}
      {app.errorMessage && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed bottom-6 left-6 right-6 md:max-w-sm md:left-auto bg-tabs-red text-white px-4 py-3 rounded-btn text-[14px] font-medium"
        >
          {app.errorMessage}
        </motion.div>
      )}
    </div>
  )
}

function TableRowCard({ table }: { table: any }) {
  const navigate = useNavigate()

  return (
    <Card
      onClick={() => navigate(`/tables/${table.id}`)}
      className="cursor-pointer flex items-center justify-between group"
    >
      <div className="flex-1 min-w-0">
        <p className="text-[15px] font-semibold text-[var(--primary)]">{table.name}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[13px] text-[var(--secondary)]">{table.memberIds.length} members</span>
          {table.activeSessionId && <LiveDot />}
          {table.disputedAmount > 0 && (
            <Badge color="orange">{formatCurrency(table.disputedAmount)}</Badge>
          )}
        </div>
      </div>
      <ChevronRight className="w-5 h-5 text-[var(--secondary)] flex-shrink-0 group-hover:translate-x-1 transition-transform" />
    </Card>
  )
}
