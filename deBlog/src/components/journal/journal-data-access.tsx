import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useWalletUi } from '@wallet-ui/react'
import { address, Address, getBase58Decoder, createTransaction, signAndSendTransactionMessageWithSigners } from 'gill'
import { PublicKey } from '@solana/web3.js'
import { useWalletUiSigner } from '@/components/solana/use-wallet-ui-signer'

/**
 * Calculate the PDA for a journal entry using the same seeds as the Anchor IDL.
 * Seeds: "entry" (as bytes), year (u16 le), month (u8), day (u8), user pubkey (Address)
 */
export function getJournalEntryPda(
  year: number,
  month: number,
  day: number,
  user: Address,
  programId: Address,
): Address {
  const seeds = [
    Buffer.from('entry'),
    Buffer.from(Uint16Array.of(year).buffer), // u16 little-endian
    Buffer.from(Uint8Array.of(month).buffer), // u8
    Buffer.from(Uint8Array.of(day).buffer), // u8
    new PublicKey(user.toString()).toBuffer(),
  ]
  const pda = PublicKey.findProgramAddressSync(seeds, new PublicKey(programId.toString()))[0]
  return address(pda.toString())
}

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

const PROGRAM_ID = 'GbEwy5B5fr4uZGAVr6GhouFQVUuDvqiscQEBeFb94wSn'
const PROGRAM_ADDRESS = address(PROGRAM_ID)
const ENTRY_ACCOUNT_DISCRIMINATOR = [63, 18, 152, 113, 215, 246, 221, 250] // from IDL

async function fetchJournalEntries(authority: Address, client: any): Promise<JournalEntry[]> {
  // The authority field is at offset 8 (discriminator is 8 bytes)
  const memcmpFilter = {
    memcmp: {
      offset: 8,
      bytes: authority.toString(),
    },
  }
  const accounts = await client.rpc
    .getProgramAccounts(PROGRAM_ID, {
      filters: [memcmpFilter],
      encoding: 'base64',
    })
    .send()

  // Parse accounts into JournalEntry objects
  return accounts.map((acc: any) => {
    // acc.account.data is base64 encoded
    const data = Buffer.from(acc.account.data[0], 'base64')
    // Parse fields according to IDL struct
    // discriminator (8 bytes), authority (32), mood (string), year (2), month (1), day (1), weather (string), message (string)
    let offset = 8
    const authorityPubkey = new PublicKey(data.slice(offset, offset + 32)).toString()
    offset += 32

    // Helper to parse Anchor strings (4 bytes length prefix)
    function parseAnchorString(buf: Buffer, offset: number): [string, number] {
      const len = buf.readUInt32LE(offset)
      const str = buf.slice(offset + 4, offset + 4 + len).toString('utf8')
      return [str, offset + 4 + len]
    }

    const [mood, off1] = parseAnchorString(data, offset)
    offset = off1
    const year = data.readUInt16LE(offset)
    offset += 2
    const month = data.readUInt8(offset)
    offset += 1
    const day = data.readUInt8(offset)
    offset += 1
    const [weather, off2] = parseAnchorString(data, offset)
    offset = off2
    const [message, off3] = parseAnchorString(data, offset)
    offset = off3

    return {
      id: acc.pubkey,
      authority: address(authorityPubkey),
      mood,
      year,
      month,
      day,
      weather,
      message,
    }
  })
}

async function createJournalEntryOnChain(
  authority: Address,
  entry: Omit<JournalEntry, 'id' | 'authority'>,
  client: any,
  signer: Address,
): Promise<string> {
  // PDA for entry
  const entryPda = getJournalEntryPda(entry.year, entry.month, entry.day, authority, PROGRAM_ADDRESS)
  // Instruction data for create_entry (IDL order: mood, year, month, day, weather, message)
  const instruction = {
    programAddress: PROGRAM_ADDRESS,
    keys: [
      { pubkey: entryPda, isSigner: false, isWritable: true },
      { pubkey: authority, isSigner: true, isWritable: true },
      { pubkey: address('11111111111111111111111111111111'), isSigner: false, isWritable: false }, // system program
    ],
    data: buildCreateEntryData(entry),
  }
  const { value: latestBlockhash } = await client.rpc.getLatestBlockhash({ commitment: 'confirmed' }).send()
  const transaction = createTransaction({
    feePayer: signer,
    version: 0,
    latestBlockhash,
    instructions: [instruction],
  })
  const signatureBytes = await signAndSendTransactionMessageWithSigners(transaction)
  const signature = getBase58Decoder().decode(signatureBytes)
  return signature
}

// Helper to build instruction data for create_entry (IDL discriminator + args)
function buildCreateEntryData(entry: Omit<JournalEntry, 'id' | 'authority'>): Buffer {
  // Discriminator from IDL
  const discriminator = Buffer.from([248, 207, 142, 242, 66, 162, 150, 16])
  // Helper for Anchor string encoding
  function encodeAnchorString(str: string): Buffer {
    const strBuf = Buffer.from(str, 'utf8')
    const lenBuf = Buffer.alloc(4)
    lenBuf.writeUInt32LE(strBuf.length, 0)
    return Buffer.concat([lenBuf, strBuf])
  }
  const moodBuf = encodeAnchorString(entry.mood)
  const yearBuf = Buffer.alloc(2)
  yearBuf.writeUInt16LE(entry.year, 0)
  const monthBuf = Buffer.from([entry.month])
  const dayBuf = Buffer.from([entry.day])
  const weatherBuf = encodeAnchorString(entry.weather)
  const messageBuf = encodeAnchorString(entry.message)
  return Buffer.concat([discriminator, moodBuf, yearBuf, monthBuf, dayBuf, weatherBuf, messageBuf])
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
  const { account, client } = useWalletUi()
  const authority = account ? address(account.address) : undefined

  return useQuery<JournalEntry[]>({
    queryKey: ['journalEntries', authority?.toString()],
    queryFn: () => (authority ? fetchJournalEntries(authority, client) : Promise.resolve([])),
    enabled: !!authority,
  })
}

export function useCreateJournalEntry() {
  const { account, client } = useWalletUi()
  const authority = account ? address(account.address) : undefined
  const queryClient = useQueryClient()
  const signer = useWalletUiSigner()

  return useMutation({
    mutationFn: async (entry: Omit<JournalEntry, 'id' | 'authority'>) => {
      if (!authority) throw new Error('Wallet not connected')
      return createJournalEntryOnChain(authority, entry, client, signer)
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
