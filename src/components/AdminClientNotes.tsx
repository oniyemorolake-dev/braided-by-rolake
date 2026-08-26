import { useEffect, useState, type FormEvent } from 'react'
import {
  adminDeleteClientNote,
  adminLoadClientNotes,
  adminUpsertClientNote,
  clientKeyFromContact,
  type ClientNote,
} from '../lib/clientNotes'

export function AdminClientNotes({
  clientName,
  phone,
  email,
}: {
  clientName: string
  phone: string
  email: string
}) {
  const clientKey = clientKeyFromContact(phone, email)
  const [notes, setNotes] = useState<ClientNote[]>([])
  const [draft, setDraft] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!clientKey) return
    let cancelled = false
    setLoading(true)
    setError('')
    void adminLoadClientNotes(clientKey)
      .then((list) => {
        if (!cancelled) setNotes(list)
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Could not load notes.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [clientKey])

  if (!clientKey) return null

  async function handleSave(e: FormEvent) {
    e.preventDefault()
    if (!draft.trim()) return
    setSaving(true)
    setError('')
    try {
      const saved = await adminUpsertClientNote({
        clientKey,
        note: draft,
        clientName,
        phone,
        email,
      })
      setNotes((prev) => [saved, ...prev])
      setDraft('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save note.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mt-4 border-t border-brand/10 pt-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-brand/45">
        Client notes (history)
      </p>
      <p className="mt-1 text-xs text-brand/50">
        Private notes tied to this phone/email — visible across their future bookings.
      </p>
      {error && <p className="mt-2 text-xs text-rose-600">{error}</p>}
      {loading ? (
        <p className="mt-2 text-xs text-brand/45">Loading notes…</p>
      ) : notes.length === 0 ? (
        <p className="mt-2 text-xs text-brand/45">No notes yet for this client.</p>
      ) : (
        <ul className="mt-2 max-h-40 space-y-2 overflow-y-auto">
          {notes.map((n) => (
            <li key={n.id} className="rounded-xl bg-lilac/50 px-3 py-2 text-sm text-brand">
              <p>{n.note}</p>
              <div className="mt-1 flex items-center justify-between gap-2">
                <span className="text-[11px] text-brand/40">
                  {new Date(n.updatedAt).toLocaleString()}
                </span>
                <button
                  type="button"
                  className="text-[11px] font-semibold text-rose-600 hover:underline"
                  onClick={() => {
                    void adminDeleteClientNote(n.id)
                      .then(() => setNotes((prev) => prev.filter((x) => x.id !== n.id)))
                      .catch((err) =>
                        setError(err instanceof Error ? err.message : 'Could not delete.'),
                      )
                  }}
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <form className="mt-2 flex gap-2" onSubmit={(e) => void handleSave(e)}>
        <input
          className="input-field !py-2 text-sm"
          placeholder="e.g. medium tension, likes parting left…"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
        />
        <button
          type="submit"
          className="btn-secondary shrink-0 !px-3 !py-2 text-sm"
          disabled={saving || !draft.trim()}
        >
          {saving ? '…' : 'Add'}
        </button>
      </form>
    </div>
  )
}
