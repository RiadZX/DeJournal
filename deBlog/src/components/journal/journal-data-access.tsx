import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useWalletUi } from '@wallet-ui/react'
import { address, Address } from 'gill'

export type JournalEntry = {
  id: string
  authority: Address
  mood: string
  year: number
  month: number
  day: number
  weather: string
  message: string
}

// Dummy in-memory store for demonstration. Replace with real backend or Solana program integration.
const journalStore: Record<string, JournalEntry[]> = {}

function getUserJournalEntries(authority: Address): JournalEntry[] {
  return journalStore[authority.toString()] || []
}

function addJournalEntry(authority: Address, entry: Omit<JournalEntry, 'id' | 'authority'>): JournalEntry {
  const id = `${Date.now()}`
  const newEntry: JournalEntry = { id, authority, ...entry }
  if (!journalStore[authority.toString()]) journalStore[authority.toString()] = []
  journalStore[authority.toString()].push(newEntry)
  return newEntry
}

function editJournalEntry(
  authority: Address,
  entryId: string,
  updates: Partial<Omit<JournalEntry, 'id' | 'authority'>>,
): JournalEntry | null {
  const entries = journalStore[authority.toString()] || []
  const idx = entries.findIndex((e) => e.id === entryId)
  if (idx === -1) return null
  entries[idx] = { ...entries[idx], ...updates }
  return entries[idx]
}

function deleteJournalEntry(authority: Address, entryId: string): boolean {
  const entries = journalStore[authority.toString()] || []
  const idx = entries.findIndex((e) => e.id === entryId)
  if (idx === -1) return false
  entries.splice(idx, 1)
  return true
}

export function useJournalEntries() {
  const { account } = useWalletUi()
  const authority = account ? address(account.address) : undefined

  return useQuery<JournalEntry[]>({
    queryKey: ['journalEntries', authority?.toString()],
    queryFn: () => (authority ? Promise.resolve(getUserJournalEntries(authority)) : Promise.resolve([])),
    enabled: !!authority,
  })
}

export function useCreateJournalEntry() {
  const { account } = useWalletUi()
  const authority = account ? address(account.address) : undefined
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (entry: Omit<JournalEntry, 'id' | 'authority'>) => {
      if (!authority) throw new Error('Wallet not connected')
      return addJournalEntry(authority, entry)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journalEntries'] })
    },
  })
}

export function useEditJournalEntry() {
  const { account } = useWalletUi()
  const authority = account ? address(account.address) : undefined
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      entryId,
      updates,
    }: {
      entryId: string
      updates: Partial<Omit<JournalEntry, 'id' | 'authority'>>
    }) => {
      if (!authority) throw new Error('Wallet not connected')
      return editJournalEntry(authority, entryId, updates)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journalEntries'] })
    },
  })
}

export function useDeleteJournalEntry() {
  const { account } = useWalletUi()
  const authority = account ? address(account.address) : undefined
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (entryId: string) => {
      if (!authority) throw new Error('Wallet not connected')
      return deleteJournalEntry(authority, entryId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journalEntries'] })
    },
  })
}
