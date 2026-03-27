// Mirror of Models.swift — identical data shapes so the web app reads/writes
// the same Firestore documents as the iOS app.

export interface AppUser {
  id: string
  name: string
  email: string
}

export interface PokerTable {
  id: string
  name: string
  adminId: string
  coAdminIds: string[]
  referenceCode: string
  memberIds: string[]
  disputedAmount: number
  createdAt: Date
  activeSessionId?: string
  isInSettlement: boolean
  settledPlayerIds: string[]
}

export interface TablePlayer {
  id: string
  userId: string
  name: string
  totalEarnings: number
  lifetimeEarnings: number
  tableId: string
  joinedAt: Date
}

export type SessionStatus = 'active' | 'settling' | 'completed' | 'disputed'

export interface GameSession {
  id: string
  tableId: string
  startedAt: Date
  endedAt?: Date
  status: SessionStatus
  disputedAmount: number
  sessionNumber: number
}

export interface SessionEntry {
  id: string
  sessionId: string
  tableId: string
  playerId: string
  playerName: string
  buyIn: number
  finalAmount: number
  netAmount: number
  submittedAt: Date
  isManualNet: boolean
}

export type DisputeResolution = 'disputeFund' | 'splitEvenly'

// Cross-table analytics (computed once, stored)
export interface TableAnalyticsStat {
  table: PokerTable
  player: TablePlayer
  entries: SessionEntry[]
  totalEarnings: number
  sessionCount: number
  bestSession: number
  worstSession: number
  winRate: number
}

export function buildTableAnalyticsStat(
  table: PokerTable,
  player: TablePlayer,
  entries: SessionEntry[]
): TableAnalyticsStat {
  const sessionCount = entries.length
  const totalEarnings = entries.reduce((s, e) => s + e.netAmount, 0)
  const bestSession = Math.max(0, ...entries.map(e => e.netAmount))
  const worstSession = Math.min(0, ...entries.map(e => e.netAmount))
  const wins = entries.filter(e => e.netAmount > 0).length
  const winRate = sessionCount === 0 ? 0 : wins / sessionCount
  return { table, player, entries, totalEarnings, sessionCount, bestSession, worstSession, winRate }
}

// Helpers (mirror of Double extensions in iOS)
export function formatCurrency(value: number, signed = false): string {
  const abs = Math.abs(value)
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(abs)
  if (!signed) return value < 0 ? `-${formatted}` : formatted
  if (value > 0) return `+${formatted}`
  if (value < 0) return `-${formatted}`
  return formatted
}

export function earningsColor(value: number): string {
  if (value > 0) return 'text-tabs-green'
  if (value < 0) return 'text-tabs-red'
  return 'text-tabs-secondary dark:text-tabs-secondary'
}

export function isAdmin(table: PokerTable, userId: string): boolean {
  return table.adminId === userId || table.coAdminIds.includes(userId)
}
