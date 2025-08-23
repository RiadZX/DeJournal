import { RefreshCw, Trash2, Edit } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { AppModal } from '@/components/app-modal'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Address } from 'gill'
import {
  useGetJournalEntriesQuery,
  useCreateJournalEntryMutation,
  useEditJournalEntryMutation,
  useDeleteJournalEntryMutation,
} from './journal-data-access'
import { Entry } from '../../../clients/js/src/generated'
import { useWalletUi } from '@wallet-ui/react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

export function JournalButtons({ address }: { address: Address }) {
  return (
    <div>
      <div className="space-x-2">
        <ModalCreateEntry address={address} />
      </div>
    </div>
  )
}

export function JournalEntries({ address }: { address: Address }) {
  const query = useGetJournalEntriesQuery({ address })
  const { account } = useWalletUi()
  const deleteMutation = useDeleteJournalEntryMutation({ address })

  return (
    <div className="space-y-2">
      <div className="flex justify-between">
        <h2 className="text-2xl font-bold">Entries</h2>
        <div className="space-x-2">
          {query.isLoading ? (
            <span className="loading loading-spinner"></span>
          ) : (
            <Button variant="outline" onClick={() => query.refetch()}>
              <RefreshCw size={16} />
            </Button>
          )}
        </div>
      </div>
      {query.isError && <pre className="alert alert-error">Error: {query.error?.message.toString()}</pre>}
      {query.isSuccess && (
        <div>
          {query.data.length === 0 ? (
            <div>No journal entries found.</div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {query.data?.map((entry) => (
                <Card key={entry.address.toString()}>
                  <CardHeader>
                    <CardTitle>{entry.data.mood}</CardTitle>
                    <CardDescription>
                      {entry.data.year}/{entry.data.month}/{entry.data.day} - Weather: {entry.data.weather}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p>{entry.data.message}</p>
                  </CardContent>
                  {account?.address.toString() === entry.data.authority.toString() && (
                    <CardFooter className="flex justify-end gap-2">
                      <ModalEditEntry address={address} entry={entry} />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (!window.confirm('Are you sure you want to delete this entry?')) return
                          deleteMutation.mutateAsync(entry.address)
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </CardFooter>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function ModalCreateEntry({ address }: { address: Address }) {
  const mutation = useCreateJournalEntryMutation({ address })
  const [mood, setMood] = useState('')
  const [weather, setWeather] = useState('')
  const [message, setMessage] = useState('')

  const now = new Date()

  return (
    <AppModal
      title="New Journal Entry"
      submitDisabled={!mood || !weather || !message || mutation.isPending}
      submitLabel="Create"
      submit={() =>
        mutation.mutateAsync({
          mood,
          weather,
          message,
          year: now.getFullYear(),
          month: now.getMonth() + 1,
          day: now.getDate(),
        })
      }
    >
      <Label htmlFor="mood">Mood</Label>
      <Input
        disabled={mutation.isPending}
        id="mood"
        onChange={(e) => setMood(e.target.value)}
        placeholder="How are you feeling?"
        value={mood}
      />
      <Label htmlFor="weather">Weather</Label>
      <Input
        disabled={mutation.isPending}
        id="weather"
        onChange={(e) => setWeather(e.target.value)}
        placeholder="What's the weather like?"
        value={weather}
      />
      <Label htmlFor="message">Message</Label>
      <Textarea
        disabled={mutation.isPending}
        id="message"
        onChange={(e) => setMessage(e.target.value)}
        placeholder="What's on your mind?"
        value={message}
      />
    </AppModal>
  )
}

function ModalEditEntry({ address, entry }: { address: Address; entry: { data: Entry; address: Address } }) {
  const mutation = useEditJournalEntryMutation({ address })
  const [mood, setMood] = useState(entry.data.mood)
  const [weather, setWeather] = useState(entry.data.weather)
  const [message, setMessage] = useState(entry.data.message)

  return (
    <AppModal
      title="Edit Journal Entry"
      submitDisabled={!mood || !weather || !message || mutation.isPending}
      submitLabel="Save"
      submit={() =>
        mutation.mutateAsync({
          entryAddress: entry.address,
          mood,
          weather,
          message,
        })
      }
    >
      <Label htmlFor="mood">Mood</Label>
      <Input
        disabled={mutation.isPending}
        id="mood"
        onChange={(e) => setMood(e.target.value)}
        placeholder="How are you feeling?"
        value={mood}
      />
      <Label htmlFor="weather">Weather</Label>
      <Input
        disabled={mutation.isPending}
        id="weather"
        onChange={(e) => setWeather(e.target.value)}
        placeholder="What's the weather like?"
        value={weather}
      />
      <Label htmlFor="message">Message</Label>
      <Textarea
        disabled={mutation.isPending}
        id="message"
        onChange={(e) => setMessage(e.target.value)}
        placeholder="What's on your mind?"
        value={message}
      />
    </AppModal>
  )
}
