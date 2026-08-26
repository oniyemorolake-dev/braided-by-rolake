import { CONFIG } from '../data'
import { isSupabaseConfigured, supabase } from './supabase'

const LOCAL_KEY = 'bbr_schedule_blocks_v1'

export interface ScheduleBlock {
  id: string
  date: string
  /** null = full day blocked */
  startSlot?: string
  endSlot?: string
  note?: string
  createdAt?: string
}

function slotToMinutes(slot: string): number {
  const [h, m] = slot.split(':').map(Number)
  return h * 60 + m
}

interface BlockRow {
  id: string
  block_date: string
  start_slot: string | null
  end_slot: string | null
  note?: string | null
  created_at?: string
}

function rowToBlock(row: BlockRow): ScheduleBlock {
  return {
    id: row.id,
    date: typeof row.block_date === 'string' ? row.block_date : String(row.block_date),
    startSlot: row.start_slot ?? undefined,
    endSlot: row.end_slot ?? undefined,
    note: row.note ?? undefined,
    createdAt: row.created_at,
  }
}

function loadLocal(): ScheduleBlock[] {
  try {
    const raw = localStorage.getItem(LOCAL_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as ScheduleBlock[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function saveLocal(blocks: ScheduleBlock[]): void {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(blocks))
}

export function newBlockId(): string {
  return `blk_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

/** Public occupancy blocks for booking calendar */
export async function loadScheduleBlocks(): Promise<ScheduleBlock[]> {
  if (!supabase || !isSupabaseConfigured) return loadLocal()

  const { data, error } = await supabase.rpc('list_schedule_blocks')
  if (error) {
    console.error('[blocks] list failed', error.message)
    return loadLocal()
  }
  return (data as BlockRow[]).map(rowToBlock)
}

export async function adminLoadScheduleBlocks(
  password = CONFIG.adminPassword,
): Promise<ScheduleBlock[]> {
  if (!supabase || !isSupabaseConfigured) return loadLocal()

  const { data, error } = await supabase.rpc('admin_list_schedule_blocks', {
    p_password: password,
  })
  if (error) throw new Error(error.message)
  return (data as BlockRow[]).map(rowToBlock)
}

export async function adminUpsertScheduleBlock(
  input: {
    id?: string
    date: string
    startSlot?: string
    endSlot?: string
    note?: string
  },
  password = CONFIG.adminPassword,
): Promise<ScheduleBlock> {
  const id = input.id || newBlockId()
  const block: ScheduleBlock = {
    id,
    date: input.date,
    startSlot: input.startSlot,
    endSlot: input.endSlot,
    note: input.note,
    createdAt: new Date().toISOString(),
  }

  if (!supabase || !isSupabaseConfigured) {
    const next = [block, ...loadLocal().filter((b) => b.id !== id)]
    saveLocal(next)
    return block
  }

  const { data, error } = await supabase.rpc('admin_upsert_schedule_block', {
    p_password: password,
    p_id: id,
    p_block_date: input.date,
    p_start_slot: input.startSlot ?? null,
    p_end_slot: input.endSlot ?? null,
    p_note: input.note ?? null,
  })
  if (error) throw new Error(error.message)
  return rowToBlock(data as BlockRow)
}

export async function adminDeleteScheduleBlock(
  id: string,
  password = CONFIG.adminPassword,
): Promise<void> {
  if (!supabase || !isSupabaseConfigured) {
    saveLocal(loadLocal().filter((b) => b.id !== id))
    return
  }
  const { error } = await supabase.rpc('admin_delete_schedule_block', {
    p_password: password,
    p_id: id,
  })
  if (error) throw new Error(error.message)
}

/** True if a proposed start + duration overlaps a block on that date */
export function slotConflictsWithBlocks(
  date: string,
  startSlot: string,
  durationMins: number,
  blocks: ScheduleBlock[],
): boolean {
  const start = slotToMinutes(startSlot)
  const end = start + durationMins
  for (const b of blocks) {
    if (b.date !== date) continue
    if (!b.startSlot || !b.endSlot) return true // full day
    const bStart = slotToMinutes(b.startSlot)
    const bEnd = slotToMinutes(b.endSlot)
    if (start < bEnd && bStart < end) return true
  }
  return false
}
