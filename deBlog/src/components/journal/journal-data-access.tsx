import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useWalletUi } from '@wallet-ui/react'
import {
  type Account,
  type Address,
  createTransaction,
  getBase58Decoder,
  getBase58Encoder,
  signAndSendTransactionMessageWithSigners,
} from 'gill'
import { toast } from 'sonner'
import { toastTx } from '@/components/toast-tx'
import { useWalletUiSigner } from '@/components/solana/use-wallet-ui-signer'
import {
  type Entry,
  fetchAllMaybeEntry,
  getCreateEntryInstructionAsync,
  getDeleteEntryInstruction,
  getEditEntryInstruction,
  DAILY_JOURNAL_PROGRAM_ADDRESS,
  ENTRY_DISCRIMINATOR,
} from '../../../clients/js/src/generated'

// Get all journal entries for a given authority
export function useGetJournalEntriesQuery({ address }: { address: Address }) {
  const { client, cluster } = useWalletUi()
  const queryKey = ['get-journal-entries', { cluster, address }]

  return useQuery({
    queryKey,
    queryFn: async () => {
      // 1. Find all entry account addresses for the given authority.
      const accountInfos = await client.rpc
        .getProgramAccounts(DAILY_JOURNAL_PROGRAM_ADDRESS, {
          // We only need the pubkey, so we request no data.
          dataSlice: { offset: 0, length: 0 },
        })
        .send()

      const addresses = accountInfos.map((info) => info.pubkey)

      if (addresses.length === 0) {
        return []
      }

      // 2. Fetch and decode the accounts using the generated client function.
      const maybeEntries = await fetchAllMaybeEntry(client.rpc, addresses)

      // 3. Filter out accounts that don't exist and ensure the authority matches.
      const existingEntries = maybeEntries.filter((e) => e.exists) as Account<Entry>[]

      return existingEntries.filter((entry) => entry.data.authority === address)
    },
  })
}

function useInvalidateGetJournalEntriesQuery({ address }: { address: Address }) {
  const queryClient = useQueryClient()
  const { cluster } = useWalletUi()
  const queryKey = ['get-journal-entries', { cluster, address }]
  return async () => {
    await queryClient.invalidateQueries({ queryKey })
  }
}

// Create a new journal entry
export function useCreateJournalEntryMutation({ address }: { address: Address }) {
  const { client } = useWalletUi()
  const signer = useWalletUiSigner()
  const invalidateJournalEntriesQuery = useInvalidateGetJournalEntriesQuery({ address })

  return useMutation({
    mutationFn: async (input: {
      mood: string
      weather: string
      message: string
      year: number
      month: number
      day: number
    }) => {
      const { value: latestBlockhash } = await client.rpc.getLatestBlockhash({ commitment: 'confirmed' }).send()

      const instruction = await getCreateEntryInstructionAsync({
        user: signer,
        mood: input.mood,
        weather: input.weather,
        message: input.message,
        year: input.year,
        month: input.month,
        day: input.day,
      })

      const transaction = createTransaction({
        feePayer: signer,
        version: 0,
        latestBlockhash,
        instructions: [instruction],
      })

      const signatureBytes = await signAndSendTransactionMessageWithSigners(transaction)
      return getBase58Decoder().decode(signatureBytes)
    },
    onSuccess: async (tx) => {
      toastTx(tx)
      await invalidateJournalEntriesQuery()
    },
    onError: (error) => {
      toast.error(`Transaction failed! ${error}`)
    },
  })
}

// Edit a journal entry
export function useEditJournalEntryMutation({ address }: { address: Address }) {
  const { client } = useWalletUi()
  const signer = useWalletUiSigner()
  const invalidateJournalEntriesQuery = useInvalidateGetJournalEntriesQuery({ address })

  return useMutation({
    mutationFn: async (input: { entryAddress: Address; mood: string; weather: string; message: string }) => {
      const { value: latestBlockhash } = await client.rpc.getLatestBlockhash({ commitment: 'confirmed' }).send()

      const instruction = getEditEntryInstruction({
        authority: signer,
        entry: input.entryAddress,
        mood: input.mood,
        weather: input.weather,
        message: input.message,
      })

      const transaction = createTransaction({
        feePayer: signer,
        version: 0,
        latestBlockhash,
        instructions: [instruction],
      })

      const signatureBytes = await signAndSendTransactionMessageWithSigners(transaction)
      return getBase58Decoder().decode(signatureBytes)
    },
    onSuccess: async (tx) => {
      toastTx(tx)
      await invalidateJournalEntriesQuery()
    },
    onError: (error) => {
      toast.error(`Transaction failed! ${error}`)
    },
  })
}

// Delete a journal entry
export function useDeleteJournalEntryMutation({ address }: { address: Address }) {
  const { client } = useWalletUi()
  const signer = useWalletUiSigner()
  const invalidateJournalEntriesQuery = useInvalidateGetJournalEntriesQuery({ address })

  return useMutation({
    mutationFn: async (entryAddress: Address) => {
      const { value: latestBlockhash } = await client.rpc.getLatestBlockhash({ commitment: 'confirmed' }).send()

      const instruction = getDeleteEntryInstruction({
        authority: signer,
        entry: entryAddress,
      })

      const transaction = createTransaction({
        feePayer: signer,
        version: 0,
        latestBlockhash,
        instructions: [instruction],
      })

      const signatureBytes = await signAndSendTransactionMessageWithSigners(transaction)
      return getBase58Decoder().decode(signatureBytes)
    },
    onSuccess: async (tx) => {
      toastTx(tx)
      await invalidateJournalEntriesQuery()
    },
    onError: (error) => {
      toast.error(`Transaction failed! ${error}`)
    },
  })
}
