import { useEffect, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { Card, AnimatedCard } from '../components/ui/Card'
import { Button, IconButton } from '../components/ui/Button'
import { Avatar, SectionLabel, Badge, Divider } from '../components/ui/Misc'
import { SegmentedControl } from '../components/ui/Misc'
import { spring, fadeUp } from '../components/ui/motion'
import { formatCurrency, earningsColor } from '../types/models'
import type { TableAnalyticsStat } from '../types/models'
import {
  LineChart, BarChart, Line, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Area, AreaChart,
} from 'recharts'

type ChartMode = 'cumulative' | 'perSession'

interface AnalyticsSummary {
  allStats: TableAnalyticsStat[]
  totalNetPnL: number
  totalSessions: number
  overallWinRate: number
  bestSession: number
  worstSession: number
  cumulativeData: any[]
  perSessionData: any[]
}

export default function AnalyticsView() {
  const app = useApp()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<TableAnalyticsStat[]>([])
  const [chartMode, setChartMode] = useState<ChartMode>('cumulative')
  const [showHistory, setShowHistory] = useState(false)

  useEffect(() => {
    const load = async () => {
      const data = await app.fetchMyStatsAcrossAllTables()
      setStats(data)
      setLoading(false)
    }
    load()
  }, [])

  const summary = useMemo((): AnalyticsSummary => {
    const allEntries = stats.flatMap(s => s.entries)
    const totalNetPnL = allEntries.reduce((sum, e) => sum + e.netAmount, 0)
    const totalSessions = new Set(allEntries.map(e => e.sessionId)).size
    const wins = allEntries.filter(e => e.netAmount > 0).length
    const overallWinRate = allEntries.length === 0 ? 0 : wins / allEntries.length

    const sortedByDate = [...allEntries].sort((a, b) => new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime())

    let cumulative = 0
    const cumulativeData = sortedByDate.map(e => {
      cumulative += e.netAmount
      return {
        date: new Date(e.submittedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        value: cumulative,
        timestamp: new Date(e.submittedAt).getTime(),
      }
    })

    const perSessionMap = new Map<string, number>()
    sortedByDate.forEach(e => {
      const key = `S${e.sessionId.substring(0, 8)}`
      perSessionMap.set(key, (perSessionMap.get(key) ?? 0) + e.netAmount)
    })
    const perSessionData = Array.from(perSessionMap.entries()).map(([key, value]) => ({
      session: key,
      value,
    }))

    const bestSession = Math.max(0, ...allEntries.map(e => e.netAmount))
    const worstSession = Math.min(0, ...allEntries.map(e => e.netAmount))

    return {
      allStats: stats,
      totalNetPnL,
      totalSessions,
      overallWinRate,
      bestSession,
      worstSession,
      cumulativeData,
      perSessionData,
    }
  }, [stats])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-dvh">
        <div className="w-8 h-8 border-2 border-[var(--card2)] border-t-[var(--primary)] rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="pb-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={spring.std}
        className="sticky top-0 z-20 bg-[var(--bg)] border-b border-[var(--card2)] px-6 py-4 flex items-center gap-3"
      >
        <h1 className="text-[24px] font-semibold font-display text-[var(--primary)]">Analytics</h1>
      </motion.div>

      <div className="px-6 pt-6 space-y-6">
        {/* Hero Stats */}
        <motion.div
          initial={fadeUp.initial}
          animate={fadeUp.animate}
          transition={spring.std}
        >
          <Card>
            <div className="flex items-center gap-4 pb-4">
              <Avatar name={app.currentUser?.name ?? 'U'} size={48} />
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-semibold text-[var(--primary)]">{app.currentUser?.name}</p>
                <p className="text-[12px] text-[var(--secondary)]">Across {summary.allStats.length} tables</p>
              </div>
            </div>
            <Divider className="my-4" />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[12px] text-[var(--secondary)] font-medium">Net P&L</p>
                <p className={`text-[20px] font-semibold font-mono ${earningsColor(summary.totalNetPnL)}`}>
                  {formatCurrency(summary.totalNetPnL, true)}
                </p>
              </div>
              <div
                onClick={() => setShowHistory(!showHistory)}
                className="cursor-pointer"
              >
                <p className="text-[12px] text-[var(--secondary)] font-medium">Sessions</p>
                <p className="text-[20px] font-semibold font-mono text-[var(--primary)]">
                  {summary.totalSessions}
                </p>
              </div>
              <div>
                <p className="text-[12px] text-[var(--secondary)] font-medium">Win Rate</p>
                <p className="text-[20px] font-semibold font-mono text-tabs-green">
                  {(summary.overallWinRate * 100).toFixed(0)}%
                </p>
              </div>
              <div>
                <p className="text-[12px] text-[var(--secondary)] font-medium">Best Session</p>
                <p className={`text-[20px] font-semibold font-mono ${earningsColor(summary.bestSession)}`}>
                  {formatCurrency(summary.bestSession, true)}
                </p>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Chart */}
        {summary.cumulativeData.length > 0 && (
          <motion.div
            initial={fadeUp.initial}
            animate={fadeUp.animate}
            transition={{ ...spring.std, delay: 0.1 }}
          >
            <div className="flex items-center justify-between mb-4">
              <SectionLabel>Performance</SectionLabel>
              <SegmentedControl
                options={[
                  { label: 'Cumulative', value: 'cumulative' },
                  { label: 'Per Session', value: 'perSession' },
                ]}
                value={chartMode}
                onChange={m => setChartMode(m as ChartMode)}
              />
            </div>
            <Card className="p-0 overflow-hidden">
              <ResponsiveContainer width="100%" height={300}>
                {chartMode === 'cumulative' ? (
                  <AreaChart data={summary.cumulativeData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3DBF71" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#3DBF71" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--card2)" />
                    <XAxis dataKey="date" stroke="var(--secondary)" style={{ fontSize: '12px' }} />
                    <YAxis stroke="var(--secondary)" style={{ fontSize: '12px' }} />
                    <Tooltip
                      contentStyle={{
                        background: 'var(--card)',
                        border: '1px solid var(--card2)',
                        borderRadius: '8px',
                      }}
                      formatter={(value: number) => formatCurrency(value, true)}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="#3DBF71"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorValue)"
                    />
                  </AreaChart>
                ) : (
                  <BarChart data={summary.perSessionData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--card2)" />
                    <XAxis dataKey="session" stroke="var(--secondary)" style={{ fontSize: '12px' }} />
                    <YAxis stroke="var(--secondary)" style={{ fontSize: '12px' }} />
                    <Tooltip
                      contentStyle={{
                        background: 'var(--card)',
                        border: '1px solid var(--card2)',
                        borderRadius: '8px',
                      }}
                      formatter={(value: number) => formatCurrency(value, true)}
                    />
                    <Bar
                      dataKey="value"
                      fill="#3DBF71"
                      radius={[8, 8, 0, 0]}
                    />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </Card>
          </motion.div>
        )}

        {/* Per-Table Breakdown */}
        {summary.allStats.length > 0 && (
          <motion.div
            initial={fadeUp.initial}
            animate={fadeUp.animate}
            transition={{ ...spring.std, delay: 0.15 }}
          >
            <SectionLabel>By Table</SectionLabel>
            <div className="space-y-3">
              {summary.allStats.map((stat, idx) => (
                <motion.div
                  key={stat.table.id}
                  initial={fadeUp.initial}
                  animate={fadeUp.animate}
                  exit={fadeUp.exit}
                  transition={{ ...spring.std, delay: idx * 0.05 }}
                >
                  <Card className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-[15px] font-semibold text-[var(--primary)]">{stat.table.name}</h3>
                      <Badge>{stat.sessionCount} sessions</Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <p className="text-[11px] text-[var(--secondary)] font-medium">Earnings</p>
                        <p className={`text-[15px] font-semibold font-mono ${earningsColor(stat.totalEarnings)}`}>
                          {formatCurrency(stat.totalEarnings, true)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[11px] text-[var(--secondary)] font-medium">Win Rate</p>
                        <p className="text-[15px] font-semibold font-mono text-tabs-green">
                          {(stat.winRate * 100).toFixed(0)}%
                        </p>
                      </div>
                      <div>
                        <p className="text-[11px] text-[var(--secondary)] font-medium">Best</p>
                        <p className={`text-[15px] font-semibold font-mono ${earningsColor(stat.bestSession)}`}>
                          {formatCurrency(stat.bestSession, true)}
                        </p>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Session History Drawer */}
        <AnimatePresence>
          {showHistory && (
            <motion.div
              initial={{ opacity: 0, y: '100%' }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: '100%' }}
              transition={spring.fluid}
              className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px]"
              onClick={() => setShowHistory(false)}
            >
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={spring.fluid}
                className="fixed inset-x-0 bottom-0 bg-[var(--bg)] rounded-t-sheet max-h-[80dvh] overflow-y-auto"
                onClick={e => e.stopPropagation()}
              >
                <div className="flex justify-center pt-3 pb-1">
                  <div className="w-10 h-[4px] rounded-full bg-[var(--secondary)]/30" />
                </div>
                <div className="px-6 py-4">
                  <h2 className="text-[20px] font-semibold font-display text-[var(--primary)] mb-4">
                    Session History
                  </h2>
                  <div className="space-y-2">
                    {summary.allStats.flatMap(stat =>
                      stat.entries
                        .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
                        .map(entry => (
                          <div key={entry.id} className="flex items-center justify-between p-3 rounded-btn hover:bg-[var(--card2)] transition-colors">
                            <div>
                              <p className="text-[14px] font-semibold text-[var(--primary)]">{stat.table.name}</p>
                              <p className="text-[12px] text-[var(--secondary)]">
                                {new Date(entry.submittedAt).toLocaleDateString()}
                              </p>
                            </div>
                            <p className={`text-[14px] font-semibold font-mono ${earningsColor(entry.netAmount)}`}>
                              {formatCurrency(entry.netAmount, true)}
                            </p>
                          </div>
                        ))
                    )}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
