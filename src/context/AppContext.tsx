// AppContext — web equivalent of AppViewModel.swift.
// Provides global state + actions via React Context + Zustand-style slice.

import React, { createContext, useContext, useEffect, useRef, useState } from 'react'
import type { User as FirebaseUser } from 'firebase/auth'
import * as svc from '../firebase/service'
import type {
  AppUser, PokerTable, TablePlayer, GameSession, SessionEntry,
  DisputeResolution, TableAnalyticsStat,
} from '../types/models'
import { buildTableAnalyticsStat } from '../types/models'

interface AppState {
  currentUser:    AppUser | null
  isLoggedIn:     boolean
  authLoading:    boolean
  authError:      string | null

  tables:         PokerTable[]
  isLoadingTables: boolean

  selectedTable:  PokerTable | null
  players:        TablePlayer[]

  sessionEntries: SessionEntry[]

  errorMessage:   string | null
  isDarkMode:     boolean
}

interface AppActions {
  signInWithGoogle:  () => Promise<void>
  signInWithApple:   () => Promise<void>
  signOut:           () => void

  loadTables:        () => Promise<void>
  createTable:       (name: string) => Promise<PokerTable | null>
  joinTable:         (code: string) => Promise<PokerTable | null>
  deleteTable:       (table: PokerTable) => Promise<void>

  selectTable:       (table: PokerTable) => void
  stopListeners:     () => void

  startSession:      (table: PokerTable) => Promise<void>
  fetchActiveSession:(tableId: string) => Promise<GameSession | null>

  startEntryListener:(tableId: string, sessionId: string) => void
  clearEntryListener: () => void
  submitEntry:        (entry: SessionEntry) => Promise<boolean>
  updateEntry:        (entry: SessionEntry) => Promise<boolean>

  settleSession:      (session: GameSession, entries: SessionEntry[], resolution: DisputeResolution, disputeAmount: number) => Promise<boolean>
  resetSession:       (session: GameSession) => Promise<void>

  fetchPlayerHistory:  (playerId: string, tableId: string) => Promise<SessionEntry[]>
  fetchMyStatsAcrossAllTables: () => Promise<TableAnalyticsStat[]>
  fetchDisputedSessions: (tableId: string) => Promise<GameSession[]>

  promoteToCoAdmin:   (userId: string, table: PokerTable) => Promise<void>
  demoteCoAdmin:      (userId: string, table: PokerTable) => Promise<void>

  startTableSettlement:  (table: PokerTable) => Promise<void>
  cancelTableSettlement: (table: PokerTable) => Promise<void>
  setPlayerSettled:      (playerId: string, table: PokerTable, isSettled: boolean) => Promise<void>
  closeTableSettlement:  (table: PokerTable) => Promise<boolean>

  settleDisputeSplit: (table: PokerTable) => Promise<boolean>
  resetDisputeFund:   (tableId: string) => Promise<boolean>

  setDarkMode:       (v: boolean) => void
  clearError:        () => void
  isAdmin:           (table: PokerTable) => boolean
  currentPlayer:     (tableId: string) => TablePlayer | undefined
}

type AppContextType = AppState & AppActions

const AppCtx = createContext<AppContextType | null>(null)

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>({
    currentUser: null, isLoggedIn: false, authLoading: true, authError: null,
    tables: [], isLoadingTables: false,
    selectedTable: null, players: [],
    sessionEntries: [],
    errorMessage: null,
    isDarkMode: localStorage.getItem('tabs_dark_mode') === 'true',
  })

  const set = (patch: Partial<AppState>) => setState(s => ({ ...s, ...patch }))

  // Dark-mode side-effect
  useEffect(() => {
    if (state.isDarkMode) document.documentElement.classList.add('dark')
    else document.documentElement.classList.remove('dark')
    localStorage.setItem('tabs_dark_mode', String(state.isDarkMode))
  }, [state.isDarkMode])

  // Firestore listeners (keep refs so we can remove them)
  const tableUnsub   = useRef<(() => void) | null>(null)
  const playerUnsub  = useRef<(() => void) | null>(null)
  const entryUnsub   = useRef<(() => void) | null>(null)

  const stopListeners = () => {
    tableUnsub.current?.(); tableUnsub.current = null
    playerUnsub.current?.(); playerUnsub.current = null
    entryUnsub.current?.(); entryUnsub.current = null
  }

  // Auth listener
  useEffect(() => {
    const unsub = svc.listenToAuthState(async (firebaseUser: FirebaseUser | null) => {
      if (!firebaseUser) {
        stopListeners()
        set({ currentUser: null, isLoggedIn: false, authLoading: false, tables: [] })
        return
      }
      const stored = await svc.fetchUser(firebaseUser.uid)
      const user: AppUser = stored ?? {
        id: firebaseUser.uid,
        name: firebaseUser.displayName ?? 'Player',
        email: firebaseUser.email ?? '',
      }
      set({ currentUser: user, isLoggedIn: true, authLoading: false })
      // load tables
      const tables = await svc.fetchTables(user.id)
      set({ tables })
    })
    return unsub
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const actions: AppActions = {
    // ── Auth ──────────────────────────────────────────────────────────────────
    signInWithGoogle: async () => {
      try {
        set({ authError: null })
        const fu = await svc.signInWithGoogle()
        const isNew = !await svc.fetchUser(fu.uid)
        if (isNew) {
          await svc.saveUser({ id: fu.uid, name: fu.displayName ?? 'Player', email: fu.email ?? '' })
        }
      } catch (e) { set({ authError: (e as Error).message }) }
    },
    signInWithApple: async () => {
      try {
        set({ authError: null })
        const fu = await svc.signInWithApple()
        const isNew = !await svc.fetchUser(fu.uid)
        if (isNew) {
          await svc.saveUser({ id: fu.uid, name: fu.displayName ?? 'Player', email: fu.email ?? '' })
        }
      } catch (e) { set({ authError: (e as Error).message }) }
    },
    signOut: () => { svc.signOut().catch(e => set({ errorMessage: (e as Error).message })) },

    // ── Tables ────────────────────────────────────────────────────────────────
    loadTables: async () => {
      if (!state.currentUser) return
      set({ isLoadingTables: true })
      try {
        const tables = await svc.fetchTables(state.currentUser.id)
        set({ tables })
      } catch (e) { set({ errorMessage: (e as Error).message }) }
      finally { set({ isLoadingTables: false }) }
    },
    createTable: async (name: string) => {
      const user = state.currentUser
      if (!user) return null
      const table: PokerTable = {
        id: crypto.randomUUID(), name, adminId: user.id, coAdminIds: [],
        referenceCode: String(Math.floor(100000 + Math.random() * 900000)),
        memberIds: [user.id], disputedAmount: 0, createdAt: new Date(),
        isInSettlement: false, settledPlayerIds: [],
      }
      try {
        await svc.createTable(table)
        const player: TablePlayer = {
          id: crypto.randomUUID(), userId: user.id, name: user.name,
          totalEarnings: 0, lifetimeEarnings: 0, tableId: table.id, joinedAt: new Date(),
        }
        await svc.addPlayer(player)
        set({ tables: [...state.tables, table] })
        return table
      } catch (e) { set({ errorMessage: (e as Error).message }); return null }
    },
    joinTable: async (code: string) => {
      const user = state.currentUser
      if (!user) return null
      try {
        const table = await svc.fetchTableByCode(code)
        if (!table) { set({ errorMessage: 'No table found with that code.' }); return null }
        if (table.memberIds.includes(user.id)) { set({ errorMessage: 'You are already in this table.' }); return null }
        await svc.addMember(user.id, table.id)
        const player: TablePlayer = {
          id: crypto.randomUUID(), userId: user.id, name: user.name,
          totalEarnings: 0, lifetimeEarnings: 0, tableId: table.id, joinedAt: new Date(),
        }
        await svc.addPlayer(player)
        table.memberIds.push(user.id)
        if (!state.tables.find(t => t.id === table.id)) set({ tables: [...state.tables, table] })
        return table
      } catch (e) { set({ errorMessage: (e as Error).message }); return null }
    },
    deleteTable: async (table: PokerTable) => {
      try {
        await svc.deleteTable(table.id)
        set({ tables: state.tables.filter(t => t.id !== table.id) })
      } catch (e) { set({ errorMessage: (e as Error).message }) }
    },

    // ── Table Detail ──────────────────────────────────────────────────────────
    selectTable: (table: PokerTable) => {
      stopListeners()
      set({ selectedTable: table, players: [] })
      tableUnsub.current = svc.listenToTable(table.id, t => {
        if (!t) return
        setState(s => ({
          ...s,
          selectedTable: t,
          tables: s.tables.map(x => x.id === t.id ? t : x),
        }))
      })
      playerUnsub.current = svc.listenToPlayers(table.id, players => {
        setState(s => ({ ...s, players }))
      })
    },
    stopListeners,

    // ── Sessions ──────────────────────────────────────────────────────────────
    startSession: async (table: PokerTable) => {
      try {
        const sessionCount = await svc.countSessions(table.id)
        const session: GameSession = {
          id: crypto.randomUUID(), tableId: table.id, status: 'active',
          sessionNumber: sessionCount + 1, disputedAmount: 0, startedAt: new Date(),
        }
        await svc.createSession(session)
      } catch (e) { set({ errorMessage: (e as Error).message }) }
    },
    fetchActiveSession: async (tableId: string) => {
      try {
        const fresh = await svc.fetchTable(tableId)
        if (fresh) {
          setState(s => ({
            ...s,
            selectedTable: fresh,
            tables: s.tables.map(t => t.id === fresh.id ? fresh : t),
          }))
        }
        const sessionId = (fresh ?? state.selectedTable)?.activeSessionId
        if (!sessionId) return null
        return svc.fetchSession(tableId, sessionId)
      } catch { return null }
    },

    // ── Entries ───────────────────────────────────────────────────────────────
    startEntryListener: (tableId, sessionId) => {
      entryUnsub.current?.()
      entryUnsub.current = svc.listenToEntries(tableId, sessionId, entries => {
        setState(s => ({ ...s, sessionEntries: entries }))
      })
    },
    clearEntryListener: () => {
      entryUnsub.current?.(); entryUnsub.current = null
      set({ sessionEntries: [] })
    },
    submitEntry: async (entry: SessionEntry) => {
      try { await svc.submitEntry(entry); return true }
      catch (e) { set({ errorMessage: (e as Error).message }); return false }
    },
    updateEntry: async (entry: SessionEntry) => {
      try { await svc.submitEntry(entry); return true }
      catch (e) { set({ errorMessage: (e as Error).message }); return false }
    },

    // ── Settlement ────────────────────────────────────────────────────────────
    settleSession: async (session, entries, resolution, disputeAmount) => {
      try {
        const loggedToFund = resolution === 'disputeFund' && disputeAmount !== 0
        const status = loggedToFund ? 'disputed' : ('completed' as const)
        const splitPer = resolution === 'splitEvenly' && disputeAmount !== 0
          ? disputeAmount / entries.length : 0
        const earningDeltas = entries.map(e => ({ playerId: e.playerId, delta: e.netAmount - splitPer }))
        await svc.settleSessionBatch({
          sessionId: session.id, tableId: session.tableId, status,
          sessionDisputedAmount: loggedToFund ? disputeAmount : 0,
          earningDeltas,
          tableDisputeDelta: loggedToFund ? disputeAmount : 0,
        })
        const fresh = await svc.fetchPlayers(session.tableId)
        setState(s => ({ ...s, players: fresh.sort((a, b) => b.totalEarnings - a.totalEarnings) }))
        return true
      } catch (e) { set({ errorMessage: (e as Error).message }); return false }
    },
    resetSession: async (session: GameSession) => {
      try { await svc.resetSession(session.id, session.tableId) }
      catch (e) { set({ errorMessage: (e as Error).message }) }
    },

    // ── Analytics ─────────────────────────────────────────────────────────────
    fetchPlayerHistory: async (playerId, tableId) => {
      try { return await svc.fetchAllEntries(tableId, playerId) }
      catch { return [] }
    },
    fetchMyStatsAcrossAllTables: async () => {
      const userId = state.currentUser?.id
      if (!userId) return []
      const results = await Promise.allSettled(
        state.tables.map(async table => {
          const player = await svc.fetchMyPlayer(table.id, userId)
          if (!player) return null
          const entries = await svc.fetchAllEntries(table.id, player.id)
          return buildTableAnalyticsStat(table, player, entries)
        })
      )
      return results
        .filter((r): r is PromiseFulfilledResult<TableAnalyticsStat> => r.status === 'fulfilled' && r.value !== null)
        .map(r => r.value)
        .sort((a, b) => a.table.name.localeCompare(b.table.name))
    },
    fetchDisputedSessions: async (tableId) => {
      try { return await svc.fetchDisputedSessions(tableId) }
      catch { return [] }
    },

    // ── Co-admins ─────────────────────────────────────────────────────────────
    promoteToCoAdmin: async (userId, table) => {
      if (table.coAdminIds.includes(userId)) return
      try { await svc.updateCoAdmins(table.id, [...table.coAdminIds, userId]) }
      catch (e) { set({ errorMessage: (e as Error).message }) }
    },
    demoteCoAdmin: async (userId, table) => {
      try { await svc.updateCoAdmins(table.id, table.coAdminIds.filter(id => id !== userId)) }
      catch (e) { set({ errorMessage: (e as Error).message }) }
    },

    // ── Table Settlement ──────────────────────────────────────────────────────
    startTableSettlement: async (table) => {
      try { await svc.startTableSettlement(table.id) }
      catch (e) { set({ errorMessage: (e as Error).message }) }
    },
    cancelTableSettlement: async (table) => {
      try { await svc.cancelTableSettlement(table.id) }
      catch (e) { set({ errorMessage: (e as Error).message }) }
    },
    setPlayerSettled: async (playerId, table, isSettled) => {
      try { await svc.setPlayerSettled(playerId, table.id, isSettled) }
      catch (e) { set({ errorMessage: (e as Error).message }) }
    },
    closeTableSettlement: async (table) => {
      try {
        await svc.closeTableSettlement(table.id, state.players)
        const fresh = await svc.fetchPlayers(table.id)
        setState(s => ({ ...s, players: fresh.sort((a, b) => b.totalEarnings - a.totalEarnings) }))
        return true
      } catch (e) { set({ errorMessage: (e as Error).message }); return false }
    },

    // ── Dispute Fund ──────────────────────────────────────────────────────────
    settleDisputeSplit: async (table) => {
      if (!state.players.length) return false
      const share = table.disputedAmount / state.players.length
      try {
        await svc.batchUpdatePlayerEarnings(state.players.map(p => ({ playerId: p.id, delta: share })), table.id)
        await svc.setDisputedAmount(0, table.id)
        const fresh = await svc.fetchPlayers(table.id)
        setState(s => ({ ...s, players: fresh.sort((a, b) => b.totalEarnings - a.totalEarnings) }))
        return true
      } catch (e) { set({ errorMessage: (e as Error).message }); return false }
    },
    resetDisputeFund: async (tableId) => {
      try { await svc.setDisputedAmount(0, tableId); return true }
      catch (e) { set({ errorMessage: (e as Error).message }); return false }
    },

    // ── Misc ──────────────────────────────────────────────────────────────────
    setDarkMode: (v) => set({ isDarkMode: v }),
    clearError: () => set({ errorMessage: null, authError: null }),
    isAdmin: (table) => {
      const uid = state.currentUser?.id
      return !!uid && (table.adminId === uid || table.coAdminIds.includes(uid))
    },
    currentPlayer: (tableId) => {
      const uid = state.currentUser?.id
      return state.players.find(p => p.userId === uid && p.tableId === tableId)
    },
  }

  return <AppCtx.Provider value={{ ...state, ...actions }}>{children}</AppCtx.Provider>
}

export function useApp(): AppContextType {
  const ctx = useContext(AppCtx)
  if (!ctx) throw new Error('useApp must be inside AppProvider')
  return ctx
}
