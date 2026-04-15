// FirebaseService.ts — mirrors FirebaseService.swift exactly.
// Same collection paths, same field names, same batch/aggregation patterns.

import {
  collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc,
  query, where, orderBy, onSnapshot, writeBatch, runTransaction,
  serverTimestamp, Timestamp, increment, arrayUnion, arrayRemove,
  getAggregateFromServer, count, type Unsubscribe,
} from 'firebase/firestore'
import {
  GoogleAuthProvider, OAuthProvider,
  signInWithPopup, signOut as fbSignOut,
  onAuthStateChanged, type User as FirebaseUser,
} from 'firebase/auth'
import { db, auth } from './config'
import type { AppUser, PokerTable, TablePlayer, GameSession, SessionEntry, SessionStatus, TableGuest, GuestEntry } from '../types/models'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toDate(v: unknown): Date {
  if (v instanceof Timestamp) return v.toDate()
  if (v instanceof Date)      return v
  return new Date()
}

function docToUser(id: string, d: Record<string, unknown>): AppUser {
  return { id, name: String(d.name ?? ''), email: String(d.email ?? '') }
}

function docToTable(id: string, d: Record<string, unknown>): PokerTable {
  return {
    id,
    name:              String(d.name ?? ''),
    adminId:           String(d.adminId ?? ''),
    coAdminIds:        Array.isArray(d.coAdminIds)        ? d.coAdminIds        : [],
    referenceCode:     String(d.referenceCode ?? ''),
    memberIds:         Array.isArray(d.memberIds)         ? d.memberIds         : [],
    disputedAmount:    Number(d.disputedAmount ?? 0),
    createdAt:         toDate(d.createdAt),
    activeSessionId:   d.activeSessionId as string | undefined,
    isInSettlement:    Boolean(d.isInSettlement ?? false),
    settledPlayerIds:  Array.isArray(d.settledPlayerIds)  ? d.settledPlayerIds  : [],
  }
}

function docToPlayer(id: string, d: Record<string, unknown>): TablePlayer {
  return {
    id,
    userId:           String(d.userId ?? ''),
    name:             String(d.name ?? ''),
    totalEarnings:    Number(d.totalEarnings ?? 0),
    lifetimeEarnings: Number(d.lifetimeEarnings ?? 0),
    tableId:          String(d.tableId ?? ''),
    joinedAt:         toDate(d.joinedAt),
  }
}

function docToSession(id: string, d: Record<string, unknown>): GameSession {
  return {
    id,
    tableId:        String(d.tableId ?? ''),
    startedAt:      toDate(d.startedAt),
    endedAt:        d.endedAt ? toDate(d.endedAt) : undefined,
    status:         (d.status as SessionStatus) ?? 'active',
    disputedAmount: Number(d.disputedAmount ?? 0),
    sessionNumber:  Number(d.sessionNumber ?? 1),
  }
}

function docToEntry(id: string, d: Record<string, unknown>): SessionEntry {
  return {
    id,
    sessionId:    String(d.sessionId ?? ''),
    tableId:      String(d.tableId ?? ''),
    playerId:     String(d.playerId ?? ''),
    playerName:   String(d.playerName ?? ''),
    buyIn:        Number(d.buyIn ?? 0),
    finalAmount:  Number(d.finalAmount ?? 0),
    netAmount:    Number(d.netAmount ?? 0),
    submittedAt:  toDate(d.submittedAt),
    isManualNet:  Boolean(d.isManualNet ?? false),
  }
}

// ─── Helpers (guests) ─────────────────────────────────────────────────────────

function docToGuest(id: string, d: Record<string, unknown>): TableGuest {
  return {
    id,
    tableId:          String(d.tableId ?? ''),
    name:             String(d.name ?? ''),
    addedBy:          String(d.addedBy ?? ''),
    addedAt:          toDate(d.addedAt),
    mergedToPlayerId: d.mergedToPlayerId ? String(d.mergedToPlayerId) : undefined,
  }
}

function docToGuestEntry(id: string, d: Record<string, unknown>): GuestEntry {
  return {
    id,
    guestId:     String(d.guestId ?? ''),
    tableId:     String(d.tableId ?? ''),
    sessionId:   String(d.sessionId ?? ''),
    sessionDate: toDate(d.sessionDate),
    buyIn:       Number(d.buyIn ?? 0),
    finalAmount: Number(d.finalAmount ?? 0),
    netAmount:   Number(d.netAmount ?? 0),
    isManualNet: Boolean(d.isManualNet ?? false),
    submittedAt: toDate(d.submittedAt),
  }
}

// ─── Refs ─────────────────────────────────────────────────────────────────────

const usersRef       = () => collection(db, 'users')
const tablesRef      = () => collection(db, 'tables')
const playersRef     = (tableId: string) => collection(db, 'tables', tableId, 'players')
const sessionsRef    = (tableId: string) => collection(db, 'tables', tableId, 'sessions')
const entriesRef     = (tableId: string, sessionId: string) =>
  collection(db, 'tables', tableId, 'sessions', sessionId, 'entries')
const guestsRef      = (tableId: string) => collection(db, 'tables', tableId, 'guests')
const guestEntriesRef = (tableId: string) => collection(db, 'tables', tableId, 'guestEntries')

// ─── Auth ─────────────────────────────────────────────────────────────────────

export function listenToAuthState(cb: (user: FirebaseUser | null) => void): Unsubscribe {
  return onAuthStateChanged(auth, cb)
}

export async function signInWithGoogle(): Promise<FirebaseUser> {
  const provider = new GoogleAuthProvider()
  const result = await signInWithPopup(auth, provider)
  return result.user
}

export async function signInWithApple(): Promise<FirebaseUser> {
  const provider = new OAuthProvider('apple.com')
  provider.addScope('name')
  provider.addScope('email')
  const result = await signInWithPopup(auth, provider)
  return result.user
}

export function signOut(): Promise<void> {
  return fbSignOut(auth)
}

// ─── Users ────────────────────────────────────────────────────────────────────

export async function fetchUser(id: string): Promise<AppUser | null> {
  const snap = await getDoc(doc(usersRef(), id))
  if (!snap.exists()) return null
  return docToUser(snap.id, snap.data() as Record<string, unknown>)
}

export async function saveUser(user: AppUser): Promise<void> {
  await setDoc(doc(usersRef(), user.id), { name: user.name, email: user.email }, { merge: true })
}

// ─── Tables ───────────────────────────────────────────────────────────────────

export async function fetchTables(userId: string): Promise<PokerTable[]> {
  const q = query(tablesRef(), where('memberIds', 'array-contains', userId))
  const snap = await getDocs(q)
  return snap.docs.map(d => docToTable(d.id, d.data() as Record<string, unknown>))
}

export async function fetchTable(id: string): Promise<PokerTable | null> {
  const snap = await getDoc(doc(tablesRef(), id))
  if (!snap.exists()) return null
  return docToTable(snap.id, snap.data() as Record<string, unknown>)
}

export async function fetchTableByCode(code: string): Promise<PokerTable | null> {
  const q = query(tablesRef(), where('referenceCode', '==', code))
  const snap = await getDocs(q)
  if (snap.empty) return null
  const d = snap.docs[0]
  return docToTable(d.id, d.data() as Record<string, unknown>)
}

export async function createTable(table: PokerTable): Promise<void> {
  await setDoc(doc(tablesRef(), table.id), {
    name: table.name, adminId: table.adminId, coAdminIds: table.coAdminIds,
    referenceCode: table.referenceCode, memberIds: table.memberIds,
    disputedAmount: table.disputedAmount, createdAt: serverTimestamp(),
    activeSessionId: null, isInSettlement: false, settledPlayerIds: [],
  })
}

export async function deleteTable(tableId: string): Promise<void> {
  await deleteDoc(doc(tablesRef(), tableId))
}

export async function addMember(userId: string, tableId: string): Promise<void> {
  await updateDoc(doc(tablesRef(), tableId), { memberIds: arrayUnion(userId) })
}

export function listenToTable(tableId: string, cb: (t: PokerTable | null) => void): Unsubscribe {
  return onSnapshot(doc(tablesRef(), tableId), snap => {
    cb(snap.exists() ? docToTable(snap.id, snap.data() as Record<string, unknown>) : null)
  })
}

// ─── Players ──────────────────────────────────────────────────────────────────

export async function fetchPlayers(tableId: string): Promise<TablePlayer[]> {
  const snap = await getDocs(playersRef(tableId))
  return snap.docs.map(d => docToPlayer(d.id, d.data() as Record<string, unknown>))
}

export async function fetchMyPlayer(tableId: string, userId: string): Promise<TablePlayer | null> {
  const q = query(playersRef(tableId), where('userId', '==', userId))
  const snap = await getDocs(q)
  if (snap.empty) return null
  const d = snap.docs[0]
  return docToPlayer(d.id, d.data() as Record<string, unknown>)
}

export async function addPlayer(player: TablePlayer): Promise<void> {
  await setDoc(doc(playersRef(player.tableId), player.id), {
    userId: player.userId, name: player.name, totalEarnings: 0,
    lifetimeEarnings: 0, tableId: player.tableId, joinedAt: serverTimestamp(),
  })
}

export function listenToPlayers(tableId: string, cb: (players: TablePlayer[]) => void): Unsubscribe {
  return onSnapshot(playersRef(tableId), snap => {
    const players = snap.docs.map(d => docToPlayer(d.id, d.data() as Record<string, unknown>))
    cb(players.sort((a, b) => b.totalEarnings - a.totalEarnings))
  })
}

export async function updateCoAdmins(tableId: string, coAdminIds: string[]): Promise<void> {
  await updateDoc(doc(tablesRef(), tableId), { coAdminIds })
}

// ─── Sessions ─────────────────────────────────────────────────────────────────

export async function countSessions(tableId: string): Promise<number> {
  const snap = await getAggregateFromServer(sessionsRef(tableId), { count: count() })
  return snap.data().count
}

export async function fetchSessions(tableId: string): Promise<GameSession[]> {
  const q = query(sessionsRef(tableId), orderBy('startedAt', 'asc'))
  const snap = await getDocs(q)
  return snap.docs.map(d => docToSession(d.id, d.data() as Record<string, unknown>))
}

export async function fetchSession(tableId: string, sessionId: string): Promise<GameSession | null> {
  const snap = await getDoc(doc(sessionsRef(tableId), sessionId))
  if (!snap.exists()) return null
  return docToSession(snap.id, snap.data() as Record<string, unknown>)
}

export async function fetchDisputedSessions(tableId: string): Promise<GameSession[]> {
  const q = query(sessionsRef(tableId), where('status', '==', 'disputed'))
  const snap = await getDocs(q)
  return snap.docs.map(d => docToSession(d.id, d.data() as Record<string, unknown>))
}

export async function createSession(session: GameSession): Promise<void> {
  const batch = writeBatch(db)
  batch.set(doc(sessionsRef(session.tableId), session.id), {
    tableId: session.tableId, status: session.status,
    sessionNumber: session.sessionNumber, disputedAmount: 0,
    startedAt: serverTimestamp(), endedAt: null,
  })
  batch.update(doc(tablesRef(), session.tableId), { activeSessionId: session.id })
  await batch.commit()
}

export async function resetSession(sessionId: string, tableId: string): Promise<void> {
  const entriesSnap = await getDocs(entriesRef(tableId, sessionId))
  const batch = writeBatch(db)
  entriesSnap.docs.forEach(d => batch.delete(d.ref))
  await batch.commit()
}

/** Fully discards a session: deletes all entries, all guest entries for the session,
 *  the session document itself, and clears activeSessionId on the table. */
export async function discardSession(sessionId: string, tableId: string): Promise<void> {
  const [entriesSnap, guestEntriesSnap] = await Promise.all([
    getDocs(entriesRef(tableId, sessionId)),
    getDocs(query(guestEntriesRef(tableId), where('sessionId', '==', sessionId))),
  ])

  const batch = writeBatch(db)

  // Delete all player entries
  entriesSnap.docs.forEach(d => batch.delete(d.ref))

  // Delete all guest entries for this session
  guestEntriesSnap.docs.forEach(d => batch.delete(d.ref))

  // Delete the session document
  batch.delete(doc(sessionsRef(tableId), sessionId))

  // Clear activeSessionId on the table
  batch.update(doc(tablesRef(), tableId), { activeSessionId: null })

  await batch.commit()
}

// Single atomic batch: N player earnings + session doc + table doc
export async function settleSessionBatch(opts: {
  sessionId: string
  tableId: string
  status: SessionStatus
  sessionDisputedAmount: number
  earningDeltas: { playerId: string; delta: number }[]
  tableDisputeDelta: number
}): Promise<void> {
  const batch = writeBatch(db)
  for (const { playerId, delta } of opts.earningDeltas) {
    if (delta !== 0) {
      batch.update(doc(playersRef(opts.tableId), playerId), {
        totalEarnings: increment(delta),
      })
    }
  }
  batch.update(doc(sessionsRef(opts.tableId), opts.sessionId), {
    status: opts.status,
    endedAt: serverTimestamp(),
    disputedAmount: opts.sessionDisputedAmount,
  })
  const tableUpdate: Record<string, unknown> = { activeSessionId: null }
  if (opts.tableDisputeDelta !== 0) {
    tableUpdate.disputedAmount = increment(opts.tableDisputeDelta)
  }
  batch.update(doc(tablesRef(), opts.tableId), tableUpdate)
  await batch.commit()
}

// ─── Entries ──────────────────────────────────────────────────────────────────

export async function submitEntry(entry: SessionEntry): Promise<void> {
  await setDoc(doc(entriesRef(entry.tableId, entry.sessionId), entry.id), {
    sessionId: entry.sessionId, tableId: entry.tableId, playerId: entry.playerId,
    playerName: entry.playerName, buyIn: entry.buyIn, finalAmount: entry.finalAmount,
    netAmount: entry.netAmount, isManualNet: entry.isManualNet,
    submittedAt: serverTimestamp(),
  })
}

export function listenToEntries(tableId: string, sessionId: string, cb: (entries: SessionEntry[]) => void): Unsubscribe {
  return onSnapshot(entriesRef(tableId, sessionId), snap => {
    cb(snap.docs.map(d => docToEntry(d.id, d.data() as Record<string, unknown>)))
  })
}

export async function fetchAllEntries(tableId: string, playerId: string): Promise<SessionEntry[]> {
  const sessions = await fetchSessions(tableId)
  const eligible = sessions.filter(s => s.status === 'completed' || s.status === 'disputed')
  if (!eligible.length) return []
  const results = await Promise.all(
    eligible.map(async s => {
      const q = query(entriesRef(tableId, s.id), where('playerId', '==', playerId))
      const snap = await getDocs(q)
      return snap.docs.map(d => docToEntry(d.id, d.data() as Record<string, unknown>))
    })
  )
  return results.flat().sort((a, b) => a.submittedAt.getTime() - b.submittedAt.getTime())
}

// ─── Batch player earnings update ─────────────────────────────────────────────

export async function batchUpdatePlayerEarnings(
  deltas: { playerId: string; delta: number }[],
  tableId: string
): Promise<void> {
  const batch = writeBatch(db)
  for (const { playerId, delta } of deltas) {
    batch.update(doc(playersRef(tableId), playerId), { totalEarnings: increment(delta) })
  }
  await batch.commit()
}

export async function setDisputedAmount(amount: number, tableId: string): Promise<void> {
  await updateDoc(doc(tablesRef(), tableId), { disputedAmount: amount })
}

// ─── Table Settlement ─────────────────────────────────────────────────────────

export async function startTableSettlement(tableId: string): Promise<void> {
  await updateDoc(doc(tablesRef(), tableId), { isInSettlement: true, settledPlayerIds: [] })
}

export async function cancelTableSettlement(tableId: string): Promise<void> {
  await updateDoc(doc(tablesRef(), tableId), { isInSettlement: false, settledPlayerIds: [] })
}

export async function setPlayerSettled(playerId: string, tableId: string, isSettled: boolean): Promise<void> {
  await updateDoc(doc(tablesRef(), tableId), {
    settledPlayerIds: isSettled ? arrayUnion(playerId) : arrayRemove(playerId),
  })
}

export async function closeTableSettlement(tableId: string, players: TablePlayer[]): Promise<void> {
  const batch = writeBatch(db)
  for (const p of players) {
    batch.update(doc(playersRef(tableId), p.id), {
      lifetimeEarnings: increment(p.totalEarnings),
      totalEarnings: 0,
    })
  }
  batch.update(doc(tablesRef(), tableId), { isInSettlement: false, settledPlayerIds: [] })
  await batch.commit()
}

// ─── Guests ───────────────────────────────────────────────────────────────────

export async function addGuest(guest: TableGuest): Promise<void> {
  await setDoc(doc(guestsRef(guest.tableId), guest.id), {
    ...guest,
    addedAt: serverTimestamp(),
  })
}

export async function fetchGuests(tableId: string): Promise<TableGuest[]> {
  const snap = await getDocs(guestsRef(tableId))
  return snap.docs.map(d => docToGuest(d.id, d.data() as Record<string, unknown>))
}

export async function submitGuestEntry(entry: GuestEntry): Promise<void> {
  await setDoc(doc(guestEntriesRef(entry.tableId), entry.id), {
    ...entry,
    sessionDate: serverTimestamp(),
    submittedAt: serverTimestamp(),
  })
}

export async function fetchGuestEntries(tableId: string, guestId: string): Promise<GuestEntry[]> {
  const q = query(guestEntriesRef(tableId), where('guestId', '==', guestId))
  const snap = await getDocs(q)
  return snap.docs.map(d => docToGuestEntry(d.id, d.data() as Record<string, unknown>))
}

export async function fetchGuestEntriesForSession(tableId: string, sessionId: string): Promise<GuestEntry[]> {
  const q = query(guestEntriesRef(tableId), where('sessionId', '==', sessionId))
  const snap = await getDocs(q)
  return snap.docs.map(d => docToGuestEntry(d.id, d.data() as Record<string, unknown>))
}

export function listenToGuests(tableId: string, cb: (guests: TableGuest[]) => void): Unsubscribe {
  return onSnapshot(guestsRef(tableId), snap => {
    cb(snap.docs.map(d => docToGuest(d.id, d.data() as Record<string, unknown>)))
  })
}

export function listenToGuestEntries(tableId: string, sessionId: string, cb: (entries: GuestEntry[]) => void): Unsubscribe {
  const q = query(guestEntriesRef(tableId), where('sessionId', '==', sessionId))
  return onSnapshot(q, snap => {
    cb(snap.docs.map(d => docToGuestEntry(d.id, d.data() as Record<string, unknown>)))
  })
}

/** Atomic batch: copies all GuestEntries as SessionEntries for the player,
 *  increments player earnings, marks the guest as merged. */
export async function mergeGuest(
  guest: TableGuest,
  player: TablePlayer,
  guestEntries: GuestEntry[]
): Promise<void> {
  const batch = writeBatch(db)
  let delta = 0

  for (const ge of guestEntries) {
    const entryRef = doc(entriesRef(ge.tableId, ge.sessionId), ge.id)
    batch.set(entryRef, {
      id: ge.id,
      sessionId: ge.sessionId,
      tableId: ge.tableId,
      playerId: player.id,
      playerName: player.name,
      buyIn: ge.buyIn,
      finalAmount: ge.finalAmount,
      netAmount: ge.netAmount,
      submittedAt: ge.submittedAt,
      isManualNet: ge.isManualNet,
    })
    delta += ge.netAmount
  }

  batch.update(doc(playersRef(player.tableId), player.id), {
    totalEarnings: increment(delta),
    lifetimeEarnings: increment(delta),
  })

  batch.update(doc(guestsRef(guest.tableId), guest.id), {
    mergedToPlayerId: player.id,
  })

  await batch.commit()
}
