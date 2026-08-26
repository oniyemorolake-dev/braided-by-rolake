import { CONFIG } from '../data'
import { isSupabaseConfigured, supabase } from './supabase'

const LOCAL_KEY = 'bbr_client_notes_v1'

export interface ClientNote {
  id: string
  clientKey: string
  clientName?: string
  phone?: string
  email?: string
  note: string
  createdAt: string
  updatedAt: string
}

interface NoteRow {
  id: string
  client_key: string
  client_name: string | null
  phone: string | null
  email: string | null
  note: string
  created_at: string
  updated_at: string
}

function rowToNote(row: NoteRow): ClientNote {
  return {
    id: row.id,
    clientKey: row.client_key,
    clientName: row.client_name ?? undefined,
    phone: row.phone ?? undefined,
    email: row.email ?? undefined,
    note: row.note,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function loadLocal(): ClientNote[] {
  try {
    const raw = localStorage.getItem(LOCAL_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as ClientNote[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function saveLocal(notes: ClientNote[]): void {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(notes))
}

/** Prefer phone digits; fall back to email */
export function clientKeyFromContact(phone?: string, email?: string): string {
  const digits = (phone ?? '').replace(/\D/g, '')
  if (digits.length >= 7) return `p:${digits}`
  const em = (email ?? '').trim().toLowerCase()
  if (em) return `e:${em}`
  return ''
}

export function newNoteId(): string {
  return `cn_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

export async function adminLoadClientNotes(
  clientKey?: string,
  password = CONFIG.adminPassword,
): Promise<ClientNote[]> {
  if (!supabase || !isSupabaseConfigured) {
    const all = loadLocal()
    if (!clientKey) return [...all].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    return all
      .filter((n) => n.clientKey === clientKey.toLowerCase())
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  }

  const { data, error } = await supabase.rpc('admin_list_client_notes', {
    p_password: password,
    p_client_key: clientKey ?? null,
  })
  if (error) throw new Error(error.message)
  return (data as NoteRow[]).map(rowToNote)
}

export async function adminUpsertClientNote(
  input: {
    id?: string
    clientKey: string
    note: string
    clientName?: string
    phone?: string
    email?: string
  },
  password = CONFIG.adminPassword,
): Promise<ClientNote> {
  const now = new Date().toISOString()
  const id = input.id || newNoteId()
  const note: ClientNote = {
    id,
    clientKey: input.clientKey.toLowerCase().trim(),
    clientName: input.clientName,
    phone: input.phone,
    email: input.email,
    note: input.note.trim(),
    createdAt: now,
    updatedAt: now,
  }

  if (!supabase || !isSupabaseConfigured) {
    const prev = loadLocal().find((n) => n.id === id)
    const saved = { ...note, createdAt: prev?.createdAt ?? now }
    saveLocal([saved, ...loadLocal().filter((n) => n.id !== id)])
    return saved
  }

  const { data, error } = await supabase.rpc('admin_upsert_client_note', {
    p_password: password,
    p_id: id,
    p_client_key: note.clientKey,
    p_note: note.note,
    p_client_name: note.clientName ?? null,
    p_phone: note.phone ?? null,
    p_email: note.email ?? null,
  })
  if (error) throw new Error(error.message)
  return rowToNote(data as NoteRow)
}

export async function adminDeleteClientNote(
  id: string,
  password = CONFIG.adminPassword,
): Promise<void> {
  if (!supabase || !isSupabaseConfigured) {
    saveLocal(loadLocal().filter((n) => n.id !== id))
    return
  }
  const { error } = await supabase.rpc('admin_delete_client_note', {
    p_password: password,
    p_id: id,
  })
  if (error) throw new Error(error.message)
}
