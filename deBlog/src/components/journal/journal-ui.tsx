'use client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { JournalEntry } from './journal-data-access'
import { useState } from 'react'

interface JournalEntryListProps {
  entries: JournalEntry[]
  onEdit: (entry: JournalEntry) => void
  onDelete: (entryId: string) => void
}

export function JournalEntryList({ entries, onEdit, onDelete }: JournalEntryListProps) {
  if (entries.length === 0) {
    return <p>No journal entries found. Create one!</p>
  }

  return (
    <div className="space-y-4">
      {entries.map((entry) => (
        <div key={entry.id} className="p-4 border rounded-md shadow-sm">
          <h3 className="text-lg font-semibold">
            Entry for {entry.year}-{entry.month}-{entry.day}
          </h3>
          <p>
            <strong>Mood:</strong> {entry.mood}
          </p>
          <p>
            <strong>Weather:</strong> {entry.weather}
          </p>
          <p>
            <strong>Message:</strong> {entry.message}
          </p>
          <div className="mt-2 space-x-2">
            <Button onClick={() => onEdit(entry)} variant="outline">
              Edit
            </Button>
            <Button onClick={() => onDelete(entry.id)} variant="destructive">
              Delete
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}

interface JournalCreateFormProps {
  onSubmit: (data: { mood: string; year: number; month: number; day: number; weather: string; message: string }) => void
  isSubmitting: boolean
}

export function JournalCreateForm({ onSubmit, isSubmitting }: JournalCreateFormProps) {
  const [mood, setMood] = useState('')
  const [year, setYear] = useState(new Date().getFullYear())
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [day, setDay] = useState(new Date().getDate())
  const [weather, setWeather] = useState('')
  const [message, setMessage] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({ mood, year, month, day, weather, message })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-md shadow-sm">
      <h2 className="text-xl font-bold">Create New Entry</h2>
      <div>
        <Label htmlFor="create-mood">Mood</Label>
        <Input id="create-mood" value={mood} onChange={(e) => setMood(e.target.value)} required />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor="create-year">Year</Label>
          <Input
            id="create-year"
            type="number"
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value))}
            required
          />
        </div>
        <div>
          <Label htmlFor="create-month">Month</Label>
          <Input
            id="create-month"
            type="number"
            value={month}
            onChange={(e) => setMonth(parseInt(e.target.value))}
            required
          />
        </div>
        <div>
          <Label htmlFor="create-day">Day</Label>
          <Input
            id="create-day"
            type="number"
            value={day}
            onChange={(e) => setDay(parseInt(e.target.value))}
            required
          />
        </div>
      </div>
      <div>
        <Label htmlFor="create-weather">Weather</Label>
        <Input id="create-weather" value={weather} onChange={(e) => setWeather(e.target.value)} required />
      </div>
      <div>
        <Label htmlFor="create-message">Message</Label>
        <Input id="create-message" value={message} onChange={(e) => setMessage(e.target.value)} required />
      </div>
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Creating...' : 'Create Entry'}
      </Button>
    </form>
  )
}

interface JournalEditFormProps {
  entry: JournalEntry
  onSubmit: (data: { entryId: string; updates: Partial<Omit<JournalEntry, 'id' | 'authority'>> }) => void
  isSubmitting: boolean
  onOpenChange: (open: boolean) => void
}

export function JournalEditForm({ entry, onSubmit, isSubmitting, onOpenChange }: JournalEditFormProps) {
  const [mood, setMood] = useState(entry.mood)
  const [weather, setWeather] = useState(entry.weather)
  const [message, setMessage] = useState(entry.message)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      entryId: entry.id,
      updates: { mood, weather, message },
    })
  }

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Edit Entry for {entry.year}-{entry.month}-{entry.day}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="edit-mood">Mood</Label>
            <Input id="edit-mood" value={mood} onChange={(e) => setMood(e.target.value)} required />
          </div>
          <div>
            <Label htmlFor="edit-weather">Weather</Label>
            <Input id="edit-weather" value={weather} onChange={(e) => setWeather(e.target.value)} required />
          </div>
          <div>
            <Label htmlFor="edit-message">Message</Label>
            <Input id="edit-message" value={message} onChange={(e) => setMessage(e.target.value)} required />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
