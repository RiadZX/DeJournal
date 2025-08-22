'use client'
import { useWalletUi } from '@wallet-ui/react'
import { address } from 'gill'
import { AppHero } from '@/components/app-hero'
import {
  useJournalEntries,
  useCreateJournalEntry,
  useEditJournalEntry,
  useDeleteJournalEntry,
  JournalEntry,
} from './journal-data-access'
import { JournalEntryList, JournalCreateForm, JournalEditForm } from './journal-ui'
import { useState } from 'react'
import { toastTx } from '@/components/toast-tx'

export function JournalFeature() {
  const { account } = useWalletUi()
  const authority = account ? address(account.address) : undefined

  const { data: entries, isLoading, isError, error } = useJournalEntries()
  const createMutation = useCreateJournalEntry()
  const editMutation = useEditJournalEntry()
  const deleteMutation = useDeleteJournalEntry()

  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null)

  const handleCreateEntry = async (data: Omit<JournalEntry, 'id' | 'authority'>) => {
    try {
      await createMutation.mutateAsync(data)
      toastTx(undefined, 'Entry created successfully!')
    } catch (err) {
      toastTx(undefined, 'Failed to create entry.')
      console.error(err)
    }
  }

  const handleEditEntry = async (data: {
    entryId: string
    updates: Partial<Omit<JournalEntry, 'id' | 'authority'>>
  }) => {
    try {
      await editMutation.mutateAsync(data)
      toastTx(undefined, 'Entry updated successfully!')
      setEditingEntry(null)
    } catch (err) {
      toastTx(undefined, 'Failed to update entry.')
      console.error(err)
    }
  }

  const handleDeleteEntry = async (entryId: string) => {
    if (!window.confirm('Are you sure you want to delete this entry?')) {
      return
    }
    try {
      await deleteMutation.mutateAsync(entryId)
      toastTx(undefined, 'Entry deleted successfully!')
    } catch (err) {
      toastTx(undefined, 'Failed to delete entry.')
      console.error(err)
    }
  }

  if (!account) {
    return <AppHero title="Journal" subtitle="Connect your wallet to view and manage your journal entries." />
  }

  if (isLoading) {
    return <AppHero title="Journal" subtitle="Loading journal entries..." />
  }

  if (isError) {
    return <AppHero title="Journal" subtitle={`Error loading journal entries: ${error?.message}`} />
  }

  return (
    <div>
      <AppHero title="Journal" subtitle="Manage your daily journal entries on Solana." />

      <div className="max-w-xl mx-auto py-6">
        <JournalCreateForm onSubmit={handleCreateEntry} isSubmitting={createMutation.isPending} />

        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4">Your Entries</h2>
          <JournalEntryList entries={entries || []} onEdit={setEditingEntry} onDelete={handleDeleteEntry} />
        </div>

        {editingEntry && (
          <JournalEditForm
            entry={editingEntry}
            onSubmit={handleEditEntry}
            isSubmitting={editMutation.isPending}
            onOpenChange={(open) => {
              if (!open) setEditingEntry(null)
            }}
          />
        )}
      </div>
    </div>
  )
}
